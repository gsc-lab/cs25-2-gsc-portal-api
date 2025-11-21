-- =========================================================
-- Mock Data for Notices (for Frontend Development)
-- Version 3: Synced with 02_mock_data.sql
-- =========================================================
SET NAMES 'utf8mb4';

-- This script assumes 02_mock_data.sql has been run first.
-- It relies on users (admin: 9999001, professors: 8888001, 8888002) and courses (C001, C002, etc.)

-- Clean up only the notice-related tables to re-run this script safely.
DELETE FROM notice_file;
DELETE FROM notice_target;
DELETE FROM notification_delivery_notice;
DELETE FROM notice;
DELETE FROM file_assets;

-- =========================================================
-- 01. Mock File Assets
-- =========================================================
INSERT INTO `file_assets` (`file_id`, `file_name`, `file_url`, `size_type`, `file_type`, `uploaded_at`) VALUES
(1, '보강계획서.pdf', 'https://example.com/files/makeup_plan.pdf', 1024, 'application/pdf', NOW()),
(2, '중간고사_시험범위.docx', 'https://example.com/files/midterm_scope.docx', 2048, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NOW()),
(3, '참고자료.png', 'https://example.com/files/reference_image.png', 512, 'image/png', NOW()),
(4, '특강안내_포스터.jpg', 'https://example.com/files/special_lecture_poster.jpg', 3072, 'image/jpeg', NOW());

-- =========================================================
-- 02. Mock Notices & Targets
-- =========================================================

-- Notice 1: Pinned, global notice from admin (no target)
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[중요] 전체 공지: 2025학년도 1학기 학사일정 안내', '2025학년도 1학기 주요 학사일정을 안내드립니다. 학생들은 반드시 숙지하여 학업에 차질이 없도록 하시기 바랍니다. 자세한 내용은 학교 홈페이지 학사일정 게시판을 참고해주세요.', TRUE, NOW() - INTERVAL 10 DAY);

-- Notice 2: Course-specific notice for '인공지능 개론' (C001)
INSERT INTO `notice` (`user_id`, `course_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('8888001', 'C001', '[인공지능 개론] 5/5(월) 휴강 및 보강 안내', '5월 5일 어린이날은 공휴일으로 수업이 없습니다. 해당 일자에 대한 보강은 첨부된 보강계획서를 확인해주시기 바랍니다.', FALSE, NOW() - INTERVAL 9 DAY);
SET @notice2_id = LAST_INSERT_ID();
INSERT INTO `notice_file` (`notice_id`, `file_id`) VALUES (@notice2_id, 1);

-- Notice 3: Course-specific notice for '데이터베이스' (C002) with multiple attachments
INSERT INTO `notice` (`user_id`, `course_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('8888001', 'C002', '[데이터베이스] 중간고사 범위 및 참고자료 안내', '중간고사 범위와 참고자료를 첨부파일로 공유합니다. 시험 준비에 만전을 기해주시기 바랍니다.', FALSE, NOW() - INTERVAL 8 DAY);
SET @notice3_id = LAST_INSERT_ID();
INSERT INTO `notice_file` (`notice_id`, `file_id`) VALUES (@notice3_id, 2), (@notice3_id, 3);

-- Notice 4: Target notice for 1st grade
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '1학년 대상: 신입생 환영회 개최 안내', '1학년 신입생 여러분을 위한 환영회를 개최합니다. 선배들과 동기들을 만나 즐거운 시간을 보낼 수 있는 기회이니 많은 참여 바랍니다.', FALSE, NOW() - INTERVAL 7 DAY);
SET @notice4_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice4_id, '1');

-- Notice 5: Target notice for 2nd grade
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '2학년 대상: 2025 상반기 취업 박람회 참가 안내', '2학년 학생들의 성공적인 취업을 지원하기 위해 2025년 상반기 취업 박람회를 개최합니다. 다양한 기업의 채용 정보를 얻고, 현직자들과 상담할 수 있는 좋은 기회가 될 것입니다.', FALSE, NOW() - INTERVAL 6 DAY);
SET @notice5_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice5_id, '2');

