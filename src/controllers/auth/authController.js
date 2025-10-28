import crypto from "crypto";
import url from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
import redisClient from "../../db/redis.js";
import { findAuthEmail, findByEmail } from "../../models/Auth.js";
import { sign, signRefresh } from "../../utils/auth.utils.js";
import { checkUserStatus, registerUser } from "../../service/auth-service.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from "../../errors/index.js";
import axios from "axios";
import { v4 } from "uuid";

dotenv.config();

const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

// 사용자를 Google OAuth 2.0 서버로 리디렉션
async function googleAuthRedirect(req, res) {
  try {
    // CSRF 방지를 위한 보안 상태 문자열 생성
    const state = crypto.randomBytes(32).toString("hex");
    // 세션에 상태 값을 저장
    req.session.state = state;

    // 사용 권한을 요청하는 인증 URL 생성
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // 'online' (기본값) 또는 'offline' (refresh_token 발급)
      access_type: "offline",
      /** 위에 정의된 scopes 배열 전달.
       * 하나의 권한만 필요하면 문자열로 전달 가능 */
      scope: scopes,
      // 점진적 권한 부여 활성화. 권장되는 모범 사례
      include_granted_scopes: true,
      // CSRF 공격 위험 감소를 위한 state 파라미터 포함
      state,
      // prompt: 'consent',
    });

    res.redirect(authorizationUrl);
  } catch {
    throw new InternalServerError(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

async function authCallback(req, res) {
  // OAuth 2.0 서버 응답 처리
  let q = url.parse(req.url, true).query;

  if (q.error) {
    // 에러 응답 처리 (예: error=access_denied)
    throw new BadRequestError("잘못된 요청입니다. 입력값을 확인하세요.");
  } else if (q.state !== req.session.state) {
    throw new ForbiddenError("접근 권한이 없습니다. 관리자에게 문의하세요.");
  } else {
    try {
      // Google로부터 토큰 받기
      const { tokens } = await oauth2Client.getToken(q.code);
      console.log("tokens:", tokens);
      const { data: userInfo } = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );

      if (!userInfo.email.endsWith("@g.yju.ac.kr")) {
        let authUser = await findAuthEmail(userInfo.email);

        if (!authUser) {
          console.log("유효한 이메일이 아닙니다.");
          return res.redirect("/?error=invalid_email");
        }
      }
      // 1) 사용자 조회/가입
      let user = await findByEmail(userInfo.email);

      // DB 유저가 없을 경우 회원가입 페이지 이동
      if (!user) {
        req.session.ouathUser = {
          email: userInfo.email,
        };
        // 최초 로그인시 회원가입 페이지로 이동
        const frontendRegisterUrl = `${process.env.FE_BASE_URL}/register`;
        return res.redirect(frontendRegisterUrl); // 회원가입 페이지 (프론트)
      }
      const verdict = checkUserStatus(user.status);

      // 비승인 접근 거절
      if (!verdict.success) {
        if (verdict.redirect) return res.redirect(verdict.redirect);
      }

      if (user) {
        const payload = {
          user_id: user.user_id,
          role: user.role,
          status: user.status,
        };
        const jti = v4();
        //  JWT 생성
        const accessToken = sign(payload); // 앱의 Access Token
        const refreshToken = signRefresh(payload.user_id, jti); // 앱의 Refresh Token

        // 학번 추출
        const userId = payload.user_id;
        // 1. 요청 헤더에서 기기 정보 가져오기
        const deviceId = req.headers["user-agent"] || "unknown_device";

        // 2. Redis Hash에 리프레시 토큰 저장
        const sessionKey = `session:${userId}`;
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;
        await redisClient.hSet(sessionKey, deviceId, refreshToken);
        await redisClient.expire(sessionKey, sevenDaysInSeconds);

        // 쿠키에 토큰 설정 응답
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60,
        });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60,
        });
        // 오늘의 날짜 계산
        const date = new Date();
        date.setDate(date.getDate());
        const startDate = date.toISOString().split("T")[0];
        res.redirect(`/dashboard?${startDate}`); // spa frontend route
      }

      if (
        tokens.scope.includes(
          "https://www.googleapis.com/auth/calendar.readonly",
        )
      ) {
        console.log("Calendar scope granted");
      } else {
        console.log("Calendar scope NOT granted");
      }
    } catch (error) {
      console.error("OAuth Callback Error", error);
      throw new InternalServerError(
        "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }
}

async function authLogout(req, res, next) {
  try {
    const userId = req.user?.user_id;
    if (userId) {
      const deviceId = req.headers["user-agent"] || "unknown_device";
      const sessionKey = `session:${userId}`;

      await redisClient.hDel(sessionKey, deviceId);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ success: true, message: "성공적으로 로그아웃했습니다." });

  } catch (err) {
    next(err);
  }
}

// 회원가입 페이지와 연계
async function registerAfterOAuth(req, res) {
  try {
    const s = req.session.ouathUser;
    if (!s) {
      throw new BadRequestError("잘못된 요청입니다. 입력값을 확인하세요.");
    }
    const { user_id, name, phone, is_student } = req.body;

    const userPayload = {
      user_id,
      name,
      phone,
      is_student,
      email: s.email,
    };

    await registerUser(userPayload);

    res.redirect("/"); // spa frontend route
  } catch {
    throw new InternalServerError(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

export default {
  googleAuthRedirect,
  authCallback,
  authLogout,
  registerAfterOAuth,
};
