import { NextRequest, NextResponse } from 'next/server'
import { getSchemaAwareClient } from '@/lib/db/schema-aware-client'

/**
 * Query routing middleware to monitor and optimize database operations
 */
export interface QueryRoutingOptions {
  logQueries?: boolean
  trackPerformance?: boolean
  enableHealthChecks?: boolean
}

/**
 * Middleware to add query routing headers and monitoring
 */
export function withQueryRouting<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: QueryRoutingOptions = {}
): T {
  const { logQueries = true, trackPerformance = true, enableHealthChecks = true } = options

  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(7)

    // Get database health status
    let healthStatus: any = {}
    if (enableHealthChecks) {
      try {
        const client = getSchemaAwareClient()
        healthStatus = client.getHealthStatus()
      } catch (error) {
        console.error('Failed to get database health status:', error)
        healthStatus = { write: false, read: false, readWriteSplitEnabled: false }
      }
    }

    if (logQueries) {
      console.log(`[QUERY-ROUTING] ${request.method} ${request.url} - Request ID: ${requestId}`)
      console.log(`[QUERY-ROUTING] DB Health: Write=${healthStatus.write}, Read=${healthStatus.read}, Split=${healthStatus.readWriteSplitEnabled}`)
    }

    try {
      // Execute the handler
      const response = await handler(request, ...args)
      
      const duration = Date.now() - startTime

      // Add query routing headers
      const headers = new Headers(response.headers)
      headers.set('X-Request-ID', requestId)
      headers.set('X-DB-Write-Available', healthStatus.write ? 'true' : 'false')
      headers.set('X-DB-Read-Available', healthStatus.read ? 'true' : 'false')
      headers.set('X-DB-Split-Enabled', healthStatus.readWriteSplitEnabled ? 'true' : 'false')
      
      if (trackPerformance) {
        headers.set('X-Response-Time', `${duration}ms`)
      }

      if (logQueries) {
        console.log(`[QUERY-ROUTING] ${request.method} ${request.url} completed in ${duration}ms`)
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers
      })
    } catch (error) {
      const duration = Date.now() - startTime
      
      console.error(`[QUERY-ROUTING] ${request.method} ${request.url} failed after ${duration}ms:`, error)
      
      // Check if it's a database connection error
      const isDatabaseError = error instanceof Error && (
        error.message.includes('connect') ||
        error.message.includes('timeout') ||
        error.message.includes('connection')
      )

      if (isDatabaseError) {
        return NextResponse.json({
          error: 'Database connection error',
          details: 'Please try again later'
        }, {
          status: 503,
          headers: {
            'X-Request-ID': requestId,
            'X-DB-Error': 'true',
            'Retry-After': '5'
          }
        })
      }

      throw error
    }
  }) as T
}

/**
 * Middleware specifically for database health monitoring
 */
export function withDatabaseHealth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    try {
      const client = getSchemaAwareClient()
      const health = client.getHealthStatus()
      
      // If both read and write are down, return service unavailable
      if (!health.write && !health.read) {
        return NextResponse.json({
          error: 'Database unavailable',
          details: 'All database connections are down'
        }, {
          status: 503,
          headers: {
            'X-DB-Status': 'unavailable',
            'Retry-After': '10'
          }
        })
      }
      
      // If only read is down, warn but continue
      if (health.write && !health.read && health.readWriteSplitEnabled) {
        console.warn('Read replica is down, using write database for all operations')
      }
      
      return handler(request, ...args)
    } catch (error) {
      console.error('Database health check failed:', error)
      return NextResponse.json({
        error: 'Database health check failed',
        details: 'Unable to verify database status'
      }, {
        status: 500,
        headers: {
          'X-DB-Status': 'unknown'
        }
      })
    }
  }) as T
}

/**
 * Performance monitoring for database operations
 */
export class QueryPerformanceMonitor {
  private metrics = new Map<string, {
    totalQueries: number
    totalTime: number
    readQueries: number
    writeQueries: number
    slowQueries: number
    errors: number
  }>()

  logQuery(
    operation: 'read' | 'write',
    duration: number,
    endpoint: string,
    success: boolean = true
  ): void {
    const key = endpoint
    const existing = this.metrics.get(key) || {
      totalQueries: 0,
      totalTime: 0,
      readQueries: 0,
      writeQueries: 0,
      slowQueries: 0,
      errors: 0
    }

    existing.totalQueries++
    existing.totalTime += duration
    
    if (operation === 'read') {
      existing.readQueries++
    } else {
      existing.writeQueries++
    }
    
    if (duration > 1000) { // Slow query threshold: 1 second
      existing.slowQueries++
    }
    
    if (!success) {
      existing.errors++
    }

    this.metrics.set(key, existing)
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      const metrics = this.metrics.get(endpoint)
      if (!metrics) return null

      return {
        endpoint,
        ...metrics,
        averageTime: metrics.totalQueries > 0 ? metrics.totalTime / metrics.totalQueries : 0,
        readWriteRatio: metrics.writeQueries > 0 ? metrics.readQueries / metrics.writeQueries : Infinity,
        errorRate: metrics.totalQueries > 0 ? (metrics.errors / metrics.totalQueries) * 100 : 0
      }
    }

    // Return aggregated metrics for all endpoints
    const allMetrics = Array.from(this.metrics.entries()).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      averageTime: metrics.totalQueries > 0 ? metrics.totalTime / metrics.totalQueries : 0,
      readWriteRatio: metrics.writeQueries > 0 ? metrics.readQueries / metrics.writeQueries : Infinity,
      errorRate: metrics.totalQueries > 0 ? (metrics.errors / metrics.totalQueries) * 100 : 0
    }))

    return allMetrics
  }

  reset(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const queryPerformanceMonitor = new QueryPerformanceMonitor()

/**
 * Middleware to track query performance
 */
export function withQueryPerformanceTracking<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  endpoint: string
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now()
    let success = true

    try {
      const response = await handler(request, ...args)
      
      const duration = Date.now() - startTime
      
      // Determine operation type from method and response
      const operationType: 'read' | 'write' = ['GET', 'HEAD'].includes(request.method) ? 'read' : 'write'
      
      queryPerformanceMonitor.logQuery(operationType, duration, endpoint, true)
      
      return response
    } catch (error) {
      success = false
      const duration = Date.now() - startTime
      const operationType: 'read' | 'write' = ['GET', 'HEAD'].includes(request.method) ? 'read' : 'write'
      
      queryPerformanceMonitor.logQuery(operationType, duration, endpoint, false)
      
      throw error
    }
  }) as T
}