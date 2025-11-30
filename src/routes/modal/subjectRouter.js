import express from 'express';
import * as subjectController from '../../controllers/modal/subjectController.js';
import { authWithRole } from "../../middleware/authWithRole.js";

const router = express.Router();

/* ===========================
    정규 과목
=========================== */
// 정규 과목 조회
router.get('/courses/regular', authWithRole("professor"), subjectController.getcoursesRegular);


/* ===========================
    특강 과목
=========================== */
// 특강 과목 조회
router.get('/courses/special', authWithRole("professor"), subjectController.getcoursesSpecial);
// 특강 분반 조회
router.get('/courses/special/classes', authWithRole("professor"), subjectController.getSpecialClasses);
// 특강 스케줄 조회
router.get('/courses/special/schedule', authWithRole("professor"), subjectController.getSpecialSchedule);
// 특강 학생 조회
router.get('/courses/:class_id/students', authWithRole("professor"), subjectController.getCourseStudents);


/* ===========================
    한국어 과목
=========================== */
// 한국어 과목 조회
router.get('/courses/korean', authWithRole("professor"), subjectController.getcoursesKorean);
// 한국어 분반 조회
router.get('/courses/korean/classes', authWithRole("professor"), subjectController.getKoreanClasses);


/* ===========================
    전체 과목
=========================== */
// 섹션별 전체 과목 조회
router.get('/courses/all/:section_id', subjectController.getcoursesAll);


/* ===========================
    휴강 정보
=========================== */
// 휴강 조회
router.get('/holidays', authWithRole("professor"), subjectController.getHolidays);

export default router;
