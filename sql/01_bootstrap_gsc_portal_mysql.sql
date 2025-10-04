-- =========================================================
-- GSC Portal Database Schema (fixed order & syntax)
-- =========================================================
CREATE DATABASE IF NOT EXISTS gsc_portal
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE gsc_portal;

-- =========================================================
-- 01. Code/Dimension tables
-- =========================================================
CREATE TABLE grade (
                       grade_id VARCHAR(10) PRIMARY KEY,
                       name     VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE language (
                          language_id VARCHAR(10) PRIMARY KEY,
                          name        VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE section (
                         sec_id     VARCHAR(10) PRIMARY KEY,
                         semester   TINYINT NOT NULL,
                         year       YEAR NOT NULL,
                         start_date DATE,
                         end_date   DATE,
                         CONSTRAINT chk_section_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
                         UNIQUE KEY ux_section_year_sem (year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE time_slot (
                           time_slot_id VARCHAR(10) PRIMARY KEY,
                           start_time   TIME NOT NULL,
                           end_time     TIME NOT NULL,
                           CONSTRAINT chk_time_slot_order CHECK (end_time > start_time),
                           UNIQUE KEY ux_slot_day_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE classroom (
                           classroom_id VARCHAR(10) PRIMARY KEY,
                           building     VARCHAR(50) NOT NULL,
                           room_number  VARCHAR(10) NOT NULL,
                           room_type    ENUM('CLASSROOM','LAB') NOT NULL DEFAULT 'CLASSROOM',
                           UNIQUE KEY ux_room_building_no (building, room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 02. Users & Roles
-- =========================================================
CREATE TABLE user_account (
                              user_id       VARCHAR(10) PRIMARY KEY,
                              name          VARCHAR(100) NOT NULL,
                              email         VARCHAR(200),
                              phone         VARCHAR(50),
                              status        ENUM('active','inactive','pending') NOT NULL DEFAULT 'pending',
                              updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              UNIQUE KEY ux_user_email (email),
                              UNIQUE KEY ux_user_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_role (
                           user_id   VARCHAR(10) NOT NULL,
                           role_type ENUM('student','professor','admin') NOT NULL,
                           PRIMARY KEY (user_id, role_type),
                           KEY ix_user_role_type (role_type),
                           CONSTRAINT fk_user_role_user
                               FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kakao_user (
                            user_id     VARCHAR(10) PRIMARY KEY,
                            kakao_id    VARCHAR(128) NOT NULL UNIQUE,
                            linked_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                            CONSTRAINT fk_kakao_user
                                FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 03. Courses
-- =========================================================
CREATE TABLE course (
                        course_id  VARCHAR(15) PRIMARY KEY,
                        sec_id     VARCHAR(10) NOT NULL,
                        title      VARCHAR(100) NOT NULL,
                        is_special TINYINT NOT NULL DEFAULT 0,
                        KEY ix_course_sec_title (sec_id, title),
                        KEY ix_course_is_special (is_special),
                        CONSTRAINT fk_course_sec
                            FOREIGN KEY (sec_id) REFERENCES section(sec_id)
                                ON UPDATE CASCADE ON DELETE CASCADE,
                        CONSTRAINT chk_course_is_special CHECK (is_special IN (0,1,2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_class (
                              class_id   VARCHAR(10) PRIMARY KEY,
                              course_id  VARCHAR(15) NOT NULL,
                              name       VARCHAR(50) NOT NULL,     -- "A반", "B반"
                              UNIQUE KEY ux_course_class (course_id, name),
                              CONSTRAINT fk_cc_course FOREIGN KEY (course_id)
                                  REFERENCES course(course_id)
                                  ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_schedule (
                                 schedule_id  VARCHAR(10) PRIMARY KEY,
                                 classroom_id VARCHAR(10)  NOT NULL,
                                 time_slot_id VARCHAR(10)  NOT NULL,
                                 course_id    VARCHAR(15) NOT NULL,
                                 sec_id       VARCHAR(10) NOT NULL,
                                 day_of_week  ENUM('MON','TUE','WED','THU','FRI') NOT NULL,
                                 class_id     VARCHAR(10) NULL,
                                 UNIQUE KEY ux_sched_slot_room (time_slot_id, classroom_id, day_of_week),
                                 KEY ix_sched_course_slot (course_id, time_slot_id, day_of_week),
                                 KEY ix_sched_room_day (classroom_id, day_of_week),
                                 CONSTRAINT fk_sched_classroom FOREIGN KEY (classroom_id) REFERENCES classroom(classroom_id)
                                     ON UPDATE CASCADE ON DELETE CASCADE,
                                 CONSTRAINT fk_sched_timeslot FOREIGN KEY (time_slot_id) REFERENCES time_slot(time_slot_id)
                                     ON UPDATE CASCADE ON DELETE CASCADE,
                                 CONSTRAINT fk_sched_course FOREIGN KEY (course_id) REFERENCES course(course_id)
                                     ON UPDATE CASCADE ON DELETE CASCADE,
                                 CONSTRAINT fk_sched_class FOREIGN KEY (class_id) REFERENCES course_class(class_id)
                                     ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_language (
                                 course_id   VARCHAR(15) NOT NULL,
                                 language_id VARCHAR(10) NOT NULL,
                                 PRIMARY KEY (course_id, language_id),
                                 CONSTRAINT fk_cl_course FOREIGN KEY (course_id)   REFERENCES course(course_id)     ON UPDATE CASCADE ON DELETE CASCADE,
                                 CONSTRAINT fk_cl_lang   FOREIGN KEY (language_id) REFERENCES language(language_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_target (
                               target_id   VARCHAR(10) PRIMARY KEY,
                               course_id   VARCHAR(15) NOT NULL,
                               grade_id    VARCHAR(10),
                               language_id VARCHAR(10),
                               class_id    VARCHAR(10),
                               UNIQUE KEY ux_course_target_combo (course_id, grade_id, language_id, class_id),
                               CONSTRAINT fk_ct_course FOREIGN KEY (course_id) REFERENCES course(course_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE,
                               CONSTRAINT fk_ct_grade  FOREIGN KEY (grade_id) REFERENCES grade(grade_id)
                                   ON UPDATE CASCADE ON DELETE SET NULL,
                               CONSTRAINT fk_ct_lang   FOREIGN KEY (language_id) REFERENCES language(language_id)
                                   ON UPDATE CASCADE ON DELETE SET NULL,
                               CONSTRAINT fk_ct_class  FOREIGN KEY (class_id) REFERENCES course_class(class_id)
                                   ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 기본정보 (course_class가 준비된 뒤 생성)
CREATE TABLE student_entity (
                                user_id          VARCHAR(10) PRIMARY KEY,
                                grade_id         VARCHAR(10) NULL,
                                class_id         VARCHAR(10) NULL,
                                language_id      VARCHAR(10) NULL,
                                is_international ENUM('korean', 'international') NULL DEFAULT NULL,
                                status           ENUM('enrolled','leave','dropped','graduated') NOT NULL DEFAULT 'enrolled',
                                KEY ix_student_grade (grade_id),
                                KEY ix_student_class (class_id),
                                KEY ix_student_language (language_id),
                                CONSTRAINT fk_student_user
                                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                        ON UPDATE CASCADE ON DELETE CASCADE,
                                CONSTRAINT fk_student_grade
                                    FOREIGN KEY (grade_id) REFERENCES grade(grade_id)
                                        ON UPDATE CASCADE ON DELETE SET NULL,
                                CONSTRAINT fk_student_class
                                    FOREIGN KEY (class_id) REFERENCES course_class(class_id)
                                        ON UPDATE CASCADE ON DELETE SET NULL,
                                CONSTRAINT fk_student_language
                                    FOREIGN KEY (language_id) REFERENCES language(language_id)
                                        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_professor (
                                  user_id   VARCHAR(10) NOT NULL,
                                  course_id VARCHAR(15) NOT NULL,
                                  class_id  VARCHAR(10) NOT NULL,
                                  PRIMARY KEY (user_id, course_id, class_id),
                                  CONSTRAINT fk_cp_user   FOREIGN KEY (user_id)   REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
                                  CONSTRAINT fk_cp_course FOREIGN KEY (course_id) REFERENCES course(course_id)     ON UPDATE CASCADE ON DELETE CASCADE,
                                  CONSTRAINT fk_cp_cc     FOREIGN KEY (class_id)  REFERENCES course_class(class_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_student (
                                user_id   VARCHAR(10) NOT NULL,
                                course_id VARCHAR(15) NOT NULL,
                                class_id  VARCHAR(10) NULL,
                                PRIMARY KEY (user_id, course_id),
                                CONSTRAINT fk_cs_user   FOREIGN KEY (user_id)   REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
                                CONSTRAINT fk_cs_course FOREIGN KEY (course_id) REFERENCES course(course_id)     ON UPDATE CASCADE ON DELETE CASCADE,
                                CONSTRAINT fk_cs_class  FOREIGN KEY (class_id) REFERENCES course_class(class_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 04. Files, Notice, Events, Logs
-- =========================================================
CREATE TABLE file_assets (
                             file_id     INT PRIMARY KEY AUTO_INCREMENT,
                             file_name   VARCHAR(255) NOT NULL,
                             file_url    TEXT NOT NULL,
                             size_type   INT,
                             file_type   VARCHAR(100) NOT NULL,
                             uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notice (
                        notice_id  INT PRIMARY KEY AUTO_INCREMENT,
                        user_id    VARCHAR(10) NOT NULL,
                        course_id  VARCHAR(15) NULL DEFAULT NULL,
                        title      VARCHAR(100) NOT NULL,
                        content    TEXT NOT NULL,
                        is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        KEY ix_notice_course_time (course_id, created_at),
                        KEY ix_notice_author_time (user_id, created_at),
                        CONSTRAINT fk_notice_course FOREIGN KEY (course_id) REFERENCES course(course_id)     ON UPDATE CASCADE ON DELETE SET NULL,
                        CONSTRAINT fk_notice_user   FOREIGN KEY (user_id)   REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notice_file (
                             file_id   INT NOT NULL,
                             notice_id INT NOT NULL,
                             PRIMARY KEY (notice_id, file_id),
                             CONSTRAINT fk_nf_file   FOREIGN KEY (file_id)   REFERENCES file_assets(file_id) ON UPDATE CASCADE ON DELETE CASCADE,
                             CONSTRAINT fk_nf_notice FOREIGN KEY (notice_id) REFERENCES notice(notice_id)    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notice_target (
                               target_id   INT PRIMARY KEY AUTO_INCREMENT,,
                               notice_id   INT NOT NULL,
                               grade_id    VARCHAR(10),
                               language_id VARCHAR(10),
                               class_id    VARCHAR(10),
                               UNIQUE KEY ux_notice_target_combo (notice_id, grade_id, class_id, language_id),
                               CONSTRAINT fk_nt_notice FOREIGN KEY (notice_id)   REFERENCES notice(notice_id)     ON UPDATE CASCADE ON DELETE CASCADE,
                               CONSTRAINT fk_nt_grade  FOREIGN KEY (grade_id)    REFERENCES grade(grade_id)       ON UPDATE CASCADE ON DELETE SET NULL,
                               CONSTRAINT fk_nt_lang   FOREIGN KEY (language_id) REFERENCES language(language_id) ON UPDATE CASCADE ON DELETE SET NULL,
                               CONSTRAINT fk_nt_class  FOREIGN KEY (class_id)    REFERENCES course_class(class_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_delivery_notice (
                                              delivery_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                              user_id     VARCHAR(10) NOT NULL,
                                              notice_id   INT NOT NULL,
                                              message_id  VARCHAR(64) NULL,
                                              send_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                                              read_at     DATETIME,
                                              status      ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
                                              UNIQUE KEY ux_ndn_notice_user (notice_id, user_id),
                                              KEY ix_ndn_inbox (user_id, status, read_at),
                                              CONSTRAINT fk_ndn_user   FOREIGN KEY (user_id)   REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
                                              CONSTRAINT fk_ndn_notice FOREIGN KEY (notice_id) REFERENCES notice(notice_id)     ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course_event (
                              event_id    VARCHAR(10) PRIMARY KEY,
                              schedule_id VARCHAR(10) NOT NULL,
                              event_type  ENUM('CANCEL','MAKEUP') NOT NULL,
                              event_date  DATE NOT NULL,
                              UNIQUE KEY ux_event_sched_date_type (schedule_id, event_date, event_type),
                              KEY ix_event_date (event_date),
                              CONSTRAINT fk_event_sched FOREIGN KEY (schedule_id) REFERENCES course_schedule(schedule_id)
                                  ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_delivery_event (
                                             delivery_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                             user_id     VARCHAR(10) NOT NULL,
                                             event_id    VARCHAR(10) NOT NULL,
                                             message_id  VARCHAR(64) NOT NULL,
                                             send_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                                             read_at     DATETIME,
                                             status      ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
                                             UNIQUE KEY ux_nde_event_user (event_id, user_id),
                                             UNIQUE KEY ux_nde_message (message_id),
                                             KEY ix_nde_inbox (user_id, status, read_at),
                                             CONSTRAINT fk_nde_user  FOREIGN KEY (user_id)  REFERENCES user_account(user_id)  ON UPDATE CASCADE ON DELETE CASCADE,
                                             CONSTRAINT fk_nde_event FOREIGN KEY (event_id) REFERENCES course_event(event_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE log_entity (
                            log_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
                            user_id    VARCHAR(10) NOT NULL,
                            action     ENUM('LOGIN','READ_NOTICE','READ_EVENT','RESERVE','VOTE') NOT NULL,
                            event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                            KEY ix_log_user_time (user_id, action, event_time),
                            KEY ix_log_action_time (action, event_time),
                            CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE allowed_email (
                               id     INT PRIMARY KEY AUTO_INCREMENT,
                               email  VARCHAR(200) NOT NULL UNIQUE,
                               reason VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_exams (
                               exam_id    VARCHAR(10) PRIMARY KEY,
                               user_id    VARCHAR(10) NOT NULL,
                               file_id    INT,
                               level_code VARCHAR(10) NULL,
                               exam_type  ENUM('JLPT','TOPIK') NOT NULL,
                               score      INT,
                               UNIQUE KEY ux_exam_user_type_level (user_id, exam_type, level_code),
                               CONSTRAINT fk_exam_user FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE,
                               CONSTRAINT fk_exam_file FOREIGN KEY (file_id) REFERENCES file_assets(file_id)
                                   ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 05. Reservations
-- =========================================================
CREATE TABLE reservation (
                             reservation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                             user_id        VARCHAR(10) NOT NULL,
                             classroom_id   VARCHAR(10) NOT NULL,
                             title          VARCHAR(100),
                             start_at       DATETIME NOT NULL,
                             end_at         DATETIME NOT NULL,
                             status         ENUM('ACTIVE','CANCELLED','FINISHED') NOT NULL DEFAULT 'ACTIVE',
                             created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                             KEY ux_start (classroom_id, start_at),
                             KEY ux_end   (classroom_id, end_at),
                             KEY ix_reservation_overlap (classroom_id, start_at, end_at),
                             CONSTRAINT chk_reservation_time CHECK (end_at > start_at),
                             CONSTRAINT fk_resv_user FOREIGN KEY (user_id)      REFERENCES user_account(user_id)   ON UPDATE CASCADE ON DELETE CASCADE,
                             CONSTRAINT fk_resv_room FOREIGN KEY (classroom_id) REFERENCES classroom(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE weekend_attendance_poll (
                                         poll_id        VARCHAR(10) PRIMARY KEY,
                                         grade_id       VARCHAR(10),
                                         classroom_id   VARCHAR(10) NOT NULL,
                                         poll_date      DATE NOT NULL,
                                         target_weekend ENUM('SAT','SUN'),
                                         required_count INT NOT NULL DEFAULT 8,
                                         status         BOOLEAN NOT NULL DEFAULT FALSE,
                                         created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                                         UNIQUE KEY ux_poll_room_date_day (classroom_id, poll_date, target_weekend),
                                         CONSTRAINT chk_weekend_required_count CHECK (required_count > 0),
                                         CONSTRAINT fk_poll_grade FOREIGN KEY (grade_id)     REFERENCES grade(grade_id)         ON UPDATE CASCADE ON DELETE SET NULL,
                                         CONSTRAINT fk_poll_room  FOREIGN KEY (classroom_id) REFERENCES classroom(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE weekend_attendance_votes (
                                          votes_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
                                          user_id   VARCHAR(10) NOT NULL,
                                          poll_id   VARCHAR(10) NOT NULL,
                                          will_join BOOLEAN NOT NULL,
                                          voted_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          UNIQUE KEY ux_poll_user_once (poll_id, user_id),
                                          CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES user_account(user_id)            ON UPDATE CASCADE ON DELETE CASCADE,
                                          CONSTRAINT fk_vote_poll FOREIGN KEY (poll_id) REFERENCES weekend_attendance_poll(poll_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 06. Cleaning
-- =========================================================
CREATE TABLE cleaning_assignment (
                                     assignment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     grade_id      VARCHAR(10) NOT NULL,
                                     classroom_id  VARCHAR(10) NOT NULL,
                                     work_date     DATE NOT NULL,
                                     team_size     TINYINT NOT NULL DEFAULT 4,
                                     members_json  JSON,
                                     status        ENUM('SCHEDULED','DONE','MISSED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
                                     created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     confirmed_at  DATETIME,
                                     UNIQUE KEY ux_cleaning_scope_day (grade_id, classroom_id, work_date),
                                     KEY ix_cleaning_date (work_date),
                                     CONSTRAINT chk_cleaning_team_size CHECK (team_size > 0),
                                     CONSTRAINT fk_clean_grade FOREIGN KEY (grade_id)      REFERENCES grade(grade_id)         ON UPDATE CASCADE ON DELETE CASCADE,
                                     CONSTRAINT fk_clean_room  FOREIGN KEY (classroom_id)  REFERENCES classroom(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 07. Counseling (교수 상담 관리)
-- =========================================================

-- ---------------------------------------------------------
-- 교수 주간 로테이션 (요일 + 시간대 + 학년 + 강의실)
-- ---------------------------------------------------------
CREATE TABLE counseling_rotation (
                                     rule_id       VARCHAR(12) PRIMARY KEY,                          -- 로테이션 규칙 고유 ID
                                     sec_id        VARCHAR(10) NOT NULL,                             -- 학기 구분 (section 참조)
                                     user_id       VARCHAR(10) NOT NULL,                             -- 상담 담당 교수 ID (user_account 참조)
                                     time_slot_id  VARCHAR(10) NOT NULL,                             -- 상담 시간대 (예: 09:00~09:50)
                                     grade_id      VARCHAR(10) NOT NULL,                             -- 상담 대상 학년 (grade 참조)
                                     classroom_id  VARCHAR(10) NOT NULL,                             -- 상담 장소 (classroom 참조)
                                     day_of_week   ENUM('MON','TUE','WED','THU','FRI') NOT NULL,     -- 상담 요일
                                     created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,                -- 등록 일시

                                     CONSTRAINT fk_cr_sec
                                         FOREIGN KEY (sec_id) REFERENCES section(sec_id)
                                             ON UPDATE CASCADE ON DELETE CASCADE,

                                     CONSTRAINT fk_cr_user
                                         FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                             ON UPDATE CASCADE ON DELETE CASCADE,

                                     CONSTRAINT fk_cr_slot
                                         FOREIGN KEY (time_slot_id) REFERENCES time_slot(time_slot_id)
                                             ON UPDATE CASCADE ON DELETE CASCADE,

                                     CONSTRAINT fk_cr_grade
                                         FOREIGN KEY (grade_id) REFERENCES grade(grade_id)
                                             ON UPDATE CASCADE ON DELETE CASCADE,

                                     CONSTRAINT fk_cr_room
                                         FOREIGN KEY (classroom_id) REFERENCES classroom(classroom_id)
                                             ON UPDATE CASCADE ON DELETE CASCADE,

                                     UNIQUE KEY ux_cr_unique (sec_id, user_id, day_of_week, time_slot_id, grade_id) -- 한 교수의 중복 요일·시간·학년 등록 방지
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 상담 예약 (교수가 학생을 선택하여 날짜 지정)
-- ---------------------------------------------------------
CREATE TABLE counseling_booking (
                                    booking_id    BIGINT PRIMARY KEY AUTO_INCREMENT,                -- 상담 예약 고유 ID
                                    user_id       VARCHAR(10) NOT NULL,                             -- 상담받는 학생 ID (user_account 참조)
                                    rule_id       VARCHAR(12) NOT NULL,                             -- 연결된 로테이션 규칙 ID (counseling_rotation 참조)
                                    time_slot_id  VARCHAR(10) NOT NULL,                             -- 상담 시간대 (time_slot 참조)
                                    booking_date  DATE NOT NULL,                                    -- 상담 날짜
                                    status        ENUM('SCHEDULED','CANCELLED','COMPLETED')         -- 상담 상태 (예약됨 / 취소됨 / 완료됨)
                  NOT NULL DEFAULT 'SCHEDULED',
                                    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,                -- 예약 생성 일시

                                    CONSTRAINT fk_cb_user
                                        FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                                            ON UPDATE CASCADE ON DELETE CASCADE,

                                    CONSTRAINT fk_cb_slot
                                        FOREIGN KEY (time_slot_id) REFERENCES time_slot(time_slot_id)
                                            ON UPDATE CASCADE ON DELETE RESTRICT,

                                    CONSTRAINT fk_cb_rule
                                        FOREIGN KEY (rule_id) REFERENCES counseling_rotation(rule_id)
                                            ON UPDATE CASCADE ON DELETE RESTRICT,

                                    UNIQUE KEY ux_cb_user_day_slot (user_id, booking_date, time_slot_id), -- 같은 학생의 중복 예약 방지
                                    KEY ix_cb_rule_date (rule_id, booking_date)                            -- rule별 예약 조회 인덱스
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;