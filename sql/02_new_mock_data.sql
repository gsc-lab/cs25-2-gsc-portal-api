-- SET NAMES 'utf8mb4';

-- =========================================================
-- 01. Master Data (ID 규칙에 맞게 수정)
-- =========================================================
INSERT INTO grade (grade_id, name) VALUES ('1','1학년'), ('2','2학년');
INSERT INTO language (language_id, name) VALUES ('KR','한국어'), ('JP','일본어');
INSERT INTO section (sec_id, semester, year, start_date, end_date) VALUES ('2025-1', 1, 2025, '2025-03-01', '2025-06-30');

INSERT INTO time_slot (time_slot_id, start_time, end_time) VALUES
('1', '09:00:00', '09:50:00'), ('2', '10:00:00', '10:50:00'), ('3', '11:00:00', '11:50:00'),
('4', '12:00:00', '12:50:00'), ('5', '13:00:00', '13:50:00'), ('6', '14:00:00', '14:50:00'),
('7', '15:00:00', '15:50:00'), ('8', '16:00:00', '16:50:00'), ('9', '17:00:00', '17:50:00');

INSERT INTO classroom (classroom_id, building, room_number, room_type) VALUES
('CR001', '창조관', '405-1호', 'CLASSROOM'), ('CR002', '창조관', '304호', 'CLASSROOM'),
('CR003', '창조관', '405호', 'CLASSROOM'), ('CR004', '정보관', '403호', 'CLASSROOM'),
('CR005', '창조관', '413호', 'CLASSROOM');

-- =========================================================
-- 02. Users & Roles
-- =========================================================

-- Professors
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

-- Admin
INSERT INTO user_account (user_id, name, email, phone, status) VALUES ('9999001', '관리자', 'admin@g.yju.ac.kr', '010-9999-9999', 'active');
INSERT INTO user_role (user_id, role_type) VALUES ('9999001', 'admin');

-- Students
INSERT INTO user_account (user_id, name, email, phone, status) SELECT (2423000 + n), CONCAT('2학년학생', n), CONCAT('2423', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2300-', LPAD(n, 4, '0')), 'active' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_role (user_id, role_type) SELECT (2423000 + n), 'student' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_account (user_id, name, email, phone, status) SELECT (2424000 + n), CONCAT('1학년학생', n), CONCAT('2424', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2400-', LPAD(n, 4, '0')), 'active' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_role (user_id, role_type) SELECT (2424000 + n), 'student' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

-- =========================================================
-- 03. Student Details (스키마에 맞게 수정)
-- =========================================================
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2423000 + n), '2', NULL, NULL, 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2423000 + 24 + n), '2', NULL, NULL, 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2424000 + n), '1', NULL, NULL, 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2424000 + 24 + n), '1', NULL, NULL, 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;

-- Student Exams (ID 형식 및 스키마 수정)
INSERT INTO student_exams (exam_id, user_id, file_id, exam_type, score) VALUES
('EX001', '2423001', NULL, 'JLPT', 120), ('EX002', '2423002', NULL, 'JLPT', 120),
('EX003', '2423015', NULL, 'JLPT', 150), ('EX004', '2423025', NULL, 'TOPIK', 230),
('EX005', '2424001', NULL, 'JLPT', 100), ('EX006', '2424015', NULL, 'JLPT', 120),
('EX007', '2424025', NULL, 'TOPIK', 150);

-- =========================================================
-- 04. Courses, Classes, Schedules, etc. (ID 규칙 적용)
-- =========================================================

-- Regular Courses
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C001', '2025-1', '한국어문법(II)', 0), ('C002', '2025-1', '프로그래밍(II)', 0), ('C003', '2025-1', '일본어회화(II)', 0), ('C004', '2025-1', '직업윤리', 0), ('C005', '2025-1', '한국어회화(II)', 0), ('C006', '2025-1', '일본어문법(II)', 0), ('C007', '2025-1', '인공지능기초수학', 0), ('C008', '2025-1', '캡스톤디자인(I)', 0),
('C009', '2025-1', '일본어문법(IV)', 0), ('C010', '2025-1', '딥러닝이론과실습', 0), ('C011', '2025-1', '캡스톤디자인(II)', 0), ('C012', '2025-1', '일본어회화(IV)', 0), ('C013', '2025-1', '데이터구조및알고리즘(II)', 0), ('C014', '2025-1', '한국어문법(IV)', 0), ('C015', '2025-1', '한국어회화(IV)', 0);

