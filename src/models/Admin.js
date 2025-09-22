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

export async function deleteAllowedEmail(id) {
    const [rows] = await pool.query(
        "DELETE FROM allowed_email WHERE id = ?",
        [id]
    );
    return rows;
}

// 학생 정보
export async function getStudentInfo(grade_name, status) {
    const [rows] = await pool.query(
        "SELECT * FROM v_admin_manage_users WHERE (? IS NULL OR grade_name = ?) AND (? IS NULL OR status = ?)",
        [grade_name, grade_name, status, status]
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