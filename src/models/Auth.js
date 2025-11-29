/**
 * @file 인증 및 사용자 계정 관련 데이터베이스 모델
 * @description 사용자 계정 조회, 생성 및 시험 점수 저장 등 인증과 관련된 데이터베이스 작업을 처리합니다.
 */
import pool from "../db/connection.js";

/**
 * 이메일을 통해 사용자 계정 정보를 조회합니다.
 * 사용자 계정(user_account)과 사용자 역할(user_role)을 조인하여 반환합니다.
 *
 * @param {string} email - 조회할 사용자의 이메일 주소
 * @returns {Promise<object|undefined>} 조회된 사용자 객체 또는 undefined
 */
export const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT ua.*, ur.role_type as role
     FROM user_account ua
     LEFT JOIN user_role ur ON ua.user_id = ur.user_id
     WHERE ua.email = ?`,
     [email],
  );
  return rows[0];
};

/**
 * 사용자 ID를 통해 사용자 계정 정보를 조회합니다.
 * 사용자 계정(user_account)과 사용자 역할(user_role)을 조인하여 반환합니다.
 *
 * @param {string} userId - 조회할 사용자의 고유 ID
 * @returns {Promise<object|undefined>} 조회된 사용자 객체 또는 undefined
 */
export const findById = async (userId) => {
  const [rows] = await pool.query(
    `SELECT ua.*, ur.role_type as role
     FROM user_account ua
     LEFT JOIN user_role ur ON ua.user_id = ur.user_id
     WHERE ua.user_id = ?`,
    [userId],
  );
  return rows[0];
};

/**
 * 허용된 이메일 목록(allowed_email 테이블)에서 특정 이메일이 존재하는지 조회합니다.
 *
 * @param {string} email - 조회할 이메일 주소
 * @returns {Promise<object|undefined>} 조회된 이메일 객체 또는 undefined
 */
export const findAuthEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM allowed_email WHERE email = ?",
    [email],
  );
  return rows[0];
};

/**
 * 새로운 학생 계정을 생성하고 관련 정보를 데이터베이스에 저장합니다.
 * user_account, student_entity, user_role 테이블에 트랜잭션으로 데이터를 삽입합니다.
 *
 * @param {object} userData - 학생 사용자 데이터
 * @param {string} userData.user_id - 사용자 ID (학번)
 * @param {string} userData.name - 사용자 이름
 * @param {string} userData.email - 사용자 이메일
 * @param {string} userData.phone - 사용자 전화번호
 * @param {string} [userData.status='pending'] - 사용자 상태 (기본값: 'pending')
 * @param {number} [userData.grade_id=null] - 학년 ID
 * @param {number} [userData.language_id=null] - 언어 ID
 * @param {number} [userData.class_id=null] - 반 ID
 * @param {boolean} [userData.is_international=null] - 국제 학생 여부
 * @returns {Promise<object>} 생성된 학생 사용자 정보
 * @throws {Error} 데이터베이스 삽입 실패 시
 */
export const createStudent = async ({
  user_id,
  name,
  email,
  phone,
  status = "pending",
  grade_id = null,
  language_id = null,
  class_id = null,
  is_international = null,
}) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1) user_account 등록
    const [user] = await conn.query(
      `INSERT INTO user_account (user_id, name, email, phone, status)
             VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, email, phone, status],
    );

    if (user.affectedRows !== 1) {
      throw new Error("user_account(학생) 입력 실패 ");
    }

    // 2) student_entity 등록
    await conn.query(
      `INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, grade_id, class_id, language_id, is_international, "enrolled"],
    );

    // 3) role 등록
    await conn.query(
      `INSERT INTO user_role (role_type, user_id)
             VALUES (?, ?)`,
      ["student", user_id],
    );

    // 4) 분반정보 등록
    await conn.query(
      `INSERT INTO course_student(user_id, class_id) VALUES (?, ?)`,
      [user_id, null]
    );

    await conn.commit();
    return {
      user_id,
      name,
      email,
      status,
      grade_id,
      class_id,
      language_id,
      is_international,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * 새로운 교수 또는 관리자 계정을 생성하고 관련 정보를 데이터베이스에 저장합니다.
 * user_account, user_role 테이블에 트랜잭션으로 데이터를 삽입합니다.
 *
 * @param {object} userData - 교수/관리자 사용자 데이터
 * @param {string} userData.user_id - 사용자 ID
 * @param {string} userData.name - 사용자 이름
 * @param {string} userData.email - 사용자 이메일
 * @param {string} userData.phone - 사용자 전화번호
 * @param {string} [userData.status='pending'] - 사용자 상태 (기본값: 'pending')
 * @returns {Promise<object>} 생성된 교수/관리자 사용자 정보
 * @throws {Error} 데이터베이스 삽입 실패 시
 */
export const createProfessor = async ({
  user_id,
  name,
  email,
  phone,
  status = "pending",
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 유저 등록
    const [rows] = await conn.query(
      `INSERT INTO user_account (user_id, name, email, phone, status)
             VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, email, phone, status],
    );

    if (rows.affectedRows !== 1) {
      throw new Error("user_account 입력 실패");
    }

    // 2) 권한 교수
    await conn.query(
      `INSERT INTO user_role (role_type, user_id)
             VALUES (?, ?)`,
      ["professor", user_id],
    );

    await conn.commit();
    return { user_id, name, email, phone, status };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * 학생 계정의 상세 정보를 사용자 ID를 통해 조회합니다.
 * user_account, user_role, student_entity 테이블을 조인하여 학생 관련 정보를 반환합니다.
 *
 * @param {string} userId - 조회할 학생의 사용자 ID
 * @returns {Promise<object|undefined>} 조회된 학생 계정 객체 또는 undefined
 */
