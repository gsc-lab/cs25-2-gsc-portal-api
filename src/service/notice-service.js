/**
 * @file 공지사항 관련 서비스 로직
 * @description 공지사항의 비즈니스 로직을 처리합니다. 목록 조회, 상세 조회, 생성, 수정, 삭제, 발송, 읽음 처리 및 읽음 현황 조회 등을 포함합니다.
 */
// import
import * as noticeModel from "../models/Notice.js";
import * as fileService from "../service/file-service.js";
import pool from "../db/connection.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/index.js";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

/**
 * 공지사항 목록을 조회합니다.
 *
 * @param {object} spec - 사용자 정보 및 기타 스펙
 * @param {object} query - 검색 및 필터링 쿼리 파라미터
 * @returns {Promise<object>} 공지사항 목록 및 총 개수
 */
export const getNotices = async (spec, query) => {
  // 사용자가 학기 관련 파라미터(sec_id, year, semester)를 전달하지 않은 경우
  if (!query.sec_id && !query.year && !query.semester) {
    // 자동으로 현재 학기에 대한 정보 호출
    const currentSection = await noticeModel.getCurrentSection();
    if (currentSection) {
      // 조회된 현재 학기 ID를 쿼리 객체에 추가합니다.
      query.sec_id = currentSection.sec_id;
    }
  }
  // 최종적으로 구성된 쿼리로 모델 함수를 호출합니다.
  return await noticeModel.findBySpec(spec, query);
};

/**
 * 특정 공지사항의 상세 정보를 조회합니다.
 * 사용자 역할에 따라 공지사항 조회 권한을 확인합니다.
 *
 * @param {string} noticeId - 조회할 공지사항의 ID
 * @param {object} user - 현재 로그인된 사용자 정보
 * @returns {Promise<object>} 공지사항 상세 정보
 * @throws {NotFoundError} 공지사항을 찾을 수 없는 경우
 * @throws {ForbiddenError} 공지사항을 조회할 권한이 없는 경우
 */
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
    const student = await noticeModel.getStudentEntity(user_id);
    if (!student) {
      // 학생 정보가 없는 경우, 권한 확인 불가
      throw new ForbiddenError("학생 정보를 찾을 수 없어 권한을 확인할 수 없습니다.");
    }

    const isRecipient = await noticeModel.isStudentRecipient(detailNt, student);
    if (!isRecipient) {
      throw new ForbiddenError("해당 공지사항을 조회할 권한이 없습니다.");
    }
    return detailNt;
  }

  // 위 모든 조건에 해당하지 않으면 권한 없음
  throw new ForbiddenError("해당 공지를 조회할 권한이 없습니다.");
};

/**
 * 새로운 공지사항을 추가합니다.
 * 공지사항 데이터, 첨부 파일, 타겟 그룹 및 특정 사용자 지정 정보를 받아 처리합니다.
 * 트랜잭션을 사용하여 데이터의 일관성을 유지합니다.
 *
 * @param {object} user - 공지사항을 생성하는 사용자 정보
 * @param {object} noticeData - 공지사항 데이터 (title, content, course_id, targets, specific_users 등)
 * @param {Array<object>} files - 첨부 파일 배열
 * @returns {Promise<{noticeId: string}>} 생성된 공지사항의 ID
 * @throws {BadRequestError} 필수 필드 누락, 잘못된 형식의 데이터, 존재하지 않는 과목 ID 시
 * @throws {ForbiddenError} 담당하지 않는 과목의 공지를 작성하려는 경우
 */
