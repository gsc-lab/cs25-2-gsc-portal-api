import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

/* ===========================
    승인 대기 사용자 관리
=========================== */
// 대기 목록 조회
router.get('/users', authWithRole("admin"), adminController.getPendingUsers);
// 승인 / 거부 처리
router.post('/users', authWithRole("admin"), adminController.postPendingUsers);
// 대기 사용자 삭제
router.delete('/users/:user_id', authWithRole("admin"), adminController.deletePendingUsers);


/* ===========================
    예외 이메일 관리
=========================== */
// 목록 조회
router.get('/email', authWithRole("admin"), adminController.getAllowedEmail);
// 추가
router.post('/email', authWithRole("admin"), adminController.postAllowedEmail);
// 삭제
router.delete('/email/:user_id', authWithRole("admin"), adminController.deleteAllowedEmail);


/* ===========================
    학생 정보 관리
=========================== */
// 조회
router.get('/students', authWithRole("admin"), adminController.getStudentInfo);
// 수정
router.patch('/students/:user_id', authWithRole("admin"), adminController.patchStudentInfo);
// 삭제
router.delete('/students/:user_id', authWithRole("admin"), adminController.deleteStudentInfo);


/* ===========================
    교수 / 관리자 정보 관리
=========================== */
// 목록 조회
router.get('/proadmin', authWithRole("admin"), adminController.getProAdminInfo);
// 수정
router.put('/proadmin/:user_id', authWithRole("admin"), adminController.putProAdminInfo);

export default router;
