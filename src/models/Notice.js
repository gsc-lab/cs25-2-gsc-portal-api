/**
 * @file 공지사항 관련 데이터베이스 모델
 * @description 공지사항의 조회, 생성, 수정, 삭제 및 관련 파일, 타겟, 발송 상태 관리를 위한 데이터베이스 작업을 처리합니다.
 */
// Notice.js
import pool from "../db/connection.js";

/**
 * 주어진 조건과 필터를 사용하여 공지사항 목록을 조회합니다.
 * 사용자 역할에 따라 조회 가능한 공지사항이 필터링됩니다.
 *
 * @param {object} spec - 사용자 정보 (예: { user: { user_id, role } })
 * @param {object} query - 검색 및 필터링 조건 (page, size, search, course_type, course_id, grade_id, language_id, author_id)
 * @returns {Promise<{total: number, notices: Array<object>}>} 총 공지사항 수와 공지사항 목록
 */
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
    const studentAccessSubquery = `
    (
      -- Course notice: check if student is in that course
      (v.course_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM course_student cs
        WHERE cs.user_id = ?
        AND cs.course_id = v.course_id
      ))
      OR
      -- General notice
      (v.course_id IS NULL AND EXISTS (
        SELECT 1 FROM student_entity se WHERE se.user_id = ? AND (
          -- 대상이 지정된 공지: 여러 대상 조건 중 하나라도 만족하면 보이도록
          (JSON_LENGTH(v.targets) > 0 AND
            (
              SELECT COUNT(*)
              FROM JSON_TABLE(v.targets, '$[*]' COLUMNS (
                  t_grade_id VARCHAR(10) PATH '$.grade_id',
                  t_language_id VARCHAR(10) PATH '$.language_id',
                  t_class_id VARCHAR(10) PATH '$.class_id'
              )) AS jt
              WHERE (jt.t_grade_id IS NULL OR jt.t_grade_id = se.grade_id)
                AND (jt.t_language_id IS NULL OR jt.t_language_id = se.language_id)
                AND (jt.t_class_id IS NULL OR jt.t_class_id = se.class_id)
            ) > 0
          )
          OR
          -- Without targets, all enrolled students
          (JSON_LENGTH(v.targets) = 0 AND se.status = 'enrolled')
        )
      ))
    )
    `;
    whereClauses.push(studentAccessSubquery);
    queryParams.push(user.user_id, user.user_id);
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

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) as total FROM (${baseSql} ${whereSql}) as count_table`;
  const [countRows] = await pool.query(countSql, queryParams);
  const total = countRows[0].total;

  const dataSql = `
    ${baseSql}
    ${whereSql}
    ORDER BY v.is_pinned DESC, v.created_at DESC
    LIMIT ? OFFSET ?`;

  const finalParams = [
    ...queryParams,
    parseInt(size, 10),
    parseInt(offset, 10),
  ];
  const [rows] = await pool.query(dataSql, finalParams);

  return {
    total,
    notices: rows,
  };
}

/**
 * 공지사항 ID를 통해 공지사항의 상세 정보를 조회합니다.
 * `v_notice_details` 뷰를 사용하여 공지사항과 관련된 모든 정보를 가져옵니다.
 *
 * @param {string} noticeId - 조회할 공지사항의 고유 ID
 * @returns {Promise<object|null>} 조회된 공지사항 객체 또는 null
 */
export async function findById(noticeId) {
  const sql = `SELECT * from v_notice_details WHERE notice_id = ?`;
  const [rows] = await pool.query(sql, [noticeId]);

  if (!rows.length) {
    return null;
  }
  rows[0].attachments = rows[0].attachments || [];
  return rows[0];
}

/**
 * 새로운 공지사항을 데이터베이스에 생성합니다.
 *
 * @param {object} noticeInfo - 공지사항 정보 (title, content, is_pinned)
 * @param {string} course_id - 공지사항이 속한 과목 ID
 * @param {string} userId - 공지사항을 작성한 사용자 ID
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 새로 생성된 공지사항의 ID
 */
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

/**
 * 기존 공지사항을 데이터베이스에서 수정합니다.
 *
 * @param {string} noticeId - 수정할 공지사항의 고유 ID
 * @param {object} patch - 업데이트할 공지사항 데이터 (title, content, is_pinned, course_id)
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 업데이트된 행의 수
 */
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

/**
 * 공지사항에 첨부파일을 연결합니다.
 * `notice_file` 테이블에 공지사항 ID와 파일 ID를 삽입합니다.
 *
 * @param {string} noticeId - 첨부파일을 연결할 공지사항의 ID
 * @param {Array<string>} files - 연결할 파일 ID 배열
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<void>}
 */
export const createFiles = async (noticeId, files, connection) => {
  const sql = `INSERT IGNORE INTO notice_file (notice_id, file_id) VALUES ?`;
  const values = files.map((id) => [noticeId, id]);
  await connection.query(sql, [values]);
};

/**
 * 공지사항의 타겟 그룹을 설정합니다.
 * `notice_target` 테이블에 공지사항 ID와 타겟 조건(학년, 반, 언어)을 삽입합니다.
 *
 * @param {string} noticeId - 타겟을 설정할 공지사항의 ID
 * @param {Array<object>} targets - 타겟 조건 배열 (grade_id, class_id, language_id 포함)
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<void>}
 */
export const createTargets = async (noticeId, courseId, targets, connection) => {
  const sql = `INSERT IGNORE INTO notice_target (notice_id, course_id, grade_id, class_id, language_id) VALUES ?`;
  const values = targets.map((t) => [
    noticeId,
    courseId ?? null,
    t.grade_id ?? null,
    t.class_id ?? null,
    t.language_id ?? null,
  ]);
  await connection.query(sql, [values]);
};

/**
 * 공지사항을 데이터베이스에서 삭제합니다.
 *
 * @param {string} noticeId - 삭제할 공지사항의 고유 ID
 * @returns {Promise<number>} 삭제된 행의 수
 */
export async function deleteNotice(noticeId) {
  const sql = `DELETE FROM notice WHERE notice_id = ?`;

  const [result] = await pool.query(sql, [noticeId]);
  return result.affectedRows;
}

/**
 * 공지사항에 연결된 특정 첨부파일들을 삭제합니다.
 * `notice_file` 테이블에서 공지사항 ID와 파일 ID를 기준으로 레코드를 삭제합니다.
 *
 * @param {string} noticeId - 첨부파일을 삭제할 공지사항의 ID
 * @param {Array<string>} fileIdsToDelete - 삭제할 파일 ID 배열
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삭제된 행의 수
 */
export const deleteFiles = async (noticeId, fileIdsToDelete, connection) => {
  if (!fileIdsToDelete || fileIdsToDelete.length === 0) return;
  const sql = `DELETE FROM notice_file WHERE notice_id = ? AND file_id IN (?)`;
  const [result] = await connection.query(sql, [noticeId, fileIdsToDelete]);
  return result.affectedRows;
};

/**
 * 공지사항의 모든 타겟 그룹을 삭제합니다.
 * `notice_target` 테이블에서 특정 공지사항 ID에 해당하는 모든 레코드를 삭제합니다.
 *
 * @param {string} noticeId - 타겟 그룹을 삭제할 공지사항의 ID
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삭제된 행의 수
 */
export const deleteTargets = async (noticeId, connection) => {
  const sql = `DELETE FROM notice_target WHERE notice_id = ?`;

  const [result] = await connection.query(sql, [noticeId]);
  return result.affectedRows;
};

/**
 * 특정 사용자들에게 공지 발송 대상을 채웁니다.
 * `notification_delivery_notice` 테이블에 지정된 사용자 ID와 공지사항 ID를 삽입합니다.
 *
 * @param {string} noticeId - 발송 대상을 채울 공지사항의 ID
 * @param {Array<string>} userIds - 발송 대상 사용자 ID 배열
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삽입된 행의 수
 */
export const populateDeliverNoticeForSpecificUsers = async (
  noticeId,
  userIds,
  connection,
) => {
  const sql = `
    INSERT IGNORE INTO notification_delivery_notice (notice_id, user_id, status)
    SELECT ?, ua.user_id, 'QUEUED'
    FROM user_account ua
    LEFT JOIN user_role ur ON ur.user_id = ua.user_id
    WHERE ua.user_id IN (?) AND ur.role_type = 'student'
  `;
  const [result] = await connection.query(sql, [noticeId, userIds]);
  return result.affectedRows;
};

/**
 * 공지사항의 발송 대상을 자동으로 채웁니다.
 * 공지사항의 `course_id` 및 `notice_target` 설정에 따라 적절한 학생들을 발송 대상으로 지정합니다.
 *
 * @param {string} noticeId - 발송 대상을 채울 공지사항의 ID
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삽입된 행의 수
 */
export const populateDeliverNotice = async (noticeId, connection) => {
  const numericNoticeId = Number(noticeId);
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
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
    numericNoticeId,
  ];
  const [result] = await connection.query(sql, params);
  console.log("Populate Result", result);
  return result.affectedRows;
};

/**
 * 공지사항의 발송 대상자 목록을 조회합니다.
 * `notification_delivery_notice` 테이블과 `user_account` 테이블을 조인하여
 * 발송 대상자의 사용자 ID와 전화번호를 반환합니다.
 *
 * @param {string} noticeId - 발송 대상자를 조회할 공지사항의 ID
 * @returns {Promise<Array<object>>} 사용자 ID와 전화번호를 포함하는 객체 배열
 */
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

/**
 * 특정 공지사항의 모든 발송 상태 기록을 삭제합니다.
 * `notification_delivery_notice` 테이블에서 해당 공지사항 ID에 해당하는 모든 레코드를 삭제합니다.
 *
 * @param {string} noticeId - 발송 상태 기록을 삭제할 공지사항의 ID
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삭제된 행의 수
 */
export const deleteDeliveryStatusByNoticeId = async (noticeId, connection) => {
  const sql = `DELETE FROM notification_delivery_notice WHERE notice_id = ?;`;

  const [rows] = await connection.query(sql, [noticeId]);

  return rows.affectedRows;
};

/**
 * 공지사항 수신자들의 발송 상태를 업데이트합니다.
 * `notification_delivery_notice` 테이블에서 특정 공지사항과 사용자 ID에 해당하는 레코드의 상태를 변경합니다.
 *
 * @param {string} noticeId - 상태를 업데이트할 공지사항의 ID
 * @param {Array<string>} userIds - 상태를 업데이트할 사용자 ID 배열
 * @param {string} [newStatus='SENT'] - 새로운 발송 상태 (기본값: 'SENT')
 * @returns {Promise<number>} 업데이트된 행의 수
 */
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

  const params = [newStatus, newStatus, Number(noticeId), ...ids];
  const [result] = await pool.query(sql, params);

  return result.affectedRows;
};

/**
 * 학생이 공지사항을 읽었을 때 상태를 업데이트합니다.
 * `notification_delivery_notice` 테이블에서 학생의 `read_at` 필드를 현재 시간으로 설정합니다.
 *
 * @param {string} noticeId - 읽음 처리할 공지사항의 ID
 * @param {string} userId - 읽음 처리한 학생의 사용자 ID
 * @returns {Promise<number>} 업데이트된 행의 수
 */
export const updateStudentStatus = async (noticeId, userId) => {
  const sql = `
        UPDATE notification_delivery_notice SET read_at = NOW()
        WHERE notice_id = ? AND user_id = ? AND read_at IS NULL
  `;
  const [result] = await pool.query(sql, [noticeId, userId]);

  return result.affectedRows;
};

/**
 * 특정 공지사항의 읽음 현황을 조회합니다.
 * `v_notice_read_status` 뷰를 사용하여 학생별 읽음 상태, 발송 상태 등을 반환합니다.
 *
 * @param {string} noticeId - 읽음 현황을 조회할 공지사항의 ID
 * @returns {Promise<Array<object>>} 읽음 현황 목록
 */
export const getNoticeReadStatus = async (noticeId) => {
  const sql = `
        SELECT student_name, user_id, status, read_at, send_at
        FROM v_notice_read_status
        WHERE notice_id = ? ORDER BY read_at IS NULL, read_at
  `;

  const [rows] = await pool.query(sql, [noticeId]);

  return rows;
};

/**
 * 공지사항 폼에서 사용할 교수 과목 목록을 필터링하여 조회합니다.
 *
 * @param {object} [user=null] - 현재 로그인된 사용자 정보 (교수일 경우 user_id 사용)
 * @param {object} [filters={}] - 필터링 조건 (grade_id, course_type 등)
 * @returns {Promise<Array<object>>} 필터링된 과목 목록
 */
export const findCoursesForForm = async (user = null, filters = {}) => {
  let sql = `
      SELECT DISTINCT 
          c.course_id,
          c.title,
          c.is_special,
          ct.grade_id,
          cc.class_id,
          cc.name AS class_name
      FROM course c
      LEFT JOIN course_target ct ON ct.course_id = c.course_id
      LEFT JOIN course_class cc ON cc.class_id = ct.class_id
  `;

  const whereClauses = [];
  const params = [];

  const { grade_id, course_type, class_id } = filters;

  // 학년 필터
  if (grade_id) {
    whereClauses.push(`ct.grade_id = ?`);
    params.push(grade_id);
  }

  // 과목 타입 틸터
  if (course_type) {
    if (course_type === "regular") {
      whereClauses.push(`c.is_special = 0`);
    } else if (course_type === "special") {
      whereClauses.push(`c.is_special = 1`);
    } else if (course_type === "korean") {
      whereClauses.push(`c.is_special = 2`);
    }
  }

  // A / B 필터 적용
  if (class_id) {
    whereClauses.push(`RIGHT(cc.class_id, 1) = ?`);
    params.push(class_id);
  }

  // WHERE 추가
  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(" AND ");
  }

  sql += ` ORDER BY c.course_id, cc.class_id`;

  const [rows] = await pool.query(sql, params);

  // ====== 그룹핑 처리 (course_id 기준) ======
  const coursesMap = new Map();

  for (const row of rows) {
    if (!coursesMap.has(row.course_id)) {
      coursesMap.set(row.course_id, {
        course_id: row.course_id,
        title: row.title,
        course_type:
          row.is_special === 2 ? "korean" :
            row.is_special === 1 ? "special" : "regular",
        targets: []
      });
    }

    // target 정보 푸시
    if (row.class_id) {
      coursesMap.get(row.course_id).targets.push({
        target_id: row.target_id,
        class_id: row.class_id,
        class_name: row.class_name,
        grade_id: row.grade_id,
        language_id: row.language_id
      });
    }
  }

  return Array.from(coursesMap.values());
};

/**
 * 특정 사용자가 공지사항의 수신 대상인지 확인합니다.
 * (동적 확인 로직으로 변경)
 *
 * 1) 과목 공지일 경우 -> 학생이 해당 course_id의 target_id를 수강 중인지 확인
 * 2) 일반 공지일 경우 -> notice.targets(학년/언어/분반)를
 *    학생이 수강 중인 course_target 정보와 비교하여 매칭 여부 판단
 *
 * @param {string} noticeId - 확인할 공지사항의 ID
 * @param {string} userId - 확인할 사용자의 ID
 * @param {object} [connection=pool] - 데이터베이스 연결 객체
 * @returns {Promise<boolean>} 수신 대상이면 true, 아니면 false
 */
export const isRecipient = async (noticeId, userId, connection = pool) => {
  // 1. 공지사항 상세 정보 조회
  const [noticeRows] = await connection.query(
    `SELECT * FROM v_notice_details WHERE notice_id = ?`,
    [noticeId],
  );
  if (noticeRows.length === 0) return false;
  const notice = noticeRows[0];

  // 2. 학생 정보 조회
  const [studentRows] = await connection.query(
    `SELECT * FROM student_entity WHERE user_id = ?`,
    [userId],
  );
  if (studentRows.length === 0) return false;
  const student = studentRows[0];

  if (student.status !== "enrolled") return false;

  // 3. 학생이 수강 중인 target 목록 로드 ---
  const [targetRows] = await connection.query(
    `
    SELECT ct.*
    FROM course_student cs
    JOIN course_target ct ON ct.target_id = cs.target_id
    WHERE cs.user_id = ?
    `,
    [userId],
  );

  // (학생이 아무 수업도 안 듣는 경우)
  if (targetRows.length === 0) return false;

  // 4. 과목 공지 처리
  if (notice.course_id) {
    // 학생이 듣는 target 중 course_id가 일치하는 경우
    return targetRows.some(t => t.course_id === notice.course_id);
  }

  // 5. 일반 공지 처리
  // 타겟 조건이 없으면 전체 학생에게 발송
  if (notice.targets.length === 0) return true;

  // 학생이 수강 중인 target 중 하나라도 조건을 만족하면 true
  for (const target of notice.targets) {
    const match = targetRows.some(t => {
      const gradeOk = !target.grade_id || t.grade_id === target.grade_id;
      const langOk = !target.language_id || t.language_id === target.language_id;
      const classOk = !target.class_id || t.class_id === target.class_id;
      return gradeOk && langOk && classOk;
    });

    // target 조건 중 하나라도 만족했다면 수신 가능
    if (match) return true;
  }

  return false;
};

/**
 * 특정 과목이 데이터베이스에 존재하는지 확인합니다.
 *
 * @param {string} courseId - 존재 여부를 확인할 과목의 ID
 * @param {object} [connection=pool] - 데이터베이스 연결 객체
 * @returns {Promise<boolean>} 과목이 존재하면 true, 아니면 false
 */
export const courseExists = async (courseId, connection = pool) => {
  const [rows] = await connection.query(
    `SELECT 1 FROM course WHERE course_id = ?`,
    [courseId],
  );
  return rows.length > 0;
};

/**
 * 특정 사용자가 특정 과목의 담당 교수인지 확인합니다.
 *
 * @param {string} userId - 확인할 사용자의 ID
 * @param {string} courseId - 확인할 과목의 ID
 * @param {object} [connection=pool] - 데이터베이스 연결 객체
 * @returns {Promise<boolean>} 담당 교수이면 true, 아니면 false
 */
export const isProfessorOfCourse = async (
  userId,
  courseId,
  connection = pool,
) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM course_professor WHERE user_id = ? AND course_id = ?`,
    [userId, courseId],
  );
  return rows[0].count > 0;
};
