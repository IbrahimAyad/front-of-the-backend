import type { NextApiRequest, NextApiResponse } from 'next';
import { resilientDb } from '../../../lib/db/nextjs/resilient-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metrics = resilientDb.getMetrics();
    
    // Get recent slow queries if monitoring is enabled
    let slowQueries: any[] = [];
    let recentQueries: any[] = [];
    
    if (metrics.connection) {
      // @ts-ignore - accessing private methods for metrics
      const monitor = resilientDb.connectionMonitor;
      if (monitor) {
        slowQueries = monitor.getSlowQueries(5);
        recentQueries = monitor.getRecentQueries(10);
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      circuitBreaker: {
        state: metrics.circuitBreaker.state,
        metrics: metrics.circuitBreaker
      },
      retry: {
        metrics: metrics.retry,
        topRetryReasons: metrics.retry.retryReasons 
          ? Array.from(metrics.retry.retryReasons.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([reason, count]) => ({ reason, count }))
          : []
      },
      connection: metrics.connection || {
        healthScore: 100,
        totalQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0
      },
      performance: {
        slowQueries: slowQueries.map(q => ({
          query: q.query,
          duration: q.duration,
          timestamp: q.timestamp
        })),
        recentQueries: recentQueries.map(q => ({
          query: q.query,
          duration: q.duration,
          timestamp: q.timestamp,
          error: q.error
        }))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[API] Failed to get database metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: (error as Error).message
    });
  }
}