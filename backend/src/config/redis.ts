import Redis from 'ioredis';
import { env } from './env';

// Create Redis client
const redis = new Redis(env.REDIS_URL, {
  password: env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// Event handlers
redis.on('connect', () => {
  console.log('🔄 Redis connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
});

process.on('SIGTERM', async () => {
  await redis.quit();
});

export { redis };
export default redis;