// Cleaning
import pool from "../db/connection.js";

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

export async function findBySection(sectionId) {
  const sql = `SELECT start_date, end_date FROM section WHERE sec_id = ?`;
  const [rows] = await pool.query(sql, [sectionId]);
  return rows[0] || null;
}

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
