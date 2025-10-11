SET NAMES 'utf8mb4';

-- =========================================================
-- Clear existing data in the correct order
-- =========================================================
DELETE FROM weekend_attendance_votes;
DELETE FROM weekend_attendance_poll;
DELETE FROM reservation;
DELETE FROM cleaning_roster_member;
DELETE FROM cleaning_roster;
DELETE FROM huka_schedule;
DELETE FROM log_entity;
DELETE FROM student_exams;
DELETE FROM kakao_user;
DELETE FROM notification_delivery_event;
DELETE FROM course_event;
DELETE FROM notification_delivery_notice;
DELETE FROM notice_target;
DELETE FROM notice_file;
DELETE FROM notice;
DELETE FROM file_assets;
DELETE FROM course_student;
DELETE FROM course_professor;
DELETE FROM course_schedule;
DELETE FROM course_target;
DELETE FROM course_language;
DELETE FROM student_entity;
DELETE FROM course_class;
DELETE FROM course;
DELETE FROM user_role;
DELETE FROM user_account;
DELETE FROM classroom;
DELETE FROM time_slot;
DELETE FROM section;
DELETE FROM language;
DELETE FROM grade;
DELETE FROM allowed_email;


-- =========================================================
-- 01. Master Data
-- =========================================================
INSERT INTO grade (grade_id, name) VALUES ('1','1학년'), ('2','2학년');
INSERT INTO language (language_id, name) VALUES ('KR','한국어'), ('JP','일본어');
INSERT INTO section (sec_id, semester, year, start_date, end_date) VALUES ('2025-1', 1, 2025, '2025-03-01', '2025-06-30');

INSERT INTO time_slot (time_slot_id, start_time, end_time) VALUES
('1', '09:00:00', '09:50:00'), ('2', '10:00:00', '10:50:00'), ('3', '11:00:00', '11:50:00'),
('4', '12:00:00', '12:50:00'), ('5', '13:00:00', '13:50:00'), ('6', '14:00:00', '14:50:00'),
('7', '15:00:00', '15:50:00'), ('8', '16:00:00', '16:50:00'), ('9', '17:00:00', '17:50:00');

INSERT INTO classroom (classroom_id, building, room_number, room_type) VALUES
('창-405-1', '창조관', '405-1호', 'CLASSROOM'), ('창-304', '창조관', '304호', 'CLASSROOM'),
('창-405', '창조관', '405호', 'CLASSROOM'), ('정보-403', '정보관', '403호', 'CLASSROOM'),
('창-413', '창조관', '413호', 'CLASSROOM');

-- =========================================================
-- 02. Users & Roles
-- =========================================================

-- Professors (user_id starts with 8888)
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
('8888001', '강은정', 'p01@g.yju.ac.kr', '010-8888-0001', 'active'),
('8888002', '코이케', 'p02@g.yju.ac.kr', '010-8888-0002', 'active'),
('8888003', '신현호', 'p03@g.yju.ac.kr', '010-8888-0003', 'active'),
('8888004', '정영철', 'p04@g.yju.ac.kr', '010-8888-0004', 'active'),
('8888005', '후까', 'p05@g.yju.ac.kr', '010-8888-0005', 'active'),
('8888006', '김희진', 'p06@g.yju.ac.kr', '010-8888-0006', 'active'),
('8888007', '박민정', 'p07@g.yju.ac.kr', '010-8888-0007', 'active'),
('8888008', '전상표', 'p08@g.yju.ac.kr', '010-8888-0008', 'active'),
('8888009', '다키타', 'p09@g.yju.ac.kr', '010-8888-0009', 'active'),
('8888010', '고마츠다', 'p10@g.yju.ac.kr', '010-8888-0010', 'active'),
('8888011', '황수지', 'p11@g.yju.ac.kr', '010-8888-0011', 'active');

