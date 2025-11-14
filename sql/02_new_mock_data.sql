-- SET NAMES 'utf8mb4';

-- =========================================================
-- 01. Master Data (ID 규칙에 맞게 수정)
-- =========================================================
-- =========================================================
-- 02. Users & Roles
-- =========================================================

-- Professors
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
('9000001', '강은정', 'p01@g.yju.ac.kr', '010-8888-0000', 'active'),
('9000002', '코이케', 'p02@g.yju.ac.kr', '010-7777-0002', 'active'),
('9000003', '신현호', 'p03@g.yju.ac.kr', '010-8888-0003', 'active'),
('9000004', '정영철', 'p04@g.yju.ac.kr', '010-8888-0004', 'active'),
('9000005', '후까', 'p05@g.yju.ac.kr', '010-8888-0005', 'active'),
('9000006', '김희진', 'p06@g.yju.ac.kr', '010-8888-0006', 'active'),
('9000007', '박민정', 'p07@g.yju.ac.kr', '010-8888-0007', 'active'),
('9000008', '전상표', 'p08@g.yju.ac.kr', '010-8888-0008', 'active'),
('9000009', '다키타', 'p09@g.yju.ac.kr', '010-8888-0009', 'active'),
('9000010', '고마츠다', 'p10@g.yju.ac.kr', '010-8888-0010', 'active'),
('9000011', '황수지', 'p11@g.yju.ac.kr', '010-8888-0011', 'active');

INSERT INTO user_role (user_id, role_type) VALUES
('9000001', 'professor'), ('9000002', 'professor'), ('9000003', 'professor'),
('9000004', 'professor'), ('9000005', 'professor'), ('9000006', 'professor'),
('9000007', 'professor'), ('9000008', 'professor'), ('9000009', 'professor'),
('9000010', 'professor'), ('9000011', 'professor');

-- Admin

-- Students
INSERT INTO user_account (user_id, name, email, phone, status) SELECT (2623000 + n), CONCAT('2학년학생', n), CONCAT('2623', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2300-', LPAD(n, 4, '0')), 'active' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_role (user_id, role_type) SELECT (2623000 + n), 'student' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_account (user_id, name, email, phone, status) SELECT (2624000 + n), CONCAT('1학년학생', n), CONCAT('2624', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('010-2400-', LPAD(n, 4, '0')), 'active' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO user_role (user_id, role_type) SELECT (2624000 + n), 'student' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

-- =========================================================
-- 03. Student Details (스키마에 맞게 수정)
-- =========================================================
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2623000 + n), '2', NULL, NULL, 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2623000 + 24 + n), '2', NULL, NULL, 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2624000 + n), '1', NULL, NULL, 'korean', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 24) as numbers;
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) SELECT (2624000 + 24 + n), '1', NULL, NULL, 'international', 'enrolled' FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 6) as numbers;

-- Student Exams (ID 형식 및 스키마 수정)
INSERT INTO student_exams (exam_id, user_id, file_id, exam_type, score) VALUES
('EX101', '2623001', NULL, 'JLPT', 120), ('EX102', '2623002', NULL, 'JLPT', 120),
('EX103', '2623015', NULL, 'JLPT', 150), ('EX104', '2623025', NULL, 'TOPIK', 230),
('EX105', '2624001', NULL, 'JLPT', 100), ('EX106', '2624015', NULL, 'JLPT', 120),
('EX107', '2624025', NULL, 'TOPIK', 150);

-- =========================================================
-- 04. Courses, Classes, Schedules, etc. (ID 규칙 적용)
-- =========================================================

-- Regular Courses
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C101', '2025-1', '한국어문법(II)', 2),('C102', '2025-1', '프로그래밍(II)', 0),
('C103', '2025-1', '일본어회화(II)', 0), ('C104', '2025-1', '직업윤리', 0),
('C105', '2025-1', '한국어회화(II)', 2), ('C106', '2025-1', '일본어문법(II)', 0),
('C107', '2025-1', '인공지능기초수학', 0), ('C108', '2025-1', '캡스톤디자인(I)', 0),
('C109', '2025-1', '일본어문법(IV)', 0), ('C110', '2025-1', '딥러닝이론과실습', 0),
('C111', '2025-1', '캡스톤디자인(II)', 0), ('C112', '2025-1', '일본어회화(IV)', 0),
('C113', '2025-1', '데이터구조및알고리즘(II)', 0), ('C114', '2025-1', '한국어문법(IV)', 2),
('C115', '2025-1', '한국어회화(IV)', 2);

