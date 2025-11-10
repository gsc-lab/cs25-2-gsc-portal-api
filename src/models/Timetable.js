import pool from "../db/connection.js";
import { BadRequestError, InternalServerError } from "../errors/index.js"
import { formatTimetable, formatTimetableForAdmin } from "../utils/timetableFormatter.js";

// 시간표 조회 (학생, 교수, 관리자)
export async function getStudentTimetable(user_id, targetDate, weekStart, weekEnd) {
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
            COALESCE(vt.event_status, 'NORMAL') AS event_status,
            vt.event_date,
            'CLASS' AS source_type
        FROM v_timetable vt
        JOIN student_entity se 
            ON se.user_id = ?
            AND se.status = 'enrolled'
        LEFT JOIN time_slot ts 
            ON COALESCE(vt.event_time_slot_id, vt.time_slot_id) = ts.time_slot_id
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
            AND vt.parent_event_id IS NULL


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
export async function getProfessorTimetable(user_id, targetDate, weekStart, weekEnd) {

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
        LEFT JOIN time_slot ts ON vt.time_slot_id = ts.time_slot_id
        WHERE vt.professor_id = ?
        AND (
        vt.event_date IS NULL
        OR (vt.event_date BETWEEN ? AND ?)
        )
        AND ? BETWEEN vt.start_date AND vt.end_date

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
export async function getAdminTimetable(targetDate, weekStart, weekEnd) {
    const sql = `
        -- =========================================================
        -- 1. 수업 (CLASS)
        -- =========================================================
        SELECT 
            g.name AS grade_name,
            cs.day_of_week AS day_of_week,
            ts.start_time,
            ts.end_time,
            ts.time_slot_id AS period,
            c.course_id,
            c.title AS course_title,
            ua.name AS professor_name,
            CONCAT(cr.building, '-', cr.room_number) AS location,
            c.is_special,
            ct.language_id,
            ce.event_type AS event_status,
            ce.event_date,
            'CLASS' AS source_type,

            -- ▼▼▼ 2. (추가) 상담 부분과 컬럼 맞추기 위한 NULL ▼▼▼
            NULL AS student_list,
            NULL AS student_count
            -- ▲▲▲▲▲

        FROM course_schedule cs
        JOIN course c           ON cs.course_id   = c.course_id
        JOIN section sec        ON cs.sec_id      = sec.sec_id
        JOIN course_professor cp ON c.course_id    = cp.course_id
        JOIN user_account ua     ON cp.user_id     = ua.user_id
        JOIN time_slot ts       ON cs.time_slot_id= ts.time_slot_id
        JOIN classroom cr       ON cs.classroom_id= cr.classroom_id
        LEFT JOIN course_target ct ON c.course_id    = ct.course_id
        LEFT JOIN grade g          ON ct.grade_id    = g.grade_id
        LEFT JOIN course_event ce 
            ON cs.schedule_id = ce.schedule_id 
            AND (ce.event_date BETWEEN ? AND ?)
            AND ce.parent_event_id IS NULL
        WHERE ? BETWEEN sec.start_date AND sec.end_date

        UNION ALL

        -- =========================================================
        -- 2. 상담 (COUNSELING)
        -- =========================================================
        SELECT 
            NULL AS grade_name,
            vhk.day AS day_of_week,
            ts.start_time,
            ts.end_time,
            ts.time_slot_id AS period,
            NULL AS course_id,

            -- ▼▼▼ 1. (수정) title은 '상담'으로 고정 ▼▼▼
            '상담' AS course_title,
            -- ▲▲▲▲▲

            up.name AS professor_name,
            vhk.location AS location,
            NULL AS is_special,
            NULL AS language_id,
            NULL AS event_status,
            vhk.event_date,
            'COUNSELING' AS source_type,

            -- ▼▼▼ 2. (추가) 학생 목록과 인원수를 별도 변수로 분리 ▼▼▼
            GROUP_CONCAT(ua.name SEPARATOR ', ') AS student_list,
            COUNT(ua.user_id) AS student_count
            -- ▲▲▲▲▲

        FROM v_huka_timetable vhk
        JOIN time_slot ts
            ON vhk.time_slot_id = ts.time_slot_id
        JOIN user_account ua ON ua.user_id = vhk.student_id
        JOIN user_account up ON up.user_id = vhk.professor_id
        JOIN section sec ON vhk.sec_id = sec.sec_id
        WHERE (
            (vhk.schedule_type = 'REGULAR' AND ? BETWEEN sec.start_date AND sec.end_date)
            OR
            (vhk.schedule_type = 'CUSTOM' AND vhk.event_date BETWEEN ? AND ?)
        )
        GROUP BY
            vhk.day,
            ts.time_slot_id,
            ts.start_time,
            ts.end_time,
            up.name,
            vhk.location,
            vhk.event_date

        ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI'), start_time;
    `;

    const params = [
        weekStart, weekEnd, targetDate,   // 수업
        targetDate, weekStart, weekEnd    // 상담
    ];

    const [rows] = await pool.query(sql, params);

    // 3. 수정된 formatTimetableForAdmin 함수를 호출합니다.
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

// 강의 수정
export async function putRegisterCourse(course_id, sec_id, title, professor_id, target) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // is_special 매핑
        let is_special = 0;
        if (target.category === "special") is_special = 1;
        else if (target.category === "korean") is_special = 2;

        // 강의 찾기
        const [course_rows] = await conn.query("SELECT course_id FROM course WHERE course_id = ?", [course_id])
        if (course_rows.length === 0) {
            throw new BadRequestError("해당하는 강의를 찾을 수 없습니다");
        }
        
        // 강의 값 수정
        await conn.query("UPDATE course SET sec_id = ?, title = ?, is_special= ? WHERE course_id = ?", [sec_id, title, is_special, course_id])
        
        // 교수 값 수정
        await conn.query(`UPDATE course_professor SET user_id = ? WHERE course_id = ?`, [professor_id, course_id]);

        // target_id 찾기
        const [target_rows] = await conn.query(`SELECT target_id FROM course_target WHERE course_id = ?`, [course_id])
        const target_id = target_rows[0].target_id

        // 대상 수정
        if (target.category === "regular") {
        await conn.query(
            `UPDATE course_target SET grade_id = ?, language_id = ?
            WHERE target_id = ?`,
            [target.grade_id, "KR", target_id]
        );
        } else if (target.category === "korean") {
        await conn.query(
            `UPDATE course_target SET level_id = ?, language_id = ?
            WHERE target_id = ?`,
            [target.level_id || null, "KR", target_id]
        );
        } else if (target.category === "special") {
        await conn.query(
            `UPDATE course_target SET level_id = ?, language_id = ?
            WHERE target_id = ?`,
            [target.level_id || null, "JP", target_id]
            );
        }

        await conn.commit()
        return { course_id, target_id };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 강의 삭제
export async function deleteRegisterCourse(course_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 강의 찾기
        const [course_rows] = await conn.query("SELECT course_id FROM course WHERE course_id = ?", [course_id])
        if (course_rows.length === 0) {
            throw new BadRequestError("해당하는 강의를 찾을 수 없습니다");
        }
        
        // 대상 삭제
        await conn.query(`DELETE FROM course_target WHERE course_id = ?`, [course_id])

        // 교수 값 삭제
        await conn.query(`DELETE FROM course_professor WHERE course_id = ?`, [course_id]);

        // 스케줄 삭제
        await conn.query(`DELETE FROM course_schedule WHERE course_id = ?`, [course_id])

        // 강의 삭제
        const [result] = await conn.query(`DELETE FROM course WHERE course_id = ?`, [course_id]);

        if (result.affectedRows === 0) {
            throw new BadRequestError("삭제할 강의가 존재하지 않습니다.");
        }

        await conn.commit()
        return { course_id };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}



// 시간표 id 찾기
export async function findClassById(class_id) {
    const [rows] = await pool.query("SELECT 1 FROM course_class WHERE class_id = ?", [class_id]);
    return rows.length > 0;
}

// 시간표 id 저장
export async function insertCourseClass(class_id, course_id, class_name) {
    return pool.query(
        "INSERT INTO course_class (class_id, course_id, name) VALUES (?, ?, ?)",
        [class_id, course_id, class_name]
    );
}

// 시간표 등록
export async function registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period, class_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 학기(sec_id) 조회
        const [secData] = await conn.query(
            `SELECT sec_id FROM course WHERE course_id = ?`,
            [course_id]
        );
        if (secData.length === 0) throw new Error("해당 과목을 찾을 수 없습니다.");
        const sec_id = secData[0].sec_id;

        // 마지막 schedule_id 조회
        const [lastRow] = await conn.query(`
            SELECT schedule_id
            FROM course_schedule
            ORDER BY CAST(SUBSTRING(schedule_id, 4) AS UNSIGNED) DESC
            LIMIT 1
        `);
        const lastId = lastRow.length > 0 ? lastRow[0].schedule_id : null;

        // 교시 범위 등록
        for (let i = 0; i <= end_period - start_period; i++) {
            const period = start_period + i;
            const newScheduleId = generateScheduleId(lastId, i);

            await conn.query(
                `
                INSERT INTO course_schedule
                (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week, class_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    newScheduleId,
                    classroom_id,
                    period,
                    course_id,
                    sec_id,
                    day_of_week,
                    class_id || null, // 정규 과목이면 null
                ]
            );
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


// 시간표 수정
export async function putRegisterTimetable(schedule_id, classroom_id, start_period, end_period, course_id, day_of_week, class_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 기존 스케줄 삭제 (같은 과목 + 같은 요일 전부 삭제)
        await conn.query(
            `DELETE FROM course_schedule WHERE course_id = ? AND day_of_week = ?`,
            [course_id, day_of_week]
        );

        // 학기(sec_id) 조회
        const [secData] = await conn.query(
            `SELECT sec_id FROM course WHERE course_id = ?`,
            [course_id]
        );
        if (secData.length === 0) throw new Error("해당 과목을 찾을 수 없습니다.");
        const sec_id = secData[0].sec_id;

        // 마지막 schedule_id 조회
        const [lastRow] = await conn.query(`
            SELECT schedule_id
            FROM course_schedule
            ORDER BY CAST(SUBSTRING(schedule_id, 4) AS UNSIGNED) DESC
            LIMIT 1
        `);
        const lastId = lastRow.length > 0 ? lastRow[0].schedule_id : null;

        // 교시 범위 재등록
        for (let i = 0; i <= end_period - start_period; i++) {
            const period = start_period + i;
            const newScheduleId = generateScheduleId(lastId, i);

            await conn.query(
                `
                INSERT INTO course_schedule
                (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week, class_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    newScheduleId,
                    classroom_id,
                    period,
                    course_id,
                    sec_id,
                    day_of_week,
                    class_id || null,
                ]
            );
        }

        await conn.commit();
        return { message: "시간표 수정 완료" };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 시간표 삭제
export async function deleteRegisterTimetable(course_id, day_of_week) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `DELETE FROM course_schedule WHERE course_id = ? AND day_of_week = ?`, [course_id, day_of_week]
        );

        await conn.commit();
        return { message: "시간표 삭제 완료" };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}


// 휴보강 등록
export async function postRegisterHoliday(event_type, event_date, start_period, end_period, course_id = null, cancel_event_ids = [], classroom) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [lastRow] = await conn.query(
        "SELECT event_id FROM course_event ORDER BY event_id DESC LIMIT 1"
        );
        let lastId = lastRow.length > 0 ? lastRow[0].event_id : null;

        if (event_type === "CANCEL") {
        await handleCancelEvent(conn, { course_id, start_period, end_period, event_date, classroom, lastId });
        await conn.commit();
        return { message: "휴강 등록 완료" };
        }

        if (event_type === "MAKEUP") {
        await handleMakeupEvent(conn, { cancel_event_ids, event_date, start_period, end_period, classroom, lastId });
        await conn.commit();
        return { message: "보강 등록 완료" };
        }

        throw new BadRequestError("지원하지 않는 event_type 입니다");
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 휴강 처리
async function handleCancelEvent(conn, { course_id, start_period, end_period, event_date, classroom, lastId }) {
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

    if (rows.length === 0) throw new BadRequestError("휴강 대상 수업 슬롯을 찾을 수 없습니다.");

    for (const row of rows) {
        lastId = generateEventId(lastId);
        await conn.query(
        `
        INSERT INTO course_event (event_id, schedule_id, event_type, event_date, classroom)
        VALUES (?, ?, 'CANCEL', ?, ?)
        `,
        [lastId, row.schedule_id, event_date, classroom]
        );
    }
}

// 보강 처리
async function handleMakeupEvent(conn, { cancel_event_ids, event_date, start_period, end_period, classroom, lastId }) {
    if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
        throw new BadRequestError("보강 등록 시 최소 1개 이상의 휴강 event_id가 필요합니다.");
    }

    // 휴강 event 찾기
    const placeholders = cancel_event_ids.map(() => "?").join(",");
    const [rows] = await conn.query(
        `
        SELECT event_id, schedule_id
        FROM course_event
        WHERE event_id IN (${placeholders}) AND event_type = 'CANCEL'
        `,
        cancel_event_ids
    );

    // 없을 경우
    if (rows.length === 0) throw new BadRequestError("대상 휴강 이벤트를 찾을 수 없습니다.");

    const eventMap = new Map(rows.map((r) => [r.event_id, r.schedule_id]));

    // 보강 교시용 time_slot
    const [timeRows] = await conn.query(
        `
        SELECT time_slot_id
        FROM time_slot
        WHERE CAST(time_slot_id AS UNSIGNED) BETWEEN ? AND ?
        `,
        [start_period, end_period]
    );

    if (timeRows.length === 0) {
        throw new BadRequestError("보강 교시(time_slot)를 찾을 수 없습니다.");
    }

    const timeslot_id = timeRows[0].time_slot_id;

    // 보강 이벤트 생성
    for (const cancel_id of cancel_event_ids) {
        const schedule_id = eventMap.get(cancel_id);
        if (!schedule_id) throw new BadRequestError(`휴강(${cancel_id})의 schedule_id를 찾을 수 없습니다.`);

        lastId = generateEventId(lastId);
        await conn.query(
        `
        INSERT INTO course_event 
            (event_id, schedule_id, event_type, event_date, classroom, parent_event_id, time_slot_id)
        VALUES (?, ?, 'MAKEUP', ?, ?, ?, ?)
        `,
        [lastId, schedule_id, event_date, classroom, cancel_id, timeslot_id]
        );
    }
}