INSERT INTO user_role (user_id, role_type) VALUES
('8888001', 'professor'), ('8888002', 'professor'), ('8888003', 'professor'),
('8888004', 'professor'), ('8888005', 'professor'), ('8888006', 'professor'),
('8888007', 'professor'), ('8888008', 'professor'), ('8888009', 'professor'),
('8888010', 'professor'), ('8888011', 'professor');

-- Admin (user_id starts with 9999)
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
('9999001', '관리자', 'admin@g.yju.ac.kr', '010-9999-9999', 'active');

INSERT INTO user_role (user_id, role_type) VALUES
('9999001', 'admin');

-- Students (Sophomores - 2nd year, user_id starts with 2423)
INSERT INTO user_account (user_id, name, email, phone, status)
SELECT (2423000 + n), CONCAT('2학년학생', n), CONCAT('2423', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2300-', LPAD(n, 4, '0')), 'active'
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

INSERT INTO user_role (user_id, role_type)
SELECT (2423000 + n), 'student'
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

-- Students (Freshmen - 1st year, user_id starts with 2424)
INSERT INTO user_account (user_id, name, email, phone, status)
SELECT (2424000 + n), CONCAT('1학년학생', n), CONCAT('2424', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2400-', LPAD(n, 4, '0')), 'active'
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

INSERT INTO user_role (user_id, role_type)
SELECT (2424000 + n), 'student'
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;


-- =========================================================
-- 03. Student Details
-- =========================================================
-- 2학년 (Sophomores)
INSERT INTO student_entity (user_id, grade_id, is_international, status)
SELECT (2423000 + n), '2', 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, is_international, status)
SELECT (2423000 + 24 + n), '2', 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;

-- 1학년 (Freshmen)
INSERT INTO student_entity (user_id, grade_id, is_international, status)
SELECT (2424000 + n), '1', 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, is_international, status)
SELECT (2424000 + 24 + n), '1', 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;

-- Student Language Scores
-- 2학년 (한국인)
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX2K', n), (2423000 + n), 'JLPT', 120, 'N2' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 14) as numbers;
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX2K', n+14), (2423000 + n + 14), 'JLPT', 150, 'N1' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 10) as numbers;
-- 2학년 (유학생)
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX2I', n), (2423000 + n + 24), 'TOPIK', 230, '6' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;

-- 1학년 (한국인)
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX1K', n), (2424000 + n), 'JLPT', 100, 'N3' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 14) as numbers;
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX1K', n+14), (2424000 + n + 14), 'JLPT', 120, 'N2' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 10) as numbers;
-- 1학년 (유학생)
INSERT INTO student_exams (exam_id, user_id, exam_type, score, level_code) SELECT CONCAT('EX1I', n), (2424000 + n + 24), 'TOPIK', 150, '4' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;


-- =========================================================
-- 04. Courses, Classes, Schedules, etc.
-- =========================================================

