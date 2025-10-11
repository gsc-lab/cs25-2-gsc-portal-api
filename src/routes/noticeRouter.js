import express from "express";
import * as noticeController from "../controllers/noticeController.js";
import { authWithRole } from "../middleware/authWithRole.js";
import { uploadForNotices } from "../middleware/fileMiddleware.js";

const router = express.Router();

// 공지사항 조회
router.get("/", authWithRole("student"), noticeController.fetchNotices);
router.get(
  "/:notice_id",
  authWithRole("student"),
  noticeController.fetchNoticesId,
);

// 공지사항 작성 / 수정 / 삭제
router.post(
  "/",
  authWithRole("professor"),
  uploadForNotices.array("files", 10),
  noticeController.createNotice,
);
router.patch(
  "/:notice_id",
  authWithRole("professor"),
  uploadForNotices.array("files", 10),
  noticeController.updateNotice,
);
router.delete(
  "/:notice_id",
  authWithRole("professor"),
  noticeController.deleteNotice,
);

// 발송 / 읽음 / 상태
router.post(
  "/:notice_id/dispatch",
  authWithRole("professor"),
  noticeController.dispatchNotice,
);
router.get(
  "/:notice_id/status",
  authWithRole("professor"),
  noticeController.getNoticeStatus,
);
router.patch(
  "/:notice_id/read",
  authWithRole("student"),
  noticeController.noticeAsRead,
);

// 과목 필터
router.get(
  "/form/courses",
  authWithRole("professor"),
  noticeController.getCourses,
);

export default router;
