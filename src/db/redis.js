import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  },
});

redisClient.on('connect', () => {
  console.log('Redis Connected');
});

await redisClient.connect();

export default redisClient;