export const findStudentAccount = async (userId) => {
  const [rows] = await pool.query(
      `SELECT 
            ua.*,
            ur.role_type as role,
            se.grade_id,
            se.language_id,
            se.is_international,
            se.status
     FROM user_account ua
     LEFT JOIN user_role ur ON ua.user_id = ur.user_id
     LEFT JOIN student_entity se ON ua.user_id = se.user_id
     WHERE ua.user_id = ?`,
      [userId],
  );
  return rows[0];
}

/**
 * 관리자 또는 교수 계정의 상세 정보를 사용자 ID를 통해 조회합니다.
 * user_account, user_role 테이블을 조인하여 관리자/교수 관련 정보를 반환합니다.
 *
 * @param {string} userId - 조회할 관리자/교수의 사용자 ID
 * @returns {Promise<object|undefined>} 조회된 관리자/교수 계정 객체 또는 undefined
 */
export const findAdminAccount = async (userId) => {
  const [rows] = await pool.query(
      `SELECT
            ua.*,
            ur.role_type as role
      FROM user_account ua
      LEFT JOIN user_role ur ON ua.user_id = ur.user_id
      WHERE ua.user_id = ?`,
      [userId],
  );
  return rows[0];
}


/**
 * 학생의 시험 점수 정보를 데이터베이스에 저장합니다.
 * 새로운 exam_id를 생성하고 student_exams 테이블에 데이터를 삽입합니다.
 *
 * @param {string} userId - 시험 점수를 저장할 학생의 사용자 ID
 * @param {object} data - 시험 데이터 (exam_type, score, level 포함)
 * @param {string} fileId - 시험 관련 파일의 ID
 * @param {object} [connection] - 사용할 데이터베이스 연결 객체 (선택 사항, 트랜잭션용)
 * @returns {Promise<object>} 데이터베이스 삽입 결과
 */
export const saveStudentExams = async (userId, data, fileId, connection) => {

  const db = connection || pool;

  const [lastRows] = await pool.query(`
        SELECT exam_id 
        FROM student_exams 
        ORDER BY exam_id DESC 
        LIMIT 1
    `);

  const { exam_type, score, level } = data;

  const lastId = lastRows[0]?.exam_id ?? null;

  const newId = lastId
    ? `EX${String(parseInt(lastId.replace("EX", ""), 10) + 1).padStart(3, "0")}`
    : "EX001";

  const [result] = await db.query(
    `INSERT INTO student_exams (exam_id, user_id, exam_type, file_id, score, level_code)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId, userId, exam_type, fileId, score, level],
  );
  return result;

};

/**
 * 사용자 ID를 통해 학생의 시험 점수 정보를 조회합니다.
 * 파일 정보를 포함하기 위해 file_assets 테이블과 조인합니다.
 *
 * @param {string} userId - 조회할 학생의 사용자 ID
 * @param {object} [connection] - 사용할 데이터베이스 연결 객체 (선택 사항, 트랜잭션용)
 * @returns {Promise<object|undefined>} 조회된 시험 점수 정보 객체 또는 undefined
 */
export const findExamByUserId = async (userId, connection) => {
  const db = connection || pool;
  const [rows] = await db.query(
      `SELECT 
         se.exam_id,
         se.user_id,
         se.exam_type,
         se.score,
         se.level_code,
         JSON_OBJECT(
           'file_id', fa.file_id,
           'file_name', fa.file_name,
           'file_url', CONCAT('/files/', fa.file_id, '/download')
         ) AS file_info
       FROM student_exams se
       LEFT JOIN file_assets fa ON se.file_id = fa.file_id
       WHERE se.user_id = ?`,
      [userId]
  );
  console.log(rows);
  return rows[0];
};

/**
 * 학생의 기존 시험 점수 정보를 업데이트합니다.
 *
 * @param {string} userId - 업데이트할 학생의 사용자 ID
 * @param {object} data - 새로운 시험 데이터 (exam_type, score, level 포함)
 * @param {string} fileId - 새로운 시험 관련 파일의 ID
 * @param {object} [connection] - 사용할 데이터베이스 연결 객체 (선택 사항, 트랜잭션용)
 * @returns {Promise<object>} 데이터베이스 업데이트 결과
 */
export const updateStudentExam = async (userId, data, fileId, connection) => {
  const db = connection || pool;
  const { exam_type, score, level } = data;
  const [result] = await db.query(
      `UPDATE student_exams 
     SET exam_type = ?, score = ?, level_code = ?, file_id = ? 
     WHERE user_id = ?`,
      [exam_type, score, level, fileId, userId]
  );
  return result;
};