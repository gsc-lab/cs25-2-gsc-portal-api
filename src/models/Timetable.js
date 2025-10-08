import pool from "../db/connection.js";
import { getWeekRange } from "../utils/timetableDateCalculator.js";
import { formatTimetable, formatTimetableForAdmin } from "../utils/timetableFormatter.js";

// 시간표 조회 (학생, 교수, 관리자)
export async function getStudentTimetable(user_id, targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    const sql = `
        -- 🔹 정규 수업 + 특강 + 한국어 + 휴보강 포함
        SELECT 
            vt.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            vt.course_id,
            vt.course_title,
            vt.professor_name,
            CONCAT(vt.building, '-', vt.room_number) AS location,
            vt.is_special,
            vt.language_id,
            vt.event_status,
            vt.event_date,
            'CLASS' AS source_type
        FROM v_timetable vt
        JOIN student_entity se 
            ON se.user_id = ?
            AND se.status = 'enrolled'
        JOIN time_slot ts ON vt.start_time = ts.start_time
        WHERE
            (
                (vt.is_special = 0 AND vt.grade_id = se.grade_id)
                OR (vt.is_special = 1 AND se.is_international = 'korean' AND vt.language_id = 'JP')
                OR (vt.is_special = 1 AND se.is_international = 'international' AND vt.language_id = 'KR')
            )
            AND (
                (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)
                OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
            )

        UNION ALL

        -- 🔹 상담 일정 (REGULAR + CUSTOM)
        SELECT 
            vhk.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            NULL AS course_id,
            '상담' AS course_title,
            up.name AS professor_name,
            vhk.location AS location,
            NULL AS is_special,
            NULL AS language_id,
            NULL AS event_status,
            NULL AS event_date,
            'COUNSELING' AS source_type
        FROM v_huka_timetable vhk
        JOIN time_slot ts ON vhk.time_slot_id = ts.time_slot_id
        JOIN user_account up ON up.user_id = vhk.professor_id
        JOIN section sec ON vhk.sec_id = sec.sec_id
        WHERE 
            vhk.student_id = ?
            AND (
                (vhk.schedule_type = 'REGULAR'
                    AND ? BETWEEN sec.start_date AND sec.end_date)
                OR 
                (vhk.schedule_type = 'CUSTOM'
                    AND vhk.event_date BETWEEN ? AND ?)
            )

        ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI'), start_time;
    `;

    const params = [
        user_id, targetDate, weekStart, weekEnd, // v_timetable
        user_id, targetDate, weekStart, weekEnd  // v_huka_timetable
    ];

    const [rows] = await pool.query(sql, params);
    return formatTimetable(rows);
}


// 교수
export async function getProfessorTimetable(user_id, targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    const sql = `
        -- 🔹 교수 담당 정규 수업 + 휴보강 포함
        SELECT 
            vt.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            vt.course_id,
            vt.course_title,
            vt.professor_name,
            CONCAT(vt.building, '-', vt.room_number) AS location,
            vt.is_special,
            vt.language_id,
            vt.event_status,
            vt.event_date,
            'CLASS' AS source_type
        FROM v_timetable vt
        LEFT JOIN time_slot ts ON vt.start_time = ts.start_time
        WHERE vt.professor_id = ?
        AND (
            (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)
            OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
        )

        UNION ALL

        -- 🔹 교수 상담 일정 (REGULAR + CUSTOM)
        SELECT 
            vhk.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            NULL AS course_id,
            CONCAT('상담(', ua.name, ')') AS course_title,
            up.name AS professor_name,
            vhk.location AS location,
            NULL AS is_special,
            NULL AS language_id,
            NULL AS event_status,
            NULL AS event_date,
            'COUNSELING' AS source_type
        FROM v_huka_timetable vhk
        JOIN time_slot ts ON vhk.time_slot_id = ts.time_slot_id
        JOIN user_account ua ON ua.user_id = vhk.student_id
        JOIN user_account up ON up.user_id = vhk.professor_id
        JOIN section sec ON vhk.sec_id = sec.sec_id
        WHERE vhk.professor_id = ?
        AND (
            -- REGULAR 상담은 학기 기간 내만 표시
            (vhk.schedule_type = 'REGULAR'
                AND ? BETWEEN sec.start_date AND sec.end_date)
            OR
            -- CUSTOM 상담은 해당 주차 범위 내만 표시
            (vhk.schedule_type = 'CUSTOM'
                AND vhk.event_date BETWEEN ? AND ?)
        )

        ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI'), start_time;
    `;

    const params = [
        user_id, targetDate, weekStart, weekEnd,   // 수업
        user_id, targetDate, weekStart, weekEnd    // 상담
    ];

    const [rows] = await pool.query(sql, params);
    return formatTimetable(rows);
}




