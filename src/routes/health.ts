import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';
import { getDatabaseMonitor } from '../../lib/monitoring/database.monitor';

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

  // Database schema health check
  fastify.get('/health/db-schemas', async (request, reply) => {
    try {
      const databaseMonitor = getDatabaseMonitor();
      const schemas = await databaseMonitor.getSchemaMetrics();
      
      const healthySchemasCount = schemas.filter(s => s.status === 'healthy').length;
      const degradedSchemasCount = schemas.filter(s => s.status === 'degraded').length;
      const unhealthySchemasCount = schemas.filter(s => s.status === 'unhealthy').length;
      
      const overallHealthy = unhealthySchemasCount === 0;
      const statusCode = overallHealthy ? 200 : 503;
      
      const response = {
        success: overallHealthy,
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        summary: {
          total: schemas.length,
          healthy: healthySchemasCount,
          degraded: degradedSchemasCount,
          unhealthy: unhealthySchemasCount,
        },
        schemas: schemas.map(schema => ({
          name: schema.schemaName,
          status: schema.status,
          tableCount: schema.tableCount,
          indexCount: schema.indexCount,
          size: `${schema.schemaSize}MB`,
          avgQueryTime: `${schema.avgQueryTime.toFixed(2)}ms`,
          slowQueries: schema.slowQueries,
          errors: schema.errors,
        })),
      };
      
      reply.status(statusCode).send(response);
    } catch (error) {
      logger.error('Database schema health check failed', { error: (error as Error).message });
      reply.status(503).send({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to check database schema health',
        message: (error as Error).message,
      });
    }
  });

  // Connection pool health check
  fastify.get('/health/connection-pool', async (request, reply) => {
    try {
      const databaseMonitor = getDatabaseMonitor();
      const poolMetrics = await databaseMonitor.getConnectionPoolMetrics();
      
      const isHealthy = poolMetrics.utilization < 90 && poolMetrics.errors < 5;
      const statusCode = isHealthy ? 200 : 503;
      
      let status = 'healthy';
      const issues: string[] = [];
      
      if (poolMetrics.utilization >= 90) {
        status = 'critical';
        issues.push(`Critical connection pool utilization: ${poolMetrics.utilization.toFixed(1)}%`);
      } else if (poolMetrics.utilization >= 75) {
        status = 'degraded';
        issues.push(`High connection pool utilization: ${poolMetrics.utilization.toFixed(1)}%`);
      }
      
      if (poolMetrics.errors >= 5) {
        status = 'critical';
        issues.push(`High error count: ${poolMetrics.errors}`);
      }
      
      const response = {
        success: isHealthy,
        status,
        timestamp: new Date().toISOString(),
        connectionPool: {
          utilization: `${poolMetrics.utilization.toFixed(1)}%`,
          totalConnections: poolMetrics.totalConnections,
          activeConnections: poolMetrics.activeConnections,
          idleConnections: poolMetrics.idleConnections,
          waitingCount: poolMetrics.waitingCount,
          maxConnections: poolMetrics.maxConnections,
          avgWaitTime: `${poolMetrics.avgWaitTime.toFixed(2)}ms`,
          timeouts: poolMetrics.timeouts,
          errors: poolMetrics.errors,
        },
        issues,
      };
      
      reply.status(statusCode).send(response);
    } catch (error) {
      logger.error('Connection pool health check failed', { error: (error as Error).message });
      reply.status(503).send({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to check connection pool health',
        message: (error as Error).message,
      });
    }
  });

  // Query performance health check
  fastify.get('/health/query-performance', async (request, reply) => {
    try {
      const databaseMonitor = getDatabaseMonitor();
      const slowQueries = await databaseMonitor.getSlowQueries(1000, 10); // Get top 10 slow queries over 1s
      const recentQueries = await databaseMonitor.getQueryMetrics(100);
      
      const avgQueryTime = recentQueries.length > 0 
        ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length 
        : 0;
      
      const slowQueryCount = slowQueries.length;
      const criticalSlowQueries = slowQueries.filter(q => q.executionTime > 5000).length;
      
      const isHealthy = avgQueryTime < 1000 && criticalSlowQueries === 0;
      const statusCode = isHealthy ? 200 : 503;
      
      let status = 'healthy';
      const issues: string[] = [];
      
      if (avgQueryTime >= 5000) {
        status = 'critical';
        issues.push(`Critical average query time: ${avgQueryTime.toFixed(2)}ms`);
      } else if (avgQueryTime >= 2000) {
        status = 'degraded';
        issues.push(`High average query time: ${avgQueryTime.toFixed(2)}ms`);
      }
      
      if (criticalSlowQueries > 0) {
        status = 'critical';
        issues.push(`${criticalSlowQueries} queries taking over 5 seconds`);
      } else if (slowQueryCount > 5) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`${slowQueryCount} slow queries detected`);
      }
      
      const response = {
        success: isHealthy,
        status,
        timestamp: new Date().toISOString(),
        performance: {
          avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
          totalQueries: recentQueries.length,
          slowQueries: slowQueryCount,
          criticalSlowQueries,
        },
        slowQueries: slowQueries.slice(0, 5).map(q => ({
          query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
          executionTime: `${q.executionTime}ms`,
          timestamp: q.timestamp.toISOString(),
          schema: q.schema,
          type: q.type,
        })),
        issues,
      };
      
      reply.status(statusCode).send(response);
    } catch (error) {
      logger.error('Query performance health check failed', { error: (error as Error).message });
      reply.status(503).send({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to check query performance',
        message: (error as Error).message,
      });
    }
  });

}

export default healthRoutes; 