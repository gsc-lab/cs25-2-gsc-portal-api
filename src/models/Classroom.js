import pool from "../db/connection.js";
import { getWeekRange } from "../utils/timetableDateCalculator.js";
import { formatReservation } from "../utils/timetableFormatter.js";

// 강의실 목록 조회
export async function getClassrooms() {
    const [results] = await pool.query("SELECT * FROM classroom");
    return results
}

// 강의실 추가
export async function postClassrooms(building, room_number, room_type) {

    const [lastRows] = await pool.query(`
        SELECT classroom_id 
        FROM classroom 
        ORDER BY classroom_id DESC 
        LIMIT 1
    `);

    // 새 ID 생성
    const lastId = lastRows[0]?.classroom_id ?? null;
    const newId = lastId
        ? `CR${String(parseInt(lastId.replace("CR", ""), 10) + 1).padStart(3, "0")}`
        : "CR001";

    const [result] = await pool.query(
        `INSERT INTO classroom (classroom_id, building, room_number, room_type)
        VALUES (?, ?, ?, ?)`,
        [newId, building, room_number, room_type]
    );

    return result;
}

// 강의실 수정
export async function putClassrooms(id, building, room_number, room_type) {
    const [result] = await pool.query(
        `UPDATE classroom SET building = ?, room_number = ?, room_type = ? WHERE classroom_id = ?`, [building, room_number, room_type, id]
    );
    return result
}

// 강의실 삭제
export async function deleteClassrooms(id) {
    const [result] = await pool.query(
        `DELETE FROM classroom WHERE classroom_id = ?`, [id]
    );
    return result
}

// 강의실 예약 조회
export async function getClassroomsReservations(id, date) {
    const { weekStart, weekEnd } = getWeekRange(date);

    const [rows] = await pool.query(`
        SELECT 
            r.reservation_id,
            r.user_id,
            u.name AS user_name,
            r.classroom_id,
            r.reserve_date,
            r.start_time,
            r.end_time,
            r.created_at
        FROM reservation AS r
        JOIN user_account AS u ON r.user_id = u.user_id
        WHERE r.classroom_id = ?
            AND r.reserve_date BETWEEN ? AND ?
        ORDER BY r.reserve_date, r.start_time
    `, [id, weekStart, weekEnd]);

    const result = formatReservation(rows);
    return result;
}

// 강의실 예약
export async function postClassroomReservations(id, user_id, reserve_date, start_time, end_time) {
    const [result] = await pool.query(`
        INSERT INTO reservation (user_id, classroom_id, reserve_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)`,
    [user_id, id, reserve_date, start_time, end_time]
    )

    return result
}

// 강의실 예약 삭제
export async function deleteClassroomReservation(id, reservation_id) {
    const [result] = await pool.query(
        `DELETE FROM reservation WHERE classroom_id = ? AND reservation_id = ?`,
        [id, reservation_id]
    );
    return result;
}

// 강의실 개방 투표 현황 조회
export async function getClassroomPolls(date) {
    const { weekStart, weekEnd } = getWeekRange(date);

    const [rows] = await pool.query(`
        
        
        
        
        `)
}