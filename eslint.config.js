import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  // ESLint가 추천하는 기본 규칙 세트
  js.configs.recommended,
  // Prettier와 충돌하는 스타일 규칙을 비활성화
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node, // Node.js 전역 변수 인식
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
