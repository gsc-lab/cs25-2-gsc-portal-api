import express from "express";
import cookieParser from "cookie-parser";
import { swaggerUi, specs } from "./docs/swagger.js";

//Router
import adminRouter from './routes/adminRouter.js';
import timetableRouter from './routes/timetableRouter.js';
import commonRouter from './routes/modal/commonRouter.js';


const app = express();
app.use(express.json());
app.use(cookieParser());

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// api
// 관리자
app.use('/admin', adminRouter);
// 시간표
app.use('/timetables', timetableRouter);
// 모달
app.use('/modal', commonRouter);

export default app;
