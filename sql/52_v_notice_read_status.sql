
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