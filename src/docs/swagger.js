import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

// __dirname 대체 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
        title: "관리자 페이지 API",
        version: "1.0.0",
        description: "ADMIN API",
        },
    },
    apis: [path.join(__dirname, "./openapi.yaml")], // ✅ 절대 경로로 맞추기
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
