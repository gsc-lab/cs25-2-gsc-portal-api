/**
 * @file 대시보드 관련 라우터
 * @description 대시보드에 필요한 데이터를 조회하는 API 엔드포인트를 정의합니다.
 */
import express from "express";
import { authWithRole } from "../middleware/authWithRole.js";
import * as dashboardController from "../controllers/dashboardController.js";
const router = express.Router();

/**
 * GET /api/dashboard
 * 대시보드에 표시될 데이터를 조회합니다. 학생 역할만 접근 가능합니다.
 */
router.get("/", authWithRole("student"), dashboardController.getDashboardData);

export default router;
