import express from "express";
import { swaggerUi, specs } from "../docs/swagger.js";

const app = express();
app.use(express.json());

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));


export default app;
