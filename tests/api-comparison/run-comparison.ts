import { ApiComparisonFramework } from './comparison.framework'
import {
  allEndpoints,
  prepareEndpoints,
  healthEndpoints,
  authEndpoints,
  productEndpoints,
} from './endpoints.config'
import fs from 'fs/promises'
import path from 'path'

async function runComparison() {
  // Configuration
  const FASTIFY_URL = process.env.FASTIFY_URL || 'http://localhost:3000'
  const NEXTJS_URL = process.env.NEXTJS_URL || 'http://localhost:3001'

  console.log('🔍 API Comparison Test Runner')
  console.log('============================')
  console.log(`Fastify URL: ${FASTIFY_URL}`)
  console.log(`Next.js URL: ${NEXTJS_URL}`)
  console.log('')

  const framework = new ApiComparisonFramework(FASTIFY_URL, NEXTJS_URL)

  // Test variables (would be obtained from actual test data)
  const testVariables = {
    token: 'test-jwt-token',
    adminToken: 'admin-jwt-token',
    refreshToken: 'test-refresh-token',
    productId: '1',
    customerId: '1',
    orderId: '1',
    category: 'Electronics',
  }

  try {
    // 1. Health Check First
    console.log('📋 Running health checks...')
    const healthResults = await framework.compareEndpoints(
      prepareEndpoints(healthEndpoints, testVariables)
    )
    
    const healthPassed = healthResults.every(r => r.match)
    if (!healthPassed) {
      console.error('❌ Health checks failed! Both APIs must be running.')
      console.log(framework.generateReport(healthResults))
      return
    }
    console.log('✅ Health checks passed!\n')

    // 2. Run Authentication Tests to Get Real Tokens
    console.log('🔐 Running authentication tests...')
    
    // Register a test user
    const registerEndpoint = prepareEndpoints([authEndpoints[0]], testVariables)[0]
    const registerResult = await framework.compareEndpoint(registerEndpoint)
    
    if (registerResult.match && registerResult.nextjs?.status === 201) {
      console.log('✅ Registration successful')
      
      // Login to get tokens
      const loginEndpoint = prepareEndpoints([authEndpoints[1]], testVariables)[0]
      const loginResult = await framework.compareEndpoint(loginEndpoint)
      
      if (loginResult.match && loginResult.nextjs?.data?.token) {
        const userToken = loginResult.nextjs.data.token
        const adminToken = loginResult.nextjs.data.token // In real scenario, login as admin
        
        // Update test variables with real tokens
        testVariables.token = userToken
        testVariables.adminToken = adminToken
        
        framework.setAuthToken(userToken)
        console.log('✅ Authentication successful, tokens obtained\n')
      }
    }

    // 3. Run All Endpoint Comparisons
    console.log('🚀 Running full API comparison...')
    const preparedEndpoints = prepareEndpoints(allEndpoints, testVariables)
    const results = await framework.compareEndpoints(preparedEndpoints)

    // 4. Generate Reports
    const textReport = framework.generateReport(results)
    const jsonReport = await framework.generateJsonReport(results)

    // 5. Save Reports
    const reportsDir = path.join(__dirname, 'reports')
    await fs.mkdir(reportsDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    await fs.writeFile(
      path.join(reportsDir, `comparison-report-${timestamp}.txt`),
      textReport
    )
    
    await fs.writeFile(
      path.join(reportsDir, `comparison-report-${timestamp}.json`),
      JSON.stringify(jsonReport, null, 2)
    )

    // 6. Display Summary
    console.log('\n' + textReport)
    
    console.log('\n📊 Summary Statistics:')
    console.log(`Total Endpoints: ${jsonReport.summary.totalEndpoints}`)
    console.log(`Matching: ${jsonReport.summary.matchingEndpoints} (${jsonReport.summary.matchPercentage.toFixed(1)}%)`)
    console.log(`Avg Performance Ratio: ${jsonReport.summary.avgPerformanceRatio.toFixed(2)}x`)
    
    // 7. Performance Winners
    console.log('\n🏆 Performance Analysis:')
    const sortedByPerformance = jsonReport.performanceMetrics
      .sort((a: any, b: any) => b.ratio - a.ratio)
      .slice(0, 5)
    
    console.log('Top 5 Fastify Performance Gains:')
    for (const metric of sortedByPerformance) {
      console.log(`  ${metric.endpoint}: ${metric.ratio.toFixed(2)}x faster (${metric.fastifyTime.toFixed(0)}ms vs ${metric.nextjsTime.toFixed(0)}ms)`)
    }

    // 8. Check for critical failures
    const criticalFailures = results.filter(
      r => !r.match && (r.endpoint.path.includes('auth') || r.endpoint.path.includes('health'))
    )
    
    if (criticalFailures.length > 0) {
      console.error('\n⚠️  Critical endpoint mismatches detected!')
      for (const failure of criticalFailures) {
        console.error(`  - ${failure.endpoint.method} ${failure.endpoint.path}`)
      }
      process.exit(1)
    }

    console.log('\n✅ API comparison completed successfully!')
    console.log(`📁 Reports saved to: ${reportsDir}`)

  } catch (error) {
    console.error('❌ Error during comparison:', error)
    process.exit(1)
  }
}

// Run comparison if this file is executed directly
if (require.main === module) {
  runComparison().catch(console.error)
}

export { runComparison }