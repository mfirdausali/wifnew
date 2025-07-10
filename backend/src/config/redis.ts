import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://:localpass@localhost:6379';

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  logger.info('Redis Client Connected');
});

// Connect to Redis
redis.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
  // Don't exit the process, allow the app to run without Redis
});