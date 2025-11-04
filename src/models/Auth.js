import pool from "../db/connection.js";

// 이메일 관련 사용자 찾기
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

// ID 조회
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