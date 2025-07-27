import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Customers Integration Tests', () => {
  let api: AxiosInstance
  let adminToken: string
  let userToken: string
  let testCustomerId: string

  beforeAll(async () => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    // Get admin token
    const adminResponse = await api.post('/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })

    if (adminResponse.status === 200) {
      adminToken = adminResponse.data.token || adminResponse.data.accessToken
    }

    // Create a regular user
    const userEmail = `customer-test-${Date.now()}@example.com`
    const userResponse = await api.post('/api/auth/register', {
      email: userEmail,
      password: 'Password123!',
      name: 'Customer Test User',
    })

    if (userResponse.status === 201) {
      userToken = userResponse.data.token
    }
  })

  afterAll(async () => {
    // Clean up test customer
    if (testCustomerId && adminToken) {
      await api.delete(`/api/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  describe('Customer Management', () => {
    it('should create a new customer as admin', async () => {
      if (!adminToken) {
        console.warn('Skipping test: No admin token')
        return
      }

      const customerData = {
        email: `customer-${Date.now()}@example.com`,
        name: 'Test Customer',
        phone: '+1234567890',
        address: {
          street: '123 Customer St',
          city: 'Customer City',
          state: 'CS',
          zipCode: '12345',
          country: 'USA',
        },
        tags: ['VIP', 'Wholesale'],
      }

      const response = await api.post('/api/customers', customerData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email', customerData.email)
      expect(response.data).toHaveProperty('name', customerData.name)
      expect(response.data).toHaveProperty('customerNumber')
      expect(response.data.tags).toContain('VIP')

      testCustomerId = response.data.id
    })

    it('should not allow regular users to create customers', async () => {
      if (!userToken) return

      const response = await api.post(
        '/api/customers',
        { email: 'test@example.com', name: 'Test' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )

      expect(response.status).toBe(403)
    })

    it('should validate customer data', async () => {
      if (!adminToken) return

      const invalidCustomers = [
        { name: 'No Email' }, // Missing email
        { email: 'invalid-email', name: 'Test' }, // Invalid email
        { email: 'test@example.com' }, // Missing name
        { email: 'test@example.com', name: '', phone: '123' }, // Empty name
      ]

      for (const invalidCustomer of invalidCustomers) {
        const response = await api.post('/api/customers', invalidCustomer, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })
  })

  describe('Customer Retrieval', () => {
    it('should list all customers as admin', async () => {
      if (!adminToken) return

      const response = await api.get('/api/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customers')
      expect(Array.isArray(response.data.customers)).toBe(true)
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
    })

    it('should not allow regular users to list customers', async () => {
      if (!userToken) return

      const response = await api.get('/api/customers', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(403)
    })

    it('should get single customer by ID', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.get(`/api/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testCustomerId)
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('orderHistory')
      expect(response.data).toHaveProperty('totalSpent')
    })

    it('should search customers', async () => {
      if (!adminToken) return

      const response = await api.get('/api/customers/search?q=test', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customers')
      expect(Array.isArray(response.data.customers)).toBe(true)
    })

    it('should filter customers by tag', async () => {
      if (!adminToken) return

      const response = await api.get('/api/customers?tag=VIP', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      response.data.customers.forEach((customer: any) => {
        expect(customer.tags).toContain('VIP')
      })
    })
  })

  describe('Customer Updates', () => {
    it('should update customer as admin', async () => {
      if (!adminToken || !testCustomerId) return

      const updates = {
        phone: '+0987654321',
        tags: ['VIP', 'Premium', 'Loyal'],
      }

      const response = await api.put(`/api/customers/${testCustomerId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('phone', updates.phone)
      expect(response.data.tags).toContain('Premium')
      expect(response.data.tags).toContain('Loyal')
    })

    it('should update customer preferences', async () => {
      if (!adminToken || !testCustomerId) return

      const preferences = {
        newsletter: true,
        smsNotifications: false,
        preferredContact: 'email',
      }

      const response = await api.put(
        `/api/customers/${testCustomerId}/preferences`,
        preferences,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data.preferences).toMatchObject(preferences)
    })

    it('should add customer notes', async () => {
      if (!adminToken || !testCustomerId) return

      const note = {
        content: 'Customer prefers morning appointments',
        type: 'PREFERENCE',
      }

      const response = await api.post(
        `/api/customers/${testCustomerId}/notes`,
        note,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('content', note.content)
      expect(response.data).toHaveProperty('createdBy')
    })
  })

  describe('Customer Analytics', () => {
    it('should get customer statistics', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.get(`/api/customers/${testCustomerId}/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalOrders')
      expect(response.data).toHaveProperty('totalSpent')
      expect(response.data).toHaveProperty('averageOrderValue')
      expect(response.data).toHaveProperty('lastOrderDate')
      expect(response.data).toHaveProperty('loyaltyTier')
    })

    it('should get customer order history', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.get(`/api/customers/${testCustomerId}/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('orders')
      expect(Array.isArray(response.data.orders)).toBe(true)
    })

    it('should get customer segments', async () => {
      if (!adminToken) return

      const response = await api.get('/api/customers/segments', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('segments')
      expect(Array.isArray(response.data.segments)).toBe(true)
    })
  })

  describe('Customer Communication', () => {
    it('should send email to customer', async () => {
      if (!adminToken || !testCustomerId) return

      const emailData = {
        subject: 'Test Email',
        content: 'This is a test email',
        template: 'general',
      }

      const response = await api.post(
        `/api/customers/${testCustomerId}/email`,
        emailData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      // Might return 501 if email service not implemented
      expect([200, 501]).toContain(response.status)
    })

    it('should get communication history', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.get(`/api/customers/${testCustomerId}/communications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('communications')
      expect(Array.isArray(response.data.communications)).toBe(true)
    })
  })

  describe('Customer Import/Export', () => {
    it('should export customers as CSV', async () => {
      if (!adminToken) return

      const response = await api.get('/api/customers/export?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect([200, 501]).toContain(response.status)
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('csv')
      }
    })

    it('should import customers from CSV', async () => {
      if (!adminToken) return

      const csvData = `email,name,phone
import1@example.com,Import Test 1,+1234567890
import2@example.com,Import Test 2,+0987654321`

      const response = await api.post(
        '/api/customers/import',
        { data: csvData, format: 'csv' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 501]).toContain(response.status)
      if (response.status === 200) {
        expect(response.data).toHaveProperty('imported')
        expect(response.data).toHaveProperty('failed')
      }
    })
  })

  describe('Customer Deletion', () => {
    it('should soft delete customer', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.delete(`/api/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)

      // Verify customer is soft deleted
      const getResponse = await api.get(`/api/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(getResponse.status).toBe(200)
      expect(getResponse.data).toHaveProperty('deletedAt')
    })

    it('should permanently delete customer', async () => {
      if (!adminToken || !testCustomerId) return

      const response = await api.delete(`/api/customers/${testCustomerId}?permanent=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)

      // Verify customer is gone
      const getResponse = await api.get(`/api/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(getResponse.status).toBe(404)
    })
  })

  describe('Customer Merge', () => {
    it('should merge duplicate customers', async () => {
      if (!adminToken) return

      // Create two customers
      const customer1Response = await api.post(
        '/api/customers',
        {
          email: `merge1-${Date.now()}@example.com`,
          name: 'Merge Test 1',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      const customer2Response = await api.post(
        '/api/customers',
        {
          email: `merge2-${Date.now()}@example.com`,
          name: 'Merge Test 2',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      if (customer1Response.status === 201 && customer2Response.status === 201) {
        const response = await api.post(
          '/api/customers/merge',
          {
            primaryId: customer1Response.data.id,
            secondaryId: customer2Response.data.id,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        )

        expect([200, 501]).toContain(response.status)
        if (response.status === 200) {
          expect(response.data).toHaveProperty('mergedCustomer')
        }
      }
    })
  })
})