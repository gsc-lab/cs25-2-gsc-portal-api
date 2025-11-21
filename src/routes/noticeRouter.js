/**
 * @file 공지사항 관련 라우터
 * @description 공지사항 목록 조회, 상세 조회, 생성, 수정, 삭제, 발송, 읽음 처리 및 읽음 현황 조회와 관련된 API 엔드포인트를 정의합니다.
 */
import express from "express";
import * as noticeController from "../controllers/noticeController.js";
import { authWithRole } from "../middleware/authWithRole.js";
import { uploadForNotices } from "../middleware/fileMiddleware.js";

const router = express.Router();

/**
 * GET /api/notices
 * 공지사항 목록을 조회합니다. 학생 역할만 접근 가능합니다.
 */
router.get("/", authWithRole("student"), noticeController.fetchNotices);

/**
 * GET /api/notices/:notice_id
 * 특정 공지사항의 상세 정보를 조회합니다. 학생 역할만 접근 가능합니다.
 */
router.get(
  "/:notice_id",
  authWithRole("student"),
  noticeController.fetchNoticesId,
);

/**
 * POST /api/notices
 * 새로운 공지사항을 생성합니다. 교수 역할만 접근 가능하며, 최대 10개의 파일을 첨부할 수 있습니다.
 */
router.post(
  "/",
  authWithRole("professor"),
  uploadForNotices.array("files", 10),
  noticeController.createNotice,
);
/**
 * PATCH /api/notices/:notice_id
 * 특정 공지사항을 수정합니다. 교수 역할만 접근 가능하며, 최대 10개의 파일을 첨부할 수 있습니다.
 */
router.patch(
  "/:notice_id",
  authWithRole("professor"),
  uploadForNotices.array("files", 10),
  noticeController.updateNotice,
);
/**
 * DELETE /api/notices/:notice_id
 * 특정 공지사항을 삭제합니다. 교수 역할만 접근 가능합니다.
 */
router.delete(
  "/:notice_id",
  authWithRole("professor"),
  noticeController.deleteNotice,
);

/**
 * POST /api/notices/:notice_id/dispatch
 * 특정 공지사항을 발송 처리합니다. 교수 역할만 접근 가능합니다.
 */
router.post(
  "/:notice_id/dispatch",
  authWithRole("professor"),
  noticeController.dispatchNotice,
);
/**
 * GET /api/notices/:notice_id/status
 * 특정 공지사항의 읽음 현황을 조회합니다. 교수 역할만 접근 가능합니다.
 */
router.get(
  "/:notice_id/status",
  authWithRole("professor"),
  noticeController.getNoticeStatus,
);
/**
 * PATCH /api/notices/:notice_id/read
 * 학생이 특정 공지사항을 읽었음을 처리합니다. 학생 역할만 접근 가능합니다.
 */
router.patch(
  "/:notice_id/read",
  authWithRole("student"),
  noticeController.noticeAsRead,
);

/**
 * GET /api/notices/form/courses
 * 공지사항 폼에서 사용할 교수 과목 목록을 조회합니다. 학생이상  접근 가능합니다.
 */
router.get(
  "/form/courses",
  authWithRole("student"),
  noticeController.getCourses,
);

export default router;
