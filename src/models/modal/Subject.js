import pool from '../../db/connection.js';

// 정규 과목 조회 (학년 기준)
export async function getCoursesRegular(grade_id) {
    const [rows] = await pool.query(
        `
        SELECT 
            c.course_id, 
            c.title
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id
        WHERE ct.grade_id = ? AND c.is_special = FALSE;
        `,
        [grade_id]
    );
    return rows;
}

// 특강 과목 조회 (레벨 대신 분반 기준)
export async function getCoursesSpecial() {
    const [rows] = await pool.query(`
        SELECT 
            c.course_id,
            c.title AS course_title,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id
        JOIN course_class cc ON ct.class_id = cc.class_id
        WHERE ct.language_id = 'JP'
        ORDER BY c.course_id, cc.name;
    `);
    return rows;
}

// 한국어 과목 조회 (language_id='KR' + 반 포함)
export async function getCoursesKorean() {
    const [rows] = await pool.query(`
        SELECT 
            c.course_id,
            c.title AS course_title,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id
        JOIN course_class cc ON ct.class_id = cc.class_id
        WHERE ct.language_id = 'KR'
        ORDER BY c.course_id, cc.name;
    `);
    return rows;
}

// 전체 과목 조회
export async function getAllCourses(section_id) {
    const [rows] = await pool.query(`
        SELECT 
            c.course_id, 
            c.sec_id, 
            c.title, 
            ua.name AS professor,
            ct.grade_id AS grade_id, 
            ct.language_id AS language_id,
            cs.schedule_id,
            cs.day_of_week AS day,
            CONCAT(cr.building, '-', cr.room_number) AS room,
            ts.time_slot_id AS period,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        LEFT JOIN course_target ct ON c.course_id = ct.course_id
        LEFT JOIN course_professor cp ON c.course_id = cp.course_id
        LEFT JOIN user_account ua ON cp.user_id = ua.user_id
        LEFT JOIN course_schedule cs ON cs.course_id = c.course_id
        LEFT JOIN classroom cr ON cs.classroom_id = cr.classroom_id
        LEFT JOIN time_slot ts ON cs.time_slot_id = ts.time_slot_id
        LEFT JOIN course_class cc ON cs.class_id = cc.class_id
        WHERE c.sec_id = ?
        ORDER BY c.course_id, cs.day_of_week, ts.time_slot_id
    `, [section_id]);

    const result = {};

    for (const row of rows) {
        let target = null;
        if (row.language_id === "JP") target = "special";
        else if (row.language_id === "KR") target = "korean";
        else if (row.grade_id) target = row.grade_id;

        if (!result[row.course_id]) {
            result[row.course_id] = {
                title: row.title,
                section: row.sec_id,
                professor: row.professor,
                target,
                schedule: []
            };
        }

        const scheduleArr = result[row.course_id].schedule;

        // ▼▼▼▼▼ [핵심 버그 수정] ▼▼▼▼▼
        // schedule_id가 NULL이 아닐 때만 (유효한 시간표가 있을 때만) push 합니다.
        if (row.schedule_id) { 
            const period = row.period ? parseInt(row.period, 10) : null;
            const last = scheduleArr[scheduleArr.length - 1];

            if (
                last &&
                last.day === row.day &&
                last.room === row.room &&
                last.class_id === row.class_id &&
                last.end_period + 1 === period
            ) {
                last.end_period = period;
                last.schedule_ids.push(row.schedule_id);
            } else {
                scheduleArr.push({
                    section: row.sec_id,
                    day: row.day,
                    room: row.room,
                    class_id: row.class_id,
                    class_name: row.class_name,
                    start_period: period,
                    end_period: period,
                    schedule_ids: [row.schedule_id]
                });
            }
        }
        // ▲▲▲▲▲ [버그 수정 완료] ▲▲▲▲▲
    }

    return result;
}




// 특강 분반 조회 (level_id 없이 전체)
export async function getSpecialClasses() {
    const [rows] = await pool.query(`
        SELECT DISTINCT
            cc.class_id,
            cc.name AS class_group
        FROM course_class cc
        JOIN course_target ct ON cc.class_id = ct.class_id
        WHERE ct.language_id = 'JP'
        ORDER BY cc.name;
    `);
    return rows;
}

// 한국어 분반 조회
export async function getKoreanClasses() {
    const [rows] = await pool.query(`
        SELECT DISTINCT
            cc.class_id,
            cc.name AS class_group
        FROM course_class cc
        JOIN course_target ct ON cc.class_id = ct.class_id
        WHERE ct.language_id = 'KR'
        ORDER BY cc.name;
    `);
    return rows;
}

// 특강 스케줄 조회 (course + class 기준)
export async function getSpecialSchedule() {
    const [rows] = await pool.query(`
        SELECT DISTINCT
            c.course_id,
            CONCAT(c.title, ' ', cc.name, '반') AS course_class_label,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        JOIN course_schedule cs ON c.course_id = cs.course_id 
        JOIN course_class cc ON cc.class_id = cs.class_id
        WHERE c.is_special = TRUE
        ORDER BY c.title, cc.name;
    `);
    return rows;
}

// 특강 학생 조회
export async function getCourseStudents(class_id) {
        const [rows] = await pool.query(
        `
        SELECT 
            ua.user_id,
            ua.name,
            se.language_id,
            se.grade,
            cs.class_id
        FROM course_student cs
        JOIN user_account ua ON ua.user_id = cs.user_id
        JOIN student_entry se ON se.user_id = cs.user_id
          ORDER BY ua.name;
        `,
    );
    console.log("rows", rows);

    return {
        all_students: rows,
        assigned_students: rows.filter(s => class_id !== null &&  s.class_id == class_id),
        unassigned_students: rows.filter(s => s.class_id === null),
    };
}

// 휴강 조회
export async function getHolidays(grade_id) {
    const [rows] = await pool.query(
        `
        SELECT
        ce.event_id,
        DATE_FORMAT(ce.event_date, '%Y-%m-%d') AS event_date,
        c.title AS course_title,
        ct.grade_id,
        ts.time_slot_id AS period,
        ts.start_time,
        ts.end_time
        FROM course_event ce
        JOIN course_schedule cs ON ce.schedule_id = cs.schedule_id
        JOIN course c ON cs.course_id = c.course_id
        JOIN time_slot ts ON cs.time_slot_id = ts.time_slot_id
        LEFT JOIN course_target ct ON c.course_id = ct.course_id
        LEFT JOIN course_event me
            ON me.parent_event_id = ce.event_id
            AND me.event_type = 'MAKEUP'
        WHERE ce.event_type = 'CANCEL'
            AND ct.grade_id = ?
            AND me.event_id IS NULL
        ORDER BY ce.event_date;
        `,
        [grade_id]
    );
    return rows;
}
