// Notice.js
import pool from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

export async function findBySpec(spec, query) {
  const { user } = spec;
  const {
    page = 1,
    size = 10,
    course_type,
    grade_id,
    level_id,
    language_id,
  } = query;
  const offset = (page - 1) * size;

  let whereClauses = [];
  let queryParams = [];

  // 모든 역할에 공통으로 적용되는 옵션 필터
  if (course_type) {
    whereClauses.push(`v.course_type = ?`);
    queryParams.push(course_type);
  }
  if (grade_id) {
    whereClauses.push(
      `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('grade_id', ?) AS JSON))`,
    );
    queryParams.push(grade_id);
  }
  if (level_id) {
    whereClauses.push(
      `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('level_id', ?) AS JSON))`,
    );
    queryParams.push(level_id);
  }
  if (language_id) {
    whereClauses.push(
      `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('language_id', ?) AS JSON))`,
    );
    queryParams.push(language_id);
  }

  // 교수 로직
  if (user.role === "professor") {
    const professorConditions = [];
    // 교수 작성한 모든 공지
    professorConditions.push(`v.author_id = ?`);
    queryParams.push(user.user_id);

    // 전체 공지
    professorConditions.push(
      `(v.course_id IS NULL AND JSON_LENGTH(v.targets) = 0)`,
    );

    whereClauses.push(`(${professorConditions.join(" OR ")})`);

    // 학생 로직
  } else if (user.role === "student") {
    const studentQuery = `SELECT s.grade_id, s.class_id, s.language_id,
                                     (SELECT GROUP_CONCAT(cs.course_id)
                                      FROM course_student cs
                                      WHERE cs.user_id = s.user_id) AS enrolled_courses
                              FROM student_entity s WHERE s.user_id = ?`;
    const [studentRows] = await pool.query(studentQuery, [user.user_id]);

    if (studentRows.length === 0) return [];

    const studentInfo = studentRows[0];
    const enrolledCourses = studentInfo.enrolled_courses
      ? studentInfo.enrolled_courses.split(",")
      : [];

    const studentConditions = [];

    // 수강하는 과목의 공지
    if (enrolledCourses.length > 0) {
      studentConditions.push(`v.course_id IN (?)`);
      queryParams.push(enrolledCourses);
    }

    //  아무 타겟도 없는 전체 공지
    studentConditions.push(
      `(v.course_id IS NULL AND (v.targets IS NULL OR JSON_LENGTH(v.targets) = 0))`,
    );

    // 일치하는 타겟이 하나라도 있는 공지
    const studentTargetConditions = [];
    if (studentInfo.grade_id) {
      studentTargetConditions.push(
        `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('grade_id', ?) AS JSON))`,
      );
      queryParams.push(studentInfo.grade_id);
    }
    if (studentInfo.class_id) {
      studentTargetConditions.push(
        `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('class_id', ?) AS JSON))`,
      );
      queryParams.push(studentInfo.class_id);
    }
    if (studentInfo.language_id) {
      studentTargetConditions.push(
        `JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('language_id', ?) AS JSON))`,
      );
      queryParams.push(studentInfo.language_id);
    }

    if (studentTargetConditions.length > 0) {
      studentConditions.push(
        `(v.course_id IS NULL AND (${studentTargetConditions.join(" OR ")}))`,
      );
    }

    whereClauses.push(`(${studentConditions.join(" OR ")})`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sql = `
        SELECT * FROM v_notice_list v ${whereSql}
        ORDER BY v.is_pinned DESC, v.created_at DESC
            LIMIT ? OFFSET ?`;

  // size와 offset 변환
  const finalParams = [
    ...queryParams,
    parseInt(size, 10),
    parseInt(offset, 10),
  ];
  const [rows] = await pool.query(sql, finalParams);

  return rows;
}

// 공지사항 상세조회
export async function findById(noticeId) {
  const sql = `SELECT * from v_notice_details WHERE notice_id = ?`;
  const [row] = await pool.query(sql, [noticeId]);

  if (row.length > 0) {
    row[0].attachments = row[0].attachments || [];
  }

  return row[0];
}

// 공지사항 작성
export async function createNotice(noticeInfo, course_id, userId, connection) {
  const { title, content, is_pinned = 0 } = noticeInfo;
  const sql = `INSERT INTO notice (title, content, is_pinned, user_id, course_id, created_at)
                        VALUES (?, ?, ?, ?, ?, NOW())`;

  const [result] = await connection.query(sql, [
    title,
    content,
    is_pinned,
    userId,
    course_id,
  ]);
  return result.insertId;
}

// 첨부파일 생성
export const createFiles = async (noticeId, files, connection) => {
  const sql = `INSERT INTO notice_file (notice_id, file_id) VALUES ?`;
  const values = files.map((id) => [noticeId, id]);
  await connection.query(sql, [values]);
};

// 타겟층 생성
export const createTargets = async (noticeId, targets, connection) => {
  const sql = `INSERT INTO notice_target (target_id, notice_id, grade_id, class_id, level_id, language_id) VALUES ?`;
  const values = targets.map((t) => [
    "NT" + uuidv4().substring(0, 8),
    noticeId,
    t.grade_id,
    t.class_id,
    t.level_id,
    t.language_id,
  ]);
  await connection.query(sql, [values]);
};

// 공지사항 수정
export async function updateNotice(noticeId, patch, connection) {
  const { title, content, is_pinned, course_id } = patch;
  const sql = `UPDATE notice SET title = ?, content = ?, is_pinned = ?, course_id = ? WHERE notice_id = ?`;

  const [result] = await connection.query(sql, [
    title,
    content,
    is_pinned,
    course_id,
    noticeId,
  ]);
  return result.affectedRows;
}

// 공지사항 삭제
export async function deleteNotice(noticeId) {
  const sql = `DELETE FROM notice WHERE notice_id = ?`;

  const [result] = await pool.query(sql, [noticeId]);
  return result.affectedRows;
}

// 첨부파일 삭제
export const deleteFiles = async (noticeId) => {
  const sql = `DELETE FROM notice_file WHERE notice_id = ?`;

  const [result] = await pool.query(sql, [noticeId]);
  return result.affectedRows;
};

// 타겟층 삭제
export const deleteTargets = async (noticeId, connection) => {
  const sql = `DELETE FROM notice_target WHERE target_id = ?`;

  const [result] = await connection.query(sql, [noticeId]);
  return result.affectedRows;
};

// export const updateFiles = async (noticeId, files, fileId, connection) => {
//   const sql = `UPDATE notice_file SET notice_id = ? WHERE notice_id = ? `;
//   const values = files.map((id) => [noticeId, id]);
//   await connection.query(sql, [values]);
// };
//
// export const updateTargets = async (noticeId, targetId, connection) => {
//   const sql = `UPDATE notice_target SET notice_id = ?, grade_id = ?, class_id = ?, level_id = ?, language_id = ? WHERE target_id = ?`;
//   const values = targetId.map((t) => [
//     noticeId,
//     t.grade_id,
//     t.class_id,
//     t.level_id,
//     t.language_id,
//   ]);
//   await connection.query(sql, [values]);
// };