-- Regular Courses - 1st Year
INSERT INTO course (course_id, sec_id, title, is_special) VALUES ('REG-101', '2025-1', '한국어문법(II)', 0), ('REG-102', '2025-1', '프로그래밍(II)', 0), ('REG-103', '2025-1', '일본어회화(II)', 0), ('REG-104', '2025-1', '직업윤리', 0), ('REG-105', '2025-1', '한국어회화(II)', 0), ('REG-106', '2025-1', '일본어문법(II)', 0), ('REG-107', '2025-1', '인공지능기초수학', 0), ('REG-108', '2025-1', '캡스톤디자인(I)', 0);
INSERT INTO course_class (class_id, course_id, name) VALUES ('CL-REG-101', 'REG-101', 'A'), ('CL-REG-102', 'REG-102', 'A'), ('CL-REG-103', 'REG-103', 'A'), ('CL-REG-104', 'REG-104', 'A'), ('CL-REG-105', 'REG-105', 'A'), ('CL-REG-106', 'REG-106', 'A'), ('CL-REG-107', 'REG-107', 'A'), ('CL-REG-108', 'REG-108', 'A');
INSERT INTO course_professor (user_id, course_id, class_id) VALUES ('8888001', 'REG-101', 'CL-REG-101'), ('8888003', 'REG-102', 'CL-REG-102'), ('8888005', 'REG-103', 'CL-REG-103'), ('8888004', 'REG-104', 'CL-REG-104'), ('8888006', 'REG-105', 'CL-REG-105'), ('8888007', 'REG-106', 'CL-REG-106'), ('8888008', 'REG-107', 'CL-REG-107'), ('8888004', 'REG-108', 'CL-REG-108');
INSERT INTO course_target (target_id, course_id, grade_id, language_id) VALUES ('TGT-101', 'REG-101', '1', 'JP'), ('TGT-102', 'REG-102', '1', 'KR'), ('TGT-103', 'REG-103', '1', 'KR'), ('TGT-104', 'REG-104', '1', 'KR'), ('TGT-105', 'REG-105', '1', 'JP'), ('TGT-106', 'REG-106', '1', 'KR'), ('TGT-107', 'REG-107', '1', 'KR'), ('TGT-108', 'REG-108', '1', 'KR');
INSERT INTO course_schedule (schedule_id, course_id, class_id, day_of_week, time_slot_id, classroom_id, sec_id) VALUES
('SCH-101-1', 'REG-101', 'CL-REG-101', 'MON', '1', '창-405-1', '2025-1'), ('SCH-101-2', 'REG-101', 'CL-REG-101', 'MON', '2', '창-405-1', '2025-1'),
('SCH-102-1', 'REG-102', 'CL-REG-102', 'MON', '5', '창-405', '2025-1'), ('SCH-102-2', 'REG-102', 'CL-REG-102', 'MON', '6', '창-405', '2025-1'), ('SCH-102-3', 'REG-102', 'CL-REG-102', 'WED', '5', '창-405', '2025-1'), ('SCH-102-4', 'REG-102', 'CL-REG-102', 'WED', '6', '창-405', '2025-1'),
('SCH-103-1', 'REG-103', 'CL-REG-103', 'TUE', '1', '창-405', '2025-1'), ('SCH-103-2', 'REG-103', 'CL-REG-103', 'TUE', '2', '창-405', '2025-1'), ('SCH-103-3', 'REG-103', 'CL-REG-103', 'FRI', '5', '창-405', '2025-1'),
('SCH-104-1', 'REG-104', 'CL-REG-104', 'TUE', '3', '창-405', '2025-1'),
('SCH-105-1', 'REG-105', 'CL-REG-105', 'TUE', '6', '창-405-1', '2025-1'), ('SCH-105-2', 'REG-105', 'CL-REG-105', 'TUE', '7', '창-405-1', '2025-1'), ('SCH-105-3', 'REG-105', 'CL-REG-105', 'TUE', '8', '창-405-1', '2025-1'),
('SCH-106-1', 'REG-106', 'CL-REG-106', 'THU', '3', '창-405', '2025-1'), ('SCH-106-2', 'REG-106', 'CL-REG-106', 'THU', '4', '창-405', '2025-1'),
('SCH-107-1', 'REG-107', 'CL-REG-107', 'THU', '7', '창-405', '2025-1'), ('SCH-107-2', 'REG-107', 'CL-REG-107', 'THU', '8', '창-405', '2025-1'),
('SCH-108-1', 'REG-108', 'CL-REG-108', 'FRI', '1', '창-405', '2025-1'), ('SCH-108-2', 'REG-108', 'CL-REG-108', 'FRI', '2', '창-405', '2025-1'), ('SCH-108-3', 'REG-108', 'CL-REG-108', 'FRI', '3', '창-405', '2025-1');

