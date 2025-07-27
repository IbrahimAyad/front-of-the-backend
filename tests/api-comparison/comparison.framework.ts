import axios, { AxiosResponse } from 'axios'
import { performance } from 'perf_hooks'

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  body?: any
  headers?: Record<string, string>
  params?: Record<string, string>
}

export interface ApiResponse {
  status: number
  data: any
  headers: Record<string, string>
  duration: number
}

export interface ComparisonResult {
  endpoint: ApiEndpoint
  fastify: ApiResponse | null
  nextjs: ApiResponse | null
  match: boolean
  differences: string[]
  performanceRatio: number // fastify time / nextjs time
}

export class ApiComparisonFramework {
  private fastifyBaseUrl: string
  private nextjsBaseUrl: string
  private authToken: string | null = null

  constructor(fastifyUrl: string, nextjsUrl: string) {
    this.fastifyBaseUrl = fastifyUrl
    this.nextjsBaseUrl = nextjsUrl
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  private async makeRequest(
    baseUrl: string,
    endpoint: ApiEndpoint
  ): Promise<ApiResponse> {
    const url = `${baseUrl}${endpoint.path}`
    const headers = {
      ...endpoint.headers,
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
    }

    const startTime = performance.now()

    try {
      const response: AxiosResponse = await axios({
        method: endpoint.method,
        url,
        data: endpoint.body,
        headers,
        params: endpoint.params,
        validateStatus: () => true, // Don't throw on any status
      })

      const endTime = performance.now()

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
        duration: endTime - startTime,
      }
    } catch (error) {
      const endTime = performance.now()
      throw new Error(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private compareResponses(
    fastify: ApiResponse,
    nextjs: ApiResponse
  ): { match: boolean; differences: string[] } {
    const differences: string[] = []

    // Compare status codes
    if (fastify.status !== nextjs.status) {
      differences.push(
        `Status code mismatch: Fastify=${fastify.status}, Next.js=${nextjs.status}`
      )
    }

    // Compare response data (deep comparison)
    const dataMatch = this.deepCompare(fastify.data, nextjs.data)
    if (!dataMatch.match) {
      differences.push(...dataMatch.differences.map(d => `Data: ${d}`))
    }

    // Compare important headers
    const importantHeaders = ['content-type', 'cache-control']
    for (const header of importantHeaders) {
      if (fastify.headers[header] !== nextjs.headers[header]) {
        differences.push(
          `Header '${header}' mismatch: Fastify=${fastify.headers[header]}, Next.js=${nextjs.headers[header]}`
        )
      }
    }

    return {
      match: differences.length === 0,
      differences,
    }
  }

  private deepCompare(
    obj1: any,
    obj2: any,
    path: string = ''
  ): { match: boolean; differences: string[] } {
    const differences: string[] = []

    if (obj1 === obj2) {
      return { match: true, differences: [] }
    }

    if (typeof obj1 !== typeof obj2) {
      differences.push(`Type mismatch at ${path}: ${typeof obj1} vs ${typeof obj2}`)
      return { match: false, differences }
    }

    if (obj1 === null || obj2 === null) {
      differences.push(`Null mismatch at ${path}`)
      return { match: false, differences }
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        differences.push(
          `Array length mismatch at ${path}: ${obj1.length} vs ${obj2.length}`
        )
      }

      const maxLength = Math.max(obj1.length, obj2.length)
      for (let i = 0; i < maxLength; i++) {
        const result = this.deepCompare(obj1[i], obj2[i], `${path}[${i}]`)
        differences.push(...result.differences)
      }
    } else if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

      for (const key of allKeys) {
        if (!(key in obj1)) {
          differences.push(`Missing key in first object at ${path}.${key}`)
        } else if (!(key in obj2)) {
          differences.push(`Missing key in second object at ${path}.${key}`)
        } else {
          const result = this.deepCompare(
            obj1[key],
            obj2[key],
            path ? `${path}.${key}` : key
          )
          differences.push(...result.differences)
        }
      }
    } else if (obj1 !== obj2) {
      differences.push(`Value mismatch at ${path}: ${obj1} vs ${obj2}`)
    }

    return {
      match: differences.length === 0,
      differences,
    }
  }

  async compareEndpoint(endpoint: ApiEndpoint): Promise<ComparisonResult> {
    let fastifyResponse: ApiResponse | null = null
    let nextjsResponse: ApiResponse | null = null

    try {
      // Make requests in parallel for fair comparison
      const [fastifyRes, nextjsRes] = await Promise.allSettled([
        this.makeRequest(this.fastifyBaseUrl, endpoint),
        this.makeRequest(this.nextjsBaseUrl, endpoint),
      ])

      if (fastifyRes.status === 'fulfilled') {
        fastifyResponse = fastifyRes.value
      }

      if (nextjsRes.status === 'fulfilled') {
        nextjsResponse = nextjsRes.value
      }

      if (!fastifyResponse || !nextjsResponse) {
        return {
          endpoint,
          fastify: fastifyResponse,
          nextjs: nextjsResponse,
          match: false,
          differences: ['One or both endpoints failed to respond'],
          performanceRatio: 0,
        }
      }

      const comparison = this.compareResponses(fastifyResponse, nextjsResponse)

      return {
        endpoint,
        fastify: fastifyResponse,
        nextjs: nextjsResponse,
        match: comparison.match,
        differences: comparison.differences,
        performanceRatio: fastifyResponse.duration / nextjsResponse.duration,
      }
    } catch (error) {
      return {
        endpoint,
        fastify: fastifyResponse,
        nextjs: nextjsResponse,
        match: false,
        differences: [
          `Error during comparison: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ],
        performanceRatio: 0,
      }
    }
  }

  async compareEndpoints(endpoints: ApiEndpoint[]): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = []

    for (const endpoint of endpoints) {
      const result = await this.compareEndpoint(endpoint)
      results.push(result)
    }

    return results
  }

  generateReport(results: ComparisonResult[]): string {
    const totalEndpoints = results.length
    const matchingEndpoints = results.filter(r => r.match).length
    const avgPerformanceRatio =
      results
        .filter(r => r.performanceRatio > 0)
        .reduce((sum, r) => sum + r.performanceRatio, 0) /
      results.filter(r => r.performanceRatio > 0).length

    let report = `API Comparison Report
======================
Total Endpoints Tested: ${totalEndpoints}
Matching Endpoints: ${matchingEndpoints} (${((matchingEndpoints / totalEndpoints) * 100).toFixed(1)}%)
Average Performance Ratio: ${avgPerformanceRatio.toFixed(2)}x (Fastify/Next.js)

Detailed Results:
-----------------\n`

    for (const result of results) {
      report += `\n${result.endpoint.method} ${result.endpoint.path} - ${result.endpoint.description}
  Status: ${result.match ? '✅ MATCH' : '❌ MISMATCH'}
  Fastify: ${result.fastify?.status || 'FAILED'} (${result.fastify?.duration.toFixed(2)}ms)
  Next.js: ${result.nextjs?.status || 'FAILED'} (${result.nextjs?.duration.toFixed(2)}ms)
  Performance Ratio: ${result.performanceRatio.toFixed(2)}x\n`

      if (!result.match && result.differences.length > 0) {
        report += `  Differences:\n`
        for (const diff of result.differences) {
          report += `    - ${diff}\n`
        }
      }
    }

    return report
  }

  async generateJsonReport(results: ComparisonResult[]): Promise<any> {
    const totalEndpoints = results.length
    const matchingEndpoints = results.filter(r => r.match).length
    const performanceMetrics = results
      .filter(r => r.performanceRatio > 0)
      .map(r => ({
        endpoint: `${r.endpoint.method} ${r.endpoint.path}`,
        ratio: r.performanceRatio,
        fastifyTime: r.fastify?.duration || 0,
        nextjsTime: r.nextjs?.duration || 0,
      }))

    return {
      summary: {
        totalEndpoints,
        matchingEndpoints,
        matchPercentage: (matchingEndpoints / totalEndpoints) * 100,
        avgPerformanceRatio:
          performanceMetrics.reduce((sum, m) => sum + m.ratio, 0) /
          performanceMetrics.length,
      },
      performanceMetrics,
      detailedResults: results.map(r => ({
        endpoint: {
          method: r.endpoint.method,
          path: r.endpoint.path,
          description: r.endpoint.description,
        },
        match: r.match,
        differences: r.differences,
        fastify: r.fastify
          ? {
              status: r.fastify.status,
              duration: r.fastify.duration,
            }
          : null,
        nextjs: r.nextjs
          ? {
              status: r.nextjs.status,
              duration: r.nextjs.duration,
            }
          : null,
      })),
    }
  }
}