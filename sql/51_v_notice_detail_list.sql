CREATE OR REPLACE VIEW v_notice_list AS
SELECT
    n.notice_id,
    n.title,
    n.content,
    n.is_pinned,
    n.created_at,
    n.course_id,
    c.title AS course_title,

    -- course_type 계산
    (CASE
         WHEN n.course_id IS NULL THEN 'general'
         WHEN c.is_special = 2 THEN 'korean'
         WHEN c.is_special = 1 THEN 'special'
         ELSE 'regular'
        END) COLLATE utf8mb4_0900_ai_ci AS course_type,

    -- 작성자 정보를 JSON_OBJECT로 묶습니다.
    JSON_OBJECT(
            'user_id', au.user_id,
            'name', au.name,
            'role', aur.role_type
    ) AS author,

    -- 집계 정보
    COALESCE(t.targets, JSON_ARRAY()) AS targets,
    COALESCE(a.attachments, JSON_ARRAY()) AS attachments,
    COALESCE(a.attach_count, 0) AS attach_count,
    a.thumb_url

FROM notice n
         LEFT JOIN user_account au ON au.user_id = n.user_id
         LEFT JOIN (
    SELECT user_id, MIN(role_type) AS role_type FROM user_role GROUP BY user_id
) aur ON aur.user_id = au.user_id
         LEFT JOIN course c ON c.course_id = n.course_id

/* 타겟 집계 */
         LEFT JOIN (
    SELECT nt.notice_id,
           JSON_ARRAYAGG(
                   JSON_OBJECT(
                           'grade_id', nt.grade_id,
                           'language_id', nt.language_id,
                           'class_id', nt.class_id
                   )
           ) AS targets
    FROM notice_target nt
    GROUP BY nt.notice_id
) t ON t.notice_id = n.notice_id

/* 첨부파일 집계 */
         LEFT JOIN (
    SELECT
        nf.notice_id,
        COUNT(f.file_id) as attach_count,
        MAX(CASE WHEN f.file_type LIKE 'image/%' THEN CONCAT('/files/', f.file_id, '/download') END) AS thumb_url,
        JSON_ARRAYAGG(
                JSON_OBJECT(
                        'file_id', f.file_id,
                        'file_name', f.file_name,
                        'file_url', CONCAT('/files/', f.file_id, '/download'),
                        'file_type', f.file_type
                )
        ) AS attachments
    FROM notice_file nf
             JOIN file_assets f ON f.file_id = nf.file_id
    GROUP BY nf.notice_id
) a ON a.notice_id = n.notice_id;