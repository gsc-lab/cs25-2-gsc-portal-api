import * as noticeService from "../service/notice-service.js";
import {dispatchByNoticeId} from "../service/notice-service.js";

// 리스트
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

// 싱세
export async function fetchNoticesId(req, res, next) {
  try {
    const { notice_id } = req.params;

    const noticeId = await noticeService.detailNotices(notice_id);

    res.status(200).json(noticeId);
  } catch (error) {
    next(error);
  }
}

// 공지 작성
export async function createNotice(req, res, next) {
  try {
    const { user, body: noticeData, files } = req;

    const result = await noticeService.addNotice(user, noticeData, files);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// 공지 수정
export async function updateNotice(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user, body: noticeData, files: newFiles } = req.body;

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

// 공지 삭제
export async function deleteNotice(req, res, next) {
  try {
    const { notice_id } = req.params;

    const result = await noticeService.deleteNotice(notice_id, req.user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function dispatchNotice(req, res, next){
  try {
    const { notice_id } = req.params;
    const { user } = req.user;

    const result = await noticeService.dispatchByNoticeId(notice_id, user);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
