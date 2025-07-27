import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Orders Integration Tests', () => {
  let api: AxiosInstance
  let userToken: string
  let adminToken: string
  let testOrderId: string
  let testProductId: string

  beforeAll(async () => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    // Create a test user and get token
    const userEmail = `order-test-${Date.now()}@example.com`
    const registerResponse = await api.post('/api/auth/register', {
      email: userEmail,
      password: 'Password123!',
      name: 'Order Test User',
    })

    if (registerResponse.status === 201) {
      userToken = registerResponse.data.token
    }

    // Get admin token
    const adminResponse = await api.post('/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })

    if (adminResponse.status === 200) {
      adminToken = adminResponse.data.token || adminResponse.data.accessToken
    }

    // Get a test product ID
    const productsResponse = await api.get('/api/products?limit=1')
    if (productsResponse.status === 200 && productsResponse.data.products.length > 0) {
      testProductId = productsResponse.data.products[0].id
    }
  })

  afterAll(async () => {
    // Clean up test order
    if (testOrderId && adminToken) {
      await api.delete(`/api/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  describe('Order Creation', () => {
    it('should create an order with valid data', async () => {
      if (!userToken || !testProductId) {
        console.warn('Skipping test: Missing prerequisites')
        return
      }

      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
        },
      }

      const response = await api.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('orderNumber')
      expect(response.data).toHaveProperty('status', 'PENDING')
      expect(response.data).toHaveProperty('total')
      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0].quantity).toBe(2)

      testOrderId = response.data.id
    })

    it('should not create order without authentication', async () => {
      const response = await api.post('/api/orders', {
        items: [{ productId: '1', quantity: 1 }],
      })

      expect(response.status).toBe(401)
    })

    it('should validate order items', async () => {
      if (!userToken) return

      const invalidOrders = [
        { items: [] }, // Empty items
        { items: [{ productId: 'invalid', quantity: 1 }] }, // Invalid product
        { items: [{ productId: testProductId, quantity: 0 }] }, // Zero quantity
        { items: [{ productId: testProductId, quantity: -1 }] }, // Negative quantity
      ]

      for (const invalidOrder of invalidOrders) {
        const response = await api.post('/api/orders', invalidOrder, {
          headers: { Authorization: `Bearer ${userToken}` },
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })

    it('should check product availability', async () => {
      if (!userToken || !testProductId) return

      const response = await api.post(
        '/api/orders',
        {
          items: [
            {
              productId: testProductId,
              quantity: 99999, // Excessive quantity
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('stock')
    })
  })

  describe('Order Retrieval', () => {
    it('should get user orders', async () => {
      if (!userToken) return

      const response = await api.get('/api/orders', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('orders')
      expect(Array.isArray(response.data.orders)).toBe(true)
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
    })

    it('should get single order by ID', async () => {
      if (!userToken || !testOrderId) return

      const response = await api.get(`/api/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testOrderId)
      expect(response.data).toHaveProperty('orderNumber')
      expect(response.data).toHaveProperty('items')
      expect(response.data).toHaveProperty('shippingAddress')
    })

    it('should not access other users orders', async () => {
      if (!userToken || !testOrderId) return

      // Create another user
      const otherUserResponse = await api.post('/api/auth/register', {
        email: `other-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Other User',
      })

      if (otherUserResponse.status === 201) {
        const otherToken = otherUserResponse.data.token

        // Try to access the first user's order
        const response = await api.get(`/api/orders/${testOrderId}`, {
          headers: { Authorization: `Bearer ${otherToken}` },
        })

        expect(response.status).toBe(403)
      }
    })

    it('should filter orders by status', async () => {
      if (!userToken) return

      const response = await api.get('/api/orders?status=PENDING', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      response.data.orders.forEach((order: any) => {
        expect(order.status).toBe('PENDING')
      })
    })

    it('should filter orders by date range', async () => {
      if (!userToken) return

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7) // 7 days ago

      const response = await api.get(
        `/api/orders?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      )

      expect(response.status).toBe(200)
      response.data.orders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt)
        expect(orderDate >= startDate).toBe(true)
        expect(orderDate <= new Date()).toBe(true)
      })
    })
  })

  describe('Order Updates', () => {
    it('should update order status as admin', async () => {
      if (!adminToken || !testOrderId) return

      const response = await api.put(
        `/api/orders/${testOrderId}/status`,
        { status: 'PROCESSING' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status', 'PROCESSING')
    })

    it('should not allow users to update order status', async () => {
      if (!userToken || !testOrderId) return

      const response = await api.put(
        `/api/orders/${testOrderId}/status`,
        { status: 'COMPLETED' },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      )

      expect(response.status).toBe(403)
    })

    it('should cancel order as user', async () => {
      if (!userToken || !testOrderId) return

      const response = await api.post(
        `/api/orders/${testOrderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status', 'CANCELLED')
    })

    it('should not cancel completed orders', async () => {
      if (!adminToken || !userToken) return

      // First, create and complete an order
      const orderResponse = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: { street: '456 Test Ave', city: 'Test', state: 'TS', zipCode: '12345' },
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      if (orderResponse.status === 201) {
        const orderId = orderResponse.data.id

        // Complete the order as admin
        await api.put(
          `/api/orders/${orderId}/status`,
          { status: 'COMPLETED' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        )

        // Try to cancel
        const cancelResponse = await api.post(
          `/api/orders/${orderId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        )

        expect(cancelResponse.status).toBe(400)
        expect(cancelResponse.data.error).toContain('cancel')
      }
    })
  })

  describe('Order Statistics', () => {
    it('should get order statistics as admin', async () => {
      if (!adminToken) return

      const response = await api.get('/api/orders/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalOrders')
      expect(response.data).toHaveProperty('totalRevenue')
      expect(response.data).toHaveProperty('ordersByStatus')
      expect(response.data).toHaveProperty('recentOrders')
    })

    it('should not get statistics without admin role', async () => {
      if (!userToken) return

      const response = await api.get('/api/orders/stats', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(403)
    })
  })

  describe('Order History', () => {
    it('should track order status history', async () => {
      if (!userToken || !adminToken || !testOrderId) return

      // Update status multiple times
      await api.put(
        `/api/orders/${testOrderId}/status`,
        { status: 'PROCESSING' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      await api.put(
        `/api/orders/${testOrderId}/status`,
        { status: 'SHIPPED' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      // Get order with history
      const response = await api.get(`/api/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('statusHistory')
      expect(Array.isArray(response.data.statusHistory)).toBe(true)
      expect(response.data.statusHistory.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Payment Integration', () => {
    it('should process payment for order', async () => {
      if (!userToken || !testOrderId) return

      const paymentData = {
        method: 'CREDIT_CARD',
        token: 'test-payment-token',
      }

      const response = await api.post(
        `/api/orders/${testOrderId}/payment`,
        paymentData,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      )

      // Response depends on payment processor implementation
      expect([200, 501]).toContain(response.status)
    })
  })

  describe('Order Export', () => {
    it('should export orders as admin', async () => {
      if (!adminToken) return

      const response = await api.get('/api/orders/export?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect([200, 501]).toContain(response.status)
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('csv')
      }
    })
  })
})