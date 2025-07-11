import { createClient, RedisClientType } from 'redis';
import { redisConfig } from '../config/redis';
import logger from '../utils/logger';

class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient(redisConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.info('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<any> {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.connect();
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.connect();
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await this.connect();
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Cache invalidate pattern error', { pattern, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.connect();
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error', { key, error });
      return -1;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.connect();
      await this.client.flushAll();
    } catch (error) {
      logger.error('Cache clear error', error);
    }
  }

  // Helper method for caching function results
  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, ttl);
    
    return result;
  }

  // Helper method for cache tags
  async taggedInvalidate(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.invalidatePattern(`tag:${tag}:*`);
    }
  }

  async addToSet(key: string, value: string): Promise<void> {
    try {
      await this.connect();
      await this.client.sAdd(key, value);
    } catch (error) {
      logger.error('Cache add to set error', { key, value, error });
    }
  }

  async removeFromSet(key: string, value: string): Promise<void> {
    try {
      await this.connect();
      await this.client.sRem(key, value);
    } catch (error) {
      logger.error('Cache remove from set error', { key, value, error });
    }
  }

  async getSet(key: string): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error('Cache get set error', { key, error });
      return [];
    }
  }

  async isInSet(key: string, value: string): Promise<boolean> {
    try {
      await this.connect();
      return await this.client.sIsMember(key, value);
    } catch (error) {
      logger.error('Cache is in set error', { key, value, error });
      return false;
    }
  }
}

export default new CacheService();