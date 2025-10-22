import pool from "../db/connection.js";
import { getWeekRange } from "../utils/timetableDateCalculator.js";
import { formatReservation } from "../utils/timetableFormatter.js";
import { BadRequestError, NotFoundError } from "../errors/index.js"

// 강의실 목록 조회
export async function getClassrooms() {
    const [results] = await pool.query("SELECT * FROM classroom");
    
    return results
}

// 강의실 ID 생성
export async function createClassroomId() {
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
    
    return newId
}

// 강의실 추가
export async function postClassrooms(classroom_id, building, room_number, room_type) {
    const [result] = await pool.query(
        `INSERT INTO classroom (classroom_id, building, room_number, room_type)
        VALUES (?, ?, ?, ?)`,
        [classroom_id, building, room_number, room_type]
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
export async function getClassroomPolls(date, user_id) {
    const { weekStart, weekEnd } = getWeekRange(date);

    const [rows] = await pool.query(`
        SELECT 
        p.poll_id,
        g.name AS grade_name,
        p.poll_date,
        p.target_weekend,
        p.required_count,
        COUNT(v.votes_id) AS vote_count,
        (COUNT(v.votes_id) >= p.required_count) AS is_opened,
        EXISTS (
            SELECT 1
            FROM weekend_attendance_votes vv
            WHERE vv.poll_id = p.poll_id
            AND vv.user_id = ?
        ) AS user_voted
        FROM weekend_attendance_poll p
        LEFT JOIN weekend_attendance_votes v ON p.poll_id = v.poll_id
        LEFT JOIN grade g ON p.grade_id = g.grade_id
        WHERE p.poll_date BETWEEN ? AND ?
        GROUP BY p.poll_id
        ORDER BY p.poll_date ASC;
    `, [user_id, weekStart, weekEnd]);

    const dayMap = { SAT: "토요일", SUN: "일요일" };

    return rows.map(row => ({
        poll_id: row.poll_id,
        grade_name: row.grade_name,
        poll_date: row.poll_date.toISOString().split("T")[0],
        day_of_week: dayMap[row.target_weekend] || row.target_weekend,
        required_count: row.required_count,
        vote_count: row.vote_count,
        is_opened: !!row.is_opened,
        user_voted: !!row.user_voted
    }));
}

// 강의실 개방 투표 ID 생성
export async function createClassroomPollsId() {
    const [last] = await pool.query(`
        SELECT poll_id FROM weekend_attendance_poll
        ORDER BY poll_id DESC
        LIMIT 1
    `);
    const lastId = last.length ? last[0].poll_id : "P000";
    // ID 생성 (P001)
    const poll_id = `P${String(parseInt(lastId.slice(1)) + 1).padStart(3, "0")}`;
    
    return poll_id
}

// 강의실 개방 투표 생성
export async function postClassroomPolls(poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count) {
    const [result] = await pool.query(`INSERT INTO weekend_attendance_poll (poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count) VALUES (?, ?, ?, ?, ?, ?)`,
    [poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count]);
    
    return result;
}

export async function addVote(user_id, poll_id) {
    // 이미 투표했는지 확인
    const [exists] = await pool.query(
        `SELECT 1 FROM weekend_attendance_votes WHERE user_id = ? AND poll_id = ?`,
        [user_id, poll_id]
    );
    if (exists.length > 0) {
        throw new BadRequestError("이미 투표에 참여했습니다.");
    }
    const [result] = await pool.query(`
        INSERT INTO weekend_attendance_votes (user_id, poll_id) VALUES (?, ?)`,
        [user_id, poll_id])

    return result
}

export async function removeVote(user_id, poll_id) {
    const [result] = await pool.query(
        `DELETE FROM weekend_attendance_votes WHERE user_id = ? AND poll_id = ?`,
        [user_id, poll_id]
    );
    if (result.affectedRows === 0) {
        throw new NotFoundError("해당 투표에 참여하지 않았습니다.");
    }

    return result;
}