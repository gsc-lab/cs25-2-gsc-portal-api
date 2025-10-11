import pool from "../../db/connection.js";

// 학기 조회
export async function getSections() {
    const [rows] = await pool.query(
        `SELECT sec_id, CONCAT(year, '-', semester) AS label FROM section`
    )
    return rows
}


// 교수 목록
export async function getProfessors() {
    const [rows] = await pool.query(
        `SELECT ua.user_id, ua.name
        FROM user_account ua
        JOIN user_role ur ON ua.user_id = ur.user_id
        WHERE ur.role_type = 'professor';`
    )
    return rows
}


// 강의실 목록
export async function getClassrooms() {
    const [rows] = await pool.query(
        `SELECT classroom_id, CONCAT(building, '-', room_number) AS label
        FROM classroom;`
    )
    return rows;
}


// 교시 목록
export async function getTimeslots() {
    const [rows] = await pool.query(
        `SELECT time_slot_id, start_time, end_time
        FROM time_slot;`
    )
    return rows;
}


// 요일 목록
export async function getDays() {
    const [rows] = await pool.query(
        `SELECT 'MON' AS day_of_week
            UNION SELECT 'TUE'
            UNION SELECT 'WEN'
            UNION SELECT 'THU'
            UNION SELECT 'FRI';`
    )
    return rows;
}