-- Notice 6: Target notice for Korean language students
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '한국어 전공생 대상: 제 98회 TOPIK 시험 접수 안내', '제 98회 한국어능력시험(TOPIK) 접수가 시작되었습니다. 응시를 희망하는 학생들은 기간 내에 접수를 완료하시기 바랍니다.', FALSE, NOW() - INTERVAL 5 DAY);
SET @notice6_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `language_id`) VALUES (@notice6_id, 'KR');

-- Notice 7: Target notice for Japanese language students
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '일본어 전공생 대상: 2025년 제1회 JLPT 시험 접수 안내', '2025년 제1회 일본어능력시험(JLPT) 접수가 곧 시작됩니다. N1, N2 등 목표 레벨에 맞춰 미리 준비하시기 바랍니다.', FALSE, NOW() - INTERVAL 4 DAY);
SET @notice7_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `language_id`) VALUES (@notice7_id, 'JP');

-- Notice 8: Target notice for 2nd grade, Japanese language students
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '2학년 일본어 전공생 대상: 일본계 기업 채용 설명회', '글로벌 IT 기업 A사에서 본교 학생들을 대상으로 채용 설명회를 개최합니다. 2학년 일본어 전공생들의 많은 관심과 참여 바랍니다.', FALSE, NOW() - INTERVAL 3 DAY);
SET @notice8_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`, `language_id`) VALUES (@notice8_id, '2', 'JP');

-- Notice 9: Target notice for a specific class '일본어 특강A' (C003A)
INSERT INTO `notice` (`user_id`, `course_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('8888002', 'C003', '[일본어 특강A] 필독: 팀 프로젝트 조 편성 안내', '일본어 특강A 수강생들은 다음 주 수업 전까지 팀 편성을 완료하여 알려주시기 바랍니다.', FALSE, NOW() - INTERVAL 2 DAY);
SET @notice9_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `class_id`) VALUES (@notice9_id, 'C003A');

-- Notice 10: A single notice with multiple targets (for all KR students in grade 1 and 2)
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '한국어 전공 1,2학년 전체 대상: 전공 필수과목 변경 안내', '2026년부터 적용되는 한국어 전공 필수과목 변경사항에 대해 사전 안내드립니다. 1, 2학년 학생들은 필독하시기 바랍니다.', FALSE, NOW() - INTERVAL 1 DAY);
SET @notice10_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`, `language_id`) VALUES (@notice10_id, '1', 'KR');
INSERT INTO `notice_target` (`notice_id`, `grade_id`, `language_id`) VALUES (@notice10_id, '2', 'KR');

-- Notice 11: For special course 'JLPT N2 특강' (C004)
INSERT INTO `notice` (`user_id`, `course_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('8888002', 'C004', '[JLPT N2 특강] 수업 관련 설문조사 참여 요청', '수업 개선을 위해 설문조사를 실시합니다. N2 특강 수강생 여러분의 적극적인 참여 부탁드립니다.', FALSE, NOW() - INTERVAL 1 DAY);

-- Notice 12: Special lecture notice with an attachment for grade 1 and 2
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[특강] AI 전문가 초청 특강 안내', '4차 산업혁명 시대를 맞이하여 AI 전문가를 모시고 특별 강연을 개최합니다. 관심 있는 학생들의 많은 참여 바랍니다.', FALSE, NOW() - INTERVAL 5 DAY);
SET @notice12_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice12_id, '1');
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice12_id, '2');
INSERT INTO `notice_file` (`notice_id`, `file_id`) VALUES (@notice12_id, 4);