// 휴보강 수정
export async function putRegisterHoliday(event_id, event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existingEvent] = await conn.query(
            "SELECT event_id FROM course_event WHERE event_id = ?",
            [event_id]
        );

        if (existingEvent.length === 0) {
            throw new BadRequestError("수정할 이벤트를 찾을 수 없습니다.");
        }

        if (event_type === "CANCEL") {
            const [scheduleRows] = await conn.query(
                `
                SELECT cs.schedule_id
                FROM course_schedule cs
                WHERE cs.course_id = ? AND cs.time_slot_id = ?
                `,
                [course_id, start_period]
            );

            if (scheduleRows.length === 0) {
                throw new BadRequestError("수업 슬롯(schedule_id)을 찾을 수 없습니다.");
            }
            const schedule_id = scheduleRows[0].schedule_id;

            await conn.query(
                `
                UPDATE course_event
                SET 
                    event_type = 'CANCEL',
                    event_date = ?,
                    classroom = ?,
                    schedule_id = ?,
                    parent_event_id = NULL
                WHERE event_id = ?
                `,
                [event_date, classroom, schedule_id, event_id]
            );

        } else if (event_type === "MAKEUP") {
            const parent_event_id = cancel_event_ids[0];

            const [parentRows] = await conn.query(
                `
                SELECT schedule_id 
                FROM course_event 
                WHERE event_id = ? AND event_type = 'CANCEL'
                `,
                [parent_event_id]
            );

            if (parentRows.length === 0) {
                throw new BadRequestError("휴강 이벤트를 찾을 수 없습니다.");
            }
            const schedule_id = parentRows[0].schedule_id;

            await conn.query(
                `
                UPDATE course_event
                SET 
                    event_type = 'MAKEUP',
                    event_date = ?,
                    classroom = ?,
                    schedule_id = ?,
                    parent_event_id = ?
                WHERE event_id = ?
                `,
                [event_date, classroom, schedule_id, parent_event_id, event_id]
            );
        } else {
            throw new BadRequestError("지원하지 않는 event_type 입니다.");
        }

        await conn.commit();      
        return { message: "휴보강 수정 완료"};

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 휴보강 삭제
export async function deleteRegisterHoliday(event_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 삭제할 이벤트의 타입을 먼저 확인합니다.
        const [existingEventRows] = await conn.query(
            "SELECT event_id, event_type FROM course_event WHERE event_id = ?",
            [event_id]
        );

        if (existingEventRows.length === 0) {
            throw new BadRequestError("삭제할 이벤트를 찾을 수 없습니다.");
        }

        const event_type = existingEventRows[0].event_type;


        if (event_type === "CANCEL") {
            const [childEventRows] = await conn.query(
                // 자식 이벤트가 있는지 확인
                "SELECT 1 FROM course_event WHERE parent_event_id = ? LIMIT 1",
                [event_id]
            );

            if (childEventRows.length > 0) {
                throw new BadRequestError("이 휴강에 연결된 보강 이벤트가 있습니다. 보강 이벤트를 먼저 삭제해 주세요.");
            }
        }

        const [deleteResult] = await conn.query(
            "DELETE FROM course_event WHERE event_id = ?",
            [event_id]
        );

        if (deleteResult.affectedRows === 0) {
            throw new BadRequestError("이벤트 삭제에 실패했습니다.");
        }

        await conn.commit();
        
        return { message: "휴보강 삭제 완료" };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}


