import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

export interface ConnectionMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionErrors: number;
  lastError?: Date;
  healthScore: number;
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  error?: string;
}

// Simplified connection monitor for serverless
export class ConnectionMonitor extends EventEmitter {
  private metrics: ConnectionMetrics = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    connectionErrors: 0,
    healthScore: 100
  };

  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold = 500; // 500ms for serverless
  private metricsWindow = 300000; // 5 minutes

  constructor(
    private prisma: PrismaClient,
    private maxConnections: number = 5
  ) {
    super();
    
    // Periodically clean old metrics
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanupOldMetrics(), 60000); // Every minute
    }
  }

  trackQuery(query: string, duration: number, error?: Error): void {
    const metric: QueryMetrics = {
      query: query.substring(0, 100),
      duration,
      timestamp: new Date(),
      error: error?.message
    };

    this.queryMetrics.push(metric);
    this.metrics.totalQueries++;

    if (error) {
      this.metrics.failedQueries++;
      this.metrics.connectionErrors++;
      this.metrics.lastError = new Date();
      
      this.emit('error', {
        query: metric.query,
        error: error.message,
        duration
      });
    } else {
      this.metrics.successfulQueries++;
    }

    // Update average query time
    const recentQueries = this.queryMetrics.filter(q => !q.error);
    if (recentQueries.length > 0) {
      const totalTime = recentQueries.reduce((sum, q) => sum + q.duration, 0);
      this.metrics.averageQueryTime = totalTime / recentQueries.length;
    }

    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      this.metrics.slowQueries++;
      this.emit('slowQuery', metric);
    }

    // Update health score
    this.updateHealthScore();
  }

  trackConnection(): void {
    // Simplified for serverless - no persistent connection tracking
  }

  trackDisconnection(): void {
    // Simplified for serverless - no persistent connection tracking
  }

  trackConnectionError(error: Error): void {
    this.metrics.connectionErrors++;
    this.metrics.lastError = new Date();
    
    this.emit('connectionError', {
      error: error.message,
      timestamp: new Date()
    });
    
    this.updateHealthScore();
  }

  private updateHealthScore(): void {
    let score = 100;

    // Error rate impact
    const errorRate = this.metrics.failedQueries / Math.max(this.metrics.totalQueries, 1);
    if (errorRate > 0.1) score -= 30;
    else if (errorRate > 0.05) score -= 15;
    else if (errorRate > 0.01) score -= 5;

    // Slow query impact
    const slowQueryRate = this.metrics.slowQueries / Math.max(this.metrics.totalQueries, 1);
    if (slowQueryRate > 0.2) score -= 20;
    else if (slowQueryRate > 0.1) score -= 10;
    else if (slowQueryRate > 0.05) score -= 5;

    // Recent errors impact
    if (this.metrics.lastError) {
      const timeSinceError = Date.now() - this.metrics.lastError.getTime();
      if (timeSinceError < 60000) score -= 10; // Less than 1 minute
    }

    // High average query time
    if (this.metrics.averageQueryTime > 1000) score -= 15;
    else if (this.metrics.averageQueryTime > 500) score -= 5;

    this.metrics.healthScore = Math.max(0, score);

    if (this.metrics.healthScore < 50) {
      this.emit('unhealthy', {
        score: this.metrics.healthScore,
        metrics: this.metrics
      });
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsWindow;
    
    // Keep only recent query metrics
    const oldLength = this.queryMetrics.length;
    this.queryMetrics = this.queryMetrics.filter(
      q => q.timestamp.getTime() > cutoff
    );

    // Reset counters if significant cleanup occurred
    if (oldLength > 100 && this.queryMetrics.length < oldLength / 2) {
      this.resetCounters();
    }
  }

  private resetCounters(): void {
    // Recalculate metrics based on remaining data
    this.metrics.totalQueries = this.queryMetrics.length;
    this.metrics.successfulQueries = this.queryMetrics.filter(q => !q.error).length;
    this.metrics.failedQueries = this.queryMetrics.filter(q => q.error).length;
    this.metrics.slowQueries = this.queryMetrics.filter(q => q.duration > this.slowQueryThreshold).length;
    
    // Keep connection errors as cumulative
    // Keep last error timestamp
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getRecentQueries(limit: number = 10): QueryMetrics[] {
    return this.queryMetrics
      .slice(-limit)
      .reverse();
  }

  getSlowQueries(limit: number = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  stop(): void {
    this.removeAllListeners();
  }
}

// Export a simplified monitoring middleware for Next.js
export function withConnectionMonitoring(monitor: ConnectionMonitor) {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const start = Date.now();

    try {
      const result = await next(params);
      const duration = Date.now() - start;
      monitor.trackQuery(params.action || 'unknown', duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      monitor.trackQuery(params.action || 'unknown', duration, error as Error);
      monitor.trackConnectionError(error as Error);
      throw error;
    }
  };
}