-- =========================================================
-- 03. Notices for Pagination Test (creating 20 more)
-- =========================================================
INSERT INTO `notice` (`user_id`, `title`, `content`, `created_at`) VALUES
('9999001', '페이지네이션 테스트 1', '본문 내용 1', NOW() - INTERVAL 25 HOUR),
('9999001', '페이지네이션 테스트 2', '본문 내용 2', NOW() - INTERVAL 26 HOUR),
('9999001', '페이지네이션 테스트 3', '본문 내용 3', NOW() - INTERVAL 27 HOUR),
('9999001', '페이지네이션 테스트 4', '본문 내용 4', NOW() - INTERVAL 28 HOUR),
('9999001', '페이지네이션 테스트 5', '본문 내용 5', NOW() - INTERVAL 29 HOUR),
('9999001', '페이지네이션 테스트 6', '본문 내용 6', NOW() - INTERVAL 30 HOUR),
('9999001', '페이지네이션 테스트 7', '본문 내용 7', NOW() - INTERVAL 31 HOUR),
('9999001', '페이지네이션 테스트 8', '본문 내용 8', NOW() - INTERVAL 32 HOUR),
('9999001', '페이지네이션 테스트 9', '본문 내용 9', NOW() - INTERVAL 33 HOUR),
('9999001', '페이지네이션 테스트 10', '본문 내용 10', NOW() - INTERVAL 34 HOUR),
('9999001', '페이지네이션 테스트 11', '본문 내용 11', NOW() - INTERVAL 35 HOUR),
('9999001', '페이지네이션 테스트 12', '본문 내용 12', NOW() - INTERVAL 36 HOUR),
('9999001', '페이지네이션 테스트 13', '본문 내용 13', NOW() - INTERVAL 37 HOUR),
('9999001', '페이지네이션 테스트 14', '본문 내용 14', NOW() - INTERVAL 38 HOUR),
('9999001', '페이지네이션 테스트 15', '본문 내용 15', NOW() - INTERVAL 39 HOUR),
('9999001', '페이지네이션 테스트 16', '본문 내용 16', NOW() - INTERVAL 40 HOUR),
('9999001', '페이지네이션 테스트 17', '본문 내용 17', NOW() - INTERVAL 41 HOUR),
('9999001', '페이지네이션 테스트 18', '본문 내용 18', NOW() - INTERVAL 42 HOUR),
('9999001', '페이지네이션 테스트 19', '본문 내용 19', NOW() - INTERVAL 43 HOUR),
('9999001', '페이지네이션 테스트 20', '본문 내용 20', NOW() - INTERVAL 44 HOUR);

-- =========================================================
-- 04. New Mock Notices based on user request (Synced)
-- =========================================================
-- 1. 전체 공지 (Overall Notice)
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[전체] 여름방학 집중근로 신청 안내', '2025년 여름방학 국가근로장학 집중근로 프로그램 신청 기간을 안내드립니다. 희망자는 기간 내에 신청해주시기 바랍니다.', FALSE, NOW() - INTERVAL 2 DAY);

-- 2. 정규 공지 (Regular Notices for each grade)
-- 2-1. 1학년 정규 공지
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[1학년 정규] 1학년 수강신청 정정 기간 안내', '1학년 대상 수강신청 정정 기간은 3월 10일부터 12일까지입니다. 수강신청 내역을 확인하고 필요한 경우 정정하시기 바랍니다.', FALSE, NOW() - INTERVAL 3 DAY);
SET @notice_reg_1_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice_reg_1_id, '1');

-- 2-2. 2학년 정규 공지
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[2학년 정규] 2학년 대상 전공설명회 개최', '2학년 학생들의 전공 선택을 돕기 위한 전공설명회를 개최합니다. 다양한 전공에 대한 정보를 얻을 수 있는 기회이니 많은 참여 바랍니다.', FALSE, NOW() - INTERVAL 3 DAY);
SET @notice_reg_2_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `grade_id`) VALUES (@notice_reg_2_id, '2');

-- 3. 특강 공지 (Special Lecture Notices)
-- 3-1. 일본어 특강 공지
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[일본어 특강] JLPT 대비 모의고사 실시 안내', 'JLPT 대비 모의고사를 실시합니다. 실전 감각을 익히고 자신의 실력을 점검해볼 수 있는 좋은 기회입니다.', FALSE, NOW() - INTERVAL 4 DAY);
SET @notice_spc_jp_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `class_id`) VALUES (@notice_spc_jp_id, 'C003A');

-- 4. 한국어 공지 (Korean Language Notice for International Students)
INSERT INTO `notice` (`user_id`, `title`, `content`, `is_pinned`, `created_at`)
VALUES ('9999001', '[한국어] 유학생 대상 한국문화체험 행사 안내', '유학생 여러분을 위해 한국의 전통문화를 체험할 수 있는 행사를 마련했습니다. 떡 만들기, 한복 체험 등 다양한 프로그램이 준비되어 있습니다.', FALSE, NOW() - INTERVAL 5 DAY);
SET @notice_kor_id = LAST_INSERT_ID();
INSERT INTO `notice_target` (`notice_id`, `class_id`) VALUES (@notice_kor_id, 'C007A');