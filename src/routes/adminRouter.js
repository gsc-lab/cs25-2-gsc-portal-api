import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 승인
router.get('/users', authWithRole("admin"), adminController.getPendingUsers);
router.post('/users', authWithRole("admin"), adminController.postPendingUsers);
router.delete('/users/:user_id', authWithRole("admin"), adminController.deletePendingUsers);

// 예외 이메일
router.get('/email', authWithRole("admin"), adminController.getAllowedEmail);
router.post('/email', authWithRole("admin"), adminController.postAllowedEmail);
router.delete('/email/:user_id', authWithRole("admin"), adminController.deleteAllowedEmail);

// 학생 정보
router.get('/students', authWithRole("professor"), adminController.getStudentInfo);
router.patch('/students/:user_id', authWithRole("admin"), adminController.patchStudentInfo);
router.delete('/students/:user_id', authWithRole("admin"), adminController.deleteStudentInfo);

// 교수, 관리자 정보
router.get('/proadmin', authWithRole("professor"), adminController.getProAdminInfo)

export default router;