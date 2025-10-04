// Notice.js
import pool from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

export async function findBySpec(spec, query) {
  const { user } = spec;
  const {
    page = 1,
    size = 10,
    search,
    course_type,
    course_id,
    grade_id,
    language_id,
  } = query;
  const offset = (page - 1) * size;

  let whereClauses = [];
  let queryParams = [];

  if (search) {
    whereClauses.push(`v.title LIKE ?`);
    queryParams.push(`%${search}%`);
  }

  if (course_id) {
    whereClauses.push(`v.course_id = ?`);
    queryParams.push(course_id);
  }

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

    // 재학 상태 확인
    if (studentInfo.role !== "enrolled") {
      return [];
    }

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
  const sql = `INSERT INTO notice_target (notice_id, grade_id, class_id, language_id) VALUES ?`;
  const values = targets.map((t) => [
    noticeId,
    t.grade_id,
    t.class_id,
    t.language_id,
  ]);
  console.log(values);
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

export const populateDeliverNotice = async (noticeId, connection) => {
  const sql = `
    INSERT IGNORE INTO notification_delivery_notice (notice_id, user_id, status)

    -- CASE 1: '과목 공지'인 경우 (course_id가 지정됨)
    -- -> 해당 과목의 수강생만 대상.
    SELECT
      n.notice_id,
      cs.user_id,
      'QUEUED'
    FROM notice n
           JOIN course_student cs ON n.course_id = cs.course_id
    WHERE n.notice_id = ? AND n.course_id IS NOT NULL

    UNION ALL

    -- CASE 2: '전체 공지'이면서 '타겟이 지정된' 경우 (course_id가 없음)
    -- -> 모든 타겟 조건을 만족하는 재학생만 대상.
    SELECT
      ? AS notice_id,
      se.user_id,
      'QUEUED'
    FROM student_entity se
    WHERE EXISTS (SELECT 1 FROM notice WHERE notice_id = ? AND course_id IS NULL)
      AND EXISTS (SELECT 1 FROM notice_target WHERE notice_id = ?)
      AND se.status = 'enrolled'
      AND (
            SELECT COUNT(*) FROM notice_target nt
            WHERE nt.notice_id = ?
              AND (nt.grade_id IS NULL OR nt.grade_id = se.grade_id)
              AND (nt.language_id IS NULL OR nt.language_id = se.language_id)
              AND (nt.class_id IS NULL OR nt.class_id = se.class_id)
          ) = (SELECT COUNT(*) FROM notice_target WHERE notice_id = ?)

    UNION ALL

    -- CASE 3: '전체 공지'이면서 '타겟이 지정되지 않은' 경우 (course_id가 없음)
    -- -> 모든 재학생을 대상.
    SELECT
      ? AS notice_id,
      se.user_id,
      'QUEUED'
    FROM student_entity se
    WHERE EXISTS (SELECT 1 FROM notice WHERE notice_id = ? AND course_id IS NULL)
      AND NOT EXISTS (SELECT 1 FROM notice_target WHERE notice_id = ?);
  `;

  const params = [noticeId, noticeId, noticeId, noticeId, noticeId, noticeId, noticeId, noticeId, noticeId]
  const [result] = await connection.query(sql, params);
  console.log('Populate Result', result);
  return result.affectedRows;
}

export const getDispatchTargets = async (noticeId) => {
  const sql = `
        SELECT user_id
        FROM notification_deliver_notice
        WHERE notice_id = ?;
       `;

  const [rows] = await pool.query(sql, [noticeId]);

  // user_id 배열을 반환
  return rows.map(row => row.user_id)
};

// TODO 카카오 메세지 발송 시 업데이트
export const updateDeliveryStatus = async (noticeId, newStatus = "SENT") => {
  const sql = `
        UPDATE notification_delivery_notice SET status = ?, send_at = NOW()
        WHERE notice_id = ? AND status = 'QUEUED'`

  const [result] = await pool.query(sql, [noticeId, newStatus]);

  return result.affectedRows;
}

export const updateStudentStatus = async (noticeId, userId) => {
  const sql = `
        UPDATE notification_delivery_notice SET read_at = NOW()
        WHERE notice_id = ? AND user_id = ? AND read_at IS NULL
  `
  const [result] = await pool.query(sql, [noticeId, userId]);

  return result.affectedRows;
}

export const getNoticeReadStatus = async (noticeId) => {
  const sql = `
        SELECT student_name, user_id, status, read_at, send_at
        FROM v_notice_read_status
        WHERE notice_id = ? ORDER BY read_at IS NULL, read_at
  `

  const [rows] = await pool.query(sql, [noticeId]);

  return rows;
}

// 필터링 조건 객체 예: { grade_id: '1', course_type: 'regular' }
export const findProfessorCourses = async (user, filters = {}) => {
  let sql = `
      SELECT DISTINCT 
          c.course_id,
          c.title,
          ct.grade_id,
          (CASE 
               WHEN c.is_special = 2 THEN 'korean'
               WHEN c.is_special = 1 THEN 'special'
               ELSE 'regular'
          END) AS course_type
      FROM course c
      JOIN course_professor cp ON c.course_id = cp.course_id
      LEFT JOIN course_target ct ON c.course_id = ct.course_id
  `;

  const whereClauses = [];
  const params = [];

  // 역할에 따라 분기
  if (user.role === 'professor') {
    whereClauses.push(`cp.user_id = ?`);
    params.push(user.user_id);
  }

  // 관리자는 모두 확인 가능

  const { grade_id, course_type } = filters;

  if (grade_id) {
    whereClauses.push(`ct.grade_id = ?`);
    params.push(grade_id);
  }

  if (course_type) {
    if (course_type === 'regular') {
      whereClauses.push(`c.is_special = 0`);
    } else if (course_type === 'special') {
      whereClauses.push(`c.is_special = 1`);
    } else if (course_type === 'korean') {
      whereClauses.push(`c.is_special = 2`);
    }
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(' AND ');
  }

  sql += ` ORDER BY c.course_id`;

  const [rows] = await pool.query(sql, params);
  return rows;
}