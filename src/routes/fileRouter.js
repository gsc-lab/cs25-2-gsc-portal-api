/**
 * @file 파일 관련 라우터
 * @description 파일 다운로드와 관련된 API 엔드포인트를 정의합니다.
 */
import express from "express";
import * as fileController from "../controllers/fileController.js";
import { authWithRole } from "../middleware/authWithRole.js"; // 인증 미들웨어

const router = express.Router();

/**
 * GET /api/files/:file_id/download
 * 특정 파일 ID에 해당하는 파일을 다운로드합니다.
 * 로그인한 학생 역할 사용자만 접근 가능합니다.
 */
router.get(
  "/:file_id/download",
  authWithRole("student"),
  fileController.downloadFile,
);

export default router;
