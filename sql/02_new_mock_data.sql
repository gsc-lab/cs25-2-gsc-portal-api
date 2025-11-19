-- =========================================================
-- GSC Portal New Mock Data (Final Version based on explicit instructions)
-- 2025-11-19
-- =========================================================
SET NAMES 'utf8mb4';

-- =========================================================
-- 01. Course Class (분반) 생성
-- 지침 1: (class_id, name, language_id)로 생성
-- =========================================================
INSERT INTO course_class (class_id, name, language_id) VALUES
('JP_A', '일본어 특강 A', 'JP'),
('JP_B', '일본어 특강 B', 'JP'),
('KR_A', '한국어 A', 'KR'),
('KR_B', '한국어 B', 'KR');

-- =========================================================
-- 02. Users & Roles
-- =========================================================
-- Professors (교수)
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
('9000001', '강은정', 'p01@g.yju.ac.kr', '010-8888-0000', 'active'),
('9000002', '코이케', 'p02@g.yju.ac.kr', '010-7777-0002', 'active'),
('9000003', '신현호', 'p03@g.yju.ac.kr', '010-8888-0003', 'active'),
('9000004', '정영철', 'p04@g.yju.ac.kr', '010-8888-0004', 'active'),
('9000005', '후까', 'p05@g.yju.ac.kr', '010-8888-0005', 'active');

INSERT INTO user_role (user_id, role_type) VALUES
('9000001', 'professor'), ('9000002', 'professor'), ('9000003', 'professor'),
('9000004', 'professor'), ('9000005', 'professor');

-- Students (학생)
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
('2623001', '이학년일', '2623001@g.yju.ac.kr', '010-2301-0001', 'active'),
('2623002', '이학년이', '2623002@g.yju.ac.kr', '010-2301-0002', 'active'),
('2624001', '일학년일', '2624001@g.yju.ac.kr', '010-2401-0001', 'active'),
('2624002', '일학년이', '2624002@g.yju.ac.kr', '010-2401-0002', 'active'),
('2624011', '일학년삼', '2624011@g.yju.ac.kr', '010-2402-0001', 'active'),
('2624012', '일학년사', '2624012@g.yju.ac.kr', '010-2402-0002', 'active');

INSERT INTO user_role (user_id, role_type) VALUES
('2623001', 'student'), ('2623002', 'student'),
('2624001', 'student'), ('2624002', 'student'),
('2624011', 'student'), ('2624012', 'student');

-- =========================================================
-- 03. Student Details (학생 상세 정보 및 분반 할당)
-- 지침 2: student_entity에 class_id를 두어 분반 구분
-- =========================================================
INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) VALUES
-- 2학년 (일본어 특강 A/B반)
('2623001', '2', 'JP_A', 'JP', 'korean', 'enrolled'),
('2623002', '2', 'JP_B', 'JP', 'korean', 'enrolled'),
-- 1학년 (일본어 특강 A/B반)
('2624001', '1', 'JP_A', 'JP', 'korean', 'enrolled'),
('2624002', '1', 'JP_B', 'JP', 'korean', 'enrolled'),
-- 1학년 (한국어 A/B반)
('2624011', '1', 'KR_A', 'KR', 'international', 'enrolled'),
('2624012', '1', 'KR_B', 'KR', 'international', 'enrolled');

-- =========================================================
-- 04. Courses & Schedules
-- =========================================================
-- Courses (과목)
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C102', '2025-1', '프로그래밍(II)', 0),
('C109', '2025-1', '일본어문법(IV)', 0),
('C110', '2025-1', '딥러닝이론과실습', 0),
('SP_JP', '2025-1', '일본어 특강', 1),
('SP_KR', '2025-1', '한국어 특강', 2);

-- Course Language (과목 언어)
INSERT INTO course_language (course_id, language_id) VALUES
('C109', 'JP'),
('SP_JP', 'JP'),
('SP_KR', 'KR');

-- Course Professors (과목 담당 교수)
INSERT INTO course_professor (user_id, course_id) VALUES
('9000003', 'C102'),
('9000002', 'C109'),
('9000004', 'C110'),
('9000005', 'SP_JP'),
('9000001', 'SP_KR');

-- Course Targets (과목 수강 대상)
INSERT INTO course_target (target_id, course_id, grade_id, language_id, class_id) VALUES
-- 정규 과목
('T101', 'C102', '1', NULL, NULL),
('T102', 'C109', '2', 'JP', NULL),
('T103', 'C110', '2', NULL, NULL),
-- 일본어 특강 (학년 및 분반별)
('T201', 'SP_JP', '1', 'JP', 'JP_A'),
('T202', 'SP_JP', '1', 'JP', 'JP_B'),
('T203', 'SP_JP', '2', 'JP', 'JP_A'),
('T204', 'SP_JP', '2', 'JP', 'JP_B'),
-- 한국어 특강 (학년 및 분반별)
('T301', 'SP_KR', '1', 'KR', 'KR_A'),
('T302', 'SP_KR', '1', 'KR', 'KR_B');

-- Course Schedules (수업 시간표)
INSERT INTO course_schedule (schedule_id, course_id, day_of_week, time_slot_id, classroom_id, sec_id, class_id) VALUES
-- 정규 과목
('SCH101', 'C102', 'MON', '5', 'CR003', '2025-1', NULL),
('SCH102', 'C109', 'MON', '1', 'CR002', '2025-1', NULL),
('SCH103', 'C110', 'MON', '6', 'CR002', '2025-1', NULL),
-- 일본어 특강 (분반)
('SCH201', 'SP_JP', 'WED', '1', 'CR004', '2025-1', 'JP_A'),
('SCH202', 'SP_JP', 'WED', '2', 'CR004', '2025-1', 'JP_B'),
-- 한국어 특강 (분반)
('SCH301', 'SP_KR', 'FRI', '3', 'CR001', '2025-1', 'KR_A'),
('SCH302', 'SP_KR', 'FRI', '4', 'CR001', '2025-1', 'KR_B');

-- =========================================================
-- 05. Student Enrollment
-- 지침 3: course_student 스키마는 (user_id, class_id)이며, class_id는 NULL로 설정
-- (참고: 이 테이블은 과목 수강신청용이 아닌 다른 용도로 추정됨)
-- =========================================================
INSERT INTO course_student (user_id, class_id) VALUES
('2623001', NULL),
('2623002', NULL),
('2624001', NULL),
('2624002', NULL),
('2624011', NULL),
('2624012', NULL);

-- =========================================================
-- 06. Allowed Emails
-- =========================================================
INSERT INTO allowed_email (email, reason) VALUES
('p01@g.yju.ac.kr', '강은정 교수'), ('p02@g.yju.ac.kr', '코이케 교수'),
('p03@g.yju.ac.kr', '신현호 교수'), ('p04@g.yju.ac.kr', '정영철 교수'),
('p05@g.yju.ac.kr', '후까 교수'),
('admin@g.yju.ac.kr', '관리자'),
('2623001@g.yju.ac.kr', '이학년일'), ('2623002@g.yju.ac.kr', '이학년이'),
('2624001@g.yju.ac.kr', '일학년일'), ('2624002@g.yju.ac.kr', '일학년이'),
('2624011@g.yju.ac.kr', '일학년삼'), ('2624012@g.yju.ac.kr', '일학년사');