import express from "express";
import authController from "../controllers/auth/authController.js";
import refreshController from "../controllers/auth/refreshController.js";
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 사용자를 Google OAuth 2.0 서버로 리디렉션
router.get("/", authController.googleAuthRedirect);

// Google OAuth 2.0 서버에서 콜백을 수신
router.get("/callback", authController.authCallback);

router.post("/register", authController.registerAfterOAuth);

router.post("/logout", authWithRole("student"), authController.authLogout);

router.post("/refresh", authWithRole("student"), refreshController.isVeryRefresh);

router.get("/me", authWithRole("student"), authController.authMe);

export default router;
