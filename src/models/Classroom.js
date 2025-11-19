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
    const targetDate = new Date(`${date}T00:00:00+09:00`);
    const dayNum = targetDate.getDay(); // 0(일) ~ 6(토)

    // 월요일과의 차이 계산 (일요일이면 6일 전이 월요일, 월요일이면 0일 차이)
    const diffToMon = dayNum === 0 ? 6 : dayNum - 1;

    const ws = new Date(targetDate);
    ws.setDate(targetDate.getDate() - diffToMon); // 이번 주 월요일

    const we = new Date(ws);
    we.setDate(ws.getDate() + 6); // 이번 주 일요일

    // YYYY-MM-DD 포맷팅 함수
    const toYMD = (d) => 
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const weekStart = toYMD(ws);
    const weekEnd = toYMD(we);

    const [rows] = await pool.query(`
        SELECT 
            p.poll_id,
            g.name AS grade_name,
            p.poll_date,
            DAYOFWEEK(p.poll_date) as day_num,
            p.required_count,
            COUNT(v.user_id) AS vote_count,
            (COUNT(v.user_id) >= p.required_count) AS is_opened,
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

    const dayMap = { 1: "일요일", 7: "토요일" };

    return rows.map(row => ({
        poll_id: row.poll_id,
        grade_name: row.grade_name,
        poll_date: row.poll_date ? new Date(row.poll_date).toISOString().split("T")[0] : null,
        day_of_week: dayMap[row.day_num], // 평일은 undefined 처리
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
export const postClassroomPolls = async function (serviceParams) {
    const { grade_id, required_count, start_date } = serviceParams; // Controller에서 받은 값

    // 1. (정상) 'r001' 같은 새 규칙 ID 생성
    const rule_id = await classroomModels.createPollRuleId(); 

    // 2. DB에 저장할 데이터 객체
    const newRuleData = {
        rule_id,
        grade_id,
        start_date, // '오늘 날짜' 대신 API에서 받은 시작일
        required_count
    };

    // 3. (정상) '규칙'을 DB에 저장 (수정된 Model 함수 호출)
    return await classroomModels.postPollRule(newRuleData); 
}

// 규칙 ID 만드는 함수
export async function createPollRuleId() {
    const [last] = await pool.query(`
        SELECT rule_id FROM poll_rules  -- (수정) poll_rules 테이블 조회
        ORDER BY rule_id DESC
        LIMIT 1
    `);
    
    const lastId = last.length ? last[0].rule_id : "r000"; // (수정) 접두사 'r'
    const rule_id = `r${String(parseInt(lastId.slice(1)) + 1).padStart(3, "0")}`;
    
    return rule_id;
}

// 규칙 저장
export async function postPollRule(data) {
    const conn = await pool.getConnection();
    try {
        await conn.query(
            `
            INSERT INTO poll_rules 
            (rule_id, grade_id, start_date, required_count)
            VALUES (?, ?, ?, ?)
            `,
            [data.rule_id, data.grade_id, data.start_date, data.required_count]
        );
        
        return { rule_id: data.rule_id };

    } finally {
        conn.release();
    }
}

// 규칙 목록 조회
export const getPollRules = async function () {
    const [rows] = await pool.query(`
        SELECT 
            r.rule_id,
            g.name AS grade_name, -- 학년 이름 (예: "1학년")
            r.grade_id,
            r.required_count,
            DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date
        FROM poll_rules r
        LEFT JOIN grade g ON r.grade_id = g.grade_id
        ORDER BY r.grade_id ASC, r.start_date DESC
    `);
    
    return rows;
}

// 규칙 목록 수정
export const putPollRules = async function (rule_id, required_count, start_date) {
    const [rows] = await pool.query(`
        UPDATE poll_rules
        SET
            required_count = ?,
            start_date = ?
        WHERE rule_id = ?`,
        [required_count, start_date, rule_id]
        );
    
    return rows;
}


// 규칙 목록 삭제
export const deletePollRules = async function (rule_id) {
    const [result] = await pool.query(`
        DELETE FROM poll_rules WHERE rule_id = ?
    `, [rule_id]);
    
    return result; // result.affectedRows로 삭제 여부 확인 가능
}



// 학생 투표 등록
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