import * as noticeModel from "../models/Notice.js";
import * as fileService from "../service/file-service.js";
import pool from "../db/connection.js";
import { ForbiddenError, NotFoundError } from "../errors/index.js";

// 권한 가시성 규칙 적용 전체 조회
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

// 작성
export const addNotice = async (user, noticeData, files) => {
  const { course_id, targets, ...noticeInfo } = noticeData;

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

    if (targets && targets.length > 0) {
      await noticeModel.createTargets(noticeId, targets, connection);
    }

    await connection.commit();
    return { noticeId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 공지사항 수정
export const updateNotice = async (noticeId, data, newFiles, user) => {
  const notice = await noticeModel.findById(noticeId);

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

    if (data.targets && data.targets.length > 0) {
      await noticeModel.createTargets(noticeId, data.targets, connection);
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

// 공지사항 삭제
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

export const dispatchByNoticeId = async (noticeId, user) => {
  const notice = await noticeModel.findById(noticeId);

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    return [];
  }

  const dispatch = await noticeModel.dispatchNotice(noticeId);

  if (dispatch.length === 0) {
    return { message: "발송 대상자가 없습니다." };
  }

  console.log(`Dispatching notice ${noticeId} to ${dispatch.length} users`);
  const jobId = `JOB_${Date.now()}${noticeId}`
  return {jobId, dispatchCount: dispatch.length };
}