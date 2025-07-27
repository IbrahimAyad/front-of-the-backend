// Artillery processor for custom logic

module.exports = {
  beforeRequest: beforeRequest,
  afterResponse: afterResponse,
  generateRandomData: generateRandomData,
}

// Metrics storage
const metrics = {
  responseTimesByEndpoint: {},
  errorsByEndpoint: {},
  successCount: 0,
  errorCount: 0,
}

function beforeRequest(requestParams, context, ee, next) {
  // Add timestamp to track request duration
  context.vars.requestStartTime = Date.now()
  
  // Add random user agent
  requestParams.headers['User-Agent'] = generateUserAgent()
  
  // Log request for debugging (only in debug mode)
  if (process.env.DEBUG) {
    console.log(`[${new Date().toISOString()}] ${requestParams.method} ${requestParams.url}`)
  }
  
  return next()
}

function afterResponse(requestParams, response, context, ee, next) {
  const duration = Date.now() - context.vars.requestStartTime
  const endpoint = `${requestParams.method} ${requestParams.url.split('?')[0]}`
  
  // Track response times
  if (!metrics.responseTimesByEndpoint[endpoint]) {
    metrics.responseTimesByEndpoint[endpoint] = []
  }
  metrics.responseTimesByEndpoint[endpoint].push(duration)
  
  // Track errors
  if (response.statusCode >= 400) {
    metrics.errorCount++
    if (!metrics.errorsByEndpoint[endpoint]) {
      metrics.errorsByEndpoint[endpoint] = 0
    }
    metrics.errorsByEndpoint[endpoint]++
    
    // Log errors
    console.error(`[ERROR] ${endpoint} returned ${response.statusCode} in ${duration}ms`)
  } else {
    metrics.successCount++
  }
  
  // Custom expectations
  if (endpoint.includes('/api/products') && response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body)
      
      // Validate product structure
      if (body.products && Array.isArray(body.products)) {
        body.products.forEach(product => {
          if (!product.id || !product.name || !product.price) {
            console.error(`[VALIDATION] Invalid product structure: ${JSON.stringify(product)}`)
          }
        })
      }
      
      // Check response time thresholds
      if (duration > 500) {
        console.warn(`[PERF] Slow response: ${endpoint} took ${duration}ms`)
      }
    } catch (e) {
      console.error(`[PARSE] Failed to parse response from ${endpoint}`)
    }
  }
  
  return next()
}

function generateRandomData(context, events, done) {
  // Generate random test data
  context.vars.randomEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
  context.vars.randomProductName = generateProductName()
  context.vars.randomPrice = Math.floor(Math.random() * 900) + 100
  context.vars.randomCategory = ['Suits', 'Ties', 'Shirts', 'Accessories'][Math.floor(Math.random() * 4)]
  
  return done()
}

// Helper functions
function generateUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

function generateProductName() {
  const adjectives = ['Premium', 'Luxury', 'Classic', 'Modern', 'Elegant']
  const materials = ['Wool', 'Silk', 'Cotton', 'Cashmere', 'Linen']
  const types = ['Suit', 'Tie', 'Shirt', 'Blazer', 'Trouser']
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const mat = materials[Math.floor(Math.random() * materials.length)]
  const type = types[Math.floor(Math.random() * types.length)]
  
  return `${adj} ${mat} ${type}`
}

// Report generation at end of test
process.on('beforeExit', () => {
  console.log('\n=== Performance Test Summary ===')
  console.log(`Total Requests: ${metrics.successCount + metrics.errorCount}`)
  console.log(`Successful: ${metrics.successCount}`)
  console.log(`Errors: ${metrics.errorCount}`)
  console.log(`Error Rate: ${((metrics.errorCount / (metrics.successCount + metrics.errorCount)) * 100).toFixed(2)}%`)
  
  console.log('\n=== Response Times by Endpoint ===')
  Object.entries(metrics.responseTimesByEndpoint).forEach(([endpoint, times]) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
    console.log(`${endpoint}:`)
    console.log(`  Average: ${avg.toFixed(2)}ms`)
    console.log(`  P95: ${p95}ms`)
  })
  
  if (metrics.errorCount > 0) {
    console.log('\n=== Errors by Endpoint ===')
    Object.entries(metrics.errorsByEndpoint).forEach(([endpoint, count]) => {
      console.log(`${endpoint}: ${count} errors`)
    })
  }
})