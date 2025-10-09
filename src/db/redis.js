import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

const redisClient = createClient({
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  socket: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  },
});

// 서버 다운 방지 핸들러
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// 비동기 함수로 감싸 Top-level await 처리
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis Client Error:', err);
  }
})();

export default redisClient;
