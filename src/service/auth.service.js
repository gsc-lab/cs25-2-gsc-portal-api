import redisClient from "../db/redis.js";
import { refreshVerify, sign, signRefresh } from "../utils/auth.utils.js";
import {
  createProfessor,
  createStudent,
  findById,
} from "../models/auth.model.js";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";

const secret = process.env.JWT_SECRET;

export const registerUser = async (userData) => {
  try {
    const isStudent = userData.is_student;

    if (isStudent === true) {
      return await createStudent(userData);
    }
    return await createProfessor(userData);
  } catch (err) {
    console.error("회원 등록 중 오류 발생:", err.stack);
    throw new BadRequestError("잘못된 요청입니다. 입력값을 확인하세요.");
  }
};

export function checkUserStatus(status) {
  switch (status) {
    case "active":
      return { success: true };
    case "inactive":
      return { success: false, redirect: "/", message: "승인 거절된 사용자" };
    case "pending":
      return { success: false, redirect: "/", message: "승인 대기중 사용자" };
    default:
      throw new UnauthenticatedError(
        "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
      );
  }
}

export async function refreshTokens(accessToken, refreshToken, req) {
  try {
    // 리프레쉬 토큰 자체 verify로 검증
    const decoded = jwt.verify(refreshToken, secret);
    const userId = decoded.sub;

    // 디코딩 결과가 없으면 권한이 없음을 응답
    if (!userId) {
      throw new UnauthenticatedError(
        "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
      );
    }

    // Redis 일치 여부 검증
    const allTokens = await redisClient.hVals(`session:${userId}`);
    if (!allTokens || !allTokens.includes(refreshToken)) {
      throw UnauthenticatedError(
        "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
      );
    }

    /* access token의 decoding 된 값에서
     * user id를 가져와 refresh Token을 검증*/
    const valid = refreshVerify(refreshToken, userId);
    if (!valid) {
      throw UnauthenticatedError(
        "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
      );
    }

    // To do -> 회원 조회 (view) 적용
    let user = await findById(userId);

    const payload = {
      user_id: user.user_id,
      name: user.name,
      role: user.role ?? "student",
    };

    const newJti = v4();

    const newAccess = sign(payload);
    const newRf = signRefresh(payload.user_id, newJti);

    // Redis 저장
    const deviceId = req.headers["user-agent"] || "unknown_device";
    const sessionKey = `session:${userId}`;
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    await redisClient.hSet(sessionKey, deviceId, newRf);
    await redisClient.expire(sessionKey, sevenDaysInSeconds);

    return { newAccess, newRf };
  } catch (err) {
    console.error("Refresh 토큰 재발급 중 오류", err.stack);
    throw new BadRequestError(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}
