import express from 'express';
import * as subjectController from '../../controllers/modal/subjectController.js';
import { authWithRole } from "../../middleware/authWithRole.js";

const router = express.Router();

// 정규 과목 조회
router.get('/courses/regular', authWithRole("professor"), subjectController.getcoursesRegular);

// 특강 과목 조회
router.get('/courses/special', authWithRole("professor"), subjectController.getcoursesSpecial);

// 한국어 과목 조회
router.get('/courses/korean', authWithRole("professor"), subjectController.getcoursesKorean);

// 전체 과목 조회
router.get('/courses/all', authWithRole("professor"), subjectController.getcoursesAll);

// 레벨 목록 조회
router.get('/levels', authWithRole("professor"), subjectController.getLevels);

// 선택한 레벨의 반 목록 조회
router.get('/classes', authWithRole("professor"), subjectController.getClassesByLevel);

// 한국어 레벨 목록 조회
router.get('/levels/korean', authWithRole("professor"), subjectController.getKoreanLevels);

// 특강 스케줄 조회
router.get("/courses/special/classess", authWithRole("professor"), subjectController.getSpecialSchedule)

// 휴강 조회
router.get('/holidays', authWithRole("professor"), subjectController.getHolidays);


export default router;