-- Special Courses
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C016', '2025-1', '후까 회화 (1학년)', 1), ('C017', '2025-1', '코이케 특강 (2학년)', 1), ('C018', '2025-1', '후까 회화 (2학년)', 1), ('C019', '2025-1', 'N2 문법', 1), ('C020', '2025-1', 'N2 회화', 1), ('C021', '2025-1', 'N2 어휘', 1), ('C022', '2025-1', 'N2 독해', 1), ('C023', '2025-1', 'N1 회화 (다키타)', 1), ('C024', '2025-1', 'N1 특강 (황수지)', 1), ('C025', '2025-1', 'N1 회화 (코이케)', 1), ('C026', '2025-1', '초급 일본어', 1);

-- Course Classes
INSERT INTO course_class (class_id, course_id, name) VALUES
('C001A', 'C001', 'A'), ('C002A', 'C002', 'A'), ('C003A', 'C003', 'A'), ('C004A', 'C004', 'A'), ('C005A', 'C005', 'A'), ('C006A', 'C006', 'A'), ('C007A', 'C007', 'A'), ('C008A', 'C008', 'A'),
('C009A', 'C009', 'A'), ('C010A', 'C010', 'A'), ('C011A', 'C011', 'A'), ('C012A', 'C012', 'A'), ('C013A', 'C013', 'A'), ('C014A', 'C014', 'A'), ('C015A', 'C015', 'A'),
('C016A', 'C016', 'A'), ('C017A', 'C017', 'A'), ('C018A', 'C018', 'A'), ('C019A', 'C019', 'A'), ('C020A', 'C020', 'A'), ('C021A', 'C021', 'A'), ('C022A', 'C022', 'A'), ('C023A', 'C023', 'A'), ('C024A', 'C024', 'A'), ('C025A', 'C025', 'A'), ('C026A', 'C026', 'A');

-- Course Professors
INSERT INTO course_professor (user_id, course_id, class_id) VALUES
('8888001', 'C001', 'C001A'), ('8888003', 'C002', 'C002A'), ('8888005', 'C003', 'C003A'), ('8888004', 'C004', 'C004A'), ('8888006', 'C005', 'C005A'), ('8888007', 'C006', 'C006A'), ('8888008', 'C007', 'C007A'), ('8888004', 'C008', 'C008A'),
('8888002', 'C009', 'C009A'), ('8888004', 'C010', 'C010A'), ('8888004', 'C011', 'C011A'), ('8888005', 'C012', 'C012A'), ('8888004', 'C013', 'C013A'), ('8888006', 'C014', 'C014A'), ('8888001', 'C015', 'C015A'),
('8888005', 'C016', 'C016A'), ('8888002', 'C017', 'C017A'), ('8888005', 'C018', 'C018A'), ('8888007', 'C019', 'C019A'), ('8888010', 'C020', 'C020A'), ('8888007', 'C021', 'C021A'), ('8888007', 'C022', 'C022A'), ('8888009', 'C023', 'C023A'), ('8888011', 'C024', 'C024A'), ('8888002', 'C025', 'C025A'), ('8888002', 'C026', 'C026A');

-- Course Targets
INSERT INTO course_target (target_id, course_id, grade_id, language_id) VALUES
('T001', 'C001', '1', 'JP'), ('T002', 'C002', '1', 'KR'), ('T003', 'C003', '1', 'KR'), ('T004', 'C004', '1', 'KR'), ('T005', 'C005', '1', 'JP'), ('T006', 'C006', '1', 'KR'), ('T007', 'C007', '1', 'KR'), ('T008', 'C008', '1', 'KR'),
('T009', 'C009', '2', 'KR'), ('T010', 'C010', '2', 'KR'), ('T011', 'C011', '2', 'KR'), ('T012', 'C012', '2', 'KR'), ('T013', 'C013', '2', 'KR'), ('T014', 'C014', '2', 'JP'), ('T015', 'C015', '2', 'JP'),
('T016', 'C016', '1', NULL), ('T017', 'C017', '2', NULL), ('T018', 'C018', '2', NULL), ('T019', 'C019', '1', NULL), ('T020', 'C019', '2', NULL), ('T021', 'C020', '1', NULL), ('T022', 'C020', '2', NULL), ('T023', 'C021', '1', NULL), ('T024', 'C021', '2', NULL), ('T025', 'C022', '1', NULL), ('T026', 'C022', '2', NULL), ('T027', 'C023', '2', NULL), ('T028', 'C024', '2', NULL), ('T029', 'C025', '2', NULL), ('T030', 'C026', '1', NULL);

