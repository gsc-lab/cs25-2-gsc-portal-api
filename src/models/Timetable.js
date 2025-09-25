import pool from "../db/connection.js";
import { getWeekRange } from "../utils/timetableDateCalculator.js";
import { formatTimetable } from "../utils/timetableFormatter.js";

// 시간표 조회 (학생, 교수, 관리자)
// 학생
export async function getStudentTimetable(user_id, targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

        const sql = `
            SELECT DISTINCT vt.*,
                lc.name AS class_group
            FROM v_timetable vt
            JOIN student_entity se ON se.user_id = ?
            LEFT JOIN level_class lc ON se.class_id = lc.class_id
            WHERE
                se.status = 'enrolled'
                AND (
                    -- 정규과목: 학년 매칭
                    (vt.is_special = 0 AND vt.grade_id = se.grade_id)

                    -- 일본어 특강: 한국인만 JLPT 레벨 매칭
                    OR (vt.is_special = 1
                        AND se.is_international = 'korean'
                        AND vt.level_id IN (1,2,3)   -- JLPT 레벨
                        AND vt.level_id = lc.level_id
                        AND vt.language_id = 'JP')

                    -- 한국어 특강: 외국인만 TOPIK 레벨 매칭
                    OR (vt.is_special = 1
                        AND se.is_international = 'international'
                        AND vt.level_id IN (4,5)     -- TOPIK 레벨
                        AND lc.level_id = vt.level_id -- 학생 TOPIK 레벨 매칭
                        AND vt.language_id = 'KR')
                )
                AND (
                    -- 정규 수업: 학기 기간 안에만
                    (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)

                    -- 이벤트: 이번 주차 안에 있는 것만
                    OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
                )
            ORDER BY FIELD(vt.day,'MON','TUE','WED','THU','FRI'), vt.start_time;
        `;


    const params = [user_id, targetDate, weekStart, weekEnd];
    const [rows] = await pool.query(sql, params);
    return formatTimetable(rows)
};

// 교수
export async function getProfessorTimetable(user_id, targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    const sql = `
    SELECT vt.*
    FROM v_timetable vt
    WHERE vt.professor_id = ?
    AND (
        (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)
        OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
    )
    ORDER BY FIELD(vt.day,'MON','TUE','WED','THU','FRI'), vt.start_time;
    `;

    const params = [user_id, targetDate, weekStart, weekEnd];
    const [rows] = await pool.query(sql, params);
    return formatTimetable(rows);
};

// 관리자
export async function getAdminTimetable(targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    const sql = `
    SELECT *
    FROM v_timetable vt
    WHERE (
        (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)
        OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
    )
    ORDER BY FIELD(vt.day,'MON','TUE','WED','THU','FRI'), vt.start_time;
    `;

    const params = [targetDate, weekStart, weekEnd];
    const [rows] = await pool.query(sql, params);
    return formatTimetable(rows);
}










// 후까 교수님
// 학생 리스트
export async function getHukaStudentTimetable() {
    const sql = `
    SELECT
        ua.user_id,
        ua.name,
        se.grade_id
    FROM user_account ua
    JOIN student_entity se ON ua.user_id = se.user_id
    JOIN user_role ur ON ua.user_id = ur.user_id
    WHERE ur.role_type = 'student'
        AND ua.status = 'active'
        AND se.status = 'enrolled'
        AND se.grade_id IN ('1','2','3')
    ORDER BY se.grade_id ASC, ua.user_id ASC;
    `

    const [rows] = await pool.query(sql);
    return rows;
}