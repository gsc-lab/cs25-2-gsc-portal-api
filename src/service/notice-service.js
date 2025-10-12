// import
import * as noticeModel from "../models/Notice.js";
import * as fileService from "../service/file-service.js";
import pool from "../db/connection.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/index.js";
import _ from 'lodash';
import { v4 as uuidv4 } from "uuid";

// 목록 조회
export const getNotices = async (spec, query) => {

  const notices = await noticeModel.findBySpec(spec, query);

  return notices;
};

// 상세 공지
export const detailNotices = async (noticeId, user) => {
  const detailNt = await noticeModel.findById(noticeId);

  if (!detailNt) {
    throw new NotFoundError(`해당 공지사항을 찾을 수 없습니다.`);
  }

  // 사용자 권한 검증
  const { role, user_id } = user;

  // 관리자 및 교수는 모든 공지 조회 가능
  if (role === "admin" || role === "professor") {
    return detailNt;
  }

  // 학생은 수신 대상인 공지만 조회 가능
  if (role === "student") {
    const isRecipient = await noticeModel.isRecipient(noticeId, user_id);
    if (!isRecipient) {
      throw new ForbiddenError("해당 공지사항을 조회할 권한이 없습니다.");
    }
    return detailNt; // 권한이 있으면 즉시 반환
  }


  // 위 모든 조건에 해당하지 않으면 권한 없음
  throw new ForbiddenError("해당 공지를 조회할 권한이 없습니다.");
};

