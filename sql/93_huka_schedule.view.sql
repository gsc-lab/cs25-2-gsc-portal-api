CREATE OR REPLACE VIEW v_huka_timetable AS
SELECT 
    hs.schedule_id,
    hs.sec_id,
    hs.professor_id,
    hs.student_id,
    ua.name AS student_name,
    hs.schedule_type,
    COALESCE(hs.day_of_week, DAYNAME(hs.date)) AS day,
    ts.start_time,
    ts.end_time,
    hs.time_slot_id,
    hs.location,
    hs.date AS event_date,
    NULL AS event_status,
    'COUNSELING' AS source_type
FROM huka_schedule hs
JOIN user_account ua ON ua.user_id = hs.student_id
JOIN time_slot ts     ON ts.time_slot_id = hs.time_slot_id;