-- Course Schedules
INSERT INTO course_schedule (schedule_id, course_id, day_of_week, time_slot_id, classroom_id, sec_id) VALUES
('SCH001', 'C001', 'MON', '1', 'CR001', '2025-1'), ('SCH002', 'C001', 'MON', '2', 'CR001', '2025-1'),
('SCH003', 'C002', 'MON', '5', 'CR003', '2025-1'), ('SCH004', 'C002', 'MON', '6', 'CR003', '2025-1'), ('SCH005', 'C002', 'WED', '5', 'CR003', '2025-1'), ('SCH006', 'C002', 'WED', '6', 'CR003', '2025-1'),
('SCH007', 'C003', 'TUE', '1', 'CR003', '2025-1'), ('SCH008', 'C003', 'TUE', '2', 'CR003', '2025-1'), ('SCH009', 'C003', 'FRI', '5', 'CR003', '2025-1'),
('SCH010', 'C004', 'TUE', '3', 'CR003', '2025-1'),
('SCH011', 'C005', 'TUE', '6', 'CR001', '2025-1'), ('SCH012', 'C005', 'TUE', '7', 'CR001', '2025-1'), ('SCH013', 'C005', 'TUE', '8', 'CR001', '2025-1'),
('SCH014', 'C006', 'THU', '3', 'CR003', '2025-1'), ('SCH015', 'C006', 'THU', '4', 'CR003', '2025-1'),
('SCH016', 'C007', 'THU', '7', 'CR003', '2025-1'), ('SCH017', 'C007', 'THU', '8', 'CR003', '2025-1'),
('SCH018', 'C008', 'FRI', '1', 'CR003', '2025-1'), ('SCH019', 'C008', 'FRI', '2', 'CR003', '2025-1'), ('SCH020', 'C008', 'FRI', '3', 'CR003', '2025-1'),
('SCH021', 'C009', 'MON', '1', 'CR002', '2025-1'), ('SCH022', 'C009', 'MON', '2', 'CR002', '2025-1'),
('SCH023', 'C010', 'MON', '5', 'CR002', '2025-1'), ('SCH024', 'C010', 'MON', '6', 'CR002', '2025-1'), ('SCH025', 'C010', 'WED', '5', 'CR002', '2025-1'), ('SCH026', 'C010', 'WED', '6', 'CR002', '2025-1'),
('SCH027', 'C011', 'TUE', '1', 'CR002', '2025-1'), ('SCH028', 'C011', 'TUE', '2', 'CR002', '2025-1'), ('SCH029', 'C011', 'THU', '5', 'CR002', '2025-1'), ('SCH030', 'C011', 'THU', '6', 'CR002', '2025-1'),
('SCH031', 'C012', 'WED', '3', 'CR002', '2025-1'), ('SCH032', 'C012', 'FRI', '1', 'CR002', '2025-1'), ('SCH033', 'C012', 'FRI', '2', 'CR002', '2025-1'),
('SCH034', 'C013', 'THU', '1', 'CR002', '2025-1'), ('SCH035', 'C013', 'THU', '2', 'CR002', '2025-1'), ('SCH036', 'C013', 'FRI', '8', 'CR002', '2025-1'), ('SCH037', 'C013', 'FRI', '9', 'CR002', '2025-1'),
('SCH038', 'C014', 'THU', '8', 'CR001', '2025-1'), ('SCH039', 'C014', 'THU', '9', 'CR001', '2025-1'),
('SCH040', 'C015', 'FRI', '6', 'CR001', '2025-1'), ('SCH041', 'C015', 'FRI', '7', 'CR001', '2025-1'), ('SCH042', 'C015', 'FRI', '8', 'CR001', '2025-1');

