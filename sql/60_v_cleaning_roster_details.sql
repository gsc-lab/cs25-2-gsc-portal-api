CREATE OR REPLACE VIEW v_cleaning_roster_details AS
SELECT
    cr.section,
    cr.work_date,
    cr.grade_id,
    cr.classroom_id,
    CONCAT(c.building, '-', c.room_number) AS classroom_name,
    crm.user_id,
    ua.name AS member_name
FROM
    cleaning_roster cr
        JOIN
    cleaning_roster_member crm ON cr.roster_id = crm.roster_id
        JOIN
    user_account ua ON crm.user_id = ua.user_id
        JOIN
    classroom c ON cr.classroom_id = c.classroom_id
-- ✅ 아래 JOIN과 WHERE 구문 추가
        JOIN
    student_entity se ON crm.user_id = se.user_id
WHERE
    se.status = 'enrolled';