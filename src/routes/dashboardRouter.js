import express from "express";
import { authWithRole } from "../middleware/authWithRole.js";
import * as dashboardController from "../controllers/dashboardController.js";
const router = express.Router();

router.get("/", authWithRole("student"), dashboardController.getDashboardData);

export default router;
