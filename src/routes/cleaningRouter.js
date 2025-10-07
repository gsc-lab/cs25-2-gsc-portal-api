import express from "express";
import * as cleaningController from "../controllers/cleaningController.js";
import { authWithRole } from "../middleware/authWithRole.js";
const router = express.Router();

router.post(
  "/generate",
  authWithRole("admin"),
  cleaningController.generateCleaningRosters,
);

router.get("/",
    authWithRole("student"),
    cleaningController.getCleaningRosters
);

router.delete(
  "/",
  authWithRole("admin"),
  cleaningController.deleteRosterByGrade,
);

export default router;