// 생성
export const addNotice = async (user, noticeData, files) => {
  const { course_id, targets, ...noticeInfo } = noticeData;
  const { title, content } = noticeInfo;

  if (!title|| title.trim() === "") {
    throw new BadRequestError("공지사항 제목은 필수 입력 항목입니다.");
  }
  if (!content || content.trim() === "") {
    throw new BadRequestError("공지사항 내용은 필수 입력 항목입니다.");
  }

  let parsedTargets = [];
  if (targets && typeof targets === "string") {
    try {
      parsedTargets = JSON.parse(targets);
    } catch {
      throw new BadRequestError("요청 타겟의 형식이 올바른 JSON이 아닙니다");
    }
  } else if (Array.isArray(targets)) {
    parsedTargets = targets;
  }

  if (course_id) {
    // 강의가 실제로 존재하는지 검증
    const courseExists = await noticeModel.exists(course_id);
    if (!courseExists) {
      throw new BadRequestError("존재하지 않는 과목입니다.");
    }

    // 교수 -> 자신의 강의 & 전체만 가능
    if (user.role === "professor") {
      const isOwner = await noticeModel.isProfessorOfCourse(user.user_id, course_id);
      if (!isOwner) {
        throw new ForbiddenError(
            "담당하지 않는 과목의 공지는 작성할 수 없습니다.",
        );
      }
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

export const updateNotice = async (noticeId, data, newFiles, user) => {
  const updateTableTextFields = ["title", "content", "is_pinned", "course_id"];

  const notice = await noticeModel.findById(noticeId);
  // 사전 검증
  if (!notice) {
    throw new NotFoundError("해당되는 공지사항을 찾을 수 없습니다.");
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    throw new ForbiddenError(`본인의 게시물만 수정할 수 있습니다.`);
  }

  if (data.title !== undefined && (!data.title || data.title.trim() === "")) {
    throw new BadRequestError("공지사항 제목은 비워둘 수 없습니다.")
  }
  if (data.content !== undefined && (!data.content || data.content.trim() === "")) {
    throw new BadRequestError("공지사항 내용은 비워둘 수 없습니다.")
  }

  const { course_id } = data;
  if (course_id) {
    // 강의가 실제로 존재하는지 검증
    const courseExists = await noticeModel.exists(course_id);
    if (!courseExists) {
      throw new BadRequestError("존재하지 않는 과목입니다.");
    }

    // 교수 -> 자신의 강의 & 전체만 가능
    if (user.role === "professor") {
      const isOwner = await noticeModel.isProfessorOfCourse(user.user_id, course_id);
      if (!isOwner) {
        throw new ForbiddenError(
            "담당하지 않는 과목의 공지는 수정할 수 없습니다.",
        );
      }
    }
  }

  // 1. 텍스트 데이터 변경 확인
  const updateData = _.pick(data, updateTableTextFields);
  const hasTextChanges = Object.keys(updateData).some(
      key => !_.isEqual(updateData[key], notice[key])
  );

  // 2. 파일 변경 확인
  const { existing_file_ids = [] } = data;
  const hasNewFileUploads = !_.isEmpty(newFiles);
  const currentFileIds = notice.attachments.map(file => String(file.file_id));
  const hasExistingFileChanges = !_.isEqual(_.sortBy(currentFileIds), _.sortBy(existing_file_ids.map(String)));
  const hasFileChanges = hasNewFileUploads || hasExistingFileChanges;

  const { targets: targetsJSON } = data;
  // Targets 파싱
  let parsedTargets = null;
  if (targetsJSON) {
    if (typeof targetsJSON === "string") {
      try {
        parsedTargets = JSON.parse(targetsJSON);
      } catch {
        throw new BadRequestError("요청 타겟의 형식이 올바른 JSON이 아닙니다.")
      }
    } else if (Array.isArray(targetsJSON)) {
      parsedTargets = targetsJSON;
    }
  }

  // 3. 타겟 변경 확인 (정규화 후 비교)
  let hasTargetChanges = false;
  if (parsedTargets !== null) {
    // DB에서 가져온 기존 타겟과 클라이언트에서 보낸 새 타겟을 동일한 형식으로 정규화
    const normalize = (t) => ({
      class_id: t.class_id || null,
      grade_id: t.grade_id || null,
      language_id: t.language_id || null,
    });

    // notice.targets가 null이나 undefined일 경우를 대비해 빈 배열로 처리
    const currentTargets = (notice.targets || []).map(normalize);
    const newTargets = parsedTargets.map(normalize);

    // 정렬 후 비교 (순서에 상관없이 내용물만 비교)
    const sortKey = ['grade_id', 'class_id', 'language_id'];
    hasTargetChanges = !_.isEqual(_.sortBy(currentTargets, sortKey), _.sortBy(newTargets, sortKey));
  }

  // 최종적으로 변경분이 있는지 확인
  if (!hasTextChanges && !hasFileChanges && !hasTargetChanges) {
    throw new BadRequestError("수정할 내용이 없습니다.");
  }


  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 텍스트 내용 업데이트
    if (hasTextChanges) {
      await noticeModel.updateNotice(noticeId, updateData, connection);
    }

    // 첨부파일 업데이트 (Diff & Patch)
    if (hasFileChanges) {
      let newFileIds = [];
      if (newFiles && newFiles.length > 0) {
        newFileIds = await fileService.addFiles(newFiles, connection);
      }

      const desiredFileIds = [...existing_file_ids.map(String), ...newFileIds.map(String)];

      const filesToDelete = _.difference(currentFileIds, desiredFileIds);
      const filesToAdd = _.difference(desiredFileIds, currentFileIds);

      if (filesToDelete.length > 0) {
        await noticeModel.deleteFiles(noticeId, filesToDelete, connection);
      }
      if (filesToAdd.length > 0) {
        await noticeModel.createFiles(noticeId, filesToAdd, connection);
      }
    }

    // 타겟 업데이트
    if (hasTargetChanges) {
      // 기존 타겟 연결 삭제
      await noticeModel.deleteTargets(noticeId, connection);
      await noticeModel.deleteDeliveryStatusByNoticeId(noticeId, connection);
      // 최종 ID 목록으로 새로운 연결 생성
      if (parsedTargets.length > 0) {
        await noticeModel.createTargets(noticeId, parsedTargets, connection);
      }
      // 새로운 수신자 목록 재설정
      await noticeModel.populateDeliverNotice(noticeId, connection);
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
  if (user.role === 'student') {
    throw new ForbiddenError('학생은 공지사항을 삭제할 수 없습니다.');
  }

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

  if (!notice) {
    throw new NotFoundError(`해당 공지사항을 찾을 수 없습니다.`);
  }

  if (user.role === "student") {
    throw new ForbiddenError("학생은 공지를 발송할 권한이 없습니다.");
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    throw new ForbiddenError("본인이 작성한 공지만 발송할 수 있습니다!");
  }

  // 대상자 해석
  const userIds = await noticeModel.getDispatchTargets(noticeId);
  if (!userIds || !userIds.length === 0) {
    return { message: "발송 대상자가 없습니다." };
  }
  const targetUserIds = userIds.map(t => t.user_id);

  // 임시 목 데이터
  if (mock) {
    const accepted = await noticeModel.updateRecipients(
      noticeId, targetUserIds,
      "SENT",
    );

    return {
      accepted,
      rejected: userIds.length - accepted,
      reason: "임시(mock) 디스패치: 즉시 SENT 처리",
    };
  }

  // 실제 알림톡 발송 로직들
  const templatedParams = {
    "GSC Portal": "공지사항",
    "title": notice.title,
    "content_preview": notice.content.substring(0, 20) + "...",
    "URL": `${process.env.FE_BASE_URL}/notices/${noticeId}`,
  };
  const TEMPLATE_CODE = "NOTICE_TEMPLATE_CODE";

  // 알림톡 발송
  const results = await Promise.allSettled(
      userIds.map(target =>
      sendAlimtalk(target.phone, TEMPLATE_CODE, templatedParams)
      )
  );

  const successfulUserIds = [];
  const failedUserIds = [];
  results.forEach((result, index) => {
    if (results.status === 'fulfilled') {
      successfulUserIds.push(userIds[index].user_id);
    } else {
      failedUserIds.push(userIds[index].user_id);
      console.error(`알림톡 실패 ${userIds[index].user_id}:`, result.reason);
    }
  });

  if (successfulUserIds.length > 0) {
    await noticeModel.updateRecipients(noticeId, successfulUserIds, "SENT");
  } else {
    await noticeModel.updateRecipients(noticeId, failedUserIds, "FAILED");
  }
};

// 읽음 처리
export const markNoticeAsRead = async (noticeId, user) => {
  if (user.role !== "student") {
    return { updated: 0, message: "읽음 처리는 학생에게만 적용됩니다." };
  }

  // 학생이 해당 공지의 수신 대상인지 먼저 확인
  const isRecipient = await noticeModel.isRecipient(noticeId, user.user_id);
  if (!isRecipient) {
    // 수신 대상이 아니므로, 읽음 처리할 수 없음
    throw new ForbiddenError("읽음 처리할 수 없는 공지입니다.");
  }

  const affectedRows = await noticeModel.updateStudentStatus(
    noticeId,
    user.user_id,
  );

  return { updated: affectedRows };
};

// 읽음 현황
export const getNoticeReadStatusById = async (noticeId, user) => {
  if (user.role === 'student') {
    throw new ForbiddenError("읽음 현황을 조회할 권한이 없습니다.");
  }

  // 권한 검사를 위해 공지 정보를 먼저 조회
  const notice = await noticeModel.findById(noticeId);
  if (!notice) {
    throw new NotFoundError("해당 공지사항을 찾을 수 없습니다.");
  }

  // 교수는 자신이 담당하는 과목의 공지 또는 본인이 작성한 공지만 조회 가능
  if (user.role === 'professor') {
    const isAuthor = notice.author.user_id === user.user_id;
    let isCourseProfessor = false;

    if (notice.course_id) {
      isCourseProfessor = await noticeModel.isProfessorOfCourse(user.user_id, notice.course_id);
    }

    // 작성자도 아니고, 담당 과목의 공지도 아니라면 권한 없음
    if (!isAuthor && !isCourseProfessor) {
      throw new ForbiddenError("읽음 현황을 조회할 권한이 없습니다.");
    }
  }

  // 관리자는 모든 공지 조회 가능
  const readStatusList = await noticeModel.getNoticeReadStatus(noticeId);

  return readStatusList;
};

// 과목 조회 필터
export const filterCourses = async (user, filters) => {
  const VALID_COURSE_TYPES = new Set(['regular', 'special', 'korean']);

  if (user.role === "student") {
    throw new ForbiddenError("과목 목록을 조회할 권한이 없습니다.");
  }
  if (filters.course_type && !VALID_COURSE_TYPES.has(filters.course_type)) {
    throw new BadRequestError(`잘못된 과목 타입입니다: ${filters.course_type}`);
  }


  let searchUserId = null;
  if (user.role === "professor") {
    searchUserId = user.user_id;
  }

  return await noticeModel.findCoursesForForm(searchUserId, filters);
};
