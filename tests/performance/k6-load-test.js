import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '1m', target: 100 },   // Scale down to 100 users
    { duration: '30s', target: 0 },    // Scale down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],             // Error rate must be below 10%
  },
}

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

// Test scenarios
const scenarios = [
  {
    name: 'Public Endpoints',
    weight: 40,
    exec: publicEndpoints,
  },
  {
    name: 'Authenticated Endpoints',
    weight: 30,
    exec: authenticatedEndpoints,
  },
  {
    name: 'Search Operations',
    weight: 20,
    exec: searchOperations,
  },
  {
    name: 'Mixed Workload',
    weight: 10,
    exec: mixedWorkload,
  },
]

export default function () {
  // Select scenario based on weights
  const random = Math.random() * 100
  let accumulated = 0
  
  for (const scenario of scenarios) {
    accumulated += scenario.weight
    if (random <= accumulated) {
      scenario.exec()
      break
    }
  }
}

function publicEndpoints() {
  // Test public product listing
  const productsRes = http.get(`${BASE_URL}/api/products?limit=20`)
  check(productsRes, {
    'Products list status is 200': (r) => r.status === 200,
    'Products list has data': (r) => {
      const body = JSON.parse(r.body)
      return body.products && body.products.length > 0
    },
    'Products response time OK': (r) => r.timings.duration < 300,
  })
  errorRate.add(productsRes.status !== 200)
  
  sleep(1)
  
  // Test single product
  const productId = Math.floor(Math.random() * 100) + 1
  const productRes = http.get(`${BASE_URL}/api/products/${productId}`)
  check(productRes, {
    'Single product status OK': (r) => r.status === 200 || r.status === 404,
    'Single product response time OK': (r) => r.timings.duration < 200,
  })
  errorRate.add(productRes.status >= 500)
  
  sleep(1)
  
  // Test categories
  const categories = ['Suits', 'Ties', 'Shirts', 'Accessories']
  const category = categories[Math.floor(Math.random() * categories.length)]
  const categoryRes = http.get(`${BASE_URL}/api/products/category/${category}`)
  check(categoryRes, {
    'Category products status is 200': (r) => r.status === 200,
    'Category response time OK': (r) => r.timings.duration < 300,
  })
  errorRate.add(categoryRes.status !== 200)
  
  sleep(1)
}

function authenticatedEndpoints() {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  }
  
  // Test authenticated product list
  const productsRes = http.get(`${BASE_URL}/api/products`, { headers })
  check(productsRes, {
    'Auth products status is 200': (r) => r.status === 200,
    'Auth products response time OK': (r) => r.timings.duration < 400,
  })
  errorRate.add(productsRes.status !== 200)
  
  sleep(1)
  
  // Test user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/me`, { headers })
  check(profileRes, {
    'Profile status is 200': (r) => r.status === 200,
    'Profile has user data': (r) => {
      if (r.status !== 200) return false
      const body = JSON.parse(r.body)
      return body.id && body.email
    },
    'Profile response time OK': (r) => r.timings.duration < 200,
  })
  errorRate.add(profileRes.status !== 200)
  
  sleep(1)
  
  // Test dashboard stats
  const statsRes = http.get(`${BASE_URL}/api/products/stats/dashboard`, { headers })
  check(statsRes, {
    'Dashboard stats status is 200': (r) => r.status === 200,
    'Dashboard stats response time OK': (r) => r.timings.duration < 500,
  })
  errorRate.add(statsRes.status !== 200)
  
  sleep(1)
}

function searchOperations() {
  const searchTerms = ['suit', 'tie', 'wool', 'silk', 'navy', 'black', 'wedding']
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)]
  
  // Test search
  const searchRes = http.get(`${BASE_URL}/api/products/search?q=${term}`)
  check(searchRes, {
    'Search status is 200': (r) => r.status === 200,
    'Search has results': (r) => {
      const body = JSON.parse(r.body)
      return body.products !== undefined
    },
    'Search response time OK': (r) => r.timings.duration < 400,
  })
  errorRate.add(searchRes.status !== 200)
  
  sleep(1)
  
  // Test filtered search
  const minPrice = Math.floor(Math.random() * 100) + 50
  const maxPrice = minPrice + Math.floor(Math.random() * 200) + 100
  const filterRes = http.get(
    `${BASE_URL}/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}&category=Suits`
  )
  check(filterRes, {
    'Filtered search status is 200': (r) => r.status === 200,
    'Filtered search response time OK': (r) => r.timings.duration < 500,
  })
  errorRate.add(filterRes.status !== 200)
  
  sleep(1)
}

function mixedWorkload() {
  const actions = [
    () => {
      // Browse products
      const res = http.get(`${BASE_URL}/api/products?page=${Math.floor(Math.random() * 5) + 1}`)
      check(res, { 'Browse products OK': (r) => r.status === 200 })
      errorRate.add(res.status !== 200)
    },
    () => {
      // View product details
      const res = http.get(`${BASE_URL}/api/products/${Math.floor(Math.random() * 100) + 1}`)
      check(res, { 'View product OK': (r) => r.status === 200 || r.status === 404 })
      errorRate.add(res.status >= 500)
    },
    () => {
      // Search products
      const res = http.get(`${BASE_URL}/api/products/search?q=suit`)
      check(res, { 'Search OK': (r) => r.status === 200 })
      errorRate.add(res.status !== 200)
    },
    () => {
      // Login attempt
      const payload = JSON.stringify({
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'password123',
      })
      const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      check(res, { 'Login attempt OK': (r) => r.status < 500 })
      errorRate.add(res.status >= 500)
    },
  ]
  
  // Execute random actions
  for (let i = 0; i < 3; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)]
    action()
    sleep(Math.random() * 2 + 1) // Random sleep between 1-3 seconds
  }
}

// Handle test lifecycle
export function setup() {
  // Verify endpoints are accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`)
  if (healthCheck.status !== 200) {
    throw new Error(`API is not accessible at ${BASE_URL}`)
  }
  
  // Get auth token if not provided
  if (!AUTH_TOKEN) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body)
      return { authToken: body.token || body.accessToken }
    }
  }
  
  return { authToken: AUTH_TOKEN }
}

export function teardown(data) {
  // Clean up any test data if needed
  console.log('Load test completed')
}