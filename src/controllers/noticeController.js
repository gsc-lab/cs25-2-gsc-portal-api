/**
 * @file 공지사항 관련 컨트롤러
 * @description 공지사항 목록 조회, 상세 조회, 생성, 수정, 삭제, 발송, 읽음 처리 및 읽음 현황 조회 등 공지사항과 관련된 요청을 처리합니다.
 */
import * as noticeService from "../service/notice-service.js";

/**
 * 공지사항 목록을 조회합니다.
 * 로그인한 사용자의 역할과 쿼리 파라미터에 따라 필터링된 공지사항 목록을 반환합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user, req.query 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function fetchNotices(req, res, next) {
  try {
    const spec = { user: req.user }; // 로그인 사용자 정보
    const query = req.query;

    const notices = await noticeService.getNotices(spec, query);

    res.status(200).json(notices);
  } catch (error) {
    next(error);
  }
}

/**
 * 특정 공지사항의 상세 정보를 조회합니다.
 * 공지사항 ID를 통해 상세 정보를 가져오며, 사용자 권한에 따라 접근이 제한될 수 있습니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function fetchNoticesId(req, res, next) {
  try {
    const { notice_id } = req.params;

    const noticeId = await noticeService.detailNotices(notice_id, req.user);

    res.status(200).json(noticeId);
  } catch (error) {
    next(error);
  }
}

/**
 * 새로운 공지사항을 생성합니다.
 * 요청 본문(body)의 공지사항 데이터와 업로드된 파일(files)을 사용하여 공지사항을 추가합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user, req.body, req.files 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function createNotice(req, res, next) {
  try {
    const { user, body: noticeData, files } = req;

    const result = await noticeService.addNotice(user, noticeData, files);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 기존 공지사항을 수정합니다.
 * 공지사항 ID, 수정할 데이터, 새로운 파일 정보를 받아 공지사항을 업데이트합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user, req.body, req.files 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function updateNotice(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user, body: noticeData, files: newFiles } = req;

    const result = await noticeService.updateNotice(
      notice_id,
      noticeData,
      newFiles,
      user,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항을 삭제합니다.
 * 공지사항 ID와 사용자 정보를 받아 해당 공지사항을 삭제합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function deleteNotice(req, res, next) {
  try {
    const { notice_id } = req.params;

    const result = await noticeService.deleteNotice(notice_id, req.user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항을 발송 처리합니다. (현재는 mock 데이터로 임시 처리)
 * 공지사항 ID와 사용자 정보를 받아 해당 공지사항을 발송합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function dispatchNotice(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user } = req;

    const jobInfo = await noticeService.dispatchByNoticeId(notice_id, user, {
      mock: true,
    });

    res.status(202).json(jobInfo);
  } catch (error) {
    next(error);
  }
}

/**
 * 학생이 공지사항을 읽었음을 처리합니다.
 * 공지사항 ID와 사용자 정보를 받아 해당 공지사항을 읽음 상태로 변경합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function noticeAsRead(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user } = req;

    const result = await noticeService.markNoticeAsRead(notice_id, user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 공지사항의 읽음 현황을 조회합니다.
 * 공지사항 ID와 사용자 정보를 받아 해당 공지사항의 읽음 상태 목록을 반환합니다.
 * 교수/관리자만 접근 가능합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.notice_id, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function getNoticeStatus(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user } = req;

    const result = await noticeService.getNoticeReadStatusById(notice_id, user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 교수 과목 목록을 필터링하여 조회합니다.
 * 쿼리 파라미터로 필터를 받아 해당 조건에 맞는 과목 목록을 반환합니다.
 *
 * @param {object} req - Express 요청 객체 (req.query, req.user 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function getCourses(req, res, next) {
  try {
    const filters = req.query;
    const { user } = req;

    const result = await noticeService.filterCourses(user, filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