// 관리자
export async function getAdminTimetable(targetDate) {
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    const sql = `
        -- 🔹 전체 수업 + 휴보강 포함
        SELECT 
            vt.grade_name,
            vt.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            vt.course_id,
            vt.course_title,
            vt.professor_name,
            CONCAT(vt.building, '-', vt.room_number) AS location,
            vt.is_special,
            vt.language_id,
            vt.event_status,
            vt.event_date,
            'CLASS' AS source_type
        FROM v_timetable vt
        LEFT JOIN time_slot ts ON vt.start_time = ts.start_time
        WHERE (
            (vt.event_date IS NULL AND ? BETWEEN vt.start_date AND vt.end_date)
            OR (vt.event_date IS NOT NULL AND vt.event_date BETWEEN ? AND ?)
        )

        UNION ALL

        -- 🔹 전체 상담 일정 (REGULAR + CUSTOM)
        SELECT 
            NULL AS grade_name,
            vhk.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            NULL AS course_id,
            CONCAT('상담(', ua.name, ')') AS course_title,
            up.name AS professor_name,
            vhk.location AS location,
            NULL AS is_special,
            NULL AS language_id,
            NULL AS event_status,
            NULL AS event_date,
            'COUNSELING' AS source_type
        FROM v_huka_timetable vhk
        JOIN time_slot ts ON vhk.time_slot_id = ts.time_slot_id
        JOIN user_account ua ON ua.user_id = vhk.student_id
        JOIN user_account up ON up.user_id = vhk.professor_id
        JOIN section sec ON vhk.sec_id = sec.sec_id
        WHERE (
            (vhk.schedule_type = 'REGULAR'
                AND ? BETWEEN sec.start_date AND sec.end_date)
            OR
            (vhk.schedule_type = 'CUSTOM'
                AND vhk.event_date BETWEEN ? AND ?)
        )

        ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI'), start_time;
    `;

    const params = [
        targetDate, weekStart, weekEnd,    // 수업
        targetDate, weekStart, weekEnd     // 상담
    ];

    const [rows] = await pool.query(sql, params);
    return formatTimetableForAdmin(rows);
}




// 강의 등록
export async function postRegisterCourse(sec_id, title, professor_id, target) {
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
            `INSERT INTO course_target (target_id, course_id, level_id, language_id)
            VALUES (?, ?, ?, ?)`,
            [target_id, course_id, target.level_id || null, "JP"]
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

// 시간표 등록
export async function registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period, class_name = null) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        let class_id = null;

        // ✅ class_name이 넘어온 경우 → course_id + class_name 조합으로 class_id 생성
        if (class_name) {
            class_id = course_id + class_name;  // 예: "C003" + "A" → "C003A"

            // DB에 없으면 course_class에 새로 등록
            const [exists] = await conn.query(
                "SELECT 1 FROM course_class WHERE class_id = ?",
                [class_id]
            );
            if (exists.length === 0) {
                await conn.query(
                    "INSERT INTO course_class (class_id, course_id, name) VALUES (?, ?, ?)",
                    [class_id, course_id, class_name]
                );
            }
        }

        // schedule_id 조회 (숫자 기준 정렬)
        const [lastRow] = await conn.query(`
            SELECT schedule_id 
            FROM course_schedule 
            ORDER BY CAST(SUBSTRING(schedule_id, 4) AS UNSIGNED) DESC 
            LIMIT 1
        `);
        const lastId = lastRow.length > 0 ? lastRow[0].schedule_id : null;


        // 교시 범위만큼 반복
        for (let i = 0; i <= end_period - start_period; i++) {
            const period = start_period + i;
            const schedule_id = generateScheduleId(lastId, i);

            const sql = `
                INSERT INTO course_schedule 
                (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week, class_id)
                SELECT ?, ?, ?, c.course_id, c.sec_id, ?, ?
                FROM course c
                WHERE c.course_id = ?`;

            await conn.query(sql, [
                schedule_id,
                classroom_id,
                period,
                day_of_week,
                class_id,   // ✅ 정규과목이면 null, 특강이면 자동 생성된 class_id
                course_id
            ]);
        }

        await conn.commit();
        return { message: "시간표 등록 완료" };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}



