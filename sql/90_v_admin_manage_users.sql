CREATE OR REPLACE VIEW v_admin_manage_users AS
SELECT
    ua.user_id,
    ua.name,
    ua.email,
    ua.phone,
    g.name       AS grade_name,
    lang.name    AS language_name,
    l.name       AS level_name,
    lc.name      AS class_name,
    se.is_international,
    se.status
FROM user_account ua
JOIN student_entity se ON ua.user_id = se.user_id
LEFT JOIN grade g ON se.grade_id = g.grade_id
LEFT JOIN language lang ON se.language_id = lang.language_id
LEFT JOIN level_class lc ON se.class_id = lc.class_id
LEFT JOIN level l ON lc.level_id = l.level_id
JOIN user_role ur ON ua.user_id = ur.user_id
WHERE ur.role_type = 'student'
AND ua.status = 'active';
