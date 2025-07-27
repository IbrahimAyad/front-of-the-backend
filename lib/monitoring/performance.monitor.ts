import { performance, PerformanceObserver } from 'perf_hooks'
import { EventEmitter } from 'events'

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface PerformanceStats {
  name: string
  count: number
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observer: PerformanceObserver | null = null
  private readonly maxMetricsPerName: number = 1000
  private readonly flushInterval: number = 60000 // 1 minute

  constructor() {
    super()
    this.setupObserver()
    this.startFlushInterval()
  }

  private setupObserver() {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            name: entry.name,
            duration: entry.duration,
            timestamp: new Date(performance.timeOrigin + entry.startTime),
          })
        }
      }
    })

    this.observer.observe({ entryTypes: ['measure'] })
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  startTimer(name: string): () => void {
    const startMark = `${name}-start-${Date.now()}`
    performance.mark(startMark)

    return () => {
      const endMark = `${name}-end-${Date.now()}`
      performance.mark(endMark)
      performance.measure(name, startMark, endMark)
      
      // Clean up marks
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const stop = this.startTimer(name)
    try {
      const result = await fn()
      return result
    } finally {
      stop()
    }
  }

  measure<T>(name: string, fn: () => T): T {
    const stop = this.startTimer(name)
    try {
      const result = fn()
      return result
    } finally {
      stop()
    }
  }

  recordMetric(metric: PerformanceMetric) {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, [])
    }

    const metrics = this.metrics.get(metric.name)!
    metrics.push(metric)

    // Keep only the most recent metrics
    if (metrics.length > this.maxMetricsPerName) {
      metrics.shift()
    }

    this.emit('metric', metric)
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || []
    }

    const allMetrics: PerformanceMetric[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }
    return allMetrics
  }

  getStats(name?: string): PerformanceStats[] {
    const namesToProcess = name
      ? [name]
      : Array.from(this.metrics.keys())

    const stats: PerformanceStats[] = []

    for (const metricName of namesToProcess) {
      const metrics = this.metrics.get(metricName) || []
      if (metrics.length === 0) continue

      const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
      const count = durations.length
      const sum = durations.reduce((a, b) => a + b, 0)

      stats.push({
        name: metricName,
        count,
        min: durations[0],
        max: durations[count - 1],
        avg: sum / count,
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
      })
    }

    return stats
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1
    return sortedArray[Math.max(0, index)]
  }

  getReport(): string {
    const stats = this.getStats()
    let report = 'Performance Report\n==================\n\n'

    for (const stat of stats) {
      report += `${stat.name}:\n`
      report += `  Count: ${stat.count}\n`
      report += `  Min: ${stat.min.toFixed(2)}ms\n`
      report += `  Max: ${stat.max.toFixed(2)}ms\n`
      report += `  Avg: ${stat.avg.toFixed(2)}ms\n`
      report += `  P50: ${stat.p50.toFixed(2)}ms\n`
      report += `  P95: ${stat.p95.toFixed(2)}ms\n`
      report += `  P99: ${stat.p99.toFixed(2)}ms\n\n`
    }

    return report
  }

  clear(name?: string) {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }

  flush() {
    const stats = this.getStats()
    this.emit('flush', stats)
    this.clear()
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.removeAllListeners()
    this.metrics.clear()
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

// Decorators for monitoring
export function Monitor(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const monitor = getPerformanceMonitor()
      
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return await monitor.measureAsync(metricName, async () => {
          return await originalMethod.apply(this, args)
        })
      } else {
        return monitor.measure(metricName, () => {
          return originalMethod.apply(this, args)
        })
      }
    }

    return descriptor
  }
}

// Express/Fastify middleware
export function performanceMiddleware(req: any, res: any, next: any) {
  const monitor = getPerformanceMonitor()
  const route = req.route?.path || req.url
  const method = req.method
  const metricName = `HTTP.${method}.${route}`

  const stop = monitor.startTimer(metricName)

  // Override res.end to stop timer
  const originalEnd = res.end
  res.end = function (...args: any[]) {
    stop()
    res.end = originalEnd
    return originalEnd.apply(res, args)
  }

  next()
}

// Database query monitoring
export function monitorQuery(queryName: string) {
  const monitor = getPerformanceMonitor()
  return monitor.startTimer(`DB.${queryName}`)
}

// Cache monitoring
export function monitorCache(operation: string, key: string) {
  const monitor = getPerformanceMonitor()
  return monitor.startTimer(`Cache.${operation}.${key}`)
}

// Memory monitoring
export interface MemoryStats {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  timestamp: Date
}

export class MemoryMonitor extends EventEmitter {
  private stats: MemoryStats[] = []
  private interval: NodeJS.Timeout | null = null
  private readonly maxStats: number = 1000
  private readonly checkInterval: number = 10000 // 10 seconds

  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      const memUsage = process.memoryUsage()
      const stat: MemoryStats = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        timestamp: new Date(),
      }

      this.stats.push(stat)
      if (this.stats.length > this.maxStats) {
        this.stats.shift()
      }

      this.emit('stat', stat)

      // Check for memory leaks
      if (this.stats.length > 10) {
        const recentStats = this.stats.slice(-10)
        const avgGrowth = this.calculateAverageGrowth(recentStats, 'heapUsed')
        
        if (avgGrowth > 1024 * 1024) { // 1MB per interval
          this.emit('leak-warning', {
            avgGrowth,
            currentHeapUsed: stat.heapUsed,
          })
        }
      }
    }, this.checkInterval)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private calculateAverageGrowth(stats: MemoryStats[], field: keyof MemoryStats): number {
    if (stats.length < 2) return 0

    let totalGrowth = 0
    for (let i = 1; i < stats.length; i++) {
      totalGrowth += (stats[i][field] as number) - (stats[i - 1][field] as number)
    }

    return totalGrowth / (stats.length - 1)
  }

  getStats(): MemoryStats[] {
    return [...this.stats]
  }

  getReport(): string {
    if (this.stats.length === 0) return 'No memory statistics available'

    const latest = this.stats[this.stats.length - 1]
    const oldest = this.stats[0]
    
    const heapGrowth = latest.heapUsed - oldest.heapUsed
    const duration = latest.timestamp.getTime() - oldest.timestamp.getTime()

    return `Memory Report
================
Current Heap Used: ${(latest.heapUsed / 1024 / 1024).toFixed(2)} MB
Current Heap Total: ${(latest.heapTotal / 1024 / 1024).toFixed(2)} MB
Current RSS: ${(latest.rss / 1024 / 1024).toFixed(2)} MB
Heap Growth: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB over ${(duration / 1000 / 60).toFixed(1)} minutes
Growth Rate: ${((heapGrowth / duration) * 1000 * 60 / 1024 / 1024).toFixed(2)} MB/min`
  }

  destroy() {
    this.stop()
    this.removeAllListeners()
    this.stats = []
  }
}

// Singleton memory monitor
let memoryMonitor: MemoryMonitor | null = null

export function getMemoryMonitor(): MemoryMonitor {
  if (!memoryMonitor) {
    memoryMonitor = new MemoryMonitor()
  }
  return memoryMonitor
}