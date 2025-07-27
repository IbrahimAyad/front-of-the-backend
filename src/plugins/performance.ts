import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { logger } from '../utils/logger';

interface QueryMetrics {
  path: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  cacheHit: boolean;
  dbQueries: number;
}

interface PerformanceStats {
  requests: {
    total: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  slow: {
    count: number;
    threshold: number;
    queries: QueryMetrics[];
  };
  byEndpoint: Record<string, {
    count: number;
    avgDuration: number;
    cacheHitRate: number;
  }>;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxMetricsSize = 10000;

  addMetric(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep metrics size bounded
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  getStats(since?: Date): PerformanceStats {
    const relevantMetrics = since 
      ? this.metrics.filter(m => m.timestamp >= since)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return this.emptyStats();
    }

    // Calculate request statistics
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const totalRequests = relevantMetrics.length;
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / totalRequests;
    const p50Duration = durations[Math.floor(totalRequests * 0.5)];
    const p95Duration = durations[Math.floor(totalRequests * 0.95)];
    const p99Duration = durations[Math.floor(totalRequests * 0.99)];

    // Calculate cache statistics
    const cacheHits = relevantMetrics.filter(m => m.cacheHit).length;
    const cacheMisses = totalRequests - cacheHits;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    // Find slow queries
    const slowQueries = relevantMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);

    // Group by endpoint
    const byEndpoint: Record<string, any> = {};
    relevantMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.path}`;
      if (!byEndpoint[key]) {
        byEndpoint[key] = {
          count: 0,
          totalDuration: 0,
          cacheHits: 0
        };
      }
      byEndpoint[key].count++;
      byEndpoint[key].totalDuration += metric.duration;
      if (metric.cacheHit) {
        byEndpoint[key].cacheHits++;
      }
    });

    // Calculate endpoint averages
    Object.keys(byEndpoint).forEach(key => {
      const endpoint = byEndpoint[key];
      byEndpoint[key] = {
        count: endpoint.count,
        avgDuration: endpoint.totalDuration / endpoint.count,
        cacheHitRate: (endpoint.cacheHits / endpoint.count) * 100
      };
    });

    return {
      requests: {
        total: totalRequests,
        avgDuration,
        p50Duration,
        p95Duration,
        p99Duration
      },
      cache: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: cacheHitRate
      },
      slow: {
        count: slowQueries.length,
        threshold: this.slowQueryThreshold,
        queries: slowQueries
      },
      byEndpoint
    };
  }

  private emptyStats(): PerformanceStats {
    return {
      requests: {
        total: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      slow: {
        count: 0,
        threshold: this.slowQueryThreshold,
        queries: []
      },
      byEndpoint: {}
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    performanceMonitor: PerformanceMonitor;
  }
  
  interface FastifyRequest {
    startTime?: number;
    cacheHit?: boolean;
    dbQueryCount?: number;
  }
}

const performancePlugin: FastifyPluginAsync = async (fastify) => {
  const monitor = new PerformanceMonitor();
  fastify.decorate('performanceMonitor', monitor);

  // Track request start time
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
    request.cacheHit = false;
    request.dbQueryCount = 0;
  });

  // Track cache hits
  fastify.addHook('preHandler', async (request, reply) => {
    // Cache hit detection is set by cache service
    if (request.headers['x-cache-hit'] === 'true') {
      request.cacheHit = true;
    }
  });

  // Record metrics after response
  fastify.addHook('onResponse', async (request, reply) => {
    if (!request.startTime) return;

    const duration = Date.now() - request.startTime;
    const metric: QueryMetrics = {
      path: request.url.split('?')[0], // Remove query params
      method: request.method,
      duration,
      timestamp: new Date(),
      statusCode: reply.statusCode,
      cacheHit: request.cacheHit || false,
      dbQueries: request.dbQueryCount || 0
    };

    monitor.addMetric(metric);

    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        path: metric.path,
        method: metric.method,
        duration,
        cacheHit: metric.cacheHit
      });
    }

    // Add performance headers
    reply.header('X-Response-Time', `${duration}ms`);
    reply.header('X-Cache', request.cacheHit ? 'HIT' : 'MISS');
  });

  // Performance dashboard endpoint
  fastify.get('/performance/stats', async (request, reply) => {
    const { since } = request.query as { since?: string };
    const sinceDate = since ? new Date(since) : undefined;
    
    const stats = monitor.getStats(sinceDate);
    
    return {
      success: true,
      stats,
      period: {
        since: sinceDate || 'all-time',
        until: new Date()
      }
    };
  });

  // Real-time performance metrics endpoint
  fastify.get('/performance/realtime', async (request, reply) => {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    const stats = monitor.getStats(last5Minutes);
    
    return {
      success: true,
      realtime: {
        avgResponseTime: stats.requests.avgDuration,
        requestsPerMinute: stats.requests.total / 5,
        cacheHitRate: stats.cache.hitRate,
        slowQueries: stats.slow.count,
        status: stats.requests.p95Duration < 500 ? 'healthy' : 
                stats.requests.p95Duration < 1000 ? 'degraded' : 'critical'
      },
      timestamp: new Date()
    };
  });

  // Clear performance metrics
  fastify.post('/performance/clear', {
    preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
    handler: async (request, reply) => {
      monitor.clearMetrics();
      return {
        success: true,
        message: 'Performance metrics cleared',
        timestamp: new Date()
      };
    }
  });

  // Database query counter middleware (for Prisma)
  if (fastify.prisma && fastify.prisma.$use) {
    fastify.prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const duration = Date.now() - before;

      // Log slow database queries
      if (duration > 100) {
        logger.warn('Slow database query', {
          model: params.model,
          action: params.action,
          duration
        });
      }

      return result;
    });
  }
};

export default fp(performancePlugin, {
  name: 'performance'
});
export { performancePlugin };