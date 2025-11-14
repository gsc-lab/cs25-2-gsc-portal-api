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
  legacyMode: true,
});

redisClient.on('connect', () => console.log('Redis is connecting...'));
redisClient.on('ready', () => console.log('Redis client ready to use.'));
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('end', () => console.log('Redis connection closed.'));

// Nodemon 환경에서 서버가 재시작될 때 충돌 방지
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error);
}

export default redisClient;
