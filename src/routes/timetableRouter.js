import express from "express";
import * as timetableController from "../controllers/timetableController.js";
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

/* ===========================
    1) 시간표 조회
=========================== */
// 학생 시간표
router.get("/student", timetableController.getStudentTimetable);
// 교수 시간표
router.get("/professor", timetableController.getProfessorTimetable);
// 관리자 전체 시간표
router.get("/admin", timetableController.getAdminTimetable);


/* ===========================
    2) 과목(Course) 관리
=========================== */
// 등록
router.post("/registerCourses", authWithRole("professor"), timetableController.postRegisterCourse);
// 수정
router.put("/registerCourses/:course_id", authWithRole("professor"), timetableController.putRegisterCourse);
// 삭제
router.delete("/registerCourses/:course_id", authWithRole("professor"), timetableController.deleteRegisterCourse);


/* ===========================
    3) 시간표(Timetable) 관리
=========================== */
// 추가
router.post("/registerTimetable", timetableController.postRegisterTimetable);
// 수정
router.put("/registerTimetable/:schedule_ids", authWithRole("professor"), timetableController.putRegisterTimetable);
// 삭제
router.delete("/registerTimetable/:schedule_ids", authWithRole("professor"), timetableController.deleteRegisterTimetable);


/* ===========================
    4) 휴·보강(Event) 관리
=========================== */
// 등록
router.post("/registerHoliday", authWithRole("professor"), timetableController.postRegisterHoliday);
// 수정
router.put("/registerHoliday/:event_id", authWithRole("professor"), timetableController.putRegisterHoliday);
// 삭제
router.delete("/registerHoliday/:event_id", authWithRole("professor"), timetableController.deleteRegisterHoliday);


/* ===========================
    5) 분반(Class) 관리
=========================== */
// 학생 배정
router.post("/classes/:class_id/assign", authWithRole("professor"), timetableController.postAssignStudents);
// 분반 수정
router.put("/classes/:class_id/assign", authWithRole("professor"), timetableController.putAssignStudents);
// 분반 삭제
router.delete("/classes/:class_id/assign", authWithRole("professor"), timetableController.deleteAssignStudents);


/* ===========================
    6) 기타 조회
=========================== */
// 휴·보강 이력
router.get("/events", authWithRole("professor"), timetableController.getEvents);
// 특정 날짜 + 학년 교시 조회
router.get("/gradeDate", timetableController.getGradeDate);


/* ===========================
    7) 후까 교수 상담
=========================== */
// 상담 학생 시간표 조회
router.get("/huka/student", timetableController.getHukaStudentTimetable);
// 정규 상담 등록
router.post("/huka/student", authWithRole("professor"), timetableController.postHukaStudentTimetable);
// 특정일 상담 등록
router.post("/huka/student/custom", authWithRole("professor"), timetableController.postHukaCustomSchedule);

export default router;
