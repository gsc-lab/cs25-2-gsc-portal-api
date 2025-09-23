import express from "express";
import cookieParser from "cookie-parser";
import { swaggerUi, specs } from "./docs/swagger.js";

//Router
import adminRouter from './routes/adminRouter.js';
import authRouter from './routes/authRouter.js';
import noticeRouter from './routes/noticeRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// api
// 관리자
app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/notices', noticeRouter);

export default app;
