import express from 'express';
import authController from '../controllers/auth/auth.controller.js';
import refreshController from '../controllers/auth/refresh.controller.js';

const router = express.Router();

// 사용자를 Google OAuth 2.0 서버로 리디렉션하는 예시입니다.
router.get('/', authController.googleAuthRedirect);

// Google OAuth 2.0 서버에서 콜백을 수신합니다.
router.get('/callback', authController.authCallback);

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', authController.registerAfterOAuth);

router.post('/logout', authController.authLogout);

router.post('/refresh', refreshController.isVeryRefresh);

export default router;
