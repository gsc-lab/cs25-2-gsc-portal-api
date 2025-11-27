CREATE OR REPLACE VIEW v_notice_list AS
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
        END) COLLATE utf8mb4_general_ci AS course_type,

    -- 3. 첨부파일 개수 (별도 서브쿼리에서 계산)
    COALESCE(a.attach_count, 0) AS attach_count,

    -- 4. 작성자 정보 (JSON 객체로 변환 - 핵심 수정사항)
    JSON_OBJECT(
            'user_id', au.user_id,
            'name', au.name,
            'role', aur.role_type
    ) AS author,

    -- 5. 공지 대상 목록 (JSON 배열)
    COALESCE(t.targets, JSON_ARRAY()) AS targets,

    -- 6. 첨부파일 목록 (JSON 배열)
    COALESCE(a.attachments, JSON_ARRAY()) AS attachments,

    -- 7. 썸네일 URL (이미지 첨부파일 중 첫 번째)
    a.thumb_url

FROM
    notice n
        -- 공지 작성자 정보 JOIN
        LEFT JOIN user_account au ON n.user_id = au.user_id
        LEFT JOIN (
        -- 한 사용자가 여러 역할을 가질 경우(예: 교수 겸 관리자) 하나만 선택
        SELECT user_id, MIN(role_type) AS role_type FROM user_role GROUP BY user_id
    ) aur ON n.user_id = aur.user_id
        -- 과목 정보 JOIN
        LEFT JOIN course c ON n.course_id = c.course_id

        -- 공지 대상(targets) 정보를 집계하는 서브쿼리 JOIN
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
    ) t ON n.notice_id = t.notice_id

        -- 첨부파일(attachments) 정보를 집계하는 서브쿼리 JOIN
        LEFT JOIN (
        SELECT
            nf.notice_id,
            COUNT(fa.file_id) AS attach_count,
            JSON_ARRAYAGG(
                    JSON_OBJECT(
                            'file_id', fa.file_id,
                            'file_name', fa.file_name,
                            'file_url', CONCAT('/files/', fa.file_id, '/download'),
                            'file_type', fa.file_type
                    )
            ) AS attachments,
            MAX(CASE WHEN fa.file_type LIKE 'image/%' THEN CONCAT('/files/', fa.file_id, '/download') END) AS thumb_url
        FROM notice_file nf
                 JOIN file_assets fa ON nf.file_id = fa.file_id
        GROUP BY nf.notice_id
    ) a ON n.notice_id = a.notice_id;