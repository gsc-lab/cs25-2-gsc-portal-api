import express from "express";
import authController from "../controllers/auth/authController.js";
import refreshController from "../controllers/auth/refreshController.js";

const router = express.Router();

// 사용자를 Google OAuth 2.0 서버로 리디렉션
router.get("/", authController.googleAuthRedirect);

// Google OAuth 2.0 서버에서 콜백을 수신
router.get("/callback", authController.authCallback);

router.post("/register", authController.registerAfterOAuth);

router.post("/logout", authController.authLogout);

router.post("/refresh", refreshController.isVeryRefresh);

export default router;
