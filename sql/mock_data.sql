SET NAMES 'utf8mb4';

-- ===== Master Data =====
INSERT INTO grade (grade_id, name) VALUES
('1','1학년'),('2','2학년'),('3','3학년');

INSERT INTO level (level_id, name) VALUES
('1','JLPT N1'),('2','JLPT N2'),('3','JLPT N3'),('4','TOPIK 4급'),('5','TOPIK 6급');

INSERT INTO level_class (class_id, level_id, name) VALUES
('1','1','A'),('2','1','B'),('3','2','A'),('4','2','B'),('5','3','A');

INSERT INTO language (language_id, name) VALUES
('KR','한국어'),('JP','일본어'),('EN','영어');

INSERT INTO section (sec_id, semester, year, start_date, end_date) VALUES
('2025-1',1,2025,'2025-03-01','2025-06-30');

INSERT INTO time_slot (time_slot_id, start_time, end_time) VALUES
('1','09:00:00','09:50:00'),
('2','10:00:00','10:50:00'),
('3','11:00:00','11:50:00'),
('4','13:00:00','13:50:00'),
('5','14:00:00','14:50:00'),
('6','15:00:00','15:50:00'),
('7','16:00:00','16:50:00'),
('8','17:00:00','17:50:00'),
('9','18:00:00','18:50:00'),
('10','19:00:00','19:50:00'),
('11','20:00:00','20:50:00');


INSERT INTO classroom (classroom_id, building, room_number, room_type) VALUES
('101','본관','101','CLASSROOM'),
('102','본관','102','CLASSROOM'),
('201','실습동','201','LAB'),
('202','실습동','202','LAB');

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

INSERT INTO student_entity (user_id, grade_id, class_id, language_id, is_international, status) VALUES
('2423001','2','3','JP','korean','enrolled'),
('2423002','2','4','KR','korean','enrolled'),
('2524001','3','5','JP','korean','leave'),
('2725001','1','1','KR','international','dropped');


-- ===== Courses =====
INSERT INTO course (course_id, sec_id, title, is_special) VALUES
('C001','2025-1','인공지능 개론',0),
('C002','2025-1','데이터베이스',0),
('C003','2025-1','일본어 특강',1),
('C004','2025-1','한국어 집중반',1);

INSERT INTO course_language (course_id, language_id) VALUES
('C001','KR'),('C002','KR'),('C003','JP'),('C004','KR');

INSERT INTO course_target (target_id, course_id, grade_id, level_id, language_id) VALUES
('T001','C001','2',NULL,'KR'),
('T002','C002','2',NULL,'KR'),
('T003','C003','1','1','JP'),
('T004','C004','1','5','KR');

INSERT INTO course_schedule (schedule_id, classroom_id, time_slot_id, course_id, sec_id, day_of_week) VALUES
('SCH1','101','1','C001','2025-1','MON'),
('SCH2','101','2','C001','2025-1','WED'),
('SCH3','102','3','C002','2025-1','TUE'),
('SCH4','201','4','C003','2025-1','FRI'),
('SCH5','202','5','C004','2025-1','THU');

INSERT INTO course_professor (user_id, course_id) VALUES
('8888001','C001'),
('8888001','C002'),
('8888002','C003'),
('8888002','C004');

INSERT INTO course_student (user_id, course_id) VALUES
('2423001','C001'),
('2423001','C002'),
('2423002','C002'),
('2524001','C001'),
('2725001','C003'),
('2725001','C004');

-- ===== Notice & Files & Events =====
INSERT INTO file_assets (file_id, file_name, file_url, size_type, file_type) VALUES
('F001','exam_schedule.pdf','/files/exam_schedule.pdf',1024,'PDF'),
('F002','lecture_intro.png','/files/lecture_intro.png',512,'IMG'),
('F003','notice_event.pdf','/files/notice_event.pdf',2048,'PDF');

INSERT INTO notice (notice_id, user_id, course_id, title, content, created_at) VALUES
(1,'8888001','C001','중간고사 안내','인공지능 개론 중간고사는 4월 15일입니다.',NOW()),
(2,'8888001','C002','과제 제출 안내','데이터베이스 과제는 5월 1일까지 제출하세요.',NOW()),
(3,'9999001',NULL,'학과 행사 안내','글로벌 시스템 융합과 MT는 4월 5일입니다.',NOW());

INSERT INTO notice_file (file_id, notice_id) VALUES 
('F001',1),('F002',2),('F003',3);

INSERT INTO notice_target (target_id, notice_id, grade_id, level_id, language_id) VALUES
('NT001',1,'2',NULL,'KR'),
('NT002',2,'2',NULL,'KR'),
('NT003',3,NULL,NULL,'KR');

INSERT INTO course_event (event_id, schedule_id, event_type, event_date) VALUES
('E001','SCH1','CANCEL','2025-04-15'),
('E002','SCH3','MAKEUP','2025-05-10');

-- ===== Reservations & Polls & Cleaning =====
INSERT INTO reservation (reservation_id, user_id, classroom_id, title, start_at, end_at, status) VALUES
(1,'2423001','201','AI 프로젝트 회의','2025-04-01 10:00:00','2025-04-01 12:00:00','ACTIVE'),
(2,'2725001','101','스터디 모임','2025-04-03 09:00:00','2025-04-03 11:00:00','CANCELLED');

INSERT INTO weekend_attendance_poll (poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count, status) VALUES
('P001','2','101','2025-04-05','SAT',8,1),
('P002','1','201','2025-04-12','SUN',6,0);

INSERT INTO weekend_attendance_votes (votes_id, user_id, poll_id, will_join) VALUES
(1,'2423001','P001',1),
(2,'2725001','P001',0),
(3,'2423002','P002',1);

INSERT INTO cleaning_assignment (assignment_id, grade_id, classroom_id, work_date, team_size, members_json, status, created_at) VALUES
(1,'2','101','2025-04-04',4,'[{\"user_id\":\"2423001\",\"name\":\"김성식\",\"role\":\"student\",\"attended\":1}]','SCHEDULED',NOW());

-- ===== Kakao & Exams & Logs =====
INSERT INTO kakao_user (user_id, kakao_id, is_verified) VALUES
('2423001','kakao_12345',1),
('8888001','kakao_67890',0);

INSERT INTO student_exams (exam_id, user_id, file_id, level_id, exam_type, score) VALUES
('EX001','2423001','F001','1','JLPT',120),
('EX002','2725001',NULL,'5','TOPIK',180);

INSERT INTO log_entity (log_id, user_id, action) VALUES
(1,'2423001','LOGIN'),
(2,'2423001','READ_NOTICE'),
(3,'8888001','LOGIN'),
(4,'2725001','RESERVE');
