import express from "express";
import { swaggerUi, specs } from "./docs/swagger.js";

import cookieParser from "cookie-parser";


import authRouter from "./routes/authRouter.js";
const app = express();
app.use(express.json());
app.use(cookieParser());

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// api


// 권한 & 인증
app.use("/api/auth", authRouter);
export default app;