// 휴보강 등록
export async function postRegisterHoliday(
    event_type,
    event_date,
    start_period,
    end_period,
    course_id = null,
    cancel_event_ids = [],
    classroom
) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 마지막 event_id 조회
        const [lastRow] = await conn.query(
            "SELECT event_id FROM course_event ORDER BY event_id DESC LIMIT 1"
        );
        let lastId = lastRow.length > 0 ? lastRow[0].event_id : null;

        if (event_type === "CANCEL") {
            // course_id + 교시 범위로 schedule_id 조회
            const [rows] = await conn.query(
                `
                SELECT cs.schedule_id
                FROM course_schedule cs
                JOIN time_slot ts ON cs.time_slot_id = ts.time_slot_id
                WHERE cs.course_id = ?
                AND CAST(ts.time_slot_id AS UNSIGNED) BETWEEN ? AND ?
                `,
                [course_id, start_period, end_period]
            );

            if (rows.length === 0) throw new Error("휴강 대상 수업 슬롯을 찾을 수 없음");

            // 교시별 이벤트 생성
            for (let i = 0; i < rows.length; i++) {
                lastId = generateEventId(lastId); // 항상 새로운 id
                await conn.query(
                    `
                    INSERT INTO course_event (event_id, schedule_id, event_type, event_date, classroom)
                    VALUES (?, ?, 'CANCEL', ?, ?)
                    `,
                    [lastId, rows[i].schedule_id, event_date, classroom]
                );
            }

            await conn.commit();
            return { message: "휴강 등록 완료" };

        } else if (event_type === "MAKEUP") {
            if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
                throw new Error("보강 등록 시 최소 1개 이상의 휴강 event_id가 필요합니다");
            }

            // 휴강 이벤트 → schedule_id 매핑 조회
            const placeholders = cancel_event_ids.map(() => "?").join(",");
            const [rows] = await conn.query(
                `
                SELECT event_id, schedule_id
                FROM course_event
                WHERE event_id IN (${placeholders}) AND event_type = 'CANCEL'
                `,
                cancel_event_ids
            );

            if (rows.length === 0) throw new Error("대상 휴강 이벤트를 찾을 수 없음");

            const eventMap = new Map(rows.map(r => [r.event_id, r.schedule_id]));

            // 보강 이벤트 생성
            for (let i = 0; i < cancel_event_ids.length; i++) {
                const cancelId = cancel_event_ids[i];
                const scheduleId = eventMap.get(cancelId);
                if (!scheduleId) throw new Error(`휴강(${cancelId})의 schedule_id를 찾을 수 없음`);

                lastId = generateEventId(lastId);
                await conn.query(
                    `
                    INSERT INTO course_event 
                        (event_id, schedule_id, event_type, event_date, classroom, parent_event_id)
                    VALUES (?, ?, 'MAKEUP', ?, ?, ?)
                    `,
                    [lastId, scheduleId, event_date, classroom, cancelId]
                );
            }

            await conn.commit();
            return { message: "보강 등록 완료" };

        } else {
            throw new Error("지원하지 않는 event_type 입니다");
        }

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 분반 등록
export async function postAssignStudents(classId, student_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const userId of student_ids) {
        await conn.query(
            `UPDATE course_student
            SET class_id = ?
            WHERE user_id = ?;`,
            [classId, userId]
        );
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 학생이 ${classId} 반에 배정되었습니다.` };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 휴보강 이력
export async function getEvents() {
    let sql = `
    SELECT vt.event_status, vt.event_date,
            vt.grade_id, vt.grade_name,
            vt.course_id, vt.course_title,
            vt.start_time, vt.end_time
    FROM v_timetable vt
    WHERE vt.event_status IS NOT NULL
    `;

    const [rows] = await pool.query(sql);
    return rows
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

// 학생 정규 상담 등록 (교시 범위 포함)
export async function postHukaStudentTimetable(student_ids, professor_id, sec_id, day_of_week, start_slot, end_slot, location) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 마지막 schedule_id 조회
        const [lastRow] = await conn.query(`
            SELECT schedule_id FROM huka_schedule ORDER BY schedule_id DESC LIMIT 1
        `);
        const lastId = lastRow.length ? lastRow[0].schedule_id : null;

        let offset = 0;

        for (const student_id of student_ids) {
            // ① 교시 범위 반복 (예: 8~10)
            for (let slot = start_slot; slot <= end_slot; slot++) {
                const newId = generateHukaScheduleId(lastId, offset++);

                await conn.query(`
                    INSERT INTO huka_schedule 
                    (schedule_id, student_id, professor_id, sec_id, schedule_type, day_of_week, time_slot_id, location)
                    VALUES (?, ?, ?, ?, 'REGULAR', ?, ?, ?)
                `, [newId, student_id, professor_id, sec_id, day_of_week, slot, location]);
            }
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 정규 상담 일정이 등록되었습니다.` };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}