// 분반 등록
export async function postAssignStudents(class_id, course_id, student_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const userId of student_ids) {
        await conn.query(
            `UPDATE course_student
            SET class_id = ?
            WHERE user_id = ? AND course_id = ?;`,
            [class_id, userId, course_id]
        );
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 학생이 ${class_id} 반에 배정되었습니다.` };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// 분반 수정
export async function putAssignStudents(class_id, course_id, student_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(`UPDATE course_student SET class_id = NULL WHERE class_id = ? AND course_id = ?`, [class_id, course_id]);

        for (const user_id of student_ids) {
            await conn.query(`UPDATE course_student SET class_id = ? WHERE user_id = ? AND course_id = ?`, [class_id, user_id, course_id])
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 학생이 ${class_id} 반에 새로 배정되었습니다.` };
    } catch (err) {
        throw err;
    }
}

// 분반 삭제
export async function deleteAssignStudents(class_id, course_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [updateResult] = await conn.query(`UPDATE course_student SET class_id = NULL WHERE class_id = ? AND course_id = ?`, [class_id, course_id])
        
        await conn.commit();
        return { message: `${class_id} 반에 배정된 ${updateResult.affectedRows}명의 학생이 미배정 처리되었습니다.` };
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}

// 휴보강 이력
export async function getEvents() {
    const [rows] = await pool.query(`
        SELECT
            cancel.event_id AS cancel_event_id,
            cancel.event_status AS cancel_status,
            cancel.event_date AS cancel_date,
            cancel.grade_id, cancel.grade_name,
            cancel.course_id, cancel.course_title,
            cancel.class_id,
            cancel.class_name,
            cancel.time_slot_id AS cancel_period,
            makeup.event_id AS makeup_event_id,
            makeup.event_status AS makeup_status,
            makeup.event_date AS makeup_date,
            makeup.time_slot_id AS makeup_period
        FROM v_timetable cancel
        LEFT JOIN v_timetable makeup
            ON makeup.parent_event_id = cancel.event_id
        WHERE cancel.event_status = 'CANCEL'
    `);
    
    const groups = new Map();
    
    for (const r of rows) {
        const key = `${r.cancel_status}-${r.course_id}-${r.cancel_date}`;

        if (!groups.has(key)) {
            groups.set(key, {
                cancel: {
                    event_id: [],
                    event_status: r.cancel_status,
                    event_date: r.cancel_date,
                    grade_id: r.grade_id,
                    grade_name: r.grade_name,
                    course_id: r.course_id,
                    course_title: r.course_title,
                    class_id: r.class_id,
                    class_name: r.class_name,
                    periods: [],
                },
                makeups: new Map(), 
            });
        }
        
        const group = groups.get(key);

        const cancelPeriodNum = Number(r.cancel_period);
        group.cancel.event_id.push(r.cancel_event_id);
        group.cancel.periods.push(cancelPeriodNum);

        if (r.makeup_status) {
            const makeupDate = r.makeup_date;
            
            if (!group.makeups.has(makeupDate)) {
                group.makeups.set(makeupDate, {
                    event_id: [],
                    event_status: r.makeup_status,
                    event_date: makeupDate,
                    grade_id: r.grade_id,
                    grade_name: r.grade_name,
                    course_id: r.course_id,
                    course_title: r.course_title,
                    class_id: r.class_id, 
                    class_name: r.class_name,
                    periods: [],
                });
            }
            
            const makeup_group_for_date = group.makeups.get(makeupDate);
            const makeupPeriodNum = Number(r.makeup_period);
            
            makeup_group_for_date.event_id.push(r.makeup_event_id);
            makeup_group_for_date.periods.push(makeupPeriodNum);
        }
    }
    
    const compress = (periods) => {
        const validPeriods = periods.filter(p => !isNaN(p) && p !== null);
        if (validPeriods.length === 0) {
            return { start_period: null, end_period: null };
        }
        validPeriods.sort((a, b) => a - b);
        const start = validPeriods[0];
        const end = validPeriods[validPeriods.length - 1];
        return { start_period: start, end_period: end };
    };
    
    const result = [];

    for (const [k, evt] of groups.entries()) {
        const cancelRange = compress(evt.cancel.periods);
        
        const makeup_array = [];
        for (const [makeupDate, makeup_evt] of evt.makeups.entries()) {
            const makeupRange = compress(makeup_evt.periods);
            makeup_array.push({
                ...makeup_evt,
                ...makeupRange
            });
        }

        result.push({
            cancel: {
                ...evt.cancel,
                ...cancelRange,
            },
            makeup: makeup_array.length > 0 ? makeup_array : null, 
        });
    }
    return result
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