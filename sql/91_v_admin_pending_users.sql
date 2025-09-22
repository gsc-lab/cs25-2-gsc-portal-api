CREATE OR REPLACE VIEW v_admin_pending_users AS
SELECT
    ua.user_id,
    ua.name,
    ua.email,
    ua.phone,
    ur.role_type,
    g.name AS grade_name,
    se.language_id,
    se.is_international
FROM user_account ua
JOIN user_role ur ON ua.user_id = ur.user_id
LEFT JOIN student_entity se ON ua.user_id = se.user_id
LEFT JOIN grade g ON se.grade_id = g.grade_id
WHERE ua.status = 'pending'
AND ur.role_type IN ('student', 'professor');
