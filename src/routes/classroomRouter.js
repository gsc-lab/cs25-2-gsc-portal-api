import express from 'express';
import * as classroomController from '../controllers/classroomController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

/* ===========================
    강의실 CRUD
=========================== */
// 조회
router.get("/", authWithRole("student"), classroomController.getClassrooms);
// 생성
router.post("/", authWithRole("professor"), classroomController.postClassrooms);
// 수정
router.put("/:id", authWithRole("professor"), classroomController.putClassrooms);
// 삭제
router.delete("/:id", authWithRole("professor"), classroomController.deleteClassrooms);

/* ===========================
    강의실 예약
=========================== */
// 특정 강의실 예약 목록 조회
router.get("/:id/reservations", authWithRole("student"), classroomController.getClassroomsReservations);
// 예약 생성
router.post("/:id/reservations", authWithRole("student"), classroomController.postClassroomReservations);
// 예약 취소
router.delete("/:id/reservations/:reservation_id", authWithRole("student"), classroomController.deleteClassroomReservation);

/* ===========================
    강의실 개방 투표
=========================== */
// 이번 주 투표 현황 조회
router.get("/polls", authWithRole("student"), classroomController.getClassroomPolls);
// 투표 규칙 생성
router.post("/polls", authWithRole("professor"), classroomController.postClassroomPolls);
// 투표 규칙 목록 조회
router.get("/polls/rules", authWithRole("professor"), classroomController.getPollRules);
// 투표 규칙 수정
router.put("/polls/rules", authWithRole("professor"), classroomController.putPollRules);
// 투표 규칙 삭제
router.delete("/polls/rules/:rule_id", authWithRole("professor"), classroomController.deletePollRules);
// 투표하기
router.post("/polls/:poll_id/vote", authWithRole("student"), classroomController.postReservationPolls);

export default router;
