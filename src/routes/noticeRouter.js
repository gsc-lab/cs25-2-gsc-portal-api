import express from "express";
import * as noticeController from '../controllers/noticeController.js';
import { authWithRole } from '../middleware/authWithRole.js';

const router = express.Router();

router.get('/', authWithRole('student'), noticeController.fetchNotices);

export default router;