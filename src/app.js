import express from "express";
import cookieParser from "cookie-parser";
import { swaggerUi, specs } from "./docs/swagger.js";
import path from "path";
import { fileURLToPath } from "url";
//Router
import adminRouter from "./routes/adminRouter.js";
import authRouter from "./routes/authRouter.js";
import noticeRouter from "./routes/noticeRouter.js";
import fileRouter from "./routes/fileRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
// 파일 디렉토리 설정
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// api
// 관리자
app.use("/admin", adminRouter);
app.use("/auth", authRouter);
app.use("/notices", noticeRouter);
app.use("/files", fileRouter);

export default app;
