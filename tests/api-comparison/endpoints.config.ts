import { ApiEndpoint } from './comparison.framework'

export const authEndpoints: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    description: 'User registration',
    body: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'User login',
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current user',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'User logout',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
  },
  {
    method: 'POST',
    path: '/api/auth/refresh',
    description: 'Refresh token',
    body: {
      refreshToken: '{{refreshToken}}',
    },
  },
]

export const productEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/products',
    description: 'List all products',
    params: {
      page: '1',
      limit: '10',
    },
  },
  {
    method: 'GET',
    path: '/api/products/{{productId}}',
    description: 'Get product by ID',
  },
  {
    method: 'POST',
    path: '/api/products',
    description: 'Create new product',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      name: 'Test Product',
      description: 'A test product',
      price: 29.99,
      stock: 100,
      category: 'Electronics',
    },
  },
  {
    method: 'PUT',
    path: '/api/products/{{productId}}',
    description: 'Update product',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      name: 'Updated Product',
      price: 34.99,
    },
  },
  {
    method: 'DELETE',
    path: '/api/products/{{productId}}',
    description: 'Delete product',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
  },
  {
    method: 'GET',
    path: '/api/products/search',
    description: 'Search products',
    params: {
      q: 'test',
      category: 'Electronics',
    },
  },
  {
    method: 'GET',
    path: '/api/products/category/{{category}}',
    description: 'Get products by category',
    params: {
      page: '1',
      limit: '10',
    },
  },
  {
    method: 'POST',
    path: '/api/products/{{productId}}/stock',
    description: 'Update product stock',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      quantity: -5,
    },
  },
]

export const customerEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/customers',
    description: 'List all customers',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    params: {
      page: '1',
      limit: '10',
    },
  },
  {
    method: 'GET',
    path: '/api/customers/{{customerId}}',
    description: 'Get customer by ID',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
  },
  {
    method: 'POST',
    path: '/api/customers',
    description: 'Create new customer',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+1234567890',
      address: '123 Main St, City, State 12345',
    },
  },
  {
    method: 'PUT',
    path: '/api/customers/{{customerId}}',
    description: 'Update customer',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      phone: '+0987654321',
      address: '456 Oak Ave, City, State 67890',
    },
  },
  {
    method: 'DELETE',
    path: '/api/customers/{{customerId}}',
    description: 'Delete customer',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
  },
]

export const orderEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/orders',
    description: 'List all orders',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
    params: {
      page: '1',
      limit: '10',
    },
  },
  {
    method: 'GET',
    path: '/api/orders/{{orderId}}',
    description: 'Get order by ID',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
  },
  {
    method: 'POST',
    path: '/api/orders',
    description: 'Create new order',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
    body: {
      items: [
        {
          productId: '{{productId}}',
          quantity: 2,
        },
      ],
      shippingAddress: '123 Main St, City, State 12345',
    },
  },
  {
    method: 'PUT',
    path: '/api/orders/{{orderId}}/status',
    description: 'Update order status',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    body: {
      status: 'SHIPPED',
    },
  },
  {
    method: 'POST',
    path: '/api/orders/{{orderId}}/cancel',
    description: 'Cancel order',
    headers: {
      Authorization: 'Bearer {{token}}',
    },
  },
]

export const analyticsEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/analytics/dashboard',
    description: 'Get dashboard analytics',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/sales',
    description: 'Get sales analytics',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    params: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/products/top',
    description: 'Get top selling products',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    params: {
      limit: '10',
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/customers/growth',
    description: 'Get customer growth metrics',
    headers: {
      Authorization: 'Bearer {{adminToken}}',
    },
    params: {
      period: 'monthly',
    },
  },
]

export const healthEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check',
  },
  {
    method: 'GET',
    path: '/api/health/db',
    description: 'Database health check',
  },
  {
    method: 'GET',
    path: '/api/health/redis',
    description: 'Redis health check',
  },
]

// Combine all endpoints
export const allEndpoints: ApiEndpoint[] = [
  ...authEndpoints,
  ...productEndpoints,
  ...customerEndpoints,
  ...orderEndpoints,
  ...analyticsEndpoints,
  ...healthEndpoints,
]

// Helper function to replace placeholders in endpoints
export function prepareEndpoints(
  endpoints: ApiEndpoint[],
  variables: Record<string, string>
): ApiEndpoint[] {
  return endpoints.map(endpoint => {
    const prepared = { ...endpoint }

    // Replace in path
    prepared.path = prepared.path.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => variables[key] || match
    )

    // Replace in headers
    if (prepared.headers) {
      prepared.headers = Object.entries(prepared.headers).reduce(
        (acc, [key, value]) => {
          acc[key] = value.replace(
            /\{\{(\w+)\}\}/g,
            (match, varKey) => variables[varKey] || match
          )
          return acc
        },
        {} as Record<string, string>
      )
    }

    // Replace in body if it's a string
    if (prepared.body && typeof prepared.body === 'string') {
      prepared.body = prepared.body.replace(
        /\{\{(\w+)\}\}/g,
        (match, key) => variables[key] || match
      )
    }

    return prepared
  })
}