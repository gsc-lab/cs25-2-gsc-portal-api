CREATE OR REPLACE VIEW v_notice_details AS
SELECT
    -- 1. 기본 공지 정보
    n.notice_id,
    n.title,
    n.content,
    n.is_pinned,
    n.created_at,
    n.course_id,
    c.title AS course_title,

    -- 2. Course Type 계산
    (CASE
         WHEN n.course_id IS NULL THEN 'general'
         WHEN c.is_special = 2 THEN 'korean'
         WHEN c.is_special = 1 THEN 'special'
         ELSE 'regular'
        END) AS course_type,

    -- 3. 작성자 정보
    JSON_OBJECT(
            'user_id', u.user_id,
            'name', u.name,
            'role', aur.role_type
    ) AS author,

    -- 4. 첨부파일 정보
    COALESCE(a.file_count, 0) AS attach_count,
    COALESCE(a.attachments, JSON_ARRAY()) AS attachments,

    -- 5. 공지 대상 정보
    COALESCE(t.targets, JSON_ARRAY()) AS targets
FROM
    notice n
        LEFT JOIN course c ON n.course_id = c.course_id
        LEFT JOIN user_account u ON n.user_id = u.user_id
        LEFT JOIN (
            SELECT user_id, MIN(role_type) AS role_type
            FROM user_role
            GROUP BY user_id
        ) aur ON aur.user_id = u.user_id
        LEFT JOIN (
            SELECT
                nf.notice_id,
                COUNT(f.file_id) as file_count,
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
        ) a ON a.notice_id = n.notice_id
        LEFT JOIN (
            SELECT
                nt.notice_id,
                JSON_ARRAYAGG(
                        JSON_OBJECT(
                                'grade_id', nt.grade_id,
                                'language_id', nt.language_id,
                                'class_id', nt.class_id
                        )
                ) AS targets
            FROM notice_target nt
            GROUP BY nt.notice_id
        ) t ON t.notice_id = n.notice_id;