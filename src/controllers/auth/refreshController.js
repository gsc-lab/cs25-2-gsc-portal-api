/**
 * @file 토큰 재발급 관련 컨트롤러
 * @description Refresh Token을 사용하여 Access Token을 재발급하는 로직을 처리합니다.
 */
import { refreshTokens } from "../../service/auth-service.js";
import { UnauthenticatedError } from "../../errors/index.js";

/**
 * Refresh Token을 사용하여 새로운 Access Token을 발급합니다.
 * 클라이언트로부터 받은 Access Token과 Refresh Token을 검증하고,
 * 유효한 경우 새로운 토큰을 발급하여 쿠키에 설정합니다.
 *
 * @param {object} req - Express 요청 객체 (req.cookies에서 토큰을 가져옴)
 * @param {object} res - Express 응답 객체
 * @returns {void}
 * @throws {UnauthenticatedError} 토큰이 없거나 유효하지 않은 경우
 */
const isVeryRefresh = async (req, res) => {
  try {
    // access token과 refresh token의 존재 유무를 체크
    if (req.headers["authorization"] || req.cookies.accessToken) {
      const accessToken = req.cookies?.accessToken;
      const refreshToken = req.cookies?.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new UnauthenticatedError(
          "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
        );
      }

      const { newAccess, newRf } = await refreshTokens(
        accessToken,
        refreshToken,
        req,
      );

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

      res.cookie("accessToken", newAccess, {
        ...cookieOptions,
        maxAge: 1 * 60 * 60 * 1000, // 1시간
      });
      res.cookie("refreshToken", newRf, cookieOptions);

      return res.status(200).json({ message: "토큰 재발급 성공" });
    }
  } catch (err) {
    // next(err) 대신 직접 에러 처리
    if (err instanceof UnauthenticatedError) {
      res.status(err.statusCode).json({ message: err.message });
    } else {
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  }
};

export default {
  isVeryRefresh,
};
