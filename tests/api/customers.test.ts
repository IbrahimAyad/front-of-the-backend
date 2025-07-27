import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Customers API Tests', () => {
  let api: AxiosInstance
  let adminToken: string
  let userToken: string
  let testCustomers: any[] = []

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
    const userEmail = `user-${Date.now()}@example.com`
    await api.post('/api/auth/register', {
      email: userEmail,
      password: 'Password123!',
      name: 'Test User',
    })
    const userLogin = await api.post('/api/auth/login', {
      email: userEmail,
      password: 'Password123!',
    })
    userToken = userLogin.data.token || userLogin.data.accessToken
  })

  afterAll(async () => {
    // Clean up test customers
    for (const customer of testCustomers) {
      await api.delete(`/api/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  describe('GET /api/customers', () => {
    it('should list customers as admin', async () => {
      const response = await api.get('/api/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customers')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
      expect(Array.isArray(response.data.customers)).toBe(true)
    })

    it('should deny access to regular users', async () => {
      const response = await api.get('/api/customers', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(403)
    })

    it('should support pagination', async () => {
      const response = await api.get('/api/customers?page=2&limit=5', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data.page).toBe(2)
      expect(response.data.limit).toBe(5)
    })

    it('should filter by status', async () => {
      const response = await api.get('/api/customers?status=active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      response.data.customers.forEach((customer: any) => {
        expect(customer.status).toBe('active')
      })
    })

    it('should search customers', async () => {
      const response = await api.get('/api/customers?search=john', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      response.data.customers.forEach((customer: any) => {
        const searchableText = `${customer.name} ${customer.email}`.toLowerCase()
        expect(searchableText).toContain('john')
      })
    })

    it('should sort customers', async () => {
      const response = await api.get('/api/customers?sort=createdAt&order=desc', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      const dates = response.data.customers.map((c: any) => new Date(c.createdAt).getTime())
      const sortedDates = [...dates].sort((a, b) => b - a)
      expect(dates).toEqual(sortedDates)
    })
  })

  describe('GET /api/customers/:id', () => {
    let customerId: string

    beforeAll(async () => {
      // Create a test customer
      const response = await api.post(
        '/api/customers',
        {
          email: `test-${Date.now()}@example.com`,
          name: 'Test Customer',
          phone: '+1234567890',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
          },
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      customerId = response.data.id
      testCustomers.push(response.data)
    })

    it('should get customer details as admin', async () => {
      const response = await api.get(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', customerId)
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('createdAt')
      expect(response.data).toHaveProperty('profile')
      expect(response.data).toHaveProperty('analytics')
    })

    it('should include customer analytics', async () => {
      const response = await api.get(`/api/customers/${customerId}?include=analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data.analytics).toHaveProperty('totalOrders')
      expect(response.data.analytics).toHaveProperty('totalSpent')
      expect(response.data.analytics).toHaveProperty('averageOrderValue')
      expect(response.data.analytics).toHaveProperty('lifetimeValue')
    })

    it('should include order history', async () => {
      const response = await api.get(`/api/customers/${customerId}?include=orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('orders')
      expect(Array.isArray(response.data.orders)).toBe(true)
    })

    it('should return 404 for non-existent customer', async () => {
      const response = await api.get('/api/customers/non-existent', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/customers', () => {
    it('should create customer as admin', async () => {
      const newCustomer = {
        email: `new-${Date.now()}@example.com`,
        name: 'New Customer',
        phone: '+1234567890',
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'NC',
          zipCode: '54321',
        },
        profile: {
          preferredContact: 'email',
          birthday: '1990-01-01',
          gender: 'male',
          notes: 'VIP customer',
        },
        tags: ['new', 'vip'],
      }

      const response = await api.post('/api/customers', newCustomer, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email', newCustomer.email)
      expect(response.data).toHaveProperty('customerNumber')
      expect(response.data.tags).toContain('vip')

      testCustomers.push(response.data)
    })

    it('should validate email uniqueness', async () => {
      const email = `duplicate-${Date.now()}@example.com`

      const response1 = await api.post(
        '/api/customers',
        { email, name: 'Customer 1' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      expect(response1.status).toBe(201)
      testCustomers.push(response1.data)

      const response2 = await api.post(
        '/api/customers',
        { email, name: 'Customer 2' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      expect(response2.status).toBe(409)
      expect(response2.data.error).toContain('exists')
    })

    it('should validate required fields', async () => {
      const invalidCustomers = [
        { name: 'No Email' }, // Missing email
        { email: 'invalid-email' }, // Invalid email format
        { email: 'test@example.com' }, // Missing name
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

  describe('PUT /api/customers/:id', () => {
    let updateCustomerId: string

    beforeAll(async () => {
      const response = await api.post(
        '/api/customers',
        {
          email: `update-${Date.now()}@example.com`,
          name: 'Update Test',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      updateCustomerId = response.data.id
      testCustomers.push(response.data)
    })

    it('should update customer details', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '+0987654321',
        tags: ['updated', 'premium'],
      }

      const response = await api.put(`/api/customers/${updateCustomerId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('name', updates.name)
      expect(response.data).toHaveProperty('phone', updates.phone)
      expect(response.data.tags).toContain('premium')
    })

    it('should update customer profile', async () => {
      const profileUpdates = {
        profile: {
          measurements: {
            chest: 40,
            waist: 32,
            sleeve: 34,
          },
          preferences: {
            fit: 'slim',
            fabric: 'wool',
          },
        },
      }

      const response = await api.put(
        `/api/customers/${updateCustomerId}`,
        profileUpdates,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data.profile.measurements).toEqual(profileUpdates.profile.measurements)
      expect(response.data.profile.preferences).toEqual(profileUpdates.profile.preferences)
    })

    it('should merge tags instead of replacing', async () => {
      // First add some tags
      await api.put(
        `/api/customers/${updateCustomerId}`,
        { tags: ['tag1', 'tag2'] },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      // Then add more tags
      const response = await api.put(
        `/api/customers/${updateCustomerId}`,
        { tags: ['tag3', 'tag4'], mergeTags: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data.tags).toContain('tag1')
      expect(response.data.tags).toContain('tag2')
      expect(response.data.tags).toContain('tag3')
      expect(response.data.tags).toContain('tag4')
    })
  })

  describe('DELETE /api/customers/:id', () => {
    it('should soft delete customer', async () => {
      const response = await api.post(
        '/api/customers',
        {
          email: `delete-${Date.now()}@example.com`,
          name: 'Delete Test',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      const customerId = response.data.id

      const deleteResponse = await api.delete(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(deleteResponse.status).toBe(200)

      // Verify soft delete
      const getResponse = await api.get(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(getResponse.status).toBe(200)
      expect(getResponse.data).toHaveProperty('deletedAt')
    })

    it('should permanently delete customer', async () => {
      const response = await api.post(
        '/api/customers',
        {
          email: `permanent-${Date.now()}@example.com`,
          name: 'Permanent Delete',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      const customerId = response.data.id

      const deleteResponse = await api.delete(
        `/api/customers/${customerId}?permanent=true`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(deleteResponse.status).toBe(200)

      // Verify permanent delete
      const getResponse = await api.get(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(getResponse.status).toBe(404)
    })
  })

  describe('Customer Analytics', () => {
    it('should get customer segments', async () => {
      const response = await api.get('/api/customers/segments', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('segments')
      expect(Array.isArray(response.data.segments)).toBe(true)
      
      if (response.data.segments.length > 0) {
        const segment = response.data.segments[0]
        expect(segment).toHaveProperty('name')
        expect(segment).toHaveProperty('count')
        expect(segment).toHaveProperty('criteria')
      }
    })

    it('should get customer statistics', async () => {
      const response = await api.get('/api/customers/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalCustomers')
      expect(response.data).toHaveProperty('activeCustomers')
      expect(response.data).toHaveProperty('newCustomersThisMonth')
      expect(response.data).toHaveProperty('averageLifetimeValue')
      expect(response.data).toHaveProperty('topCustomers')
    })

    it('should get customer growth metrics', async () => {
      const response = await api.get('/api/customers/analytics/growth?period=monthly', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('growth')
      expect(Array.isArray(response.data.growth)).toBe(true)
    })

    it('should get customer retention metrics', async () => {
      const response = await api.get('/api/customers/analytics/retention', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('retentionRate')
      expect(response.data).toHaveProperty('churnRate')
      expect(response.data).toHaveProperty('cohorts')
    })
  })

  describe('Customer Communications', () => {
    let commCustomerId: string

    beforeAll(async () => {
      const response = await api.post(
        '/api/customers',
        {
          email: `comm-${Date.now()}@example.com`,
          name: 'Communication Test',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      commCustomerId = response.data.id
      testCustomers.push(response.data)
    })

    it('should add customer note', async () => {
      const note = {
        content: 'Customer prefers email communication',
        type: 'preference',
      }

      const response = await api.post(
        `/api/customers/${commCustomerId}/notes`,
        note,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('content', note.content)
      expect(response.data).toHaveProperty('createdBy')
    })

    it('should get customer notes', async () => {
      const response = await api.get(`/api/customers/${commCustomerId}/notes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should send email to customer', async () => {
      const emailData = {
        subject: 'Test Email',
        template: 'welcome',
        data: { name: 'Test Customer' },
      }

      const response = await api.post(
        `/api/customers/${commCustomerId}/email`,
        emailData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 202]).toContain(response.status)
    })

    it('should get communication history', async () => {
      const response = await api.get(`/api/customers/${commCustomerId}/communications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('communications')
      expect(Array.isArray(response.data.communications)).toBe(true)
    })
  })

  describe('Bulk Operations', () => {
    it('should import customers from CSV', async () => {
      const csvData = `email,name,phone,tags
bulk1-${Date.now()}@example.com,Bulk Customer 1,+1234567890,"new,imported"
bulk2-${Date.now()}@example.com,Bulk Customer 2,+0987654321,"new,vip"
bulk3-${Date.now()}@example.com,Bulk Customer 3,+1122334455,"new"`

      const response = await api.post(
        '/api/customers/import',
        { data: csvData, format: 'csv' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 201]).toContain(response.status)
      expect(response.data).toHaveProperty('imported')
      expect(response.data).toHaveProperty('failed')
      expect(response.data).toHaveProperty('errors')

      if (response.data.imported) {
        response.data.imported.forEach((c: any) => testCustomers.push(c))
      }
    })

    it('should export customers', async () => {
      const response = await api.get('/api/customers/export?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('csv')
    })

    it('should bulk update customers', async () => {
      const updates = testCustomers.slice(0, 3).map(c => ({
        id: c.id,
        updates: { tags: ['bulk-updated'] },
      }))

      const response = await api.put('/api/customers/bulk', updates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect([200, 207]).toContain(response.status)
    })

    it('should bulk tag customers', async () => {
      const customerIds = testCustomers.slice(0, 3).map(c => c.id)

      const response = await api.post(
        '/api/customers/bulk/tag',
        {
          customerIds,
          tags: ['bulk-tag-test'],
          operation: 'add',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Customer Search', () => {
    it('should search customers by query', async () => {
      const response = await api.get('/api/customers/search?q=test', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('customers')
      expect(response.data).toHaveProperty('total')
    })

    it('should search with filters', async () => {
      const response = await api.get('/api/customers/search', {
        params: {
          q: 'test',
          tags: 'vip',
          status: 'active',
          minLifetimeValue: 1000,
        },
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
    })

    it('should use fuzzy search', async () => {
      const response = await api.get('/api/customers/search?q=jhon&fuzzy=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      // Should find "John" even with typo
    })
  })
})