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

// 강의 등록
export async function registerCourse(sec_id, title, professor_id, target) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // is_special 매핑
        let is_special = 0;
        if (target.category === "special") is_special = 1;
        else if (target.category === "korean") is_special = 2;

        // 마지막 course_id 조회 후 새 ID 생성
        const [rows] = await conn.query("SELECT course_id FROM course ORDER BY course_id DESC LIMIT 1");
        const lastId = rows.length > 0 ? rows[0].course_id : null;
        const course_id = generateCourseId(lastId);

        // course 등록
        await conn.query(
        `INSERT INTO course (course_id, sec_id, title, is_special)
        VALUES (?, ?, ?, ?)`,
        [course_id, sec_id, title, is_special]
        );

        // 교수 매핑
        await conn.query(
        `INSERT INTO course_professor (user_id, course_id)
        VALUES (?, ?)`,
        [professor_id, course_id]
        );

        // 마지막 target_id 조회 후 새 ID 생성
        const [rows2] = await conn.query("SELECT target_id FROM course_target ORDER BY target_id DESC LIMIT 1");
        const lastTargetId = rows2.length > 0 ? rows2[0].target_id : null;
        const target_id = generateTargetId(lastTargetId);

        // 대상 등록
        if (target.category === "regular") {
        await conn.query(
            `INSERT INTO course_target (target_id, course_id, grade_id, language_id)
            VALUES (?, ?, ?, ?)`,
            [target_id, course_id, target.grade_id, "KR"]
        );
        } else if (target.category === "korean") {
        await conn.query(
            `INSERT INTO course_target (target_id, course_id, level_id, language_id)
            VALUES (?, ?, ?, ?)`,
            [target_id, course_id, target.level_id || null, "KR"]
        );
        } else if (target.category === "special") {
        await conn.query(
            `INSERT INTO course_target (target_id, course_id, language_id)
            VALUES (?, ?, ?)`,
            [target_id, course_id, "JP"]
        );
        }

        await conn.commit();
        return { course_id, target_id };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}




// helper 함수
// Course ID 생성 (C001, C002, ...)
function generateCourseId(lastId) {
    if (!lastId) return "C001";
    const num = parseInt(lastId.substring(1));
    return "C" + String(num + 1).padStart(3, "0");
}

// Target ID 생성 (T001, T002, ...)
function generateTargetId(lastId) {
    if (!lastId) return "T001";
    const num = parseInt(lastId.substring(1)); // "T008" → 8
    return "T" + String(num + 1).padStart(3, "0"); // → "T009"
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