-- Special Courses
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C116', '2025-1', '후까 회화 (1학년)', 1), ('C117', '2025-1', '코이케 특강 (2학년)', 1),
('C118', '2025-1', '후까 회화 (2학년)', 1), ('C119', '2025-1', 'N2 문법', 1),
('C120', '2025-1', 'N2 회화', 1), ('C121', '2025-1', 'N2 어휘', 1),
('C122', '2025-1', 'N2 독해', 1), ('C123', '2025-1', 'N1 회화 (다키타)', 1),
('C124', '2025-1', 'N1 특강 (황수지)', 1), ('C125', '2025-1', 'N1 회화 (코이케)', 1),
('C126', '2025-1', '초급 일본어', 1);

-- Course Classes
INSERT INTO course_class (class_id, course_id, name) VALUES
('C101A', 'C101', 'A'), ('C102A', 'C102', 'A'), ('C103A', 'C103', 'A'),
('C104A', 'C104', 'A'), ('C105A', 'C105', 'A'), ('C106A', 'C106', 'A'),
('C107A', 'C107', 'A'), ('C108A', 'C108', 'A'), ('C109A', 'C109', 'A'),
('C110A', 'C110', 'A'), ('C111A', 'C111', 'A'), ('C112A', 'C112', 'A'),
('C113A', 'C113', 'A'), ('C114A', 'C114', 'A'), ('C115A', 'C115', 'A'),
('C116A', 'C116', 'A'), ('C117A', 'C117', 'A'), ('C118A', 'C118', 'A'),
('C119A', 'C119', 'A'), ('C120A', 'C120', 'A'), ('C121A', 'C121', 'A'),
('C122A', 'C122', 'A'), ('C123A', 'C123', 'A'), ('C124A', 'C124', 'A'),
('C125A', 'C125', 'A'), ('C126A', 'C126', 'A');

-- Course Professors
INSERT INTO course_professor (user_id, course_id, class_id) VALUES
('8888001', 'C101', 'C101A'), ('9000003', 'C102', 'C102A'), ('9000005', 'C103', 'C103A'),
('9000004', 'C104', 'C104A'), ('9000006', 'C105', 'C105A'), ('9000007', 'C106', 'C106A'),
('9000008', 'C107', 'C107A'), ('9000004', 'C108', 'C108A'),('8888002', 'C109', 'C109A'),
('9000004', 'C110', 'C110A'), ('9000004', 'C111', 'C111A'), ('9000005', 'C112', 'C112A'),
('9000004', 'C113', 'C113A'), ('9000006', 'C114', 'C114A'),('8888001', 'C115', 'C115A'),
('9000005', 'C116', 'C116A'), ('8888002', 'C117', 'C117A'), ('9000005', 'C118', 'C118A'),
('9000007', 'C119', 'C119A'), ('9000010', 'C120', 'C120A'), ('9000007', 'C121', 'C121A'),
('9000007', 'C122', 'C122A'), ('9000009', 'C123', 'C123A'), ('9000011', 'C124', 'C124A'),
('8888002', 'C125', 'C125A'), ('8888002', 'C126', 'C126A');

