import { createClient } from 'redis';
import { logger } from '../../utils/logger';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Error handling
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

// Connect to Redis
export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

// Disconnect from Redis
export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
}

// Cache wrapper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 3600): Promise<void> {
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
  }
}

// Pattern-based cache clearing
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error(`Redis DEL pattern error for ${pattern}:`, error);
  }
}

export { redisClient };