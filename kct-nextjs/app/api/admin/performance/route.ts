import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { queryPerformanceMonitor } from '@/middleware/query-routing'
import { getSchemaAwareClient } from '@/lib/db/schema-aware-client'
import { createApiResponse } from '@/lib/api/response'

/**
 * Performance monitoring endpoint for admins
 * GET /api/admin/performance
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    // Get performance metrics
    const metrics = queryPerformanceMonitor.getMetrics(endpoint || undefined)
    
    // Get database health
    const client = getSchemaAwareClient()
    const healthStatus = client.getHealthStatus()
    
    // Calculate load reduction from read/write splitting
    const totalMetrics = Array.isArray(metrics) ? metrics : [metrics].filter(Boolean)
    const loadReduction = calculateLoadReduction(totalMetrics)
    
    return createApiResponse({
      data: {
        database: {
          health: healthStatus,
          loadReduction: {
            writePoolReduction: loadReduction.writePoolReduction,
            readWriteRatio: loadReduction.readWriteRatio,
            totalQueries: loadReduction.totalQueries
          }
        },
        performance: {
          byEndpoint: Array.isArray(metrics) ? metrics : (metrics ? [metrics] : []),
          summary: calculateSummaryMetrics(totalMetrics)
        },
        recommendations: generateRecommendations(totalMetrics, healthStatus)
      }
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return createApiResponse({
      error: 'Failed to fetch performance metrics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

/**
 * Reset performance metrics
 * POST /api/admin/performance/reset
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    queryPerformanceMonitor.reset()
    
    return createApiResponse({
      data: { message: 'Performance metrics reset successfully' }
    })
  } catch (error) {
    console.error('Error resetting performance metrics:', error)
    return createApiResponse({
      error: 'Failed to reset performance metrics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

/**
 * Calculate load reduction from read/write splitting
 */
function calculateLoadReduction(metrics: any[]): {
  writePoolReduction: number
  readWriteRatio: number
  totalQueries: number
} {
  const totals = metrics.reduce((acc, metric) => ({
    readQueries: acc.readQueries + (metric.readQueries || 0),
    writeQueries: acc.writeQueries + (metric.writeQueries || 0),
    totalQueries: acc.totalQueries + (metric.totalQueries || 0)
  }), { readQueries: 0, writeQueries: 0, totalQueries: 0 })
  
  // Calculate how much load was taken off the write pool
  const writePoolReduction = totals.totalQueries > 0 
    ? (totals.readQueries / totals.totalQueries) * 100 
    : 0
    
  const readWriteRatio = totals.writeQueries > 0 
    ? totals.readQueries / totals.writeQueries 
    : totals.readQueries
  
  return {
    writePoolReduction: Math.round(writePoolReduction),
    readWriteRatio: Math.round(readWriteRatio * 100) / 100,
    totalQueries: totals.totalQueries
  }
}

/**
 * Calculate summary metrics
 */
function calculateSummaryMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalEndpoints: 0,
      averageResponseTime: 0,
      slowestEndpoint: null,
      fastestEndpoint: null,
      errorRate: 0
    }
  }
  
  const totals = metrics.reduce((acc, metric) => ({
    totalTime: acc.totalTime + metric.totalTime,
    totalQueries: acc.totalQueries + metric.totalQueries,
    totalErrors: acc.totalErrors + metric.errors
  }), { totalTime: 0, totalQueries: 0, totalErrors: 0 })
  
  const sortedByTime = [...metrics].sort((a, b) => b.averageTime - a.averageTime)
  
  return {
    totalEndpoints: metrics.length,
    averageResponseTime: totals.totalQueries > 0 ? Math.round(totals.totalTime / totals.totalQueries) : 0,
    slowestEndpoint: sortedByTime[0]?.endpoint || null,
    fastestEndpoint: sortedByTime[sortedByTime.length - 1]?.endpoint || null,
    errorRate: totals.totalQueries > 0 ? Math.round((totals.totalErrors / totals.totalQueries) * 100) : 0
  }
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(metrics: any[], healthStatus: any): string[] {
  const recommendations: string[] = []
  
  // Check if read/write splitting is working
  if (!healthStatus.readWriteSplitEnabled) {
    recommendations.push('Enable read/write splitting by configuring DATABASE_READONLY_URL for better performance')
  }
  
  // Check for slow endpoints
  const slowEndpoints = metrics.filter(m => m.averageTime > 1000)
  if (slowEndpoints.length > 0) {
    recommendations.push(`Optimize slow endpoints: ${slowEndpoints.map(e => e.endpoint).join(', ')}`)
  }
  
  // Check error rates
  const highErrorEndpoints = metrics.filter(m => m.errorRate > 5)
  if (highErrorEndpoints.length > 0) {
    recommendations.push(`Investigate high error rates on: ${highErrorEndpoints.map(e => e.endpoint).join(', ')}`)
  }
  
  // Check read/write ratio
  const loadReduction = calculateLoadReduction(metrics)
  if (loadReduction.writePoolReduction < 30 && healthStatus.readWriteSplitEnabled) {
    recommendations.push('Consider optimizing more queries to use read replicas for better load distribution')
  }
  
  // Check database health
  if (!healthStatus.read && healthStatus.readWriteSplitEnabled) {
    recommendations.push('Read replica is unavailable - all queries are using write database')
  }
  
  if (!healthStatus.write) {
    recommendations.push('CRITICAL: Write database is unavailable')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! No immediate optimizations needed.')
  }
  
  return recommendations
}