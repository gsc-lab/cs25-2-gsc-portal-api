// notices.repository.js
import pool from '../db/connection.js';

export async function findBySpec(spec, query) {
    const { user } = spec;
    const { page = 1, size = 10 } = query;
    const offset = (page - 1) * size;

    let whereClauses = [];
    let queryParams = [];

    // 교수 로직
    if (user.role === "professor") {
        const professorConditions = [];
        // 교수 작성한 모든 공지
        professorConditions.push(`v.author_id = ?`);
        queryParams.push(user.user_id);

        // 전체 공지
        professorConditions.push(`(v.course_id IS NULL AND JSON_LENGTH(v.targets) = 0)`);

        whereClauses.push(`(${professorConditions.join(' OR ')})`);

        // 학생 로직
    } else if (user.role === "student") {
        const studentQuery = `SELECT s.grade_id, s.class_id, s.language_id,
                                     (SELECT GROUP_CONCAT(cs.course_id)
                                      FROM course_student cs
                                      WHERE cs.user_id = s.user_id) AS enrolled_courses
                              FROM student_entity s WHERE s.user_id = ?`;
        const [studentRows] = await pool.query(studentQuery, [user.user_id]);

        if (studentRows.length === 0) return [];

        const studentInfo = studentRows[0];
        const enrolledCourses = studentInfo.enrolled_courses ? studentInfo.enrolled_courses.split(',') : [];

        const studentConditions = [];

        // 수강하는 과목의 공지
        if (enrolledCourses.length > 0) {
            studentConditions.push(`v.course_id IN (?)`);
            queryParams.push(enrolledCourses);
        }

        //  아무 타겟도 없는 전체 공지
        studentConditions.push(`(v.course_id IS NULL AND (v.targets IS NULL OR JSON_LENGTH(v.targets) = 0))`);

        // 일치하는 타겟이 하나라도 있는 공지
        const studentTargetConditions = [];
        if (studentInfo.grade_id) {
            studentTargetConditions.push(`JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('grade_id', ?) AS JSON))`);
            queryParams.push(studentInfo.grade_id);
        }
        if (studentInfo.class_id) {
            studentTargetConditions.push(`JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('class_id', ?) AS JSON))`);
            queryParams.push(studentInfo.class_id);
        }
        if (studentInfo.language_id) {
            studentTargetConditions.push(`JSON_CONTAINS(v.targets, CAST(JSON_OBJECT('language_id', ?) AS JSON))`);
            queryParams.push(studentInfo.language_id);
        }

        if (studentTargetConditions.length > 0) {
            studentConditions.push(`(v.course_id IS NULL AND (${studentTargetConditions.join(' OR ')}))`);
        }

        whereClauses.push(`(${studentConditions.join(' OR ')})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT * FROM v_notice_list v ${whereSql}
        ORDER BY v.is_pinned DESC, v.created_at DESC
            LIMIT ? OFFSET ?`;

    // size와 offset 변환
    const finalParams = [...queryParams, parseInt(size, 10), parseInt(offset, 10)];
    const [rows] = await pool.query(sql, finalParams);

    return rows;
}

export async function countBySpec(spec, query) {
    // TODO(SQL): findBySpec와 동일 WHERE로 COUNT(*) 수행
    return 0; // count
}

export async function findById(noticeId) {
    // TODO(SQL): 단건 조회 (필요하면 작성자/과목 join)
    // 예: SELECT * FROM notices WHERE notice_id=? AND is_deleted=0
    return null; // row | null
}

export async function insertNotice(row) {
    // row: {title, content, type, target_audience, grade_id, level_id, group_level, subject_id, visible_from, visible_to, created_by}
    // TODO(SQL): INSERT 후 삽입된 레코드 반환
    // 예: const [r] = await pool.query('INSERT INTO notices (...) VALUES (...)', [...]);
    // return await findById(r.insertId);
    return null;
}

export async function updateNotice(noticeId, patch) {
    // patch: 바뀔 수 있는 필드만 포함
    // TODO(SQL): UPDATE ... WHERE notice_id=?; 이후 findById로 재조회
    return null;
}

export async function softDeleteNotice(noticeId) {
    // TODO(SQL): UPDATE notices SET is_deleted=1 WHERE notice_id=?
    return { notice_id: noticeId, is_deleted: 1 };
}

// (옵션) 파일 관련 — 필요 시 사용
export async function findFileById(fileId) {
    // TODO(SQL): SELECT f.*, n.* JOIN 으로 소속 notice_id 가져오기
    return null;
}

export async function attachFile(noticeId, fileMeta) {
    // fileMeta: { originalname, path, size, mimetype } 등
    // TODO(SQL): INSERT INTO notice_files (...) VALUES (...)
    return null;
}