import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };
  });

  // Detailed health check with dependencies
  fastify.get('/health/detailed', async (request, reply) => {
    const health = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: 'unknown',
        prisma: 'unknown'
      }
    };

    try {
      // Check database connection
      if (fastify.prisma) {
        await fastify.prisma.$queryRaw`SELECT 1`;
        health.dependencies.database = 'healthy';
        health.dependencies.prisma = 'connected';
      } else {
        health.dependencies.database = 'disconnected';
        health.dependencies.prisma = 'not_initialized';
        health.success = false;
        health.status = 'degraded';
      }
    } catch (error) {
      logger.error('Health check database error', { error: (error as Error).message });
      health.dependencies.database = 'unhealthy';
      health.dependencies.prisma = 'error';
      health.success = false;
      health.status = 'unhealthy';
    }

    const statusCode = health.success ? 200 : 503;
    reply.status(statusCode).send(health);
  });

  // Readiness probe (for Kubernetes/Railway)
  fastify.get('/ready', async (request, reply) => {
    try {
      // Check if the app is ready to serve traffic
      if (fastify.prisma) {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return { ready: true };
      } else {
        reply.status(503).send({ ready: false, reason: 'database_not_connected' });
      }
    } catch (error) {
      reply.status(503).send({ 
        ready: false, 
        reason: 'database_error',
        error: (error as Error).message 
      });
    }
  });

  // Liveness probe (for Kubernetes/Railway)
  fastify.get('/live', async (request, reply) => {
    // Simple liveness check - just return that the process is running
    return { 
      alive: true,
      timestamp: new Date().toISOString()
    };
  });
}

export default healthRoutes; 