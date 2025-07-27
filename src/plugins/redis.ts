import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { logger } from '../utils/logger';

// Redis type already declared by @fastify/redis

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  // Redis configuration
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    // Register Redis plugin
    await fastify.register(fastifyRedis, {
      url: redisUrl,
      closeClient: true,
      // Redis options
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 1000);
      }
    });

    // Test Redis connection
    fastify.addHook('onReady', async () => {
      try {
        await fastify.redis.ping();
        logger.info('✅ Redis connected successfully');
      } catch (error) {
        logger.error('❌ Redis connection test failed', { error: (error as Error).message });
      }
    });

    // Handle Redis errors
    fastify.redis.on('error', (error: Error) => {
      logger.error('Redis error', { error: error.message });
    });

    fastify.redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    fastify.redis.on('ready', () => {
      logger.info('Redis client ready');
    });

    fastify.redis.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

  } catch (error) {
    logger.error('Failed to initialize Redis plugin', { error: (error as Error).message });
    // Don't throw - allow server to start without Redis
    logger.warn('Continuing without Redis caching');
  }
};

export default fp(redisPlugin, {
  name: 'redis'
});
export { redisPlugin };