import express from "express";
import * as timetableController from '../controllers/timetableController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 시간표 조회 (학생, 교수, 관리자)
router.get("/student/:user_id", authWithRole("student"), timetableController.getStudentTimetable);
router.get("/professor/:user_id", authWithRole("professor"), timetableController.getProfessorTimetable);
router.get("/admin", authWithRole("admin"), timetableController.getAdminTimetable);






// 후까 교수님
router.get("/huka/student", authWithRole("professor"), timetableController.getHukaStudentTimetable);

export default router;