import express from 'express';
import * as commonController from '../../controllers/modal/commonController.js';

const router = express.Router();

/* ===========================
    학기 (Section)
=========================== */
// 조회
router.get('/sections', commonController.getSections);
// 등록
router.post('/sections', commonController.postSections);
// 수정
router.put('/sections/:sec_id', commonController.putSections);
// 삭제
router.delete('/sections/:sec_id', commonController.deleteSections);


/* ===========================
    교수 목록
=========================== */
router.get('/professors', commonController.getProfessors);


/* ===========================
    강의실 목록
=========================== */
router.get('/classrooms', commonController.getClassrooms);


/* ===========================
    교시 (Timeslots)
=========================== */
router.get('/timeslots', commonController.getTimeslots);


/* ===========================
    요일 (Days)
=========================== */
router.get('/days', commonController.getDays);

export default router;
