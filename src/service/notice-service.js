// import
import * as noticeModel from "../models/Notice.js";
import * as fileService from "../service/file-service.js";
import pool from "../db/connection.js";
import { ForbiddenError, NotFoundError } from "../errors/index.js";
import { v4 as uuidv4 } from "uuid";

// 목록 조회
export const getNotices = async (spec, query) => {
  return await noticeModel.findBySpec(spec, query);
};

// 상세 공지
export const detailNotices = async (noticeId) => {
  const detailNt = await noticeModel.findById(noticeId);

  if (!detailNt) {
    throw new NotFoundError(`${noticeId} not found`);
  }

  return detailNt;
};

// 생성
export const addNotice = async (user, noticeData, files) => {
  const { course_id, ...noticeInfo } = noticeData;
  let { targets } = noticeData;

  let parsedTargets = [];
  if (targets && typeof targets === "string") {
    try {
      parsedTargets = JSON.parse(targets);
    } catch {
      throw new Error("targets의 형식이 올바른 JSON이 아닙니다");
    }
  } else if (Array.isArray(targets)) {
    parsedTargets = targets;
  }

  // 교수 -> 자신의 강의 & 전체만 가능
  if (user.role === "professor" && course_id) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM course_professor WHERE user_id = ? AND course_id = ?`,
      [user.user_id, course_id],
    );

    if (rows[0].count === 0) {
      throw new ForbiddenError(
        "담당하지 않는 과목의 공지는 작성할 수 없습니다.",
      );
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const noticeId = await noticeModel.createNotice(
      noticeInfo,
      course_id,
      user.user_id,
      connection,
    );

    if (files && files.length > 0) {
      const fileIds = await fileService.addFiles(files, connection);
      await noticeModel.createFiles(noticeId, fileIds, connection);
    }

    if (parsedTargets && parsedTargets.length > 0) {
      await noticeModel.createTargets(noticeId, parsedTargets, connection);
    }

    await noticeModel.populateDeliverNotice(noticeId, connection);

    await connection.commit();
    return { noticeId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 수정
export const updateNotice = async (noticeId, data, newFiles, user) => {
  const notice = await noticeModel.findById(noticeId);

  let { targets } = data;

  let parsedTargets = [];
  if (targets && typeof targets === "string") {
    try {
      parsedTargets = JSON.parse(targets);
    } catch {
      throw new Error("targets의 형식이 올바른 JSON이 아닙니다");
    }
  } else if (Array.isArray(targets)) {
    parsedTargets = targets;
  }

  if (!notice) {
    throw new NotFoundError(`${noticeId} not found`);
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    throw new ForbiddenError(`본인의 게시물만 수정할 수 있습니다.`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let newFileIds = [];
    if (newFiles && newFiles.length > 0) {
      newFileIds = await fileService.addFiles(newFiles, connection);
    }

    const existingFileIds = data.existing_file_ids || [];
    const finalFileIds = [...existingFileIds, ...newFileIds];

    await noticeModel.updateNotice(noticeId, data, connection);

    // 기존 파일 및 타겟 연결 삭제
    await noticeModel.deleteFiles(noticeId, connection);
    await noticeModel.deleteTargets(noticeId, connection);

    // 최종 ID 목록으로 새로운 연결 생성
    if (finalFileIds.length > 0) {
      await noticeModel.createFiles(noticeId, finalFileIds, connection);
    }

    if (parsedTargets && parsedTargets.length > 0) {
      await noticeModel.createTargets(noticeId, parsedTargets, connection);
    }

    await connection.commit();
    return await noticeModel.findById(noticeId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 삭제
export const deleteNotice = async (noticeId, user) => {
  const notice = await noticeModel.findById(noticeId);
  if (!notice) {
    throw new NotFoundError(`${noticeId} not found`);
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    throw new ForbiddenError("본인의 게시물만 삭제할 수 있습니다.");
  }

  const affectedRow = await noticeModel.deleteNotice(noticeId);

  if (affectedRow === 0) {
    throw new NotFoundError(`공지사항 삭제에 실패했습니다.`);
  }

  // 자동으로 삭제됨
  // await noticeModel.deleteFiles(noticeId, connection);
  // await noticeModel.deleteTargets(noticeId, connection);

  return { message: "공지사항이 성공적으로 삭제되었습니다." };
};

// 디스패치 (발송) 액션
export const dispatchByNoticeId = async (noticeId, user, { mock = true }) => {
  const notice = await noticeModel.findById(noticeId);
  // const channel = "KAKAO";

  if (user.role === "student") {
    return { message: "학생은 발송 권한이 없습니다." };
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    return { message: "본인 공지만 발송할 수 있습니다." };
  }

  // 대상자 해석
  const userIds = await noticeModel.getDispatchTargets(noticeId);
  if (!userIds.length) return { message: "발송 대상자가 없습니다." };

  const jobId = `JOB_${uuidv4()}`;
  // const jobData = { jobId, noticeId, dispatch: userIds, channel };

  if (mock) {
    // 1) QUEUE 상태로 표기
    // await noticeModel.markQueued(noticeId, userIds, channel);

    // 2) (가짜) 발송 성공 처리 - 전부 SENT로
    const accepted = await noticeModel.updateRecipients(
      noticeId,
      userIds,
      "SENT",
    );

    return {
      job_id: jobId,
      accepted,
      rejected: userIds.length - accepted,
      reason: "임시(mock) 디스패치: 즉시 SENT 처리",
    };
  }

  // TODO: 실제 큐 적재(나중에 카카오 프로바이더 붙일 때)
  // await queue.add('send-notice', jobData);

  return {
    job_id: jobId,
    accepted: 0,
    rejected: 0,
    reason: "큐에 적재됨",
  };
};

// 읽음 처리
export const markNoticeAsRead = async (noticeId, user) => {
  if (user.role !== "student") {
    return { message: "학생만 읽음 처리가 가능합니다." };
  }
  const affectedRows = await noticeModel.updateStudentStatus(
    noticeId,
    user.user_id,
  );

  return { updated: affectedRows };
};

// 읽음 현황
export const getNoticeReadStatusById = async (noticeId, user) => {
  console.log(user);
  if (user.role !== "professor" && user.role !== "admin") {
    throw new ForbiddenError("읽음 현황을 조회할 권한이 없습니다.");
  }

  const readStatusList = await noticeModel.getNoticeReadStatus(noticeId);

  return readStatusList;
};

// 과목 조회 필터
export const filterCourses = async (user, filters) => {
  return await noticeModel.findProfessorCourses(user, filters);
};
