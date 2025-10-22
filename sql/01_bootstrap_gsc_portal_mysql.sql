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

CREATE TABLE course (
course_id  VARCHAR(15) PRIMARY KEY,
sec_id     VARCHAR(10) NOT NULL,
title      VARCHAR(100) NOT NULL,
is_special BOOLEAN NOT NULL DEFAULT FALSE,
KEY ix_course_sec_title (sec_id, title),
CONSTRAINT fk_course_sec
FOREIGN KEY (sec_id) REFERENCES section(sec_id)
ON UPDATE CASCADE ON DELETE CASCADE
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
                               target_id   INT PRIMARY KEY AUTO_INCREMENT,
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
    event_id        VARCHAR(10) PRIMARY KEY,
    schedule_id     VARCHAR(10) NOT NULL,
    event_type      ENUM('CANCEL','MAKEUP') NOT NULL,
    event_date      DATE NOT NULL,
    classroom       VARCHAR(100),
    parent_event_id VARCHAR(10) NULL, -- 보강일 경우 연결된 휴강 이벤트 ID

    UNIQUE KEY ux_event_sched_date_type (schedule_id, event_date, event_type),
    KEY ix_event_date (event_date),
    KEY ix_event_parent (parent_event_id),

    CONSTRAINT fk_event_sched FOREIGN KEY (schedule_id)
        REFERENCES course_schedule(schedule_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_event_parent FOREIGN KEY (parent_event_id)
        REFERENCES course_event(event_id)
        ON UPDATE CASCADE ON DELETE SET NULL
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
                             reserve_date   DATE NOT NULL,
                             start_time     TIME NOT NULL,
                             end_time       TIME NOT NULL,
                             created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                             KEY ix_classroom_date (classroom_id, reserve_date),
                             KEY ix_reservation_overlap (classroom_id, reserve_date, start_time, end_time),
                             CONSTRAINT chk_time_range CHECK (end_time > start_time),
                             CONSTRAINT fk_resv_user FOREIGN KEY (user_id)
                                 REFERENCES user_account(user_id)
                                 ON UPDATE CASCADE ON DELETE CASCADE,
                             CONSTRAINT fk_resv_room FOREIGN KEY (classroom_id)
                                 REFERENCES classroom(classroom_id)
                                 ON UPDATE CASCADE ON DELETE CASCADE
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
                                          voted_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          UNIQUE KEY ux_poll_user_once (poll_id, user_id),
                                          CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES user_account(user_id)            ON UPDATE CASCADE ON DELETE CASCADE,
                                          CONSTRAINT fk_vote_poll FOREIGN KEY (poll_id) REFERENCES weekend_attendance_poll(poll_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 06. Cleaning
-- (simple rotation: generate once per semester, read-only on UI)
-- =========================================================
CREATE TABLE cleaning_roster (
  roster_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  section      VARCHAR(10) NOT NULL,         -- 예: 2025-2
  grade_id     VARCHAR(10) NOT NULL,         -- 예: G1
  classroom_id VARCHAR(10) NOT NULL,         -- 학기/연도 고정 강의실
  work_date    DATE NOT NULL,                -- 주차 기준일(또는 실제 청소일)
  team_size    TINYINT NOT NULL DEFAULT 4,   -- 팀 구성 인원 수
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roster_scope_day (section, grade_id, work_date),
  KEY ix_cleaning_date (work_date),
  CONSTRAINT chk_cleaning_team_size CHECK (team_size > 0),
  CONSTRAINT fk_clean_grade FOREIGN KEY (grade_id)     REFERENCES grade(grade_id)         ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_clean_room  FOREIGN KEY (classroom_id) REFERENCES classroom(classroom_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cleaning_roster_member (
  roster_id BIGINT NOT NULL,
  user_id   VARCHAR(10) NOT NULL,           -- FK → user_account.user_id (학생)
  work_date DATE NOT NULL,                  -- 부모의 work_date를 복제 저장
  PRIMARY KEY (roster_id, user_id),
  UNIQUE KEY uq_no_double_per_day (user_id, work_date), -- 같은 날 중복 배정 금지(전역)
  KEY ix_member_user (user_id),
  CONSTRAINT fk_member_roster FOREIGN KEY (roster_id) REFERENCES cleaning_roster(roster_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_member_user   FOREIGN KEY (user_id)   REFERENCES user_account(user_id)      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 07. Counseling (교수 상담 관리)
-- =========================================================

-- ---------------------------------------------------------
-- 교수 주간 로테이션 (요일 + 시간대 + 학년 + 강의실)
-- ---------------------------------------------------------
CREATE TABLE huka_schedule (
                               schedule_id VARCHAR(10) PRIMARY KEY,
                               student_id VARCHAR(10) NOT NULL,
                               professor_id VARCHAR(10) NOT NULL,
                               sec_id VARCHAR(10) NOT NULL,
                               schedule_type ENUM('REGULAR', 'CUSTOM') NOT NULL,
                               day_of_week ENUM('MON','TUE','WED','THU','FRI') NULL,
                               date DATE NULL,
                               time_slot_id VARCHAR(10) NOT NULL,
                               location VARCHAR(50),              -- ← 교실 대신 자유입력 문자열
                               created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                               updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                               CONSTRAINT fk_hs_student FOREIGN KEY (student_id)
                                   REFERENCES user_account(user_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE,
                               CONSTRAINT fk_hs_professor FOREIGN KEY (professor_id)
                                   REFERENCES user_account(user_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE,
                               CONSTRAINT fk_hs_timeslot FOREIGN KEY (time_slot_id)
                                   REFERENCES time_slot(time_slot_id)
                                   ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;