-- Regular Courses - 2nd Year
INSERT INTO course (course_id, sec_id, title, is_special) VALUES ('REG-201', '2025-1', '일본어문법(IV)', 0), ('REG-202', '2025-1', '딥러닝이론과실습', 0), ('REG-203', '2025-1', '캡스톤디자인(II)', 0), ('REG-204', '2025-1', '일본어회화(IV)', 0), ('REG-205', '2025-1', '데이터구조및알고리즘(II)', 0), ('REG-206', '2025-1', '한국어문법(IV)', 0), ('REG-207', '2025-1', '한국어회화(IV)', 0);
INSERT INTO course_class (class_id, course_id, name) VALUES ('CL-REG-201', 'REG-201', 'A'), ('CL-REG-202', 'REG-202', 'A'), ('CL-REG-203', 'REG-203', 'A'), ('CL-REG-204', 'REG-204', 'A'), ('CL-REG-205', 'REG-205', 'A'), ('CL-REG-206', 'REG-206', 'A'), ('CL-REG-207', 'REG-207', 'A');
INSERT INTO course_professor (user_id, course_id, class_id) VALUES ('8888002', 'REG-201', 'CL-REG-201'), ('8888004', 'REG-202', 'CL-REG-202'), ('8888004', 'REG-203', 'CL-REG-203'), ('8888005', 'REG-204', 'CL-REG-204'), ('8888004', 'REG-205', 'CL-REG-205'), ('8888006', 'REG-206', 'CL-REG-206'), ('8888001', 'REG-207', 'CL-REG-207');
INSERT INTO course_target (target_id, course_id, grade_id, language_id) VALUES ('TGT-201', 'REG-201', '2', 'KR'), ('TGT-202', 'REG-202', '2', 'KR'), ('TGT-203', 'REG-203', '2', 'KR'), ('TGT-204', 'REG-204', '2', 'KR'), ('TGT-205', 'REG-205', '2', 'KR'), ('TGT-206', 'REG-206', '2', 'JP'), ('TGT-207', 'REG-207', '2', 'JP');
INSERT INTO course_schedule (schedule_id, course_id, class_id, day_of_week, time_slot_id, classroom_id, sec_id) VALUES
('SCH-201-1', 'REG-201', 'CL-REG-201', 'MON', '1', '창-304', '2025-1'), ('SCH-201-2', 'REG-201', 'CL-REG-201', 'MON', '2', '창-304', '2025-1'),
('SCH-202-1', 'REG-202', 'CL-REG-202', 'MON', '5', '창-304', '2025-1'), ('SCH-202-2', 'REG-202', 'CL-REG-202', 'MON', '6', '창-304', '2025-1'), ('SCH-202-3', 'REG-202', 'CL-REG-202', 'WED', '5', '창-304', '2025-1'), ('SCH-202-4', 'REG-202', 'CL-REG-202', 'WED', '6', '창-304', '2025-1'),
('SCH-203-1', 'REG-203', 'CL-REG-203', 'TUE', '1', '창-304', '2025-1'), ('SCH-203-2', 'REG-203', 'CL-REG-203', 'TUE', '2', '창-304', '2025-1'), ('SCH-203-3', 'REG-203', 'CL-REG-203', 'THU', '5', '창-304', '2025-1'), ('SCH-203-4', 'REG-203', 'CL-REG-203', 'THU', '6', '창-304', '2025-1'),
('SCH-204-1', 'REG-204', 'CL-REG-204', 'WED', '3', '창-304', '2025-1'), ('SCH-204-2', 'REG-204', 'CL-REG-204', 'FRI', '1', '창-304', '2025-1'), ('SCH-204-3', 'REG-204', 'CL-REG-204', 'FRI', '2', '창-304', '2025-1'),
('SCH-205-1', 'REG-205', 'CL-REG-205', 'THU', '1', '창-304', '2025-1'), ('SCH-205-2', 'REG-205', 'CL-REG-205', 'THU', '2', '창-304', '2025-1'), ('SCH-205-3', 'REG-205', 'CL-REG-205', 'FRI', '8', '창-304', '2025-1'), ('SCH-205-4', 'REG-205', 'CL-REG-205', 'FRI', '9', '창-304', '2025-1'),
('SCH-206-1', 'REG-206', 'CL-REG-206', 'THU', '8', '창-405-1', '2025-1'), ('SCH-206-2', 'REG-206', 'CL-REG-206', 'THU', '9', '창-405-1', '2025-1'),
('SCH-207-1', 'REG-207', 'CL-REG-207', 'FRI', '6', '창-405-1', '2025-1'), ('SCH-207-2', 'REG-207', 'CL-REG-207', 'FRI', '7', '창-405-1', '2025-1'), ('SCH-207-3', 'REG-207', 'CL-REG-207', 'FRI', '8', '창-405-1', '2025-1');

