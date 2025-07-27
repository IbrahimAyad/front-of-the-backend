import { NextRequest, NextResponse } from 'next/server'
import { getSchemaAwareClient } from '@/lib/db/schema-aware-client'
import { queryPerformanceMonitor } from '@/middleware/query-routing'

/**
 * Database health check endpoint
 * GET /api/health/database
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSchemaAwareClient()
    const healthStatus = client.getHealthStatus()
    
    // Get performance metrics
    const performanceMetrics = queryPerformanceMonitor.getMetrics()
    
    // Test read and write connections
    const readTest = await testConnection('read', client)
    const writeTest = await testConnection('write', client)
    
    const overallHealth = readTest.success && writeTest.success
    const status = overallHealth ? 200 : 503
    
    return NextResponse.json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        readWriteSplitEnabled: healthStatus.readWriteSplitEnabled,
        connections: {
          read: {
            available: healthStatus.read,
            responseTime: readTest.responseTime,
            error: readTest.error
          },
          write: {
            available: healthStatus.write,
            responseTime: writeTest.responseTime,
            error: writeTest.error
          }
        }
      },
      performance: {
        totalEndpoints: performanceMetrics?.length || 0,
        metrics: performanceMetrics?.slice(0, 5) || [] // Top 5 endpoints
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        readonlyUrl: process.env.DATABASE_READONLY_URL ? 'configured' : 'not configured'
      }
    }, { status })
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        readWriteSplitEnabled: false,
        connections: {
          read: { available: false, error: 'Health check failed' },
          write: { available: false, error: 'Health check failed' }
        }
      }
    }, { status: 500 })
  }
}

/**
 * Test database connection
 */
async function testConnection(type: 'read' | 'write', client: any): Promise<{
  success: boolean
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const dbClient = client.getClient(type)
    
    // Simple query to test connection
    await dbClient.$queryRaw`SELECT 1 as test`
    
    return {
      success: true,
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}