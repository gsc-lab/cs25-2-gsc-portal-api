SET NAMES 'utf8mb4';

-- ===== Master Data =====
INSERT INTO grade (grade_id, name) VALUES
                                       ('1','1학년'),('2','2학년'),('3','3학년');

INSERT INTO language (language_id, name) VALUES
                                             ('KR','한국어'),('JP','일본어'),('EN','영어');

INSERT INTO section (sec_id, semester, year, start_date, end_date) VALUES
    ('2025-1',1,2025,'2025-03-01','2025-06-30');

INSERT INTO time_slot (time_slot_id, start_time, end_time) VALUES
                                                               ('1','09:00:00','09:50:00'),
                                                               ('2','10:00:00','10:50:00'),
                                                               ('3','11:00:00','11:50:00'),
                                                               ('4','13:00:00','13:50:00');

INSERT INTO classroom (classroom_id, building, room_number, room_type) VALUES
                                                                           ('CR001','본관','101','CLASSROOM'),
                                                                           ('CR002','본관','102','CLASSROOM'),
                                                                           ('CR003','실습동','201','LAB'),
                                                                           ('CR004','실습동','202','LAB');

-- ===== Users =====
INSERT INTO user_account (user_id, name, email, phone, status) VALUES
                                                                   ('2423001','김성식','2423001@g.yju.ac.kr','010-1111-2222','active'),
                                                                   ('2423002','이유진','2423002@g.yju.ac.kr','010-2222-3333','active'),
                                                                   ('2524001','박민수','2524001@g.yju.ac.kr','010-3333-4444','active'),
                                                                   ('9999001','관리자','admin@g.yju.ac.kr','010-9999-9999','active'),
                                                                   ('8888001','이교수','prof1@g.yju.ac.kr','010-8888-0001','active'),
                                                                   ('8888002','박교수','prof2@g.yju.ac.kr','010-8888-0002','active'),
                                                                   ('2725001','유학생A','intl1@example.com','010-7777-0001','active');

INSERT INTO user_role (user_id, role_type) VALUES
                                               ('2423001','student'),
                                               ('2423002','student'),
                                               ('2524001','student'),
                                               ('9999001','admin'),
                                               ('8888001','professor'),
                                               ('8888002','professor'),
                                               ('2725001','student');

-- ===== Courses =====
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
                                                              ('C001','2025-1','인공지능 개론',0),
                                                              ('C002','2025-1','데이터베이스',0),
                                                              ('C003','2025-1','일본어 특강',1);

INSERT INTO course_class (class_id, course_id, name) VALUES
                                                         ('CL01','C001','인공지능A'),
                                                         ('CL02','C002','데이터베이스A'),
                                                         ('CL03','C003','일본어특강A');

INSERT INTO course_language (course_id, language_id) VALUES
                                                         ('C001','KR'),('C002','KR'),('C003','JP');

INSERT INTO course_target (target_id, course_id, grade_id, language_id, class_id) VALUES
                                                                                      ('T001','C001','2','KR','CL01'),
                                                                                      ('T002','C002','2','KR','CL02'),
                                                                                      ('T003','C003','1','JP','CL03');

INSERT INTO course_schedule (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week) VALUES
                                                                                                          ('SCH1','CR001','1','C001','2025-1','MON'),
                                                                                                          ('SCH2','CR002','2','C002','2025-1','TUE'),
                                                                                                          ('SCH3','CR003','3','C003','2025-1','FRI');

INSERT INTO course_professor (user_id, course_id, class_id) VALUES
                                                                ('8888001','C001','CL01'),
                                                                ('8888001','C002','CL02'),
                                                                ('8888002','C003','CL03');

-- course_id 컬럼과 값을 추가합니다.
INSERT INTO course_student (user_id, course_id, class_id) VALUES
                                                              ('2423001', 'C001', 'CL01'),
                                                              ('2423001', 'C002', 'CL02'),
                                                              ('2423002', 'C002', 'CL02'),
                                                              ('2524001', 'C001', 'CL01'),
                                                              ('2725001', 'C003', 'CL03');

INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) VALUES
                                                                                                    ('2423001','2','CL01','JP','korean','enrolled'),
                                                                                                    ('2423002','2','CL02','KR','korean','enrolled'),
                                                                                                    ('2524001','3','CL01','JP','korean','leave'),
                                                                                                    ('2725001','1','CL03','KR','international','dropped');

-- ===== Notice & Files & Events =====
INSERT INTO file_assets (file_id, file_name, file_url, size_type, file_type) VALUES
                                                                                 (1,'exam_schedule.pdf','/files/exam_schedule.pdf',1024,'PDF'),
                                                                                 (2,'lecture_intro.png','/files/lecture_intro.png',512,'IMG');

-- 테이블 이름을 notice로, user_id를 추가
INSERT INTO notice (user_id, title, content, is_pinned, course_id, created_at)
VALUES ('9999001', '[전체] 학사 공지', '본문...', 0, NULL, NOW());

-- user_id를 추가하고, 존재하는 course_id 'C003'으로 수정
INSERT INTO notice (user_id, title, content, is_pinned, course_id, created_at)
VALUES ('8888002', '[C003] 과제 안내', '본문...', 0, 'C003', NOW());

INSERT INTO notice_file (file_id, notice_id) VALUES
                                                 (1,1),(2,2);

INSERT INTO notice_target (notice_id, grade_id, language_id, class_id) VALUES
                                                                                      ('1','2','KR','CL01'),
                                                                                      ('2','2','KR','CL02');

INSERT INTO course_event (event_id, schedule_id, event_type, event_date) VALUES
    ('E001','SCH1','CANCEL','2025-04-15');

-- ===== Kakao & Exams & Logs =====
INSERT INTO kakao_user (user_id, kakao_id, is_verified) VALUES
    ('2423001','kakao_12345',1);

INSERT INTO student_exams (exam_id, user_id, file_id, exam_type, score) VALUES
    ('EX001','2423001',1,'JLPT',120);

INSERT INTO log_entity (log_id, user_id, action) VALUES
                                                     (1,'2423001','LOGIN'),
                                                     (2,'2423001','READ_NOTICE');

-- ===== Allowed Emails =====
INSERT INTO allowed_email (email, reason) VALUES
                                              ('external1@example.com', '산학협력 교수'),
                                              ('external2@example.com', '졸업생 멘토링'),
                                              ('testuser@example.com', '개발 테스트용');