-- Course Targets
INSERT INTO course_target (target_id, course_id, grade_id, language_id) VALUES
('T101', 'C101', '1', 'JP'), ('T102', 'C102', '1', 'KR'), ('T103', 'C103', '1', 'KR'),
('T104', 'C104', '1', 'KR'), ('T105', 'C105', '1', 'JP'), ('T106', 'C106', '1', 'KR'),
('T107', 'C107', '1', 'KR'), ('T108', 'C108', '1', 'KR'), ('T109', 'C109', '2', 'KR'),
('T110', 'C110', '2', 'KR'), ('T111', 'C111', '2', 'KR'), ('T112', 'C112', '2', 'KR'),
('T113', 'C113', '2', 'KR'), ('T114', 'C114', '2', 'JP'), ('T115', 'C115', '2', 'JP'),
('T116', 'C116', '1', NULL), ('T117', 'C117', '2', NULL), ('T118', 'C118', '2', NULL),
('T119', 'C119', '1', NULL), ('T120', 'C119', '2', NULL), ('T121', 'C120', '1', NULL),
('T122', 'C120', '2', NULL), ('T123', 'C121', '1', NULL), ('T124', 'C121', '2', NULL),
('T125', 'C122', '1', NULL), ('T126', 'C122', '2', NULL), ('T127', 'C123', '2', NULL),
('T128', 'C124', '2', NULL), ('T129', 'C125', '2', NULL), ('T130', 'C126', '1', NULL);

-- Course Schedules
INSERT INTO course_schedule (schedule_id, course_id, day_of_week, time_slot_id, classroom_id, sec_id) VALUES
('SCH101', 'C101', 'MON', '3', 'CR001', '2025-1'), ('SCH102', 'C101', 'MON', '2', 'CR001', '2025-1'),
('SCH103', 'C102', 'MON', '5', 'CR003', '2025-1'), ('SCH104', 'C102', 'MON', '6', 'CR003', '2025-1'),
('SCH105', 'C102', 'WED', '5', 'CR003', '2025-1'), ('SCH106', 'C102', 'WED', '6', 'CR003', '2025-1'),
('SCH107', 'C103', 'TUE', '1', 'CR003', '2025-1'), ('SCH108', 'C103', 'TUE', '2', 'CR003', '2025-1'),
('SCH109', 'C103', 'FRI', '5', 'CR003', '2025-1'), ('SCH110', 'C104', 'TUE', '3', 'CR003', '2025-1'),
('SCH111', 'C105', 'TUE', '6', 'CR001', '2025-1'), ('SCH112', 'C105', 'TUE', '7', 'CR001', '2025-1'),
('SCH113', 'C105', 'TUE', '8', 'CR001', '2025-1'), ('SCH114', 'C106', 'THU', '3', 'CR003', '2025-1'),
('SCH115', 'C106', 'THU', '4', 'CR003', '2025-1'), ('SCH116', 'C107', 'THU', '7', 'CR003', '2025-1'),
('SCH117', 'C107', 'THU', '8', 'CR003', '2025-1'), ('SCH118', 'C108', 'FRI', '1', 'CR003', '2025-1'),
('SCH119', 'C108', 'FRI', '2', 'CR003', '2025-1'), ('SCH120', 'C108', 'FRI', '3', 'CR003', '2025-1'),
('SCH121', 'C109', 'MON', '1', 'CR002', '2025-1'), ('SCH122', 'C109', 'MON', '2', 'CR002', '2025-1'),
('SCH123', 'C110', 'MON', '5', 'CR002', '2025-1'), ('SCH124', 'C110', 'MON', '6', 'CR002', '2025-1'),
('SCH125', 'C110', 'WED', '5', 'CR002', '2025-1'), ('SCH126', 'C110', 'WED', '6', 'CR002', '2025-1'),
('SCH127', 'C111', 'TUE', '1', 'CR002', '2025-1'), ('SCH128', 'C111', 'TUE', '2', 'CR002', '2025-1'),
('SCH129', 'C111', 'THU', '5', 'CR002', '2025-1'), ('SCH130', 'C111', 'THU', '6', 'CR002', '2025-1'),
('SCH131', 'C112', 'WED', '3', 'CR002', '2025-1'), ('SCH132', 'C112', 'FRI', '1', 'CR002', '2025-1'),
('SCH133', 'C112', 'FRI', '2', 'CR002', '2025-1'), ('SCH134', 'C113', 'THU', '1', 'CR002', '2025-1'),
('SCH135', 'C113', 'THU', '2', 'CR002', '2025-1'), ('SCH136', 'C113', 'FRI', '8', 'CR002', '2025-1'),
('SCH137', 'C113', 'FRI', '9', 'CR002', '2025-1'), ('SCH138', 'C114', 'THU', '8', 'CR001', '2025-1'),
('SCH139', 'C114', 'THU', '9', 'CR001', '2025-1'), ('SCH140', 'C115', 'FRI', '6', 'CR001', '2025-1'),
('SCH141', 'C115', 'FRI', '7', 'CR001', '2025-1'), ('SCH142', 'C115', 'FRI', '8', 'CR001', '2025-1');

