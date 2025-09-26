
-- 변수
SET @v_course_id = 'COURSE-G1-01';
SET @v_author_id = 2;         -- 현재 로그인 user_id
SET @v_title     = '[G1] 2차 과제 안내';
SET @v_content   = '과제 마감일은 다음주 월요일입니다.';

INSERT INTO notice (course_id, title, content, created_at, user_id)
VALUES (@v_course_id, @v_title, @v_content, NOW(), @v_author_id);

SET @v_notice_id = LAST_INSERT_ID();
SELECT @v_notice_id AS notice_id;

INSERT INTO notice_target (target_id, notice_id, grade_id, level_id, language_id)
VALUES
    ('11',@v_notice_id, 'G1', 'N1', 'JP');

-- 수강생 (course_student) + 공지의 타겟과 매칭
INSERT IGNORE INTO notification_delivery_notice (notice_id, user_id)
SELECT DISTINCT n.notice_id, cs.user_id
FROM notice n
         JOIN course_student cs   ON cs.course_id = n.course_id
         JOIN student_entity se   ON se.user_id   = cs.user_id
         LEFT JOIN level_class lc ON lc.class_id  = se.class_id
         LEFT JOIN notice_target nt ON nt.notice_id = n.notice_id
WHERE n.notice_id = @v_notice_id
  AND (
    nt.notice_id IS NULL                      -- 타겟 없으면 전체
        OR ( (nt.grade_id    IS NULL OR nt.grade_id    = se.grade_id)
        AND (nt.level_id    IS NULL OR nt.level_id    = lc.level_id)
        AND (nt.language_id IS NULL OR nt.language_id = se.language_id)
        )
    );


UPDATE notification_delivery_notice
SET status = 'SENT', send_at = NOW()
WHERE notice_id = @v_notice_id
  AND status = 'QUEUED';

-- 확인(샘플 10행)
SELECT * FROM notification_delivery_notice
WHERE notice_id = @v_notice_id
ORDER BY user_id
    LIMIT 10;

SET @v_reader = 1;

UPDATE notification_delivery_notice
SET read_at = NOW()
WHERE notice_id = @v_notice_id
  AND user_id  = @v_reader
  AND read_at IS NULL;

# CREATE OR REPLACE VIEW v_notice_read_summary AS
# SELECT
               #     notice_id,
               #     COUNT(*) AS sent_cnt,
#     SUM(read_at IS NOT NULL) AS read_cnt,
#     SUM(read_at IS NULL)     AS unread_cnt
# FROM notification_delivery_notice
               # GROUP BY notice_id;
#
# SELECT * FROM v_notice_read_summary WHERE notice_id = @v_notice_id;

CREATE OR REPLACE VIEW v_notice_read_status AS
SELECT
    d.notice_id,
    d.user_id,
    ua.name AS student_name,
    d.status,
    d.read_at,
    d.send_at
FROM notification_delivery_notice d
         JOIN user_account ua ON ua.user_id = d.user_id;

SELECT * FROM v_notice_read_status
WHERE notice_id = @v_notice_id
ORDER BY read_at IS NULL, read_at;  -- 읽은 사람 먼저/나중 정렬