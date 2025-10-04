import pool from '../../db/connection.js';

// 정규 과목 조회
export async function getcoursesRegular(grade) {
    
    const [rows] = await pool.query(
        `SELECT c.course_id, c.title
            FROM course c
            JOIN course_target ct ON c.course_id = ct.course_id
            WHERE ct.grade_id = ? AND c.is_special = FALSE;
        `, [grade]
    )

    return rows;
}

// 특강 과목 조회
export async function getcoursesSpecial() {
    const [rows] = await pool.query(
        `
        SELECT c.course_id, c.title, ct.level_id, l.name AS level_name,
                lc.class_id, lc.name AS class_name
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id
        JOIN level l ON ct.level_id = l.level_id
        JOIN level_class lc ON ct.level_id = lc.level_id
        WHERE c.is_special = TRUE;
        `
    )
    return rows;
}

// 한국어 과목 조회
export async function getcoursesKorean() {
    const [rows] = await pool.query(
        `
        SELECT c.course_id, c.title, ct.level_id, l.name AS level_name
        FROM course c
        JOIN course_target ct ON c.course_id = ct.course_id
        JOIN level l ON ct.level_id = l.level_id
        WHERE ct.language_id = 'KR';
        `
    )
    return rows;
}

// 전체 과목 조회
export async function getAllCourses() {
    const [rows] = await pool.query(
        `
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
        `
    )
    return rows;
}

// 레벨 목록 조회
export async function getLevels() {
    const [rows] = await pool.query(`SELECT level_id, name FROM level;`)

    return rows;
}

// 선택한 레벨의 반 목록 조회
export async function getClassesByLevel(level_id) {
    const [rows] = await pool.query(
        `
        SELECT class_id, name
        FROM level_class
        WHERE level_id = ?;
        `, [level_id]
    )
    return rows;
}

// 한국어 레벨 목록 조회
export async function getKoreanLevels() {
    const [rows] = await pool.query(
        `
        SELECT level_id, name
        FROM level
        WHERE name LIKE 'TOPIC%'
        `
    )
    return rows;
}

// 특강 스케줄 조회
export async function getSpecialSchedule() {
    const [rows] = await pool.query (
        `
        SELECT
            c.course_id,
            CONCAT(c.title, ' ', cc.name, '반') AS course_class_label,
            cc.class_id,
            cc.name AS class_name
        FROM course c
        JOIN course_class cc ON c.course_id = cc.course_id
        WHERE c.is_special = TRUE
        ORDER BY c.title, cc.name;
        `
    )
    return rows;
}


// 휴강 조회
export async function getHolidays(grade_id) {
    const [rows] = await pool.query (
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
        `, [grade_id]
    )

    return rows;
}