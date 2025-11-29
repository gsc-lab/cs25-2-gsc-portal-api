import pool from "../db/connection.js";
import { BadRequestError, InternalServerError } from "../errors/index.js"
import { formatTimetable, formatTimetableForAdmin } from "../utils/timetableFormatter.js";
import { getNationalHoliday } from "../utils/holidayService.js";

//
function addDays(baseDateStr, offset) {
    const d = new Date(baseDateStr);   // "2025-05-05"
    d.setDate(d.getDate() + offset);   // 0 → 월요일, 1 → 화요일...
    return d.toISOString().slice(0, 10);  // "YYYY-MM-DD"
}

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
    
    // 주간 공휴일 정보 만들기
    const holidayMap = {};

    const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

    for (let i = 0; i < DAYS.length; i++) {
        const dayCode = DAYS[i];
        const dateStr = addDays(weekStart, i);

        const info = await getNationalHoliday(dateStr);
        holidayMap[dayCode] = {
            isHoliday: info.isHoliday,
            name: info.name,
            date: dateStr,
        };
    }

    console.log(holidayMap);

    return formatTimetable(rows, holidayMap);
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

    // 주간 공휴일 정보 만들기
    const holidayMap = {};

    const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

    for (let i = 0; i < DAYS.length; i++) {
        const dayCode = DAYS[i];
        const dateStr = addDays(weekStart, i);

        const info = await getNationalHoliday(dateStr);
        holidayMap[dayCode] = {
            isHoliday: info.isHoliday,
            name: info.name,
            date: dateStr,
        };
    }


    return formatTimetable(rows, holidayMap);
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
            vhk.event_date,
            vhk.schedule_type

        ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI'), start_time;
    `;

    const params = [
        weekStart, weekEnd, targetDate,   // 수업
        targetDate, weekStart, weekEnd    // 상담
    ];

    const [rows] = await pool.query(sql, params);

    // 주간 공휴일 정보 만들기
    const holidayMap = {};

    const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

    for (let i = 0; i < DAYS.length; i++) {
        const dayCode = DAYS[i];
        const dateStr = addDays(weekStart, i);

        const info = await getNationalHoliday(dateStr);
        holidayMap[dayCode] = {
            isHoliday: info.isHoliday,
            name: info.name,
            date: dateStr,
        };
    }

    // 3. 수정된 formatTimetableForAdmin 함수를 호출합니다.
    const timetable =  formatTimetableForAdmin(rows, holidayMap);

    return timetable;
}

// 강의 등록
export async function postRegisterCourse(sec_id, title, professor_id, is_special, grade_id, language_id, class_id, class_name) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // (is_special 매핑 로직 삭제 - Service가 이미 번역함)

        // ... (course_id 생성은 동일) ...
        const [rows] = await conn.query("SELECT course_id FROM course ORDER BY course_id DESC LIMIT 1");
        const lastId = rows.length > 0 ? rows[0].course_id : null;
        const course_id = generateCourseId(lastId);

        // course 등록 (Service가 번역한 is_special 사용)
        await conn.query(
        `INSERT INTO course (course_id, sec_id, title, is_special)
        VALUES (?, ?, ?, ?)`,
        [course_id, sec_id, title, is_special]
        );

        // ... (교수 매핑, target_id 생성은 동일) ...
        await conn.query(`INSERT INTO course_professor (user_id, course_id) VALUES (?, ?)`, [professor_id, course_id]);
        const [rows2] = await conn.query("SELECT target_id FROM course_target ORDER BY target_id DESC LIMIT 1");
        const lastTargetId = rows2.length > 0 ? rows2[0].target_id : null;
        const target_id = generateTargetId(lastTargetId);
        
        let cls_id = null
        if (class_name && !class_id) {
            cls_id = course_id + class_name;
            const exists = await findClassById(cls_id);
            if (!exists) await insertCourseClass(cls_id, class_name);
            class_id = cls_id
        }

        // 대상 등록 (Service가 번역한 grade_id, language_id 사용)
        await conn.query(
            `INSERT INTO course_target (target_id, course_id, grade_id, language_id, class_id)
            VALUES (?, ?, ?, ?, ?)`,
            [target_id, course_id, grade_id, language_id, class_id]
        );

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
export async function putRegisterCourse(course_id, sec_id, title, professor_id, is_special, grade_id, language_id, class_id) {
    const conn = await pool.getConnection();
    const cls_id = class_id || null;
    try {
        await conn.beginTransaction();

        // ... (강의 찾기 동일) ...
        const [course_rows] = await conn.query("SELECT course_id FROM course WHERE course_id = ?", [course_id])
        if (course_rows.length === 0) {
            throw new BadRequestError("해당하는 강의를 찾을 수 없습니다");
        }
        
        // 강의 값 수정 (Service가 번역한 is_special 사용)
        await conn.query("UPDATE course SET sec_id = ?, title = ?, is_special= ? WHERE course_id = ?", [sec_id, title, is_special, course_id])
        
        // ... (교수 값 수정, target_id 찾기 동일) ...
        await conn.query(`UPDATE course_professor SET user_id = ? WHERE course_id = ?`, [professor_id, course_id]);
        const [target_rows] = await conn.query(`SELECT target_id FROM course_target WHERE course_id = ?`, [course_id])
        const target_id = target_rows[0].target_id

        // 대상 수정 (Service가 번역한 grade_id, language_id 사용)
        await conn.query(
            `UPDATE course_target SET grade_id = ?, language_id = ?, class_id = ?
            WHERE target_id = ?`,
            [grade_id, language_id, cls_id, target_id]
        );

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

// // 시간표 id 저장
export async function insertCourseClass(class_id, class_name) {
    return pool.query(
        "INSERT INTO course_class (class_id, name) VALUES (?, ?)",
        [class_id, class_name]
    );
}

// 시간표 등록
export async function registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period){
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        /*
            과목 등록시 저장한 클래스 아이디를 조회 
            -> 해당이 1개 이상
            -> 해다 클래스 아이다를 저장해놓고 course_schedule에 저장
        */
        const [classIdRaw] = await conn.query(
            `SELECT class_id FROM course_target WHERE course_id = ?`,
            [course_id]
        );
        const class_id = classIdRaw.length > 0 ? classIdRaw[0].class_id : null;
        
        
        
        
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
                (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week,class_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    newScheduleId,
                    classroom_id,
                    period,
                    course_id,
                    sec_id,
                    day_of_week,
                    class_id
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
export async function putRegisterTimetable(schedule_ids, classroom_id, start_period, end_period, day_of_week) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 삭제 해야할 요일 조회
        for (let idx = 0; idx < schedule_ids.length; idx++) {
            const [oldScheduleRows] = await conn.query(
                `SELECT day_of_week, course_id 
                    FROM course_schedule 
                    WHERE schedule_id = ? LIMIT 1`,
                [schedule_ids[idx]]
            );
            if (oldScheduleRows.length === 0) {
                throw new Error("수정할 시간표(schedule_id)를 찾을 수 없습니다.");
            }
            
            const old_day_of_week = oldScheduleRows[0].day_of_week;
            const original_course_id = oldScheduleRows[0].course_id;

            // 기존 스케줄 삭제 (같은 과목 + 같은 요일 전부 삭제)
            await conn.query(
                `DELETE FROM course_schedule WHERE course_id = ? AND day_of_week = ?`,
                [original_course_id, old_day_of_week]
            );

            // 학기(sec_id) 조회
            const [secData] = await conn.query(
                `SELECT sec_id FROM course WHERE course_id = ?`,
                [original_course_id]
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
                (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                    [
                        newScheduleId,
                        classroom_id,
                        period,
                        original_course_id,
                        sec_id,
                        day_of_week,
                    ]
                );
            }
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
export async function deleteRegisterTimetable(schedule_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        for (let idx = 0; idx < schedule_ids.length; idx++) {
            await conn.query(
                `DELETE FROM course_schedule WHERE schedule_id = ?`, [schedule_ids[idx]]
            );
        }
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

    // 휴강과 보강 교시 확인
    if (cancel_event_ids.length !== timeRows.length) {
        throw new BadRequestError("휴강 시간과 보강 시간의 교시 수가 다릅니다.")
    }

    // 보강 이벤트 생성
    for (const [index, cancel_id] of cancel_event_ids.entries()) {
        const schedule_id = eventMap.get(cancel_id);
        if (!schedule_id) throw new BadRequestError(`휴강(${cancel_id})의 schedule_id를 찾을 수 없습니다.`);

        // index에 맞게 보강 등록
        const timeslot_id = timeRows[index].time_slot_id;

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
                    parent_event_id = ?,
                    time_slot_id = ?
                WHERE event_id = ?
                `,
                [event_date, classroom, schedule_id, parent_event_id, start_period, event_id]
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
export async function postAssignStudents(class_id, student_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const userId of student_ids) {
        await conn.query(
            `UPDATE course_student
                SET class_id = ?
                WHERE user_id = ?;`,
                [class_id, userId]
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
export async function putAssignStudents(class_id, student_ids) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(`UPDATE course_student SET class_id = NULL WHERE class_id = ? `, [class_id]);

        for (const user_id of student_ids) {
            await conn.query(`UPDATE course_student SET class_id = ? WHERE user_id = ?`, [class_id, user_id])
        }

        await conn.commit();
        return { message: `${student_ids.length}명의 학생이 ${class_id} 반에 새로 배정되었습니다.` };
    } catch (err) {
        throw err;
    }
}

