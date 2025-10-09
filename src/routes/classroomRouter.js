import express from 'express';
import * as classroomController from '../controllers/classroomController.js';
import { authWithRole } from "../middleware/authWithRole.js";

const router = express.Router();

router.get("/", authWithRole("professor"), classroomController.getClassrooms)
router.post("/", authWithRole("professor"), classroomController.postClassrooms)
router.put("/:id", authWithRole("professor"), classroomController.putClassrooms)
router.delete("/:id", authWithRole("professor"), classroomController.deleteClassrooms)


export default router