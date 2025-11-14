/**
 * @file 청소 당번 관련 데이터베이스 모델
 * @description 청소 당번표 생성, 조회, 삭제 등 청소 당번과 관련된 데이터베이스 작업을 처리합니다.
 */
// Cleaning
import pool from "../db/connection.js";

/**
 * 특정 학년의 재학생 목록을 조회합니다.
 *
 * @param {string} grade_id - 조회할 학년 ID
 * @returns {Promise<Array<object>>} 해당 학년의 학생 목록 (user_id, name 포함)
 */
export async function findStudentByGrade(grade_id) {
  const sql = `
        SELECT se.user_id, ua.name FROM student_entity se
        JOIN user_account ua ON se.user_id = ua.user_id
        WHERE se.grade_id = ? AND se.status = 'enrolled'
        ORDER BY ua.name;
    `;
  const [rows] = await pool.query(sql, [grade_id]);
  return rows;
}

/**
 * 학기 ID를 통해 학기 정보를 조회합니다.
 *
 * @param {string} sectionId - 조회할 학기 ID
 * @returns {Promise<object|null>} 학기 정보 (start_date, end_date 포함) 또는 null
 */
export async function findBySection(sectionId) {
  const sql = `SELECT start_date, end_date FROM section WHERE sec_id = ?`;
  const [rows] = await pool.query(sql, [sectionId]);
  return rows[0] || null;
}

/**
 * 청소 당번표를 생성하거나 업데이트합니다.
 * `cleaning_roster` 테이블에 당번표 정보를 삽입하고, `cleaning_roster_member` 테이블에 당번 멤버를 연결합니다.
 * 트랜잭션을 사용하여 데이터의 일관성을 유지합니다.
 *
 * @param {object} assignments - 당번표 할당 정보
 * @param {string} assignments.classroom_id - 강의실 ID
 * @param {string} assignments.grade_id - 학년 ID
 * @param {string} assignments.sec_id - 학기 ID
 * @param {string} assignments.work_date - 청소 작업일
 * @param {number} assignments.team_size - 팀 크기
 * @param {Array<string>} [assignments.memberIds=[]] - 당번 멤버 사용자 ID 배열
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<{roster_id: number}>} 생성 또는 업데이트된 당번표의 ID
 * @throws {Error} 데이터베이스 작업 실패 시
 */
export async function createCleaningRoaster(assignments, connection) {
  const {
    classroom_id,
    grade_id,
    sec_id,
    work_date,
    team_size,
    memberIds = [],
  } = assignments;

  await connection.beginTransaction();
  try {
    const sql = `
            INSERT INTO cleaning_roster (classroom_id, grade_id, section, work_date, team_size)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              classroom_id = VALUES(classroom_id),
              team_size = VALUES(team_size),
              roster_id = LAST_INSERT_ID(roster_id)
        `;
    const params = [classroom_id, grade_id, sec_id, work_date, team_size];

    const [r1] = await connection.execute(sql, params);
    const rosterId = r1.insertId;

    const deleteMemberSql = `DELETE FROM cleaning_roster_member WHERE roster_id = ?`;
    await connection.execute(deleteMemberSql, [rosterId]);

    if (memberIds.length > 0) {
      const rows = memberIds.map((uid) => [rosterId, uid, work_date]);
      const insertMemberSql = `
              INSERT INTO cleaning_roster_member (roster_id, user_id, work_date)
              VALUES ?
              ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
            `;
      await connection.query(insertMemberSql, [rows]);
    }

    await connection.commit();
    return { roster_id: rosterId };
  } catch (error) {
    await connection.rollback();
    throw Error(error);
  }
}

/**
 * 특정 기간 및 학년의 청소 당번표 상세 뷰를 조회합니다.
 * `v_cleaning_roster_details` 뷰를 사용하여 당번표 정보를 가져옵니다.
 *
 * @param {string} startDate - 조회 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 조회 종료일 (YYYY-MM-DD)
 * @param {string|null} gradeId - 조회할 학년 ID (선택 사항)
 * @returns {Promise<Array<object>>} 청소 당번표 상세 목록
 */
export async function getCleaningRosterView(startDate, endDate, gradeId) {
  const sql = `
        SELECT * FROM v_cleaning_roster_details
        WHERE work_date BETWEEN ? AND ?
            AND (? IS NULL OR grade_id = ?)
        ORDER BY work_date, classroom_name, member_name;
    `;
  const [rows] = await pool.query(sql, [startDate, endDate, gradeId, gradeId]);
  return rows;
}

/**
 * 특정 학기 또는 학년의 청소 당번표를 삭제합니다.
 *
 * @param {string} section - 삭제할 학기 ID
 * @param {string|null} gradeId - 삭제할 학년 ID (선택 사항)
 * @returns {Promise<number>} 삭제된 행의 수
 */
export async function deleteRosters(section, gradeId) {
  let sql = `DELETE FROM cleaning_roster WHERE section = ?`;
  const params = [section];

  if (gradeId) {
    sql += ` AND grade_id = ?`;
    params.push(gradeId);
  }

  const [result] = await pool.query(sql, params);
  return result.affectedRows;
}
