/**
 * @file 인증 관련 서비스 로직
 * @description 사용자 등록, 상태 확인, 토큰 재발급 및 학생 시험 점수 저장 등 인증과 관련된 비즈니스 로직을 처리합니다.
 */
import redisClient from "../db/redis.js";
import { refreshVerify, sign, signRefresh } from "../utils/auth.utils.js";
import {
  createProfessor,
  createStudent,
  findById,
  findByEmail, saveStudentExams,
} from "../models/Auth.js";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import {
  BadRequestError,
  UnauthenticatedError,
  ConflictError,
  ForbiddenError,
} from "../errors/index.js";
import * as fileService from "./file-service.js";
import * as noticeModel from "../models/Notice.js";
import pool from "../db/connection.js";

const secret = process.env.JWT_SECRET;

/**
 * 새로운 사용자를 등록합니다.
 * 이메일, 학번, 이름, 전화번호의 유효성을 검사하고, 중복 여부를 확인한 후
 * 학생 또는 교수/관리자 계정을 생성합니다.
 *
 * @param {object} userData - 등록할 사용자 정보
 * @param {string} userData.email - 사용자 이메일
 * @param {string} userData.user_id - 사용자 ID (학번)
 * @param {string} userData.name - 사용자 이름
 * @param {string} userData.phone - 사용자 전화번호
 * @param {boolean|string} userData.is_student - 학생 여부 (true, 'true', 'on' 중 하나)
 * @returns {Promise<object>} 생성된 사용자 정보
 * @throws {BadRequestError} 필수 항목 누락 또는 전화번호 형식 오류 시
 * @throws {ConflictError} 이미 가입된 이메일 또는 학번인 경우
 */
export const registerStudent = async (userData) => {
  const { user_id, name, phone } = userData;

  if (!user_id || !name || !phone) {
    throw new BadRequestError("학번, 이름, 전화번호는 필수 항목입니다.");
  }
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    throw new BadRequestError("전화번호 형식이 올바르지 않습니다.");
  }

  const existingUserById = await findById(user_id);
  if (existingUserById) {
    throw new ConflictError("이미 등록된 학번입니다.");
  }

  try {
    return await createStudent(userData);
  } catch (err) {
    console.error("학생 등록 중 오류 발생:", err.stack);
    throw new BadRequestError("회원가입 처리 중 오류가 발생했습니다. 입력값을 확인하세요.");
  }
};

export const registerProfessor = async (userData) => {
  const { name, phone, email } = userData;

  if (!name || !phone) {
    throw new BadRequestError("이름, 전화번호는 필수 항목입니다.");
  }
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    throw new BadRequestError("전화번호 형식이 올바르지 않습니다.");
  }

  const existingUserByEmail = await findByEmail(email);
  if (existingUserByEmail) {
    throw new ConflictError("이미 가입된 이메일입니다.");
  }

  try {
    // 교수는 학번이 없으므로 10자리 숫자로 임의 생성 (DB 중복 체크 포함)
    let user_id;
    let isUnique = false;
    while (!isUnique) {
      user_id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const existingUser = await findById(user_id);
      if (!existingUser) {
        isUnique = true;
      }
    }

    const professorData = { ...userData, user_id };
    return await createProfessor(professorData);
  } catch (err) {
    console.error("교수 등록 중 오류 발생:", err.stack);
    throw new BadRequestError("회원가입 처리 중 오류가 발생했습니다. 입력값을 확인하세요.");
  }
};

/**
 * 사용자의 계정 상태를 확인하고, 상태에 따라 적절한 응답 또는 에러를 반환합니다.
 * 'active' 상태가 아니면 로그인 또는 접근을 제한합니다.
 *
 * @param {string} status - 확인할 사용자의 계정 상태 ('active', 'inactive', 'pending' 등)
 * @returns {{success: boolean}} 상태가 'active'일 경우 성공 객체
 * @throws {ForbiddenError} 계정이 거절된 경우
 * @throws {UnauthenticatedError} 관리자 승인 대기 중이거나 유효하지 않은 로그인 정보인 경우
 */
export function checkUserStatus(status) {
  switch (status) {
    case "active":
      return { success: true };
    case "inactive":
      throw new ForbiddenError("가입이 거절된 계정입니다.");
    case "pending":
      throw new UnauthenticatedError("관리자의 승인을 기다리는 중입니다.");
    default:
      throw new UnauthenticatedError(
        "로그인 정보가 유효하지 않습니다. 다시 로그인하세요.",
      );
  }
}

/**
 * Access Token이 만료되었을 때 Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급합니다.
 * Refresh Token의 유효성을 검증하고, Redis에 저장된 토큰과 일치하는지 확인합니다.
 *
 * @param {string} accessToken - 만료된 Access Token
 * @param {string} refreshToken - 유효한 Refresh Token
 * @param {object} req - Express 요청 객체 (사용자 에이전트 정보 추출용)
 * @returns {Promise<{newAccess: string, newRf: string}>} 새로 발급된 Access Token과 Refresh Token
 * @throws {UnauthenticatedError} 로그인 정보가 유효하지 않거나 토큰 검증 실패 시
 * @throws {BadRequestError} 서버 오류 발생 시
 */
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

    let user = await findById(userId);

    const payload = {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      status: user.status
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

/**
 * 학생의 시험 점수와 관련 파일을 저장합니다.
 * 파일 서비스와 연동하여 파일을 추가하고, 시험 데이터를 데이터베이스에 트랜잭션으로 저장합니다.
 *
 * @param {object} user - 현재 로그인된 사용자 정보 (user.user_id 포함)
 * @param {object} file - 업로드된 파일 객체
 * @param {object} examData - 시험 점수 데이터 (exam_type, score, level 포함)
 * @returns {Promise<void>}
 * @throws {BadRequestError} 파일이 없거나 필수 시험 데이터가 누락된 경우
 */
export const saveStudentExam = async (user, file, examData) => {
  const userId = user.user_id;
  const { exam_type, score, level } = examData;

  if (!file) {
    throw new BadRequestError("저장할 파일을 입력해주세요");
  }

  if (!exam_type || !score || !level) {
    throw new BadRequestError("누락된 값이 존재합니다.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertedFileIds = await fileService.addFiles([file], connection);
    const fileId = insertedFileIds[0];

    await saveStudentExams(userId, examData, fileId, connection);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};