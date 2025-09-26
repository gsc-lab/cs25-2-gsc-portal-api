CREATE OR REPLACE VIEW v_notice_details AS
SELECT
    n.notice_id,
    n.title,
    n.content,
    n.is_pinned,
    n.created_at,
    n.course_id,
    c.title AS course_title,

    -- [최종 수정] 작성자 정보를 JSON 객체로 그룹화하고, user_role 테이블에서 역할을 정확하게 가져옵니다.
    JSON_OBJECT(
            'user_id', u.user_id,
            'name', u.name,
            'role', aur.role_type
    ) AS author,

    -- 첨부파일 개수와 목록
    COALESCE(a.file_count, 0) AS attach_count,
    COALESCE(a.attachments, JSON_ARRAY()) AS attachments,

    -- 타겟 목록
    COALESCE(t.targets, JSON_ARRAY()) AS targets

FROM notice n
         LEFT JOIN course c ON n.course_id = c.course_id
         LEFT JOIN user_account u ON n.user_id = u.user_id

         LEFT JOIN (
    SELECT user_id, MIN(role_type) AS role_type
    FROM user_role
    GROUP BY user_id
) aur ON aur.user_id = u.user_id

-- 첨부파일 집계 서브쿼리
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

-- 타겟 집계 서브쿼리
         LEFT JOIN (
    SELECT
        nt.notice_id,
        JSON_ARRAYAGG(
                JSON_OBJECT(
                        'grade_id', nt.grade_id,
                        'level_id', nt.level_id,
                        'language_id', nt.language_id,
                        'class_id', nt.class_id
                )
        ) AS targets
    FROM notice_target nt
    GROUP BY nt.notice_id
) t ON t.notice_id = n.notice_id;