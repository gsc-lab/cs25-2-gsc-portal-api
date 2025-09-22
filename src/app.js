import express from "express";
import { swaggerUi, specs } from "./docs/swagger.js";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.router.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send(`<a href='/api/auth/'>구글</a>`);
});

export default app;
