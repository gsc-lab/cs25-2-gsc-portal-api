import express from 'express';
import * as classroomController from '../controllers/classroomController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

// 강의실 CRUD
router.get("/", authWithRole("professor"), classroomController.getClassrooms)
router.post("/", authWithRole("professor"), classroomController.postClassrooms)
router.put("/:id", authWithRole("professor"), classroomController.putClassrooms)
router.delete("/:id", authWithRole("professor"), classroomController.deleteClassrooms)

// 강의실 예약
router.get("/:id/reservations", authWithRole("student"), classroomController.getClassroomsReservations)
router.post("/:id/reservations", authWithRole("student"), classroomController.postClassroomReservations)
router.delete("/:id/reservations/:reservation_id", authWithRole("student"), classroomController.deleteClassroomReservation);

// 이번 주 강의실 개방 투표 현황 조회
router.get("/polls", classroomController.getClassroomPolls)
router.post("/polls", classroomController.postClassroomPolls)
router.get("/polls/rules", classroomController.getPollRules)
router.put("/polls/rules", classroomController.putPollRules)
router.delete("/polls/rules/:rule_id", classroomController.deletePollRules)
router.post("/polls/:poll_id/vote", classroomController.postReservationPolls)


export default router