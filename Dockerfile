# --- Build stage ---
FROM node:lts AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # 빌드 결과물 생성

# --- Production stage ---
FROM node:lts-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production  # 여기서 새로 설치
COPY --from=build /app/dist ./dist  # 빌드 결과물만 복사
COPY --from=build /app/.env .env    # env 파일 명시적으로 복사
EXPOSE 3000
CMD ["node", "dist/main.js"]
