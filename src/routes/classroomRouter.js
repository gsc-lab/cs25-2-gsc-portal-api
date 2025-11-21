import express from 'express';
import * as classroomController from '../controllers/classroomController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 강의실 CRUD
router.get("/", authWithRole("student"), classroomController.getClassrooms)
router.post("/", authWithRole("professor"), classroomController.postClassrooms)
router.put("/:id", authWithRole("professor"), classroomController.putClassrooms)
router.delete("/:id", authWithRole("professor"), classroomController.deleteClassrooms)

// 강의실 예약
router.get("/:id/reservations", authWithRole("student"), classroomController.getClassroomsReservations)
router.post("/:id/reservations", authWithRole("student"), classroomController.postClassroomReservations)
router.delete("/:id/reservations/:reservation_id", authWithRole("student"), classroomController.deleteClassroomReservation);

// 이번 주 강의실 개방 투표 현황 조회
router.get("/polls", authWithRole("student"), classroomController.getClassroomPolls)
router.post("/polls", authWithRole("professor"), classroomController.postClassroomPolls)
router.get("/polls/rules", authWithRole("professor"), classroomController.getPollRules)
router.put("/polls/rules", authWithRole("professor"), classroomController.putPollRules)
router.delete("/polls/rules/:rule_id", authWithRole("professor"), classroomController.deletePollRules)
router.post("/polls/:poll_id/vote", authWithRole("student"), classroomController.postReservationPolls)


export default router