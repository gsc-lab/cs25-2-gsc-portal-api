import express from 'express';
import * as commonController from '../../controllers/modal/commonController.js';

const router = express.Router();

// 학기 조회
router.get('/sections', commonController.getSections);
router.put('/sections/:sec_id', commonController.putSections);
router.delete('/sections/:sec_id', commonController.deleteSections)

// 학기 등록
router.post('/sections', commonController.postSections);

// 교수 목록
router.get('/professors', commonController.getProfessors);

// 강의실 목록
router.get('/classrooms', commonController.getClassrooms);

// 교시 목록
router.get('/timeslots', commonController.getTimeslots);

// 요일 목록
router.get('/days', commonController.getDays);

export default router;