-- =========================================================
-- 05. Notices
-- =========================================================
INSERT INTO notice (user_id, title, content, is_pinned) VALUES ( '9999001', '전체 공지사항', '전체 학생 및 교수 대상 공지입니다.', TRUE);
INSERT INTO notice (user_id, course_id, title, content) VALUES ( '8888001', 'C101', 'C101 휴강 안내', '5월 5일 어린이날 휴강입니다.');
INSERT INTO notice (user_id, course_id, title, content) VALUES ( '9000004', 'C110', 'C110 과제 안내', '과제는 5월 10일까지 제출하세요.');
INSERT INTO notice (user_id, title, content) VALUES ( '9999001', '1학년 대상 공지', '1학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES (4, '1');
INSERT INTO notice (user_id, title, content) VALUES ('9999001', '2학년 대상 공지', '2학년은 필독하세요.');
INSERT INTO notice_target (notice_id, grade_id) VALUES (5, '2');

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

INSERT INTO allowed_email (email, reason) SELECT CONCAT('2623', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('2학년학생', n) FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;
INSERT INTO allowed_email (email, reason) SELECT CONCAT('2624', LPAD(n, 3, '0'), '@g.yju.ac.kr'), CONCAT('1학년학생', n) FROM (SELECT ROW_NUMBER() OVER () AS n FROM information_schema.tables LIMIT 30) as numbers;

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
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C123', 'C123A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C124', 'C124A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C125', 'C125A' FROM student_exams ex WHERE ex.score >= 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C119', 'C119A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C120', 'C120A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C121', 'C121A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C122', 'C122A' FROM student_exams ex WHERE ex.score >= 120 AND ex.score < 150;
INSERT INTO course_student (user_id, course_id, class_id) SELECT ex.user_id, 'C126', 'C126A' FROM student_exams ex WHERE ex.score < 120;

-- =========================================================
-- 08. Other Mock Data (huka, events, reservations, etc.)
-- =========================================================

-- Huka Schedule
INSERT INTO huka_schedule (schedule_id, student_id, professor_id, sec_id, schedule_type, day_of_week, date, time_slot_id, location, created_at, updated_at) VALUES
('HK101', '2624001', '8888001', '2025-1', 'REGULAR', 'MON', NULL, '8', '실습동 301호', NOW(), NOW()),
('HK102', '2623001', '8888002', '2025-1', 'CUSTOM', NULL, '2025-10-10', '9', '본관 201호', NOW(), NOW());

-- Course Event
INSERT INTO course_event (event_id, schedule_id, event_type, event_date) VALUES
('E101','SCH101','CANCEL','2025-04-15'),
('E102','SCH107','MAKEUP','2025-05-10');

-- Reservation
INSERT INTO reservation (user_id, classroom_id, reserve_date, start_time, end_time, created_at) VALUES
('2623001', 'CR003', '2025-10-13', '10:00:00', '12:00:00', NOW()),
('2624005', 'CR001', '2025-10-14', '09:00:00', '11:00:00', NOW());

-- Weekend Poll & Votes
INSERT INTO weekend_attendance_poll (poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count, status) VALUES
('P101','2','CR001','2025-04-06','SUN',8,1);

INSERT INTO weekend_attendance_votes (poll_id, user_id) VALUES
('P101', '2623001'),
('P101', '2623002'),
('P101', '2623003');

-- Kakao User
INSERT INTO kakao_user (user_id, kakao_id, is_verified) VALUES
('2623001','kakao_12345_new',1);
