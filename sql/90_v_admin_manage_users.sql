CREATE OR REPLACE VIEW v_admin_manage_users AS
SELECT
    ua.user_id,
    ua.name,
    ua.email,
    ua.phone,
    se.grade_id,
    se.language_id,
    se.class_id,
    se.is_international,
    se.status,
    ur.role_type
FROM user_account ua
JOIN user_role ur
    ON ua.user_id = ur.user_id
LEFT JOIN student_entity se
    ON ua.user_id = se.user_id
LEFT JOIN grade g
    ON se.grade_id = g.grade_id
LEFT JOIN language lang
    ON se.language_id = lang.language_id
LEFT JOIN course_class cc
    ON se.class_id = cc.class_id
WHERE ur.role_type = 'student'
    AND ua.status = 'active';