-- Special Courses
INSERT INTO course (course_id, sec_id, title, is_special) VALUES ('SPC-GEN-1', '2025-1', '후까 회화 (1학년)', 1), ('SPC-GEN-2', '2025-1', '코이케 특강 (2학년)', 1), ('SPC-GEN-3', '2025-1', '후까 회화 (2학년)', 1), ('SPC-N2-1', '2025-1', 'N2 문법', 1), ('SPC-N2-2', '2025-1', 'N2 회화', 1), ('SPC-N2-3', '2025-1', 'N2 어휘', 1), ('SPC-N2-4', '2025-1', 'N2 독해', 1), ('SPC-N1-1', '2025-1', 'N1 회화 (다키타)', 1), ('SPC-N1-2', '2025-1', 'N1 특강 (황수지)', 1), ('SPC-N1-3', '2025-1', 'N1 회화 (코이케)', 1), ('SPC-BEG-1', '2025-1', '초급 일본어', 1);
INSERT INTO course_class (class_id, course_id, name) VALUES ('CL-SPC-GEN-1', 'SPC-GEN-1', 'A'), ('CL-SPC-GEN-2', 'SPC-GEN-2', 'A'), ('CL-SPC-GEN-3', 'SPC-GEN-3', 'A'), ('CL-SPC-N2-1', 'SPC-N2-1', 'A'), ('CL-SPC-N2-2', 'SPC-N2-2', 'A'), ('CL-SPC-N2-3', 'SPC-N2-3', 'A'), ('CL-SPC-N2-4', 'SPC-N2-4', 'A'), ('CL-SPC-N1-1', 'SPC-N1-1', 'A'), ('CL-SPC-N1-2', 'SPC-N1-2', 'A'), ('CL-SPC-N1-3', 'SPC-N1-3', 'A'), ('CL-SPC-BEG-1', 'SPC-BEG-1', 'A');
INSERT INTO course_professor (user_id, course_id, class_id) VALUES ('8888005', 'SPC-GEN-1', 'CL-SPC-GEN-1'), ('8888002', 'SPC-GEN-2', 'CL-SPC-GEN-2'), ('8888005', 'SPC-GEN-3', 'CL-SPC-GEN-3'), ('8888007', 'SPC-N2-1', 'CL-SPC-N2-1'), ('8888010', 'SPC-N2-2', 'CL-SPC-N2-2'), ('8888007', 'SPC-N2-3', 'CL-SPC-N2-3'), ('8888007', 'SPC-N2-4', 'CL-SPC-N2-4'), ('8888009', 'SPC-N1-1', 'CL-SPC-N1-1'), ('8888011', 'SPC-N1-2', 'CL-SPC-N1-2'), ('8888002', 'SPC-N1-3', 'CL-SPC-N1-3'), ('8888002', 'SPC-BEG-1', 'CL-SPC-BEG-1');
INSERT INTO course_target (target_id, course_id, grade_id) VALUES ('TGT-S1', 'SPC-GEN-1', '1'), ('TGT-S2', 'SPC-GEN-2', '2'), ('TGT-S3', 'SPC-GEN-3', '2'), ('TGT-N2-1', 'SPC-N2-1', '1'), ('TGT-N2-2', 'SPC-N2-1', '2'), ('TGT-N2-3', 'SPC-N2-2', '1'), ('TGT-N2-4', 'SPC-N2-2', '2'), ('TGT-N2-5', 'SPC-N2-3', '1'), ('TGT-N2-6', 'SPC-N2-3', '2'), ('TGT-N2-7', 'SPC-N2-4', '1'), ('TGT-N2-8', 'SPC-N2-4', '2'), ('TGT-N1-1', 'SPC-N1-1', '2'), ('TGT-N1-2', 'SPC-N1-2', '2'), ('TGT-N1-3', 'SPC-N1-3', '2'), ('TGT-BEG-1', 'SPC-BEG-1', '1');
INSERT INTO course_schedule (schedule_id, course_id, class_id, day_of_week, time_slot_id, classroom_id, sec_id) VALUES
('SCH-S1-1', 'SPC-GEN-1', 'CL-SPC-GEN-1', 'TUE', '1', '정보-403', '2025-1'), ('SCH-S1-2', 'SPC-GEN-1', 'CL-SPC-GEN-1', 'FRI', '5', '정보-403', '2025-1'),
('SCH-S2-1', 'SPC-GEN-2', 'CL-SPC-GEN-2', 'MON', '2', '정보-403', '2025-1'), ('SCH-S2-2', 'SPC-GEN-2', 'CL-SPC-GEN-2', 'MON', '3', '정보-403', '2025-1'),
('SCH-S3-1', 'SPC-GEN-3', 'CL-SPC-GEN-3', 'WED', '2', '정보-403', '2025-1'), ('SCH-S3-2', 'SPC-GEN-3', 'CL-SPC-GEN-3', 'FRI', '2', '정보-403', '2025-1'),
('SCH-N21-1', 'SPC-N2-1', 'CL-SPC-N2-1', 'THU', '4', '정보-403', '2025-1'),
('SCH-N22-1', 'SPC-N2-2', 'CL-SPC-N2-2', 'TUE', '8', '창-413', '2025-1'), ('SCH-N22-2', 'SPC-N2-2', 'CL-SPC-N2-2', 'TUE', '9', '창-413', '2025-1'),
('SCH-N23-1', 'SPC-N2-3', 'CL-SPC-N2-3', 'TUE', '8', '창-405', '2025-1'), ('SCH-N23-2', 'SPC-N2-3', 'CL-SPC-N2-3', 'TUE', '9', '창-405', '2025-1'),
('SCH-N24-1', 'SPC-N2-4', 'CL-SPC-N2-4', 'WED', '8', '창-405', '2025-1'), ('SCH-N24-2', 'SPC-N2-4', 'CL-SPC-N2-4', 'WED', '9', '창-405', '2025-1'),
('SCH-N11-1', 'SPC-N1-1', 'CL-SPC-N1-1', 'MON', '8', '창-413', '2025-1'), ('SCH-N11-2', 'SPC-N1-1', 'CL-SPC-N1-1', 'MON', '9', '창-413', '2025-1'),
('SCH-N12-1', 'SPC-N1-2', 'CL-SPC-N1-2', 'WED', '8', '창-413', '2025-1'),
('SCH-N13-1', 'SPC-N1-3', 'CL-SPC-N1-3', 'WED', '8', '정보-403', '2025-1'), ('SCH-N13-2', 'SPC-N1-3', 'CL-SPC-N1-3', 'WED', '9', '정보-403', '2025-1'),
('SCH-BEG-1', 'SPC-BEG-1', 'CL-SPC-BEG-1', 'FRI', '8', '정보-403', '2025-1');