-- =========================================================
-- 05. Notices
-- =========================================================
INSERT INTO notice (notice_id, user_id, title, content, is_pinned) VALUES ('N001', '9999001', '전체 공지사항', '전체 학생 및 교수 대상 공지입니다.', TRUE);
INSERT INTO notice (notice_id, user_id, course_id, title, content) VALUES ('N002', '8888001', 'C001', 'C001 휴강 안내', '5월 5일 어린이날 휴강입니다.');
INSERT INTO notice (notice_id, user_id, course_id, title, content) VALUES ('N003', '8888004', 'C010', 'C010 과제 안내', '과제는 5월 10일까지 제출하세요.');
INSERT INTO notice (notice_id, user_id, title, content) VALUES ('N004', '9999001', '1학년 대상 공지', '1학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES ('N004', '1');
INSERT INTO notice (notice_id, user_id, title, content) VALUES ('N005', '9999001', '2학년 대상 공지', '2학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES ('N005', '2');

-- =========================================================
-- 06. Allowed Emails
-- =========================================================
INSERT INTO allowed_email (email, reason) VALUES
('p01@g.yju.ac.kr', '강은정 교수'), ('p02@g.yju.ac.kr', '코이케 교수'),
('p03@g.yju.ac.kr', '신현호 교수'), ('p04@g.yju.ac.kr', '정영철 교수'),
('p05@g.yju.ac.kr', '후까 교수'), ('p06@g.yju.ac.kr', '김희진 교수'),
('p07@g.yju.ac.kr', '박민정 교수'), ('p08@g.yju.ac.kr', '전상표 교수'),
('p09@g.yju.ac.kr', '다키타 교수'), ('p10@g.yju.ac.kr', '고마츠다 교수'),
('p11@g.yju.ac.kr', '황수지 교수'), ('admin@g.yju.ac.kr', '관리자');

INSERT INTO allowed_email (email, reason) SELECT CONCAT('2423', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('2학년학생', n) FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO allowed_email (email, reason) SELECT CONCAT('2424', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('1학년학생', n) FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

-- =========================================================
-- 07. Student Enrollment (ID 규칙 적용)
-- =========================================================
-- 1학년 (한국인) 정규 과목
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, ct.course_id, CONCAT(ct.course_id, 'A')
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
WHERE se.grade_id = '1' AND se.is_international = 'korean' AND ct.language_id = 'KR' AND ct.course_id LIKE 'C%';

-- 1학년 (유학생) 정규 과목
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, ct.course_id, CONCAT(ct.course_id, 'A')
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
WHERE se.grade_id = '1' AND se.is_international = 'international' AND ct.language_id = 'JP' AND ct.course_id LIKE 'C%';

-- 2학년 (한국인) 정규 과목
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, ct.course_id, CONCAT(ct.course_id, 'A')
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
WHERE se.grade_id = '2' AND se.is_international = 'korean' AND ct.language_id = 'KR' AND ct.course_id LIKE 'C%';

-- 2학년 (유학생) 정규 과목
INSERT INTO course_student (user_id, course_id, class_id)
SELECT se.user_id, ct.course_id, CONCAT(ct.course_id, 'A')
FROM student_entity se
JOIN course_target ct ON ct.grade_id = se.grade_id
WHERE se.grade_id = '2' AND se.is_international = 'international' AND ct.language_id = 'JP' AND ct.course_id LIKE 'C%';

-- 특강 (성적 기반)
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C023', 'C023A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C024', 'C024A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C025', 'C025A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C019', 'C019A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C020', 'C020A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C021', 'C021A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C022', 'C022A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C026', 'C026A' FROM student_exams ex WHERE ex.score < 120;

-- =========================================================
-- 08. Other Mock Data (huka, events, reservations, etc.)
-- =========================================================

-- Huka Schedule
INSERT INTO huka_schedule (schedule_id, student_id, professor_id, sec_id, schedule_type, day_of_week, date, time_slot_id, location, created_at, updated_at) VALUES
('HK001', '2424001', '8888001', '2025-1', 'REGULAR', 'MON', NULL, '8', '실습동 301호', NOW(), NOW()),
('HK002', '2423001', '8888002', '2025-1', 'CUSTOM', NULL, '2025-10-10', '9', '본관 201호', NOW(), NOW());

-- Course Event
INSERT INTO course_event (event_id, schedule_id, event_type, event_date) VALUES
('E001','SCH001','CANCEL','2025-04-15'),
('E002','SCH007','MAKEUP','2025-05-10');

-- Reservation
INSERT INTO reservation (user_id, classroom_id, reserve_date, start_time, end_time, created_at) VALUES
('2423001', 'CR003', '2025-10-13', '10:00:00', '12:00:00', NOW()),
('2424005', 'CR001', '2025-10-14', '09:00:00', '11:00:00', NOW());

-- Weekend Poll & Votes
INSERT INTO weekend_attendance_poll (poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count, status) VALUES
('P001','2','CR001','2025-04-05','SAT',8,1);

INSERT INTO weekend_attendance_votes (poll_id, user_id) VALUES
('P001', '2423001'),
('P001', '2423002'),
('P001', '2423003');

-- Kakao User
INSERT INTO kakao_user (user_id, kakao_id, is_verified) VALUES
('2423001','kakao_12345',1),
('8888001','kakao_67890',0);