import express from "express";
import * as fileController from "../controllers/fileController.js";
import { authWithRole } from "../middleware/authWithRole.js"; // 인증 미들웨어

const router = express.Router();

// 로그인한 모든 사용자가 다운로드 가능
router.get(
  "/:file_id/download",
  authWithRole("student"),
  fileController.downloadFile,
);

export default router;