export const addNotice = async (user, noticeData, files) => {
  const { sec_id, course_id, targets, specific_users, ...noticeInfo } = noticeData;
  const { title, content } = noticeInfo;

  if (!title || title.trim() === "") {
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

  let specificUsers = specific_users;

  if (specific_users && typeof specific_users === "string") {
    try {
      specificUsers = JSON.parse(specific_users);

      // 한 번 파싱했는데 여전히 문자열이면 -> 다시 한 번 파싱
      if (typeof specificUsers === "string") {
        specificUsers = JSON.parse(specificUsers);
      }

      // 문자열 숫자일 경우 숫자로 변환
      if (Array.isArray(specificUsers)) {
        specificUsers = specificUsers.map(Number);
      }
    } catch (err) {
      console.error("specific_users 파싱 실패:", err.message);
      specificUsers = [];
    }
  }

  if (course_id) {
    // 강의가 실제로 존재하는지 검증
    const courseExists = await noticeModel.courseExists(course_id);
    if (!courseExists) {
      throw new BadRequestError("존재하지 않는 과목입니다.");
    }

    // 교수 -> 자신의 강의 & 전체만 가능
    if (user.role === "professor") {
      const isOwner = await noticeModel.isProfessorOfCourse(
        user.user_id,
        course_id,
      );
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
      sec_id,
      course_id,
      user.user_id,
      connection,
    );

    if (files && files.length > 0) {
      const fileIds = await fileService.addFiles(files, connection);
      await noticeModel.createFiles(noticeId, fileIds, connection);
    }

    if (parsedTargets && parsedTargets.length > 0) {
      await noticeModel.createTargets(noticeId, course_id, parsedTargets, connection);
    }

    if (Array.isArray(specificUsers) && specificUsers.length > 0) {
      await noticeModel.populateDeliverNoticeForSpecificUsers(
        noticeId,
        specificUsers,
        connection,
      );
    } else {
      await noticeModel.populateDeliverNotice(noticeId, connection);
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

/**
 * 기존 공지사항을 업데이트합니다.
 * 공지사항 ID, 업데이트할 데이터, 새로운 파일 정보, 사용자 정보를 받아 처리합니다.
 * 텍스트 내용, 첨부 파일, 타겟 그룹의 변경 사항을 감지하고 트랜잭션으로 업데이트합니다.
 *
 * @param {string} noticeId - 업데이트할 공지사항의 ID
 * @param {object} data - 업데이트할 공지사항 데이터
 * @param {Array<object>} newFiles - 새로 추가될 첨부 파일 배열
 * @param {object} user - 공지사항을 수정하는 사용자 정보
 * @returns {Promise<object>} 업데이트된 공지사항 정보
 * @throws {NotFoundError} 공지사항을 찾을 수 없는 경우
 * @throws {ForbiddenError} 공지사항을 수정할 권한이 없는 경우
 * @throws {BadRequestError} 필수 필드 누락, 잘못된 형식의 데이터, 수정할 내용이 없는 경우
 */
export const updateNotice = async (noticeId, data, newFiles, user) => {
  const updateTableTextFields = ["title", "content", "is_pinned", "course_id", "sec_id"];

  const notice = await noticeModel.findById(noticeId);
  // 사전 검증
  if (!notice) {
    throw new NotFoundError("해당되는 공지사항을 찾을 수 없습니다.");
  }

  if (user.role === "professor" && notice.author.user_id !== user.user_id) {
    throw new ForbiddenError(`본인의 게시물만 수정할 수 있습니다.`);
  }

  if (data.title !== undefined && (!data.title || data.title.trim() === "")) {
    throw new BadRequestError("공지사항 제목은 비워둘 수 없습니다.");
  }
  if (
    data.content !== undefined &&
    (!data.content || data.content.trim() === "")
  ) {
    throw new BadRequestError("공지사항 내용은 비워둘 수 없습니다.");
  }

  const { course_id } = data;
  if (course_id) {
    // 강의가 실제로 존재하는지 검증
    const courseExists = await noticeModel.courseExists(course_id);
    if (!courseExists) {
      throw new BadRequestError("존재하지 않는 과목입니다.");
    }

    // 교수 -> 자신의 강의 & 전체만 가능
    if (user.role === "professor") {
      const isOwner = await noticeModel.isProfessorOfCourse(
        user.user_id,
        course_id,
      );
      if (!isOwner) {
        throw new ForbiddenError(
          "담당하지 않는 과목의 공지는 수정할 수 없습니다.",
        );
      }
    }
  }

  // 1. 텍스트 데이터 변경 확인
  const updateData = _.pick(data, updateTableTextFields);
  const hasTextChanges = Object.keys(updateData).some((key) => {
    if (key === "course_id") {
      return !_.isEqual(updateData.course_id, notice.course_id);
    }
    return !_.isEqual(updateData[key], notice[key]);
  });

  // 2. 파일 변경 확인
  let { existing_file_ids = [] } = data;
  if (existing_file_ids) {
    if (typeof existing_file_ids === "string") {
      try {
        existing_file_ids = JSON.parse(existing_file_ids);
      } catch {
        throw new BadRequestError("요청 타겟의 형식이 올바른 JSON이 아닙니다.");
      }
    }
  }
  const hasNewFileUploads = !_.isEmpty(newFiles);
  const currentFileIds = notice.attachments.map((file) => String(file.file_id));
  const hasExistingFileChanges = !_.isEqual(
    _.sortBy(currentFileIds),
    _.sortBy(existing_file_ids.map(String)),
  );
  const hasFileChanges = hasNewFileUploads || hasExistingFileChanges;

  const { targets: targetsJSON, specific_users } = data;
  // Targets 파싱
  let parsedTargets = null;
  if (targetsJSON) {
    if (typeof targetsJSON === "string") {
      try {
        parsedTargets = JSON.parse(targetsJSON);
      } catch {
        throw new BadRequestError("요청 타겟의 형식이 올바른 JSON이 아닙니다.");
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
    const sortKey = ["grade_id", "class_id", "language_id"];
    hasTargetChanges = !_.isEqual(
      _.sortBy(currentTargets, sortKey),
      _.sortBy(newTargets, sortKey),
    );
  }

  let specificUsers = specific_users;

  if (specific_users && typeof specific_users === "string") {
    try {
      specificUsers = JSON.parse(specific_users);

      // 한 번 파싱했는데 여전히 문자열이면 → 다시 한 번 파싱
      if (typeof specificUsers === "string") {
        specificUsers = JSON.parse(specificUsers);
      }

      // 문자열 숫자일 경우 숫자로 변환
      if (Array.isArray(specificUsers)) {
        specificUsers = specificUsers.map(Number);
      }
    } catch (err) {
      specificUsers = [];
    }
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

      const desiredFileIds = [
        ...existing_file_ids.map(String),
        ...newFileIds.map(String),
      ];

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
        await noticeModel.createTargets(noticeId, notice.course_id, parsedTargets, connection);
      }
      // 새로운 수신자 목록 재설정
      await noticeModel.populateDeliverNotice(noticeId, connection);
    }

    // 특정 유저 지정 수정 처리
    if (
      specificUsers &&
      Array.isArray(specificUsers) &&
      specificUsers.length > 0
    ) {
      // 기존 delivery 삭제 (중복 방지)
      await noticeModel.deleteDeliveryStatusByNoticeId(noticeId, connection);

      // 지정된 유저만 다시 채움
      await noticeModel.populateDeliverNoticeForSpecificUsers(
        noticeId,
        specificUsers,
        connection,
      );
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

/**
 * 공지사항을 삭제합니다.
 * 학생은 공지사항을 삭제할 수 없으며, 교수는 본인이 작성한 공지사항만 삭제할 수 있습니다.
 *
 * @param {string} noticeId - 삭제할 공지사항의 ID
 * @param {object} user - 공지사항을 삭제하는 사용자 정보
 * @returns {Promise<{message: string}>} 삭제 성공 메시지
 * @throws {ForbiddenError} 공지사항을 삭제할 권한이 없는 경우
 * @throws {NotFoundError} 공지사항을 찾을 수 없는 경우
 */
export const deleteNotice = async (noticeId, user) => {
  if (user.role === "student") {
    throw new ForbiddenError("학생은 공지사항을 삭제할 수 없습니다.");
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

/**
 * 특정 공지사항을 발송 처리합니다.
 * 공지사항의 발송 대상자를 조회하고, 실제 알림톡 발송 로직을 호출하거나 mock 처리합니다.
 *
 * @param {string} noticeId - 발송할 공지사항의 ID
 * @param {object} user - 공지사항을 발송하는 사용자 정보
 * @param {object} options - 발송 옵션 (mock 여부 등)
 * @param {boolean} [options.mock=true] - mock 발송 여부
 * @returns {Promise<object>} 발송 결과 정보
 * @throws {NotFoundError} 공지사항을 찾을 수 없는 경우
 * @throws {ForbiddenError} 공지사항을 발송할 권한이 없는 경우
 */
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
  const targetUserIds = userIds.map((t) => t.user_id);

  // 임시 목 데이터
  if (mock) {
    const accepted = await noticeModel.updateRecipients(
      noticeId,
      targetUserIds,
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
    title: notice.title,
    content_preview: notice.content.substring(0, 20) + "...",
    URL: `${process.env.FE_BASE_URL}/notices/${noticeId}`,
  };
  const TEMPLATE_CODE = "NOTICE_TEMPLATE_CODE";

  // 알림톡 발송
  const results = await Promise.allSettled(
    userIds.map((target) =>
      sendAlimtalk(target.phone, TEMPLATE_CODE, templatedParams),
    ),
  );

  const successfulUserIds = [];
  const failedUserIds = [];
  results.forEach((result, index) => {
    if (results.status === "fulfilled") {
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

/**
 * 학생이 공지사항을 읽었음을 처리합니다.
 * 학생만 이 기능을 사용할 수 있으며, 해당 공지사항의 수신 대상인 경우에만 읽음 처리가 됩니다.
 *
 * @param {string} noticeId - 읽음 처리할 공지사항의 ID
 * @param {object} user - 읽음 처리하는 사용자 정보 (학생)
 * @returns {Promise<{updated: number, message?: string}>} 업데이트된 행의 수 또는 메시지
 * @throws {ForbiddenError} 읽음 처리할 수 없는 공지인 경우
 */
export const markNoticeAsRead = async (noticeId, user) => {
  if (user.role !== "student") {
    return { updated: 0, message: "읽음 처리는 학생에게만 적용됩니다." };
  }

  // 학생이 해당 공지의 수신 대상인지 먼저 확인
  const notice = await noticeModel.findById(noticeId);
  if (!notice) {
    throw new NotFoundError("읽음 처리할 공지를 찾을 수 없습니다.");
  }

  const student = await noticeModel.getStudentEntity(user.user_id);
  if (!student) {
    throw new ForbiddenError("학생 정보를 찾을 수 없어 권한을 확인할 수 없습니다.");
  }

  const isRecipient = await noticeModel.isStudentRecipient(notice, student);
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

/**
 * 특정 공지사항의 읽음 현황을 조회합니다.
 * 교수 또는 관리자만 이 기능을 사용할 수 있습니다.
 *
 * @param {string} noticeId - 읽음 현황을 조회할 공지사항의 ID
 * @param {object} user - 읽음 현황을 조회하는 사용자 정보
 * @returns {Promise<Array<object>>} 읽음 현황 목록
 * @throws {ForbiddenError} 읽음 현황을 조회할 권한이 없는 경우
 * @throws {NotFoundError} 공지사항을 찾을 수 없는 경우
 */
export const getNoticeReadStatusById = async (noticeId, user) => {
  if (user.role === "student") {
    throw new ForbiddenError("읽음 현황을 조회할 권한이 없습니다.");
  }

  // 권한 검사를 위해 공지 정보를 먼저 조회
  const notice = await noticeModel.findById(noticeId);
  if (!notice) {
    throw new NotFoundError("해당 공지사항을 찾을 수 없습니다.");
  }

  // 교수는 자신이 담당하는 과목의 공지 또는 본인이 작성한 공지만 조회 가능 -> 주석 처리
  // if (user.role === 'professor') {
  //   const isAuthor = notice.author.user_id === user.user_id;
  //   let isCourseProfessor = false;
  //
  //   if (notice.course_id) {
  //     isCourseProfessor = await noticeModel.isProfessorOfCourse(user.user_id, notice.course_id);
  //   }
  //
  //   // 작성자도 아니고, 담당 과목의 공지도 아니라면 권한 없음
  //   if (!isAuthor && !isCourseProfessor) {
  //     throw new ForbiddenError("읽음 현황을 조회할 권한이 없습니다.");
  //   }
  // }

  // 관리자는 모든 공지 조회 가능
  const readStatusList = await noticeModel.getNoticeReadStatus(noticeId);

  return readStatusList;
};

/**
 * 공지사항 폼에서 사용할 과목 목록을 필터링하여 반환합니다.
 * 유효한 과목 타입인지 검증하고, 교수 역할에 따라 조회 범위를 제한합니다.
 *
 * @param {object} user - 현재 로그인된 사용자 정보
 * @param {object} filters - 필터링 조건 (course_type 등)
 * @returns {Promise<Array<object>>} 필터링된 과목 목록
 * @throws {BadRequestError} 잘못된 과목 타입이 전달된 경우
 */
export const filterCourses = async (user, filters) => {
  const VALID_COURSE_TYPES = new Set(["regular", "special", "korean"]);

  if (filters.course_type && !VALID_COURSE_TYPES.has(filters.course_type)) {
    throw new BadRequestError(`잘못된 과목 타입입니다: ${filters.course_type}`);
  }

  let searchUserId = null;
  if (user.role === "professor") {
    searchUserId = user.user_id;
  }

  return await noticeModel.findCoursesForForm(searchUserId, filters);
};

/**
 * 카카오 알림톡을 발송하는 mock 함수입니다.
 * 실제 알림톡 API 연동 시 이 함수를 구현해야 합니다.
 *
 * @param {string} phoneNumber - 수신자 전화번호
 * @param {string} templateCode - 알림톡 템플릿 코드
 * @param {object} params - 템플릿에 채워질 파라미터
 * @returns {Promise<object>} 발송 결과 (현재는 mock 결과)
 */
async function sendAlimtalk(phoneNumber, templateCode, params) {
  console.log(
    `Sending Alimtalk to ${phoneNumber} with template ${templateCode} and params`,
    params,
  );
  // 실제 카카오 알림톡 API 호출 로직
  return { success: true, message: "Alimtalk sent (mock)" };
}
