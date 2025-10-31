// Notice.js
import pool from "../db/connection.js";

// 공지사항 목록 조회 (필터 + 권한)
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
    author_id,
  } = query;
  const offset = (page - 1) * size;

  let baseSql = `SELECT v.* FROM v_notice_list v`;
  let whereClauses = [];
  let queryParams = [];

  if (user.role === "student") {
    baseSql += ` JOIN notification_delivery_notice ndn ON v.notice_id = ndn.notice_id`;
    whereClauses.push(`ndn.user_id = ?`);
    queryParams.push(user.user_id);
  }

  if (search) {
    whereClauses.push(`v.title LIKE ?`);
    queryParams.push(`%${search}%`);
  }

  if (course_id) {
    whereClauses.push(`v.course_id = ?`);
    queryParams.push(course_id);
  }

  // 교수 및 관리자를 위한 필터링
  if (grade_id) {
    whereClauses.push(`v.grade_id = ?`);
    queryParams.push(grade_id);
  }
  if (language_id) {
    whereClauses.push(`v.language_id = ?`);
    queryParams.push(language_id);
  }

  // 모든 역할에 공통으로 적용되는 옵션 필터
  if (course_type) {
    whereClauses.push(`v.course_type = ?`);
    queryParams.push(course_type);
  }
  if (author_id) {
    whereClauses.push(`JSON_UNQUOTE(JSON_EXTRACT(v.author, '$.user_id')) = ?`);
    queryParams.push(author_id);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) as total FROM (${baseSql} ${whereSql}) as count_table`;
  const [countRows] = await pool.query(countSql, queryParams);
  const total = countRows[0].total;

  const dataSql = `
    ${baseSql}
    ${whereSql}
    ORDER BY v.is_pinned DESC, v.created_at DESC
    LIMIT ? OFFSET ?`;

  const finalParams = [...queryParams, parseInt(size, 10), parseInt(offset, 10)];
  const [rows] = await pool.query(dataSql, finalParams);

  return {
    total,
    notices: rows,
  }
}

// 공지사항 상세 조회
export async function findById(noticeId) {
  const sql = `SELECT * from v_notice_details WHERE notice_id = ?`;
  const [rows] = await pool.query(sql, [noticeId]);

  if (!rows.length) {
    return null;
  }
  rows[0].attachments = rows[0].attachments || [];
  return rows[0];
}

// 공지사항 CRUD
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

// 첨부파일 생성
export const createFiles = async (noticeId, files, connection) => {
  const sql = `INSERT IGNORE INTO notice_file (notice_id, file_id) VALUES ?`;
  const values = files.map((id) => [noticeId, id]);
  await connection.query(sql, [values]);
};

// 타겟층 생성
export const createTargets = async (noticeId, targets, connection) => {
  const sql = `INSERT IGNORE INTO notice_target (notice_id, grade_id, class_id, language_id) VALUES ?`;
  const values = targets.map((t) => [
    noticeId,
    t.grade_id,
    t.class_id,
    t.language_id,
  ]);
  console.log(values);
  await connection.query(sql, [values]);
};

// 공지사항 삭제
export async function deleteNotice(noticeId) {
  const sql = `DELETE FROM notice WHERE notice_id = ?`;

  const [result] = await pool.query(sql, [noticeId]);
  return result.affectedRows;
}


// 첨부파일 삭제
export const deleteFiles = async (noticeId, fileIdsToDelete,  connection) => {
  if (!fileIdsToDelete || fileIdsToDelete.length === 0) return;
  const sql = `DELETE FROM notice_file WHERE notice_id = ? AND file_id IN (?)`;
  const [result] = await connection.query(sql, [noticeId, fileIdsToDelete]);
  return result.affectedRows;
};


// 타겟층 삭제
export const deleteTargets = async (noticeId, connection) => {
  const sql = `DELETE FROM notice_target WHERE notice_id = ?`;

  const [result] = await connection.query(sql, [noticeId]);
  return result.affectedRows;
};


// 공지 대상자(학생) 직접 채우기
export const populateDeliverNoticeForSpecificUsers = async (noticeId, userIds, connection) => {
  const sql = `
    INSERT IGNORE INTO notification_delivery_notice (notice_id, user_id, status)
    SELECT ?, ua.user_id, 'QUEUED'
    FROM user_account ua
    LEFT JOIN user_role ur ON ur.user_id = ua.user_id
    WHERE ua.user_id IN (?) AND ur.role_type = 'student'
  `;
  const [result] = await connection.query(sql, [noticeId, userIds]);
  return result.affectedRows;
}

// 공지 대상자(학생) 자동 채우기
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

  const params = [
    noticeId,
    noticeId,
    noticeId,
    noticeId,
    noticeId,
    noticeId,
    noticeId,
    noticeId,
    noticeId,
  ];
  const [result] = await connection.query(sql, params);
  console.log("Populate Result", result);
  return result.affectedRows;
};

// 발송 대상자 조회 (user_id 배열 및 사용자 전화번호)
export const getDispatchTargets = async (noticeId) => {
  const sql = `
        SELECT 
            ndn.user_id,
            ua.phone
        FROM 
            notification_delivery_notice ndn
        INNER JOIN 
                user_account ua ON ndn.user_id = ua.user_id
        WHERE 
            ndn.notice_id = ?;
       `;

  const [rows] = await pool.query(sql, [noticeId]);

  // user_id와 phone이 담긴 객체를 반환
  return rows;
};

export const deleteDeliveryStatusByNoticeId = async (noticeId, connection) => {
  const sql = `DELETE FROM notification_delivery_notice WHERE notice_id = ?;`;

  const [rows] = await connection.query(sql, [noticeId]);

  return rows.affectedRows;
}

// TODO 카카오 메세지 발송 시 업데이트
// 카카오 발송 성공 시 상태 업데이트
export const updateRecipients = async (
  noticeId,
  userIds = [],
  newStatus = "SENT",
) => {
  if (!userIds.length) return 0;

  const ids = userIds.map(Number);
  const placeholders = ids.map(() => "?").join(",");
  const sql = `
    UPDATE notification_delivery_notice
      SET status = ?,
          send_at = CASE WHEN ? = 'SENT' THEN NOW() ELSE send_at END
      WHERE notice_id = ?
        AND user_id IN (${placeholders})
        AND status = 'QUEUED'
  `;
  console.log("userIds for bulk update:", userIds);

  const params = [newStatus, newStatus, Number(noticeId), ...ids];
  const [result] = await pool.query(sql, params);
  console.log("Excuting bulk Update ", sql, params);

  return result.affectedRows;
};

// 학생이 공지 읽었을 때 상태 변경
export const updateStudentStatus = async (noticeId, userId) => {
  const sql = `
        UPDATE notification_delivery_notice SET read_at = NOW()
        WHERE notice_id = ? AND user_id = ? AND read_at IS NULL
  `;
  const [result] = await pool.query(sql, [noticeId, userId]);

  return result.affectedRows;
};

// 읽음 상태 조회
export const getNoticeReadStatus = async (noticeId) => {
  const sql = `
        SELECT student_name, user_id, status, read_at, send_at
        FROM v_notice_read_status
        WHERE notice_id = ? ORDER BY read_at IS NULL, read_at
  `;

  const [rows] = await pool.query(sql, [noticeId]);

  return rows;
};

// 교수 과목 조회 (필터링)
export const findCoursesForForm = async (user = null, filters = {}) => {
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

  // 역할에 따라 분기 주석 처리
  // if (user) {
  //   whereClauses.push(`cp.user_id = ?`);
  //   params.push(user.user_id);
  // }

  // 관리자는 모두 확인 가능

  const { grade_id, course_type } = filters;

  if (grade_id) {
    whereClauses.push(`ct.grade_id = ?`);
    params.push(grade_id);
  }

  if (course_type) {
    if (course_type === "regular") {
      whereClauses.push(`c.is_special = 0`);
    } else if (course_type === "special") {
      whereClauses.push(`c.is_special = 1`);
    } else if (course_type === "korean") {
      whereClauses.push(`c.is_special = 2`);
    }
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(" AND ");
  }

  sql += ` ORDER BY c.course_id`;

  const [rows] = await pool.query(sql, params);
  return rows;
};

// 사용자가 공지 수신 대상인지 확인
export const isRecipient = async (noticeId, userId, connection = pool) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM notification_delivery_notice WHERE notice_id = ? AND user_id = ?`,
    [noticeId, userId],
  );
  return rows[0].count > 0;
};


// 과목 존재 여부 확인
export const exists = async (courseId, connection = pool) => {
  const [rows] = await connection.query(
      `SELECT 1 FROM course WHERE course_id = ?`,
      [courseId],
  );
  return rows.length > 0;
};

// 교수가 해당 과목을 담당하는지 확인
export const isProfessorOfCourse = async (userId, courseId, connection = pool) => {
  const [rows] = await connection.query(
      `SELECT COUNT(*) as count FROM course_professor WHERE user_id = ? AND course_id = ?`,
      [userId, courseId],
  );
  return rows[0].count > 0;
};