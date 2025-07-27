import { getPerformanceMonitor, getMemoryMonitor, PerformanceStats, MemoryStats } from './performance.monitor'
import { CacheService } from '../services/cache.service'
import { prisma } from '../prisma'

export interface SystemMetrics {
  timestamp: Date
  performance: PerformanceStats[]
  memory: MemoryStats
  database: DatabaseMetrics
  cache: CacheMetrics
  errors: ErrorMetrics[]
}

export interface DatabaseMetrics {
  activeConnections: number
  queryCount: number
  slowQueries: number
  avgQueryTime: number
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  evictionRate: number
  memoryUsage: number
  keyCount: number
}

export interface ErrorMetrics {
  timestamp: Date
  type: string
  message: string
  stack?: string
  endpoint?: string
  userId?: string
}

export class MetricsCollector {
  private performanceMonitor = getPerformanceMonitor()
  private memoryMonitor = getMemoryMonitor()
  private cacheService: CacheService
  private errors: ErrorMetrics[] = []
  private dbQueryCount = 0
  private dbSlowQueries = 0
  private dbTotalQueryTime = 0
  private cacheHits = 0
  private cacheMisses = 0
  private cacheEvictions = 0

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService
    this.setupMonitoring()
  }

  private setupMonitoring() {
    // Start memory monitoring
    this.memoryMonitor.start()

    // Monitor performance events
    this.performanceMonitor.on('metric', (metric) => {
      if (metric.name.startsWith('DB.')) {
        this.dbQueryCount++
        this.dbTotalQueryTime += metric.duration
        if (metric.duration > 100) { // Slow query threshold: 100ms
          this.dbSlowQueries++
        }
      }
    })

    // Monitor memory warnings
    this.memoryMonitor.on('leak-warning', (warning) => {
      this.recordError({
        timestamp: new Date(),
        type: 'MemoryLeak',
        message: `Potential memory leak detected: ${(warning.avgGrowth / 1024 / 1024).toFixed(2)}MB/interval`,
      })
    })

    // Reset counters periodically
    setInterval(() => {
      this.resetCounters()
    }, 300000) // 5 minutes
  }

  private resetCounters() {
    this.dbQueryCount = 0
    this.dbSlowQueries = 0
    this.dbTotalQueryTime = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    this.cacheEvictions = 0
  }

  recordCacheHit() {
    this.cacheHits++
  }

  recordCacheMiss() {
    this.cacheMisses++
  }

  recordCacheEviction() {
    this.cacheEvictions++
  }

  recordError(error: ErrorMetrics) {
    this.errors.push(error)
    // Keep only recent errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000)
    }
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const performanceStats = this.performanceMonitor.getStats()
    const memoryStats = this.memoryMonitor.getStats()
    const latestMemory = memoryStats[memoryStats.length - 1] || {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      timestamp: new Date(),
    }

    // Get database metrics
    const dbMetrics = await this.collectDatabaseMetrics()

    // Get cache metrics
    const cacheMetrics = await this.collectCacheMetrics()

    // Get recent errors
    const recentErrors = this.errors.slice(-100)

    return {
      timestamp: new Date(),
      performance: performanceStats,
      memory: latestMemory,
      database: dbMetrics,
      cache: cacheMetrics,
      errors: recentErrors,
    }
  }

  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get active connections (this is a simplified example)
      const activeConnections = await prisma.$executeRaw`
        SELECT COUNT(*) as count FROM pg_stat_activity 
        WHERE state = 'active' AND application_name = 'prisma'
      `

      const avgQueryTime = this.dbQueryCount > 0
        ? this.dbTotalQueryTime / this.dbQueryCount
        : 0

      return {
        activeConnections: Number(activeConnections) || 0,
        queryCount: this.dbQueryCount,
        slowQueries: this.dbSlowQueries,
        avgQueryTime,
      }
    } catch (error) {
      console.error('Failed to collect database metrics:', error)
      return {
        activeConnections: 0,
        queryCount: this.dbQueryCount,
        slowQueries: this.dbSlowQueries,
        avgQueryTime: 0,
      }
    }
  }

  private async collectCacheMetrics(): Promise<CacheMetrics> {
    try {
      // Get Redis info
      const info = await this.cacheService.getInfo()
      
      const totalOps = this.cacheHits + this.cacheMisses
      const hitRate = totalOps > 0 ? this.cacheHits / totalOps : 0
      const missRate = totalOps > 0 ? this.cacheMisses / totalOps : 0
      const evictionRate = totalOps > 0 ? this.cacheEvictions / totalOps : 0

      return {
        hitRate,
        missRate,
        evictionRate,
        memoryUsage: info.usedMemory || 0,
        keyCount: info.keyCount || 0,
      }
    } catch (error) {
      console.error('Failed to collect cache metrics:', error)
      return {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        memoryUsage: 0,
        keyCount: 0,
      }
    }
  }

  async generateReport(): Promise<string> {
    const metrics = await this.collectSystemMetrics()
    let report = `System Metrics Report
=====================
Generated: ${metrics.timestamp.toISOString()}

Performance Metrics:
-------------------
${this.performanceMonitor.getReport()}

Memory Metrics:
--------------
${this.memoryMonitor.getReport()}

Database Metrics:
----------------
Active Connections: ${metrics.database.activeConnections}
Total Queries: ${metrics.database.queryCount}
Slow Queries: ${metrics.database.slowQueries}
Avg Query Time: ${metrics.database.avgQueryTime.toFixed(2)}ms

Cache Metrics:
-------------
Hit Rate: ${(metrics.cache.hitRate * 100).toFixed(2)}%
Miss Rate: ${(metrics.cache.missRate * 100).toFixed(2)}%
Eviction Rate: ${(metrics.cache.evictionRate * 100).toFixed(2)}%
Memory Usage: ${(metrics.cache.memoryUsage / 1024 / 1024).toFixed(2)}MB
Key Count: ${metrics.cache.keyCount}

Recent Errors (Last 10):
-----------------------
`

    const recentErrors = metrics.errors.slice(-10)
    if (recentErrors.length === 0) {
      report += 'No recent errors\n'
    } else {
      for (const error of recentErrors) {
        report += `[${error.timestamp.toISOString()}] ${error.type}: ${error.message}\n`
        if (error.endpoint) {
          report += `  Endpoint: ${error.endpoint}\n`
        }
      }
    }

    return report
  }

  getMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      performance: this.performanceMonitor.getStats(),
      memory: this.memoryMonitor.getStats()[this.memoryMonitor.getStats().length - 1] || {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        timestamp: new Date(),
      },
      database: {
        activeConnections: 0,
        queryCount: this.dbQueryCount,
        slowQueries: this.dbSlowQueries,
        avgQueryTime: this.dbQueryCount > 0 ? this.dbTotalQueryTime / this.dbQueryCount : 0,
      },
      cache: {
        hitRate: this.cacheHits + this.cacheMisses > 0
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0,
        missRate: this.cacheHits + this.cacheMisses > 0
          ? this.cacheMisses / (this.cacheHits + this.cacheMisses)
          : 0,
        evictionRate: 0,
        memoryUsage: 0,
        keyCount: 0,
      },
      errors: this.errors.slice(-100),
    }
  }

  destroy() {
    this.performanceMonitor.destroy()
    this.memoryMonitor.destroy()
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null

export function getMetricsCollector(cacheService?: CacheService): MetricsCollector {
  if (!metricsCollector && cacheService) {
    metricsCollector = new MetricsCollector(cacheService)
  }
  if (!metricsCollector) {
    throw new Error('MetricsCollector not initialized. Provide CacheService on first call.')
  }
  return metricsCollector
}