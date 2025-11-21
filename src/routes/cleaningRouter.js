/**
 * @file 청소 당번 관련 라우터
 * @description 청소 당번표 생성, 조회, 삭제와 관련된 API 엔드포인트를 정의합니다.
 */
import express from "express";
import * as cleaningController from "../controllers/cleaningController.js";
import { authWithRole } from "../middleware/authWithRole.js";
const router = express.Router();

/**
 * POST /api/cleaning/generate
 * 새로운 청소 당번표를 생성합니다. 관리자 역할만 접근 가능합니다.
 */
router.post(
  "/generate",
  authWithRole("admin"),
  cleaningController.generateCleaningRosters,
);

/**
 * GET /api/cleaning
 * 특정 날짜가 포함된 주의 청소 당번표를 조회합니다. 학생 역할만 접근 가능합니다.
 */
router.get("/",
    authWithRole("student"),
    cleaningController.getCleaningRosters
);

/**
 * GET /api/cleaning/monthly
 * 월간 청소 당번표를 조회합니다. 학생 역할만 접근 가능합니다.
 */
router.get('/monthly',
    authWithRole("student"),
    cleaningController.getMonthlyRoster
);

/**
 * DELETE /api/cleaning
 * 학년별 청소 당번표를 삭제합니다. 관리자 역할만 접근 가능합니다.
 */
router.delete(
  "/",
  authWithRole("admin"),
  cleaningController.deleteRosterByGrade,
);

export default router;
