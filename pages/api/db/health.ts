import type { NextApiRequest, NextApiResponse } from 'next';
import { resilientDb } from '../../../lib/db/nextjs/resilient-client';
import { checkDatabaseHealth } from '../../../lib/db/nextjs/database-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get health check
    const health = await checkDatabaseHealth();
    
    // Get resilience metrics
    const metrics = resilientDb.getMetrics();
    
    // Determine overall status
    const isHealthy = health.healthy && 
      metrics.circuitBreaker.state !== 'OPEN' &&
      (metrics.connection?.healthScore || 100) > 50;

    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: health.healthy,
        latency: health.latency,
        error: health.error
      },
      resilience: {
        circuitBreaker: {
          state: metrics.circuitBreaker.state,
          failures: metrics.circuitBreaker.failedRequests,
          successes: metrics.circuitBreaker.successfulRequests
        },
        retry: {
          attempts: metrics.retry.totalAttempts,
          successes: metrics.retry.successfulAttempts,
          failures: metrics.retry.failedAttempts
        },
        monitoring: metrics.connection ? {
          healthScore: metrics.connection.healthScore,
          totalQueries: metrics.connection.totalQueries,
          failedQueries: metrics.connection.failedQueries,
          averageQueryTime: Math.round(metrics.connection.averageQueryTime)
        } : null
      }
    };

    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    console.error('[API] Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
}