// 수정(일회성) 상담 등록 (교시 범위 포함)
export async function postHukaCustomSchedule(student_ids, professor_id, sec_id, date, start_slot, end_slot, location) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 마지막 schedule_id 조회
        const [lastRow] = await conn.query(`
            SELECT schedule_id FROM huka_schedule ORDER BY schedule_id DESC LIMIT 1
        `);
        const lastId = lastRow.length ? lastRow[0].schedule_id : null;

        let offset = 0;

        for (const student_id of student_ids) {
            // ② 교시 범위 반복 (예: 8~9)
            for (let slot = start_slot; slot <= end_slot; slot++) {
                const newId = generateHukaScheduleId(lastId, offset++);

                await conn.query(`
                    INSERT INTO huka_schedule 
                    (schedule_id, student_id, professor_id, sec_id, schedule_type, date, time_slot_id, location)
                    VALUES (?, ?, ?, ?, 'CUSTOM', ?, ?, ?)
                `, [newId, student_id, professor_id, sec_id, date, slot, location]);
            }
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 상담 일정이 수정되었습니다.` };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}



















// helper 함수
// Course ID 생성
function generateCourseId(lastId) {
    if (!lastId) return "C001";
    const num = parseInt(lastId.substring(1));
    return "C" + String(num + 1).padStart(3, "0");
}
// Target ID 생성
function generateTargetId(lastId) {
    if (!lastId) return "T001";
    const num = parseInt(lastId.substring(1));
    return "T" + String(num + 1).padStart(3, "0");
}
// Schedule ID 생성
function generateScheduleId(lastId, offset = 0) {
    if (!lastId) return "SCH001";
    const num = parseInt(lastId.substring(3));
    return "SCH" + String(num + 1 + offset).padStart(3, "0");
}
// Event ID 생성
function generateEventId(lastId) {
    if (!lastId) return "E001";
    const num = parseInt(lastId.substring(1)) + 1;
    return "E" + String(num).padStart(3, "0");
}
// 상담 일정 ID 생성
export function generateHukaScheduleId(lastId, offset = 0) {
    if (!lastId) return "HK001"; // 첫 번째 일정
    const num = parseInt(lastId.substring(2)); // "HK" 제외하고 숫자만 추출
    return "HK" + String(num + 1 + offset).padStart(3, "0");
}