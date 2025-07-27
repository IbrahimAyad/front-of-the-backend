import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/utils/logger';
import { EventEmitter } from 'events';

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  connectionErrors: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionStorms: number;
  lastConnectionStorm?: Date;
  poolUtilization: number;
  healthScore: number; // 0-100
}

export interface ConnectionEvent {
  type: 'connection' | 'disconnection' | 'error' | 'slow_query' | 'storm';
  timestamp: Date;
  details: any;
  duration?: number;
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  error?: string;
}

export class ConnectionMonitor extends EventEmitter {
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    connectionErrors: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    connectionStorms: 0,
    poolUtilization: 0,
    healthScore: 100
  };

  private events: ConnectionEvent[] = [];
  private queryMetrics: QueryMetrics[] = [];
  private connectionTimestamps: Date[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private stormThreshold = 50; // connections per second
  private slowQueryThreshold = 1000; // ms

  constructor(
    private prisma: PrismaClient,
    private maxConnections: number = parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20')
  ) {
    super();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor connection pool every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateConnectionMetrics();
        this.detectConnectionStorms();
        this.calculateHealthScore();
        this.cleanupOldData();
      } catch (error) {
        logger.error('Connection monitoring error', { error: (error as Error).message });
      }
    }, 5000);

    logger.info('Connection monitoring started', {
      maxConnections: this.maxConnections,
      stormThreshold: this.stormThreshold
    });
  }

  private async updateConnectionMetrics(): Promise<void> {
    try {
      // Get PostgreSQL connection statistics
      const result = await this.prisma.$queryRaw<Array<{
        state: string;
        count: bigint;
        avg_duration: number;
      }>>`
        SELECT 
          state,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (now() - state_change))) as avg_duration
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      let active = 0;
      let idle = 0;
      let waiting = 0;

      result.forEach(row => {
        const count = Number(row.count);
        switch (row.state) {
          case 'active':
            active = count;
            break;
          case 'idle':
            idle = count;
            break;
          case 'idle in transaction':
          case 'idle in transaction (aborted)':
            waiting += count;
            break;
        }
      });

      this.metrics.activeConnections = active;
      this.metrics.idleConnections = idle;
      this.metrics.waitingRequests = waiting;
      this.metrics.totalConnections = active + idle + waiting;
      this.metrics.poolUtilization = (this.metrics.totalConnections / this.maxConnections) * 100;

      // Emit high utilization warning
      if (this.metrics.poolUtilization > 80) {
        this.emit('highUtilization', {
          utilization: this.metrics.poolUtilization,
          active: active,
          total: this.metrics.totalConnections
        });
      }

    } catch (error) {
      logger.error('Failed to update connection metrics', { error });
      this.metrics.connectionErrors++;
    }
  }

  private detectConnectionStorms(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Count connections in the last second
    const recentConnections = this.connectionTimestamps.filter(
      ts => ts.getTime() > oneSecondAgo
    ).length;

    if (recentConnections > this.stormThreshold) {
      this.metrics.connectionStorms++;
      this.metrics.lastConnectionStorm = new Date();
      
      const event: ConnectionEvent = {
        type: 'storm',
        timestamp: new Date(),
        details: {
          connectionsPerSecond: recentConnections,
          threshold: this.stormThreshold
        }
      };

      this.events.push(event);
      this.emit('connectionStorm', event);

      logger.warn('Connection storm detected', {
        connectionsPerSecond: recentConnections,
        threshold: this.stormThreshold
      });
    }
  }

  private calculateHealthScore(): void {
    let score = 100;

    // Deduct points for various issues
    if (this.metrics.poolUtilization > 90) score -= 30;
    else if (this.metrics.poolUtilization > 75) score -= 15;
    else if (this.metrics.poolUtilization > 60) score -= 5;

    // Connection errors
    if (this.metrics.connectionErrors > 10) score -= 20;
    else if (this.metrics.connectionErrors > 5) score -= 10;
    else if (this.metrics.connectionErrors > 0) score -= 5;

    // Slow queries
    const slowQueryRate = this.metrics.slowQueries / Math.max(this.queryMetrics.length, 1);
    if (slowQueryRate > 0.2) score -= 20;
    else if (slowQueryRate > 0.1) score -= 10;
    else if (slowQueryRate > 0.05) score -= 5;

    // Recent storms
    if (this.metrics.lastConnectionStorm) {
      const timeSinceStorm = Date.now() - this.metrics.lastConnectionStorm.getTime();
      if (timeSinceStorm < 60000) score -= 20; // Less than 1 minute
      else if (timeSinceStorm < 300000) score -= 10; // Less than 5 minutes
    }

    this.metrics.healthScore = Math.max(0, score);

    // Emit health alerts
    if (this.metrics.healthScore < 50) {
      this.emit('unhealthy', {
        score: this.metrics.healthScore,
        metrics: this.metrics
      });
    }
  }

  private cleanupOldData(): void {
    const fiveMinutesAgo = Date.now() - 300000;
    
    // Clean old events
    this.events = this.events.filter(e => e.timestamp.getTime() > fiveMinutesAgo);
    
    // Clean old query metrics
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp.getTime() > fiveMinutesAgo);
    
    // Clean old connection timestamps
    this.connectionTimestamps = this.connectionTimestamps.filter(
      ts => ts.getTime() > fiveMinutesAgo
    );
  }

  // Public methods for tracking
  trackConnection(): void {
    this.connectionTimestamps.push(new Date());
    this.metrics.totalConnections++;
    
    this.events.push({
      type: 'connection',
      timestamp: new Date(),
      details: { total: this.metrics.totalConnections }
    });
  }

  trackDisconnection(): void {
    this.events.push({
      type: 'disconnection',
      timestamp: new Date(),
      details: { total: this.metrics.totalConnections }
    });
  }

  trackQuery(query: string, duration: number, error?: Error): void {
    const metric: QueryMetrics = {
      query: query.substring(0, 200),
      duration,
      timestamp: new Date(),
      error: error?.message
    };

    this.queryMetrics.push(metric);

    // Update average query time
    const totalTime = this.queryMetrics.reduce((sum, q) => sum + q.duration, 0);
    this.metrics.averageQueryTime = totalTime / this.queryMetrics.length;

    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      this.metrics.slowQueries++;
      
      this.events.push({
        type: 'slow_query',
        timestamp: new Date(),
        duration,
        details: { query: metric.query }
      });

      this.emit('slowQuery', metric);
    }

    // Track errors
    if (error) {
      this.metrics.connectionErrors++;
      
      this.events.push({
        type: 'error',
        timestamp: new Date(),
        details: { error: error.message, query: metric.query }
      });
    }
  }

  trackConnectionError(error: Error): void {
    this.metrics.connectionErrors++;
    
    const event: ConnectionEvent = {
      type: 'error',
      timestamp: new Date(),
      details: {
        error: error.message,
        code: (error as any).code
      }
    };

    this.events.push(event);
    this.emit('connectionError', event);
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getEvents(limit: number = 100): ConnectionEvent[] {
    return this.events.slice(-limit);
  }

  getProblematicQueries(limit: number = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter(q => q.duration > this.slowQueryThreshold || q.error)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  generateReport(): string {
    const report = `Connection Monitoring Report
========================================
Generated: ${new Date().toISOString()}

Connection Pool Status:
- Total Connections: ${this.metrics.totalConnections}
- Active: ${this.metrics.activeConnections}
- Idle: ${this.metrics.idleConnections}
- Waiting: ${this.metrics.waitingRequests}
- Pool Utilization: ${this.metrics.poolUtilization.toFixed(1)}%
- Max Connections: ${this.maxConnections}

Performance Metrics:
- Average Query Time: ${this.metrics.averageQueryTime.toFixed(2)}ms
- Slow Queries: ${this.metrics.slowQueries}
- Connection Errors: ${this.metrics.connectionErrors}
- Connection Storms: ${this.metrics.connectionStorms}
${this.metrics.lastConnectionStorm ? `- Last Storm: ${this.metrics.lastConnectionStorm.toISOString()}` : ''}

Health Score: ${this.metrics.healthScore}/100

Recent Issues:
${this.events
  .filter(e => e.type === 'error' || e.type === 'storm')
  .slice(-5)
  .map(e => `- [${e.timestamp.toISOString()}] ${e.type}: ${JSON.stringify(e.details)}`)
  .join('\n') || '- No recent issues'}

Top Slow Queries:
${this.getProblematicQueries(5)
  .map(q => `- ${q.duration}ms: ${q.query}`)
  .join('\n') || '- No slow queries'}
`;

    return report;
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.removeAllListeners();
    logger.info('Connection monitoring stopped');
  }
}

// Connection monitoring middleware
export function createConnectionMonitoringMiddleware(monitor: ConnectionMonitor) {
  return {
    async $allOperations(params: any, next: (params: any) => Promise<any>) {
      const start = Date.now();
      monitor.trackConnection();

      try {
        const result = await next(params);
        const duration = Date.now() - start;
        monitor.trackQuery(params.action, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        monitor.trackQuery(params.action, duration, error as Error);
        monitor.trackConnectionError(error as Error);
        throw error;
      } finally {
        monitor.trackDisconnection();
      }
    }
  };
}