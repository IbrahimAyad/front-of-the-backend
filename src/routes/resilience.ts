import { FastifyInstance } from 'fastify';
import { getResilientPrismaClient } from '../../lib/db/resilient-client';
import { PoolOptimizer, POOL_CONFIGS, HEALTH_CHECK_QUERY } from '../../lib/db/pool-optimizer';
import { logger } from '../utils/logger';

async function resilienceRoutes(fastify: FastifyInstance) {
  // Get resilient client metrics
  fastify.get('/resilience/metrics', async (request, reply) => {
    try {
      const resilientClient = getResilientPrismaClient();
      const metrics = resilientClient.getMetrics();
      
      reply.send({
        success: true,
        timestamp: new Date().toISOString(),
        metrics
      });
    } catch (error) {
      logger.error('Failed to get resilience metrics', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve resilience metrics',
        message: (error as Error).message
      });
    }
  });

  // Database health check with resilience info
  fastify.get('/resilience/health', async (request, reply) => {
    try {
      const resilientClient = getResilientPrismaClient();
      const health = await resilientClient.healthCheck();
      
      const statusCode = health.healthy ? 200 : 503;
      
      reply.status(statusCode).send({
        success: health.healthy,
        timestamp: new Date().toISOString(),
        ...health
      });
    } catch (error) {
      logger.error('Resilience health check failed', { error: (error as Error).message });
      reply.status(503).send({
        success: false,
        error: 'Health check failed',
        message: (error as Error).message
      });
    }
  });

  // Generate detailed resilience report
  fastify.get('/resilience/report', async (request, reply) => {
    try {
      const resilientClient = getResilientPrismaClient();
      const report = resilientClient.generateReport();
      
      reply
        .header('Content-Type', 'text/plain')
        .send(report);
    } catch (error) {
      logger.error('Failed to generate resilience report', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to generate report',
        message: (error as Error).message
      });
    }
  });

  // Test circuit breaker
  fastify.post('/resilience/test/circuit-breaker', async (request, reply) => {
    try {
      const { simulateFailures = 5 } = request.body as { simulateFailures?: number };
      const resilientClient = getResilientPrismaClient();
      const results = [];

      for (let i = 0; i < simulateFailures + 2; i++) {
        try {
          // Simulate a failing query
          await resilientClient.client.$queryRaw`SELECT pg_sleep(0.1); ${i < simulateFailures ? 'INVALID SQL' : ''}`;
          results.push({ attempt: i + 1, success: true });
        } catch (error) {
          results.push({ 
            attempt: i + 1, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }

      const metrics = resilientClient.getMetrics();
      
      reply.send({
        success: true,
        test: 'circuit-breaker',
        simulatedFailures: simulateFailures,
        results,
        circuitBreakerState: metrics.circuitBreaker.state,
        metrics: metrics.circuitBreaker
      });
    } catch (error) {
      logger.error('Circuit breaker test failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Test failed',
        message: (error as Error).message
      });
    }
  });

  // Test retry logic
  fastify.post('/resilience/test/retry', async (request, reply) => {
    try {
      const { failTimes = 2 } = request.body as { failTimes?: number };
      let attempts = 0;
      
      const resilientClient = getResilientPrismaClient();
      const startTime = Date.now();

      try {
        await resilientClient.client.$queryRaw`
          SELECT CASE 
            WHEN ${attempts++} < ${failTimes} 
            THEN pg_terminate_backend(pg_backend_pid())
            ELSE 1 
          END
        `;
      } catch (error) {
        // Expected to fail initially
      }

      const duration = Date.now() - startTime;
      const metrics = resilientClient.getMetrics();

      reply.send({
        success: true,
        test: 'retry-logic',
        configuredFailures: failTimes,
        actualAttempts: attempts,
        duration,
        retryMetrics: metrics.retry
      });
    } catch (error) {
      logger.error('Retry test failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Test failed',
        message: (error as Error).message
      });
    }
  });

  // Pool configuration endpoint
  fastify.get('/resilience/pool-config', async (request, reply) => {
    try {
      const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
      const expectedConcurrency = parseInt(process.env.EXPECTED_CONCURRENCY || '100');
      
      const optimalConfig = PoolOptimizer.getOptimalConfiguration(environment, expectedConcurrency);
      const platformConfig = process.env.PLATFORM === 'railway' ? POOL_CONFIGS.railway : optimalConfig;

      reply.send({
        success: true,
        environment,
        expectedConcurrency,
        platform: process.env.PLATFORM || 'unknown',
        currentConfig: {
          maxConnections: process.env.DATABASE_MAX_CONNECTIONS,
          connectionTimeout: process.env.DATABASE_CONNECTION_TIMEOUT,
          statementTimeout: process.env.DATABASE_STATEMENT_TIMEOUT
        },
        optimalConfig,
        platformConfig,
        connectionUrl: PoolOptimizer.generatePrismaUrl(
          process.env.DATABASE_URL || 'postgresql://localhost',
          platformConfig
        ).replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Hide credentials
      });
    } catch (error) {
      logger.error('Failed to get pool configuration', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to get pool configuration',
        message: (error as Error).message
      });
    }
  });

  // PostgreSQL configuration recommendations
  fastify.get('/resilience/postgres-config', async (request, reply) => {
    try {
      const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
      const optimalPoolConfig = PoolOptimizer.getOptimalConfiguration(environment, 100);
      const postgresConfig = PoolOptimizer.generatePostgreSQLConfig(optimalPoolConfig);

      reply.send({
        success: true,
        environment,
        recommendations: postgresConfig,
        notes: {
          application: 'Apply these settings to your PostgreSQL instance',
          restart: 'Some settings require a database restart',
          monitoring: 'Monitor performance after applying changes'
        }
      });
    } catch (error) {
      logger.error('Failed to generate PostgreSQL config', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to generate configuration',
        message: (error as Error).message
      });
    }
  });

  // Live connection test
  fastify.get('/resilience/connection-test', async (request, reply) => {
    try {
      const resilientClient = getResilientPrismaClient();
      const tests = {
        basic: { success: false, duration: 0 },
        health: { success: false, duration: 0, data: null as any },
        concurrent: { success: false, duration: 0, count: 0 }
      };

      // Basic connection test
      const basicStart = Date.now();
      try {
        await resilientClient.client.$queryRaw`SELECT 1`;
        tests.basic.success = true;
        tests.basic.duration = Date.now() - basicStart;
      } catch (error) {
        logger.error('Basic connection test failed', { error });
      }

      // Health query test
      const healthStart = Date.now();
      try {
        const [result] = await resilientClient.client.$queryRawUnsafe<any[]>(HEALTH_CHECK_QUERY);
        tests.health.success = true;
        tests.health.duration = Date.now() - healthStart;
        tests.health.data = result;
      } catch (error) {
        logger.error('Health query test failed', { error });
      }

      // Concurrent connection test
      const concurrentStart = Date.now();
      try {
        const promises = Array(10).fill(0).map((_, i) => 
          resilientClient.client.$queryRaw`SELECT ${i} as test_id, pg_sleep(0.05)`
        );
        const results = await Promise.all(promises);
        tests.concurrent.success = true;
        tests.concurrent.duration = Date.now() - concurrentStart;
        tests.concurrent.count = results.length;
      } catch (error) {
        logger.error('Concurrent connection test failed', { error });
      }

      const allSuccess = Object.values(tests).every(test => test.success);

      reply.status(allSuccess ? 200 : 503).send({
        success: allSuccess,
        timestamp: new Date().toISOString(),
        tests,
        metrics: resilientClient.getMetrics().connection
      });
    } catch (error) {
      logger.error('Connection test failed', { error: (error as Error).message });
      reply.status(503).send({
        success: false,
        error: 'Connection test failed',
        message: (error as Error).message
      });
    }
  });
}

export default resilienceRoutes;