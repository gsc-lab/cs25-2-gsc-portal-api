import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from './db/redis.js';
import cors from "cors";
import { swaggerUi, specs } from "./docs/swagger.js";
import path from "path";
import dotenv from "dotenv";

import { fileURLToPath } from "url";

//Router
import adminRouter from "./routes/adminRouter.js";
import timetableRouter from "./routes/timetableRouter.js";
import authRouter from "./routes/authRouter.js";
import noticeRouter from "./routes/noticeRouter.js";
import fileRouter from "./routes/fileRouter.js";
import cleaningRouter from "./routes/cleaningRouter.js";
import classroomRouter from "./routes/classroomRouter.js";
import subjectRouter from "./routes/modal/subjectRouter.js";
import commonRouter from "./routes/modal/commonRouter.js";
import dashboardRouter from "./routes/dashboardRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

import { centralErrorHandler } from "./middleware/errorHandler.js";

const app = express();

const corsOptions = {
  origin: process.env.FE_BASE_URL,
  credentials: true,
};
app.use(cors(corsOptions));

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,

      // 임시로 false로 설정 (로컬 HTTP 환경에서 쿠키 저장을 위해)
      // secure: false,
      // 또는 isProd가 아니라고 가정하고 배포
      secure: false, // 혹은 isProd && process.env.COOKIE_SECURE_ALLOWED ,

      // SameSite도 현재 개발 환경에 더 적합한 'lax'로 고정
      sameSite: "lax",     // "none"은 HTTPS와 함께 사용

      // domain 설정도 일단 주석처리하거나 undefined로 변경 (IP/Port 기반으로 테스트 시)
      // domain: isProd ? process.env.SESSION_COOKIE_DOMAIN : undefined,
      domain: undefined,

      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // 클라이언트에서 application/x-www-form-urlencoded 데이터를 보냈을때 파싱해서 body 객체에 넣어줌
// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
// 파일 디렉토리 설정
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// api
app.use("/api/admin", adminRouter);
app.use("/api/timetables", timetableRouter);
app.use("/api/auth", authRouter);
app.use("/api/notices", noticeRouter);
app.use("/api/files", fileRouter);
app.use("/api/cleaning-rosters", cleaningRouter);
app.use("/api/classrooms", classroomRouter);
app.use("/api/modal/subjects", subjectRouter);
app.use("/api/modal/common", commonRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(centralErrorHandler);
export default app;
