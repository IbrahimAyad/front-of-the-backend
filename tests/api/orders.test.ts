import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Orders API Tests', () => {
  let api: AxiosInstance
  let adminToken: string
  let userToken: string
  let userId: string
  let testProductId: string
  let testCustomerId: string
  let testOrders: any[] = []

  beforeAll(async () => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    // Login as admin
    const adminLogin = await api.post('/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })
    adminToken = adminLogin.data.token || adminLogin.data.accessToken

    // Create and login as regular user
    const userEmail = `order-user-${Date.now()}@example.com`
    const registerResponse = await api.post('/api/auth/register', {
      email: userEmail,
      password: 'Password123!',
      name: 'Order Test User',
    })
    userId = registerResponse.data.user.id

    const userLogin = await api.post('/api/auth/login', {
      email: userEmail,
      password: 'Password123!',
    })
    userToken = userLogin.data.token || userLogin.data.accessToken

    // Get a test product
    const productsResponse = await api.get('/api/products?limit=1')
    if (productsResponse.data.products.length > 0) {
      testProductId = productsResponse.data.products[0].id
    }

    // Create a test customer
    const customerResponse = await api.post(
      '/api/customers',
      {
        email: `order-customer-${Date.now()}@example.com`,
        name: 'Order Test Customer',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    testCustomerId = customerResponse.data.id
  })

  afterAll(async () => {
    // Clean up test orders
    for (const order of testOrders) {
      await api.delete(`/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  describe('POST /api/orders', () => {
    it('should create order as authenticated user', async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
            price: 299.99, // Should match product price
          },
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        billingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      }

      const response = await api.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('orderNumber')
      expect(response.data).toHaveProperty('status', 'pending')
      expect(response.data).toHaveProperty('items')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('userId', userId)
      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0].quantity).toBe(2)

      testOrders.push(response.data)
    })

    it('should create order with customer ID as admin', async () => {
      const orderData = {
        customerId: testCustomerId,
        items: [
          {
            productId: testProductId,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: 'Customer Name',
          street: '456 Customer St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
      }

      const response = await api.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('customerId', testCustomerId)
      testOrders.push(response.data)
    })

    it('should validate order items', async () => {
      const invalidOrders = [
        { items: [] }, // Empty items
        { items: [{ productId: 'invalid', quantity: 1 }] }, // Invalid product
        { items: [{ productId: testProductId, quantity: 0 }] }, // Zero quantity
        { items: [{ productId: testProductId, quantity: -1 }] }, // Negative quantity
        { items: [{ productId: testProductId }] }, // Missing quantity
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
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('stock')
    })

    it('should calculate order totals correctly', async () => {
      // Get product price first
      const productResponse = await api.get(`/api/products/${testProductId}`)
      const productPrice = productResponse.data.price

      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 3,
          },
        ],
        discount: {
          type: 'percentage',
          value: 10, // 10% discount
        },
        shipping: {
          method: 'express',
          cost: 15.00,
        },
      }

      const response = await api.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(201)
      
      const expectedSubtotal = productPrice * 3
      const expectedDiscount = expectedSubtotal * 0.10
      const expectedTotal = expectedSubtotal - expectedDiscount + 15.00

      expect(response.data.subtotal).toBeCloseTo(expectedSubtotal, 2)
      expect(response.data.discount).toBeCloseTo(expectedDiscount, 2)
      expect(response.data.shipping).toBe(15.00)
      expect(response.data.total).toBeCloseTo(expectedTotal, 2)

      testOrders.push(response.data)
    })

    it('should require authentication', async () => {
      const response = await api.post('/api/orders', {
        items: [{ productId: testProductId, quantity: 1 }],
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/orders', () => {
    it('should list user orders', async () => {
      const response = await api.get('/api/orders', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('orders')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
      expect(Array.isArray(response.data.orders)).toBe(true)

      // User should only see their own orders
      response.data.orders.forEach((order: any) => {
        expect(order.userId).toBe(userId)
      })
    })

    it('should list all orders as admin', async () => {
      const response = await api.get('/api/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data.orders)).toBe(true)
      // Admin sees all orders
    })

    it('should support pagination', async () => {
      const response = await api.get('/api/orders?page=2&limit=5', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data.page).toBe(2)
      expect(response.data.limit).toBe(5)
    })

    it('should filter by status', async () => {
      const response = await api.get('/api/orders?status=pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      response.data.orders.forEach((order: any) => {
        expect(order.status).toBe('pending')
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const endDate = new Date()

      const response = await api.get(
        `/api/orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      response.data.orders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt)
        expect(orderDate >= startDate).toBe(true)
        expect(orderDate <= endDate).toBe(true)
      })
    })

    it('should sort orders', async () => {
      const response = await api.get('/api/orders?sort=createdAt&order=desc', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      const dates = response.data.orders.map((o: any) => new Date(o.createdAt).getTime())
      const sortedDates = [...dates].sort((a, b) => b - a)
      expect(dates).toEqual(sortedDates)
    })
  })

  describe('GET /api/orders/:id', () => {
    let orderId: string

    beforeAll(async () => {
      // Create an order for testing
      const response = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      orderId = response.data.id
      testOrders.push(response.data)
    })

    it('should get order details as owner', async () => {
      const response = await api.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', orderId)
      expect(response.data).toHaveProperty('orderNumber')
      expect(response.data).toHaveProperty('items')
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('timeline')
    })

    it('should get order details as admin', async () => {
      const response = await api.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data.id).toBe(orderId)
    })

    it('should include full details when requested', async () => {
      const response = await api.get(`/api/orders/${orderId}?include=customer,products`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customer')
      expect(response.data.items[0]).toHaveProperty('product')
    })

    it('should not allow access to other users orders', async () => {
      // Create another user
      const otherEmail = `other-${Date.now()}@example.com`
      await api.post('/api/auth/register', {
        email: otherEmail,
        password: 'Password123!',
        name: 'Other User',
      })
      const otherLogin = await api.post('/api/auth/login', {
        email: otherEmail,
        password: 'Password123!',
      })
      const otherToken = otherLogin.data.token

      const response = await api.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${otherToken}` },
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent order', async () => {
      const response = await api.get('/api/orders/non-existent', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/orders/:id', () => {
    let updateOrderId: string

    beforeAll(async () => {
      const response = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      updateOrderId = response.data.id
      testOrders.push(response.data)
    })

    it('should update order status as admin', async () => {
      const response = await api.put(
        `/api/orders/${updateOrderId}`,
        { status: 'processing' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status', 'processing')
      expect(response.data.timeline).toContainEqual(
        expect.objectContaining({
          status: 'processing',
          updatedBy: expect.any(String),
        })
      )
    })

    it('should update shipping information', async () => {
      const shippingUpdate = {
        shipping: {
          carrier: 'FedEx',
          trackingNumber: '1234567890',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }

      const response = await api.put(
        `/api/orders/${updateOrderId}`,
        shippingUpdate,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data.shipping).toMatchObject(shippingUpdate.shipping)
    })

    it('should not allow users to update order details', async () => {
      const response = await api.put(
        `/api/orders/${updateOrderId}`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(response.status).toBe(403)
    })

    it('should validate status transitions', async () => {
      // Try to move from processing directly to delivered (invalid)
      const response = await api.put(
        `/api/orders/${updateOrderId}`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('status')
    })
  })

  describe('POST /api/orders/:id/cancel', () => {
    let cancelOrderId: string

    beforeAll(async () => {
      const response = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      cancelOrderId = response.data.id
      testOrders.push(response.data)
    })

    it('should cancel order as owner', async () => {
      const response = await api.post(
        `/api/orders/${cancelOrderId}/cancel`,
        { reason: 'Changed my mind' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status', 'cancelled')
      expect(response.data).toHaveProperty('cancellationReason', 'Changed my mind')
    })

    it('should not cancel already shipped orders', async () => {
      // Create and ship an order
      const orderResponse = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      const shippedOrderId = orderResponse.data.id
      testOrders.push(orderResponse.data)

      // Update to shipped status
      await api.put(
        `/api/orders/${shippedOrderId}`,
        { status: 'processing' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      await api.put(
        `/api/orders/${shippedOrderId}`,
        { status: 'shipped' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      // Try to cancel
      const cancelResponse = await api.post(
        `/api/orders/${shippedOrderId}/cancel`,
        { reason: 'Too late' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(cancelResponse.status).toBe(400)
      expect(cancelResponse.data.error).toContain('cancel')
    })
  })

  describe('POST /api/orders/:id/refund', () => {
    let refundOrderId: string

    beforeAll(async () => {
      // Create a completed order
      const orderResponse = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 2 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      refundOrderId = orderResponse.data.id
      testOrders.push(orderResponse.data)

      // Move to completed status
      await api.put(
        `/api/orders/${refundOrderId}`,
        { status: 'processing' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      await api.put(
        `/api/orders/${refundOrderId}`,
        { status: 'shipped' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      await api.put(
        `/api/orders/${refundOrderId}`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
    })

    it('should process full refund as admin', async () => {
      const response = await api.post(
        `/api/orders/${refundOrderId}/refund`,
        {
          amount: 'full',
          reason: 'Defective product',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('refund')
      expect(response.data.refund).toHaveProperty('amount')
      expect(response.data.refund).toHaveProperty('status', 'pending')
    })

    it('should process partial refund', async () => {
      const response = await api.post(
        `/api/orders/${refundOrderId}/refund`,
        {
          amount: 50.00,
          reason: 'Partial damage',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data.refund.amount).toBe(50.00)
    })

    it('should not allow users to process refunds', async () => {
      const response = await api.post(
        `/api/orders/${refundOrderId}/refund`,
        {
          amount: 'full',
          reason: 'Want refund',
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('Order Analytics', () => {
    it('should get order statistics as admin', async () => {
      const response = await api.get('/api/orders/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalOrders')
      expect(response.data).toHaveProperty('totalRevenue')
      expect(response.data).toHaveProperty('averageOrderValue')
      expect(response.data).toHaveProperty('ordersByStatus')
      expect(response.data).toHaveProperty('topProducts')
      expect(response.data).toHaveProperty('revenueByPeriod')
    })

    it('should get user order statistics', async () => {
      const response = await api.get('/api/orders/my-stats', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalOrders')
      expect(response.data).toHaveProperty('totalSpent')
      expect(response.data).toHaveProperty('averageOrderValue')
    })

    it('should not allow regular users to access admin stats', async () => {
      const response = await api.get('/api/orders/stats', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(403)
    })
  })

  describe('Order Export', () => {
    it('should export orders as CSV for admin', async () => {
      const response = await api.get('/api/orders/export?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('csv')
    })

    it('should export orders as PDF for admin', async () => {
      const response = await api.get('/api/orders/export?format=pdf', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect([200, 501]).toContain(response.status) // 501 if not implemented
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('pdf')
      }
    })

    it('should export user orders', async () => {
      const response = await api.get('/api/orders/my-orders/export?format=csv', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
    })
  })

  describe('Order Notifications', () => {
    let notifOrderId: string

    beforeAll(async () => {
      const response = await api.post(
        '/api/orders',
        {
          items: [{ productId: testProductId, quantity: 1 }],
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      notifOrderId = response.data.id
      testOrders.push(response.data)
    })

    it('should send order confirmation email', async () => {
      const response = await api.post(
        `/api/orders/${notifOrderId}/send-confirmation`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 202]).toContain(response.status)
    })

    it('should send shipping notification', async () => {
      // First update order to shipped
      await api.put(
        `/api/orders/${notifOrderId}`,
        { 
          status: 'shipped',
          shipping: {
            carrier: 'UPS',
            trackingNumber: 'TRACK123',
          },
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      const response = await api.post(
        `/api/orders/${notifOrderId}/send-shipping-notification`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 202]).toContain(response.status)
    })
  })
})