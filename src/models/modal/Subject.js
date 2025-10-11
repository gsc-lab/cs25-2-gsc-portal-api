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
        JOIN course_class cc ON c.course_id = cc.course_id
        WHERE c.is_special = TRUE
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
        JOIN course_class cc ON c.course_id = cc.course_id
        JOIN course_target ct ON c.course_id = ct.course_id
        WHERE ct.language_id = 'KR'
        ORDER BY c.course_id, cc.name;
    `);
    return rows;
}

// 전체 과목 조회
export async function getAllCourses() {
    const [rows] = await pool.query(`
        SELECT
            c.course_id,
            c.title,
            CASE
                WHEN ct.language_id = 'KR' THEN '한국어'
                WHEN c.is_special = TRUE THEN '특강'
                ELSE '정규'
            END AS type,
            CASE
                WHEN ct.language_id = 'KR' THEN 'korean'
                WHEN c.is_special = TRUE THEN 'special'
                WHEN ct.grade_id = '1' THEN '1'
                WHEN ct.grade_id = '2' THEN '2'
                WHEN ct.grade_id = '3' THEN '3'
                ELSE NULL
            END AS target
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id;
    `);
    return rows;
}

// 특강 분반 조회 (level_id 없이 전체)
export async function getSpecialClasses() {
    const [rows] = await pool.query(`
        SELECT 
            c.course_id,
            c.title AS course_name,
            cc.class_id,
            cc.name AS class_group
        FROM course c
        JOIN course_class cc ON c.course_id = cc.course_id
        WHERE c.is_special = 1
        ORDER BY c.course_id, cc.name;
    `);
    return rows;
}

// 한국어 분반 조회
export async function getKoreanClasses() {
    const [rows] = await pool.query(`
        SELECT 
            c.course_id,
            c.title AS course_name,
            cc.class_id,
            cc.name AS class_group
        FROM course c
        JOIN course_class cc ON c.course_id = cc.course_id
        JOIN course_target ct ON c.course_id = ct.course_id
        WHERE ct.language_id = 'KR'
        ORDER BY c.course_id, cc.name;
    `);
    return rows;
}

// 특강 스케줄 조회 (course + class 기준)
export async function getSpecialSchedule() {
    const [rows] = await pool.query(`
        SELECT
            c.course_id,
            CONCAT(c.title, ' ', cc.name, '반') AS course_class_label,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        JOIN course_class cc ON c.course_id = cc.course_id
        WHERE c.is_special = TRUE
        ORDER BY c.title, cc.name;
    `);
    return rows;
}

// 특강 학생 조회
export async function getCourseStudents(course_id) {
    const [rows] = await pool.query(
        `
        SELECT 
            ua.user_id,
            ua.name,
            ua.email,
            cs.course_id,
            cs.class_id
        FROM course_student cs
        JOIN user_account ua ON ua.user_id = cs.user_id
        WHERE cs.course_id = ?
        ORDER BY ua.name;
        `,
        [course_id]
    );

    return {
        all_students: rows,
        assigned_students: rows.filter(s => s.class_id !== null),
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
        WHERE ce.event_type = 'CANCEL'
        AND ct.grade_id = ?
        ORDER BY ce.event_date;
        `,
        [grade_id]
    );
    return rows;
}
