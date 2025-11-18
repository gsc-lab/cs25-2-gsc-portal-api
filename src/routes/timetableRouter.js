import express from "express";
import * as timetableController from '../controllers/timetableController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 시간표 조회 (학생, 교수, 관리자)
router.get("/student/:user_id", authWithRole("student"), timetableController.getStudentTimetable);
router.get("/professor/:user_id", authWithRole("professor"), timetableController.getProfessorTimetable);
router.get("/admin", authWithRole("admin"), timetableController.getAdminTimetable);

// 강의 등록
router.post("/registerCourses", authWithRole("professor"), timetableController.postRegisterCourse);
router.put("/registerCourses/:course_id", authWithRole("professor"), timetableController.putRegisterCourse);
router.delete("/registerCourses/:course_id", authWithRole("professor"), timetableController.deleteRegisterCourse);

// 시간표 등록
router.post("/registerTimetable", authWithRole("professor"), timetableController.postRegisterTimetable);
router.put("/registerTimetable/:schedule_ids", authWithRole("professor"), timetableController.putRegisterTimetable);
router.delete("/registerTimetable/:schedule_ids", authWithRole("professor"), timetableController.deleteRegisterTimetable);

// 휴보강 등록
router.post("/registerHoliday", authWithRole("professor"), timetableController.postRegisterHoliday);
router.put("/registerHoliday/:event_id", authWithRole("professor"), timetableController.putRegisterHoliday);
router.delete("/registerHoliday/:event_id", authWithRole("professor"), timetableController.deleteRegisterHoliday);

// 분반 등록
router.post("/classes/:class_id/assign",  authWithRole("professor"), timetableController.postAssignStudents);
router.put("/classes/:class_id/assign", authWithRole("professor"), timetableController.putAssignStudents);
router.delete("/classes/:class_id/assign", authWithRole("professor"), timetableController.deleteAssignStudents);

// 휴보강 이력
router.get("/events", authWithRole("professor"), timetableController.getEvents)

// 후까 교수님
router.get("/huka/student", timetableController.getHukaStudentTimetable);
router.post("/huka/student", authWithRole("professor"), timetableController.postHukaStudentTimetable);
router.post("/huka/student/custom", authWithRole("professor"), timetableController.postHukaCustomSchedule)

export default router;