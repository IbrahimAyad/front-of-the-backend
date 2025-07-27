import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ApiComparisonFramework } from './comparison.framework'
import { healthEndpoints, authEndpoints, productEndpoints, prepareEndpoints } from './endpoints.config'

describe('API Comparison Tests', () => {
  let framework: ApiComparisonFramework
  let testVariables: Record<string, string>

  beforeAll(() => {
    const FASTIFY_URL = process.env.FASTIFY_URL || 'http://localhost:3000'
    const NEXTJS_URL = process.env.NEXTJS_URL || 'http://localhost:3001'
    
    framework = new ApiComparisonFramework(FASTIFY_URL, NEXTJS_URL)
    
    testVariables = {
      token: 'test-jwt-token',
      adminToken: 'admin-jwt-token',
      refreshToken: 'test-refresh-token',
      productId: '1',
      customerId: '1',
      orderId: '1',
      category: 'Electronics',
    }
  })

  describe('Health Endpoints', () => {
    it('should match health check responses', async () => {
      const endpoints = prepareEndpoints(healthEndpoints.slice(0, 1), testVariables)
      const results = await framework.compareEndpoints(endpoints)
      
      expect(results).toHaveLength(1)
      expect(results[0].match).toBe(true)
      expect(results[0].fastify?.status).toBe(200)
      expect(results[0].nextjs?.status).toBe(200)
    })
  })

  describe('Authentication Endpoints', () => {
    it('should handle registration endpoint comparison', async () => {
      const registerEndpoint = prepareEndpoints([authEndpoints[0]], testVariables)[0]
      // Modify email to ensure uniqueness
      registerEndpoint.body.email = `test-${Date.now()}@example.com`
      
      const result = await framework.compareEndpoint(registerEndpoint)
      
      // Both should return same status (201 for success or 409 for already exists)
      expect(result.fastify?.status).toBe(result.nextjs?.status)
    })

    it('should handle login endpoint comparison', async () => {
      const loginEndpoint = prepareEndpoints([authEndpoints[1]], testVariables)[0]
      const result = await framework.compareEndpoint(loginEndpoint)
      
      // Both should return same status
      expect(result.fastify?.status).toBe(result.nextjs?.status)
      
      // If successful, both should return token
      if (result.fastify?.status === 200) {
        expect(result.fastify?.data).toHaveProperty('token')
        expect(result.nextjs?.data).toHaveProperty('token')
      }
    })
  })

  describe('Product Endpoints', () => {
    it('should compare product listing endpoint', async () => {
      const listEndpoint = prepareEndpoints([productEndpoints[0]], testVariables)[0]
      const result = await framework.compareEndpoint(listEndpoint)
      
      expect(result.fastify?.status).toBe(200)
      expect(result.nextjs?.status).toBe(200)
      
      // Both should return array of products
      expect(Array.isArray(result.fastify?.data?.products)).toBe(true)
      expect(Array.isArray(result.nextjs?.data?.products)).toBe(true)
    })

    it('should measure performance differences', async () => {
      const endpoints = prepareEndpoints(productEndpoints.slice(0, 3), testVariables)
      const results = await framework.compareEndpoints(endpoints)
      
      for (const result of results) {
        if (result.fastify && result.nextjs) {
          // Performance ratio should be calculated
          expect(result.performanceRatio).toBeGreaterThan(0)
          
          // Log performance for visibility
          console.log(
            `${result.endpoint.method} ${result.endpoint.path}: ` +
            `Fastify ${result.fastify.duration.toFixed(2)}ms, ` +
            `Next.js ${result.nextjs.duration.toFixed(2)}ms, ` +
            `Ratio: ${result.performanceRatio.toFixed(2)}x`
          )
        }
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate text report', async () => {
      const endpoints = prepareEndpoints(healthEndpoints, testVariables)
      const results = await framework.compareEndpoints(endpoints)
      const report = framework.generateReport(results)
      
      expect(report).toContain('API Comparison Report')
      expect(report).toContain('Total Endpoints Tested:')
      expect(report).toContain('Average Performance Ratio:')
    })

    it('should generate JSON report', async () => {
      const endpoints = prepareEndpoints(healthEndpoints, testVariables)
      const results = await framework.compareEndpoints(endpoints)
      const jsonReport = await framework.generateJsonReport(results)
      
      expect(jsonReport).toHaveProperty('summary')
      expect(jsonReport).toHaveProperty('performanceMetrics')
      expect(jsonReport).toHaveProperty('detailedResults')
      
      expect(jsonReport.summary).toHaveProperty('totalEndpoints')
      expect(jsonReport.summary).toHaveProperty('matchingEndpoints')
      expect(jsonReport.summary).toHaveProperty('matchPercentage')
      expect(jsonReport.summary).toHaveProperty('avgPerformanceRatio')
    })
  })

  describe('Deep Comparison', () => {
    it('should detect differences in nested objects', async () => {
      const mockEndpoint = {
        method: 'GET' as const,
        path: '/test',
        description: 'Test endpoint',
      }

      // Mock different responses
      const fastifyResponse = {
        status: 200,
        data: {
          user: {
            id: 1,
            name: 'John',
            roles: ['admin', 'user'],
          },
        },
        headers: { 'content-type': 'application/json' },
        duration: 10,
      }

      const nextjsResponse = {
        status: 200,
        data: {
          user: {
            id: 1,
            name: 'John Doe', // Different
            roles: ['admin'], // Missing 'user'
          },
        },
        headers: { 'content-type': 'application/json' },
        duration: 15,
      }

      // Use private method through reflection (for testing)
      const comparison = (framework as any).compareResponses(
        fastifyResponse,
        nextjsResponse
      )

      expect(comparison.match).toBe(false)
      expect(comparison.differences).toContain('Data: Value mismatch at user.name: John vs John Doe')
      expect(comparison.differences).toContain('Data: Array length mismatch at user.roles: 2 vs 1')
    })
  })
})