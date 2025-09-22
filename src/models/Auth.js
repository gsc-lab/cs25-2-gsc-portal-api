import pool from "../db/connection.js";

// 이메일 관련 사용자 찾기
export const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM user_account WHERE email = ?",
    [email],
  );
  return rows[0];
};

// ID 조회
export const findById = async (userId) => {
  const [rows] = await pool.query(
    "SELECT * FROM user_account WHERE user_id = ?",
    [userId],
  );
  return rows[0];
};

// 이메일 허용 사용자 찾기
export const findAuthEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM allowed_email WHERE email = ?",
    [email],
  );
  return rows[0];
};

// 최초 사용자 등록
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

    // 2) student_entity 등록
    await conn.query(
      `INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, grade_id, class_id, language_id, is_international, "enrolled"],
    );

    await conn.query(
      `INSERT INTO user_role (role_type, user_id)
             VALUES (?, ?)`,
      ["student", user_id],
    );

    if (user.affectedRows !== 1) {
      throw new Error("user_account(학생) 입력 실패 ");
    }

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

// 최초 사용자 교수 이상의 경우
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
    // 2) 권한 교수
    await conn.query(
      `INSERT INTO user_role (role_type, user_id)
             VALUES (?, ?)`,
      ["professor", user_id],
    );

    if (rows.affectedRows !== 1) {
      throw new Error("user_account 입력 실패");
    }

    await conn.commit();
    return { user_id, name, email, phone, status };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
