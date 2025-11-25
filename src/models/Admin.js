import pool from "../db/connection.js";

// 승인
export async function getPendingUsers() {
    const [rows] = await pool.query("SELECT * FROM v_admin_pending_users;");
    return rows;
}

export async function postPendingUsers(user_id, action) {
    const [rows] = await pool.query(
        "UPDATE user_account SET status = ?, updated_at = NOW() WHERE user_id = ?",
        [action, user_id]
    );
    return rows;
}

export async function deletePendingUsers(user_id) {
    const [rows] = await pool.query(
        "DELETE FROM user_account WHERE user_id = ?",
        [user_id]
    );
    return rows;
}

// 예외 이메일
export async function getAllowedEmail() {
    const [rows] = await pool.query(
        "SELECT * FROM allowed_email"
    );
    return rows;
}

export async function postAllowedEmail(email, reason) {
    const [rows] = await pool.query(
        "INSERT INTO allowed_email (email, reason) VALUES (?, ?)",
        [email, reason]
    );
    return rows;
}

export async function deleteAllowedEmail(user_id) {
    const [rows] = await pool.query(
        "DELETE FROM allowed_email WHERE id = ?",
        [user_id]
    );
    return rows;
}

// 학생 정보
export async function getStudentInfo(grade_id, status) {
    const [rows] = await pool.query(
        `SELECT * FROM v_admin_manage_users 
        WHERE (? IS NULL OR grade_id = ?) 
        AND (? IS NULL OR status = ?)
        ORDER BY
            grade_id ASC,
            CASE status
                WHEN 'enrolled' THEN 1
                ELSE 2
            END ASC,
            name ASC;
        `,
        [grade_id, grade_id, status, status]
    );
    return rows;
}

export async function updateUserAccount(user_id, updates) {
    const fields = Object.keys(updates).map(f => `${f} = ?`).join(", ");
    const values = Object.values(updates);

    const [rows] = await pool.query(
        `UPDATE user_account SET ${fields} WHERE user_id = ?`,
        [...values, user_id]
    );
    return rows;
}

export async function updateStudentEntity(user_id, updates) {
    const fields = Object.keys(updates).map(f => `${f} = ?`).join(", ");
    const values = Object.values(updates);

    const [rows] = await pool.query(
        `UPDATE student_entity SET ${fields} WHERE user_id = ?`,
        [...values, user_id]
    );
    return rows;
}

export async function deleteStudentInfo(user_id) {
    const [rows] = await pool.query(
        "DELETE FROM user_account WHERE user_id = ?",
        [user_id]
    );
    return rows;
}

// 교수, 관리자
export async function getProAdminInfo() {
    const [rows] = await pool.query(`
        SELECT * FROM user_account ua
        JOIN user_role ur ON ua.user_id = ur.user_id
        WHERE ur.role_type = 'professor' OR ur.role_type = 'admin'
        ORDER BY 
            CASE ur.role_type
                WHEN 'professor' THEN 1
                WHEN 'admin'    THEN 2
            END ASC
    `);
    return rows;
}

// 권한 수정
export async function putProAdminInfo(user_id, role_type) {
    const [rows] = await pool.query(`
        UPDATE user_role SET role_type = ? WHERE user_id = ?
    `, [role_type, user_id]);
    return rows;
}
