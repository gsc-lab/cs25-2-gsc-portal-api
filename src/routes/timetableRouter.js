import express from "express";
import * as timetableController from '../controllers/timetableController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 시간표 조회 (학생, 교수, 관리자)
router.get("/student/:user_id", timetableController.getStudentTimetable);
router.get("/professor/:user_id", timetableController.getProfessorTimetable);
router.get("/admin", timetableController.getAdminTimetable);

// 강의 등록
router.post("/registerCourses", authWithRole("professor"), timetableController.postRegisterCourse);
router.put("/registerCourses/:course_id", authWithRole("professor"), timetableController.putRegisterCourse);
router.delete("/registerCourses/:course_id", authWithRole("professor"), timetableController.deleteRegisterCourse);

// 시간표 등록
router.post("/registerTimetable", authWithRole("admin"), timetableController.postRegisterTimetable);
router.put("/registerTimetable/:id", authWithRole("admin"), timetableController.putRegisterTimetable);
router.delete("/registerTimetable/:id", authWithRole("admin"), timetableController.deleteRegisterTimetable);

// 휴보강 등록
router.post("/registerHoliday", timetableController.postRegisterHoliday);
router.put("/registerHoliday/:event_id", timetableController.putRegisterHoliday);
router.delete("/registerHoliday/:event_id", timetableController.deleteRegisterHoliday);

// 분반 등록
router.post("/classes/:class_id/assign/:course_id",  timetableController.postAssignStudents);
router.put("/classes/:class_id/assign/:course_id", timetableController.putAssignStudents);
router.delete("/classes/:class_id/assign/:course_id", timetableController.deleteAssignStudents);

// 휴보강 이력
router.get("/events", timetableController.getEvents)

// 후까 교수님
router.get("/huka/student", authWithRole("professor"), timetableController.getHukaStudentTimetable);
router.post("/huka/student", authWithRole("professor"), timetableController.postHukaStudentTimetable);
router.post("/huka/student/custom", authWithRole("professor"), timetableController.postHukaCustomSchedule)

export default router;