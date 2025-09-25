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
                WHEN c.is_special = TRUE THEN '특강'
                WHEN ct.language_id = 'KR' AND c.is_special = FALSE THEN '한국어'
                ELSE '정규'
            END AS type
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