-- =========================================================
-- 05. Student Enrollment
-- =========================================================
-- 1st Year (Freshmen)
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, c.course_id, cc.class_id
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
JOIN course c ON c.course_id = ct.course_id
JOIN course_class cc ON c.course_id = cc.course_id
WHERE se.grade_id = '1' AND se.is_international = 'korean' AND ct.language_id = 'KR';

INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, c.course_id, cc.class_id
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
JOIN course c ON c.course_id = ct.course_id
JOIN course_class cc ON c.course_id = cc.course_id
WHERE se.grade_id = '1' AND se.is_international = 'international' AND ct.language_id = 'JP';

-- 2nd Year (Sophomores)
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, c.course_id, cc.class_id
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
JOIN course c ON c.course_id = ct.course_id
JOIN course_class cc ON c.course_id = cc.course_id
WHERE se.grade_id = '2' AND se.is_international = 'korean' AND ct.language_id = 'KR';

INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, c.course_id, cc.class_id
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
JOIN course c ON c.course_id = ct.course_id
JOIN course_class cc ON c.course_id = cc.course_id
WHERE se.grade_id = '2' AND se.is_international = 'international' AND ct.language_id = 'JP';

-- Special Lectures by Level
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N1-1', 'CL-SPC-N1-1' FROM student_exams ex WHERE ex.level_code = 'N1';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N1-2', 'CL-SPC-N1-2' FROM student_exams ex WHERE ex.level_code = 'N1';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N1-3', 'CL-SPC-N1-3' FROM student_exams ex WHERE ex.level_code = 'N1';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N2-1', 'CL-SPC-N2-1' FROM student_exams ex WHERE ex.level_code = 'N2';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N2-2', 'CL-SPC-N2-2' FROM student_exams ex WHERE ex.level_code = 'N2';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N2-3', 'CL-SPC-N2-3' FROM student_exams ex WHERE ex.level_code = 'N2';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-N2-4', 'CL-SPC-N2-4' FROM student_exams ex WHERE ex.level_code = 'N2';
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'SPC-BEG-1', 'CL-SPC-BEG-1' FROM student_exams ex WHERE ex.level_code = 'N3';