// 분반 삭제
export async function deleteAssignStudents(class_id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [updateResult] = await conn.query(`UPDATE course_student SET class_id = NULL WHERE class_id = ? `, [class_id])
        
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

// 교시 목록 조회
// models/timetableModel.js

export async function getGradePeriodsByDate(gradeName, date, dayCode) {
  const sql = `
    SELECT DISTINCT vt.time_slot_id AS period
    FROM v_timetable vt
    WHERE vt.grade_name = ?
      AND ? BETWEEN vt.start_date AND vt.end_date
      AND vt.day = ?
    ORDER BY vt.time_slot_id;
  `;

  console.log("[MODEL] params:", { gradeName, date, dayCode }); // ⬅ 로그

  const [rows] = await pool.query(sql, [gradeName, date, dayCode]);

  console.log("[MODEL] rows:", rows); // ⬅ 여기 꼭 찍어봐

  return rows;  // 예: [ { period: 3 } ]
}






// 후까 교수님
// 학생 리스트
export async function getHukaStudentTimetable(sec_id) {
    const [rows] = await pool.query(`
    SELECT
        hs.student_id,
        ua.name,
        se.grade_id,
        hs.schedule_type,
        hs.day_of_week,
        hs.date,
        hs.time_slot_id,
        hs.location
    FROM huka_schedule hs
    JOIN student_entity se ON hs.student_id = se.user_id
    JOIN user_account ua ON ua.user_id = se.user_id
    WHERE  se.status = 'enrolled'
        AND hs.sec_id = ?
    /* ★★★ 정렬 순서가 매우 중요합니다! ★★★ */
    ORDER BY 
        hs.student_id ASC, 
        hs.schedule_type ASC, 
        hs.day_of_week ASC, 
        hs.date ASC, 
        hs.time_slot_id ASC;
    `,[sec_id]
    );

    // --- 1단계: 학생별로 데이터를 묶고, 연속 시간을 합칩니다. ---

    const studentMap = new Map();

    for (const row of rows) {
        // 학생이 Map에 없으면, 기본 정보와 빈 'schedules' 배열을 생성
        if (!studentMap.has(row.student_id)) {
            studentMap.set(row.student_id, {
                student_id: String(row.student_id),
                name: row.name,
                grade_id: String(row.grade_id),
                schedules: [] // 이 학생의 병합된 일정이 들어갈 곳
            });
        }

        const studentData = studentMap.get(row.student_id);
        const lastSchedule = studentData.schedules.length > 0 
            ? studentData.schedules[studentData.schedules.length - 1] 
            : null;

        // "연속" 조건 확인
        if (
            lastSchedule && // 마지막 일정이 있고
            lastSchedule.schedule_type === row.schedule_type &&
            lastSchedule.day_of_week === row.day_of_week &&
            lastSchedule.date === row.date &&
            lastSchedule.location === row.location &&
            // ★ time_slot_id가 바로 다음 번호일 때
            parseInt(lastSchedule.end_time) + 1 === parseInt(row.time_slot_id)
        ) {
            // "연속"이면: end_time만 업데이트
            lastSchedule.end_time = String(row.time_slot_id);
        } else {
            // "연속"이 아니면: 새 일정 블록으로 추가
            studentData.schedules.push({
                schedule_type: row.schedule_type,
                day_of_week: row.day_of_week,
                date: row.date,
                location: row.location,
                start_time: String(row.time_slot_id),
                end_time: String(row.time_slot_id) // 시작과 끝이 같음
            });
        }
    }

    // --- 2단계: '학생 중심' 데이터를 '일정 중심' 틀로 재조립합니다. ---

    const result = {
        regular: [],
        custom: []
    };
    const finalScheduleMap = new Map(); // 최종 그룹화를 위한 Map

    // 'studentMap'에 있는 모든 학생을 순회
    for (const [student_id, student] of studentMap.entries()) {
        
        // 해당 학생의 병합된 일정들을 순회
        for (const schedule of student.schedules) {
            
            // 학생 정보 객체 생성
            const studentData = {
                student_id: student.student_id,
                name: student.name,
                grade_id: student.grade_id
            };

            // "일정"을 기준으로 고유 '틀(key)' 생성
            // 예: "REGULAR-MON-null-8-9-실습동 301호"
            const key = `${schedule.schedule_type}-${schedule.day_of_week}-${schedule.date}-${schedule.start_time}-${schedule.end_time}-${schedule.location}`;

            // 이 '틀'이 Map에 없으면 새로 생성
            if (!finalScheduleMap.has(key)) {
                finalScheduleMap.set(key, {
                    ...schedule, // { day_of_week, date, start_time, end_time, location }
                    student: []  // 학생 배열
                });
            }
            
            // '틀'에 학생 정보 추가
            finalScheduleMap.get(key).student.push(studentData);
        }
    }

    // Map에 저장된 최종 '틀'들을 'regular'와 'custom'으로 분배
    for (const [key, schedule] of finalScheduleMap.entries()) {
        if (schedule.schedule_type === 'REGULAR') {
            result.regular.push(schedule);
        } else {
            result.custom.push(schedule);
        }
    }

    return result;
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

// sec_id 조회 함수
export async function findSecIdByDate(date) {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `
            SELECT sec_id 
            FROM section 
            WHERE ? BETWEEN start_date AND end_date
            LIMIT 1
            `,
            [date]
        );
        
        return rows.length > 0 ? rows[0].sec_id : null;

    } catch (err) {
        throw err;
    } finally {
        conn.release();
    }
}


// 수정(일회성) 상담 등록 (교시 범위 포함)
export async function postHukaCustomSchedule(student_ids, professor_id, sec_id, date, start_slot, end_slot, location, day_of_week) {
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
            // 교시 범위 반복
            for (let slot = start_slot; slot <= end_slot; slot++) {
                const newId = generateHukaScheduleId(lastId, offset++);

                await conn.query(`
                    INSERT INTO huka_schedule 
                    (schedule_id, student_id, professor_id, sec_id, schedule_type, date, time_slot_id, location, day_of_week)
                    VALUES (?, ?, ?, ?, 'CUSTOM', ?, ?, ?, ?)
                `, [newId, student_id, professor_id, sec_id, date, slot, location, day_of_week]);
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