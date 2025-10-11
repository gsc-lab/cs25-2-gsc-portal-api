import jwt from "jsonwebtoken";
import redisClient from "../db/redis.js";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;

// ESM 방식 export로 전체 함수 묶어서 내보내기
export const sign = (user) => {
  const payload = {
    user_id: user.user_id,
    role: user.role,
    status: user.status,
  };

  console.log(payload);
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: "1800s",
  });
};

export const verify = (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      user_id: decoded.user_id,
      role: decoded.role,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
};

export const signRefresh = (userId, jti) => {
  const payload = { sub: String(userId), jti };
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
};

export const refreshVerify = async (token, userId) => {
  try {
    const allTokens = await redisClient.hVals(`session:${userId}`);
    if (allTokens && allTokens.includes(token)) {
      try {
        jwt.verify(token, secret);
        return true;
      } catch (err) {
        console.warn("JWT 서명 검증 실패:", err.message);
        return false;
      }
    }
    return false;
  } catch (err) {
    console.warn("Redis 조회 실패", err.message);
    return false;
  }
};