-- =========================================================
-- 06. Notices
-- =========================================================
INSERT INTO notice (user_id, title, content, is_pinned) VALUES ('9999001', '전체 공지사항', '전체 학생 및 교수 대상 공지입니다.', TRUE);
INSERT INTO notice (user_id, course_id, title, content) VALUES ('8888001', 'REG-101', 'REG-101 휴강 안내', '5월 5일 어린이날 휴강입니다.');
INSERT INTO notice (user_id, course_id, title, content) VALUES ('8888004', 'REG-202', 'REG-202 과제 안내', '과제는 5월 10일까지 제출하세요.');
INSERT INTO notice (user_id, title, content) VALUES ('9999001', '1학년 대상 공지', '1학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES (LAST_INSERT_ID(), '1');
INSERT INTO notice (user_id, title, content) VALUES ('9999001', '2학년 대상 공지', '2학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES (LAST_INSERT_ID(), '2');


-- =========================================================
-- 07. Allowed Emails
-- =========================================================
INSERT INTO allowed_email (email, reason) VALUES
('p01@g.yju.ac.kr', '강은정 교수'), ('p02@g.yju.ac.kr', '코이케 교수'),
('p03@g.yju.ac.kr', '신현호 교수'), ('p04@g.yju.ac.kr', '정영철 교수'),
('p05@g.yju.ac.kr', '후까 교수'), ('p06@g.yju.ac.kr', '김희진 교수'),
('p07@g.yju.ac.kr', '박민정 교수'), ('p08@g.yju.ac.kr', '전상표 교수'),
('p09@g.yju.ac.kr', '다키타 교수'), ('p10@g.yju.ac.kr', '고마츠다 교수'),
('p11@g.yju.ac.kr', '황수지 교수'), ('admin@g.yju.ac.kr', '관리자');

INSERT INTO allowed_email (email, reason)
SELECT CONCAT('2423', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('2학년학생', n)
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

INSERT INTO allowed_email (email, reason)
SELECT CONCAT('2424', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('1학년학생', n)
FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
