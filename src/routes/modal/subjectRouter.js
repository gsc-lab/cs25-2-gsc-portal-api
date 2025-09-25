import express from 'express';
import * as subjectController from '../../controllers/modal/subjectController.js';

const router = express.Router();

// 정규 과목 조회
router.get('/courses/regular', subjectController.getcoursesRegular);

// 특강 과목 조회
router.get('/courses/special', subjectController.getcoursesSpecial);

// 한국어 과목 조회
router.get('/courses/korean', subjectController.getcoursesKorean);

// 전체 과목 조회
router.get('/courses/all', subjectController.getcoursesAll);

// 레벨 목록 조회
router.get('/levels', subjectController.getLevels);

// 선택한 레벨의 반 목록 조회
router.get('/classes', subjectController.getClassesByLevel);

// 한국어 레벨 목록 조회
router.get('/levels/korean', subjectController.getKoreanLevels);


export default router;