import express from "express";
import * as noticeController from "../controllers/noticeController.js";
import { authWithRole } from "../middleware/authWithRole.js";
import { uploadForNotices } from "../middleware/fileMiddleware.js";

const router = express.Router();

// 공지사항 CRUD
router.get("/", authWithRole("student"), noticeController.fetchNotices);
router.get(
  "/:notice_id",
  authWithRole("student"),
  noticeController.fetchNoticesId,
);
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

export default router;
