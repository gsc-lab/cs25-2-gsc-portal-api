/**
 * @file 인증 관련 컨트롤러
 * @description Google OAuth2 인증 및 사용자 세션 관리를 담당합니다.
 */
import crypto from "crypto";
import url from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
import redisClient from "../../db/redis.js";
import {findAdminAccount, findAuthEmail, findByEmail, findById, findStudentAccount} from "../../models/Auth.js";
import { sign, signRefresh } from "../../utils/auth.utils.js";
import * as authService from "../../service/auth-service.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError, NotFoundError,
} from "../../errors/index.js";
import axios from "axios";
import { v4 } from "uuid";

dotenv.config();

const scopes = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

/**
 * Google OAuth 2.0 인증 프로세스를 시작합니다.
 * 사용자를 Google 인증 서버로 리디렉션하여 동의를 얻고 인증 코드를 받습니다.
 * CSRF 공격 방지를 위해 `state` 파라미터를 사용합니다.
 *
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @returns {void}
 * @throws {InternalServerError} 서버 오류 발생 시
 */
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
      prompt: 'consent',
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
    });

    res.redirect(authorizationUrl);
  } catch {
    throw new InternalServerError(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

/**
 * Google OAuth 2.0 서버로부터 콜백을 처리합니다.
 * 인증 코드를 사용하여 액세스 토큰을 교환하고 사용자 정보를 가져옵니다.
 * 기존 사용자이거나 신규 사용자인 경우 회원가입 또는 로그인 처리를 진행합니다.
 *
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @returns {void}
 * @throws {BadRequestError} 잘못된 요청 또는 CSRF 상태 불일치 시
 * @throws {InternalServerError} 서버 오류 발생 시
 */
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
        const tempToken = crypto.randomBytes(32).toString("hex");
        const preRegisterKey = `pre-register:${tempToken}`;

        await redisClient.set(preRegisterKey, userInfo.email, {
          EX: 600, // 10 minutes
        });

        // Redirect to frontend with the token and email
        const frontendRegisterUrl = `${process.env.FE_BASE_URL}/register?token=${tempToken}&email=${encodeURIComponent(userInfo.email)}`;
        return res.redirect(frontendRegisterUrl);
      }

      try {
        authService.checkUserStatus(user.status);
      } catch (error) {
        // 승인 대기, 거절된 사용자는 에러 메시지와 함께 로그인 페이지로 리디렉션
        return res.redirect(
          `${process.env.FE_BASE_URL}/?error=${encodeURIComponent(error.message)}`,
        );
      }

      // 유저 활성화 상태의 경우
      if (user) {
        const payload = {
          user_id: user.user_id,
          role: user.role,
          status: user.status,
        };
        const jti = v4();
        // JWT 생성
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

        // const cookieOptions = {
        //   httpOnly: true,
        //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        //   secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 true
        //   sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 프로덕션은 None, 개발은 Lax
        // };

        const cookieOptions = {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7일

          //  1. secure: 현재 HTTP 환경이므로 NODE_ENV에 관계없이 'false'로 임시 고정
          secure: false,

          //  2. sameSite: secure: false일 때 'None'은 작동하지 않으므로 'Lax'로 고정
          sameSite: 'Lax',
        };

        // 디버깅을 위해 쿠키 옵션 출력
        console.log("Setting cookie with options:", cookieOptions);

        // 쿠키에 토큰 설정 응답
        res.cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: 1 * 60 * 60 * 1000, // 1시간
        });
        res.cookie("refreshToken", refreshToken, cookieOptions);
        // 오늘의 날짜 계산
        const date = new Date();
        date.setDate(date.getDate());
        const startDate = date.toISOString().split("T")[0];
        return res.redirect(
          `${process.env.FE_BASE_URL}`, // spa frontend route
        );
      }

      // if (
      //   tokens.scope.includes(
      //     "https://www.googleapis.com/auth/calendar.readonly",
      //   )
      // ) {
      //   console.log("Calendar scope granted");
      // } else {
      //   console.log("Calendar scope NOT granted");
      // }
    } catch (error) {
      console.error("OAuth Callback Error", error);
      return res.redirect(`${process.env.FE_BASE_URL}/error?msg=oauth_failed`);
      throw new InternalServerError(
        "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }
}

/**
 * 현재 로그인된 사용자를 로그아웃 처리합니다.
 * Redis에 저장된 리프레시 토큰을 삭제하고, 클라이언트의 accessToken 및 refreshToken 쿠키를 제거합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user에서 사용자 ID를 가져옴)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
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

/**
 * OAuth 인증 후 사용자 정보를 받아 회원가입을 처리합니다.
 * 사전 등록 토큰을 확인하고, 유효한 경우 사용자 정보를 데이터베이스에 저장합니다.
 *
 * @param {object} req - Express 요청 객체 (body에 토큰 및 사용자 정보 포함)
 * @param {object} res - Express 응답 객체
 * @returns {void}
 * @throws {BadRequestError} 토큰이 없거나 유효하지 않은 경우
 * @throws {InternalServerError} 서버 오류 발생 시
 */
async function registerStudent(req, res) {
  const { token, ...studentData } = req.body;
  await handleRegistration(token, studentData, authService.registerStudent, res);
}

async function registerProfessor(req, res) {
  const { token, ...professorData } = req.body;
  await handleRegistration(token, professorData, authService.registerProfessor, res);
}

async function handleRegistration(token, userData, registerFn, res) {
  try {
    if (!token) {
      throw new BadRequestError("잘못된 요청입니다. 인증 토큰이 없습니다.");
    }

    const preRegisterKey = `pre-register:${token}`;
    const email = await redisClient.get(preRegisterKey);

    if (!email) {
      throw new BadRequestError("만료되었거나 유효하지 않은 요청입니다. 다시 시도해주세요.");
    }

    await redisClient.del(preRegisterKey);

    const userPayload = { ...userData, email };
    await registerFn(userPayload);

    res.status(201).json({
      success: true,
      message: "회원가입이 성공적으로 완료되었습니다.",
    });
  } catch (error) {
    console.log("회원가입 오류!", error);
    if (error.statusCode) {
      throw error;
    }
    throw new InternalServerError(
        "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

/**
 * 현재 로그인된 사용자의 정보를 반환합니다.
 * Access Token을 통해 인증된 사용자 정보를 조회하여 응답합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user에서 사용자 ID 및 역할을 가져옴)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 * @throws {ForbiddenError} 접근 권한이 없는 경우
 * @throws {NotFoundError} 사용자 정보를 찾을 수 없는 경우
 */
async function authMe(req, res, next) {
  try {
    if (!req.user?.user_id) {
      throw new ForbiddenError("접근 권한이 없습니다!");
    }

    const { user_id, role } = req.user;

    let user;

    switch (role) {
      case "student":
        user = await findStudentAccount(user_id);
        break;
      case "professor":
      case "admin":
        user = await findAdminAccount(user_id);
        break;
      default:
          throw new ForbiddenError("접근 권한이 없습니다!");
    }

    if (!user) {
      throw new NotFoundError("사용자 정보를 찾을 수 없습니다.");
    }

    const userPayload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_type: user.role || user.role_type,
      ...(user.role === "student" && {
        grade_id: user.grade_id,
        language_id: user.language_id,
        is_international: user.is_international,
      }),
    }

    res.status(200).json(userPayload);
  } catch (err) {
    console.log("authMe Error", err);
    next(err);
  }
}

/**
 * 사용자의 프로필 정보(예: JLPT 시험 점수)를 저장합니다.
 * 파일 업로드를 처리하고, 관련 데이터를 데이터베이스에 저장합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user, req.files, req.body 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 * @throws {BadRequestError} 파일이 없거나 필수 데이터가 누락된 경우
 */
async function saveMyProfile(req, res, next) {
  try {
    const { user, files, body } = req;

    if (!files || files.length === 0) {
      throw new BadRequestError("파일을 업로드해주세요.");
    }

    await authService.saveStudentExam(user, files[0], body);
    res.status(201).json({ message: "성공적으로 저장되었습니다." });
  } catch (err) {
    next(err);
  }
}

/**
 * 현재 로그인한 사용자의 시험 성적 정보를 조회합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user에서 사용자 ID를 가져옴)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
async function getMyExam(req, res, next) {
  try {
    const { user } = req;
    const exam = await authService.getStudentExam(user.user_id);
    res.status(200).json(exam);
  } catch (err) {
    next(err);
  }
}

export default {
  googleAuthRedirect,
  authCallback,
  authLogout,
  registerStudent,
  registerProfessor,
  authMe,
  saveMyProfile,
  getMyExam,
};