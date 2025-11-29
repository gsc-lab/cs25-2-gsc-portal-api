/**
 * @file 인증 관련 라우터
 * @description Google OAuth2 인증, 사용자 등록, 로그인/로그아웃, 토큰 갱신 및 사용자 정보 조회와 관련된 API 엔드포인트를 정의합니다.
 */
import express from "express";
import authController from "../controllers/auth/authController.js";
import refreshController from "../controllers/auth/refreshController.js";
import { authWithRole } from "../middleware/authWithRole.js";
import {uploadForJLPT} from "../middleware/fileMiddleware.js";

const router = express.Router();

/**
 * GET /api/auth
 * Google OAuth 2.0 인증 프로세스를 시작합니다.
 * 사용자를 Google 인증 서버로 리디렉션합니다.
 */
router.get("/", authController.googleAuthRedirect);

/**
 * GET /api/auth/callback
 * Google OAuth 2.0 서버로부터 인증 콜백을 처리합니다.
 * 인증 코드를 사용하여 토큰을 교환하고 사용자 로그인/등록을 진행합니다.
 */
router.get("/callback", authController.authCallback);

/**
 * POST /api/auth/register/student
 * OAuth 인증 후 추가 정보를 받아 학생 회원가입을 완료합니다.
 */
router.post("/register/student", authController.registerStudent);

/**
 * POST /api/auth/register/professor
 * OAuth 인증 후 추가 정보를 받아 교수 회원가입을 완료합니다.
 */
router.post("/register/professor", authController.registerProfessor);

/**
 * POST /api/auth/logout
 * 현재 로그인된 사용자를 로그아웃 처리합니다.
 * 학생 역할만 접근 가능합니다.
 */
router.post("/logout", authWithRole("student"), authController.authLogout);

/**
 * POST /api/auth/refresh
 * Access Token이 만료되었을 때 Refresh Token을 사용하여 새로운 Access Token을 발급합니다.
 * 학생 역할만 접근 가능합니다.
 */
router.post("/refresh", authWithRole("student"), refreshController.isVeryRefresh);

/**
 * GET /api/auth/me
 * 현재 로그인된 사용자의 정보를 조회합니다.
 * 학생 역할만 접근 가능합니다.
 */
router.get("/me", authWithRole("student"), authController.authMe);

/**
 * POST /api/auth/me
 * 현재 로그인된 사용자의 프로필 정보(예: JLPT 시험 점수)를 저장합니다.
 * 파일 업로드를 포함하며, 학생 역할만 접근 가능합니다.
 */
router.post("/me", authWithRole("student"), uploadForJLPT.array("files", 1), authController.saveMyProfile);

/**
 * GET /api/auth/me/exam
 * 현재 로그인한 학생의 시험 성적 정보를 조회합니다.
 * 학생 역할만 접근 가능합니다.
 */
router.get("/me/exam", authWithRole("student"), authController.getMyExam);

export default router;