-- ===== Reservation Mock Data =====
INSERT INTO reservation (user_id, classroom_id, reserve_date, start_time, end_time, created_at) VALUES
-- === 1주차: 10월 13일 ~ 10월 17일 ===
-- 월요일 (CR001)
('2423001', 'CR001', '2025-10-13', '09:00:00', '10:00:00', NOW()),
('2423002', 'CR001', '2025-10-13', '10:00:00', '11:00:00', NOW()),
('2524001', 'CR001', '2025-10-13', '11:00:00', '12:00:00', NOW()),
('2725001', 'CR002', '2025-10-13', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR002', '2025-10-13', '14:00:00', '15:00:00', NOW()),
('2423001', 'CR003', '2025-10-13', '15:00:00', '16:00:00', NOW()),
('2524001', 'CR003', '2025-10-13', '16:00:00', '17:00:00', NOW()),

-- 화요일 (CR001)
('2423002', 'CR001', '2025-10-14', '09:00:00', '10:00:00', NOW()),
('2524001', 'CR001', '2025-10-14', '10:00:00', '11:00:00', NOW()),
('2725001', 'CR001', '2025-10-14', '11:00:00', '12:00:00', NOW()),
('2423001', 'CR002', '2025-10-14', '13:00:00', '14:00:00', NOW()),
('2423002', 'CR002', '2025-10-14', '14:00:00', '15:00:00', NOW()),
('8888001', 'CR003', '2025-10-14', '15:00:00', '16:00:00', NOW()),
('2524001', 'CR003', '2025-10-14', '16:00:00', '17:00:00', NOW()),

-- 수요일
('2423001', 'CR001', '2025-10-15', '09:00:00', '10:00:00', NOW()),
('2423002', 'CR001', '2025-10-15', '10:00:00', '11:00:00', NOW()),
('2524001', 'CR001', '2025-10-15', '11:00:00', '12:00:00', NOW()),
('2725001', 'CR002', '2025-10-15', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-15', '14:00:00', '15:00:00', NOW()),
('2423001', 'CR003', '2025-10-15', '15:00:00', '16:00:00', NOW()),

-- 목요일
('2423002', 'CR001', '2025-10-16', '09:00:00', '10:00:00', NOW()),
('2524001', 'CR001', '2025-10-16', '10:00:00', '11:00:00', NOW()),
('2725001', 'CR002', '2025-10-16', '11:00:00', '12:00:00', NOW()),
('2423001', 'CR002', '2025-10-16', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-16', '14:00:00', '15:00:00', NOW()),
('2725001', 'CR001', '2025-10-16', '15:00:00', '16:00:00', NOW()),

-- 금요일
('8888001', 'CR001', '2025-10-17', '09:00:00', '10:00:00', NOW()),
('2524001', 'CR001', '2025-10-17', '10:00:00', '11:00:00', NOW()),
('2423002', 'CR002', '2025-10-17', '11:00:00', '12:00:00', NOW()),
('2423001', 'CR003', '2025-10-17', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-17', '14:00:00', '15:00:00', NOW()),
('2725001', 'CR001', '2025-10-17', '15:00:00', '16:00:00', NOW()),

-- === 2주차: 10월 20일 ~ 10월 24일 ===
-- 월요일
('2423001', 'CR001', '2025-10-20', '09:00:00', '10:00:00', NOW()),
('2423002', 'CR001', '2025-10-20', '10:00:00', '11:00:00', NOW()),
('2524001', 'CR002', '2025-10-20', '11:00:00', '12:00:00', NOW()),
('2725001', 'CR002', '2025-10-20', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-20', '14:00:00', '15:00:00', NOW()),

-- 화요일
('2423002', 'CR001', '2025-10-21', '09:00:00', '10:00:00', NOW()),
('2524001', 'CR001', '2025-10-21', '10:00:00', '11:00:00', NOW()),
('2725001', 'CR002', '2025-10-21', '11:00:00', '12:00:00', NOW()),
('2423001', 'CR002', '2025-10-21', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-21', '14:00:00', '15:00:00', NOW()),
('2524001', 'CR003', '2025-10-21', '15:00:00', '16:00:00', NOW()),

-- 수요일
('2423001', 'CR001', '2025-10-22', '09:00:00', '10:00:00', NOW()),
('2423002', 'CR001', '2025-10-22', '10:00:00', '11:00:00', NOW()),
('2725001', 'CR002', '2025-10-22', '11:00:00', '12:00:00', NOW()),
('8888001', 'CR003', '2025-10-22', '13:00:00', '14:00:00', NOW()),
('2524001', 'CR003', '2025-10-22', '14:00:00', '15:00:00', NOW()),

-- 목요일
('2423001', 'CR001', '2025-10-23', '09:00:00', '10:00:00', NOW()),
('2423002', 'CR001', '2025-10-23', '10:00:00', '11:00:00', NOW()),
('2725001', 'CR002', '2025-10-23', '11:00:00', '12:00:00', NOW()),
('2524001', 'CR002', '2025-10-23', '13:00:00', '14:00:00', NOW()),
('8888001', 'CR003', '2025-10-23', '14:00:00', '15:00:00', NOW()),

-- 금요일
('8888001', 'CR001', '2025-10-24', '09:00:00', '10:00:00', NOW()),
('2524001', 'CR001', '2025-10-24', '10:00:00', '11:00:00', NOW()),
('2423002', 'CR002', '2025-10-24', '11:00:00', '12:00:00', NOW()),
('2423001', 'CR002', '2025-10-24', '13:00:00', '14:00:00', NOW()),
('2725001', 'CR003', '2025-10-24', '14:00:00', '15:00:00', NOW()),
('8888001', 'CR003', '2025-10-24', '15:00:00', '16:00:00', NOW());

INSERT INTO weekend_attendance_poll VALUES 
('P001', '1', 'CR001', '2025-10-18', 'SAT', 8, FALSE, NOW()),
('P002', '2', 'CR002', '2025-10-19', 'SUN', 10, FALSE, NOW());

INSERT INTO weekend_attendance_votes (poll_id, user_id) VALUES
('P001', '2423001'),
('P001', '2423002'),
('P001', '2524001'),
('P001', '2725001');