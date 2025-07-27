import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Auth Integration Tests', () => {
  let api: AxiosInstance
  let testUser: any
  let authToken: string

  beforeAll(() => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Integration Test User',
    }
  })

  afterAll(async () => {
    // Clean up test user if needed
    if (authToken) {
      try {
        await api.delete('/api/auth/user', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  })

  describe('Registration Flow', () => {
    it('should register a new user', async () => {
      const response = await api.post('/api/auth/register', testUser)

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data.user.email).toBe(testUser.email)
      expect(response.data.user.name).toBe(testUser.name)
      expect(response.data.user).not.toHaveProperty('password')

      authToken = response.data.token
    })

    it('should not allow duplicate email registration', async () => {
      const response = await api.post('/api/auth/register', testUser)

      expect(response.status).toBe(409)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate email format', async () => {
      const response = await api.post('/api/auth/register', {
        ...testUser,
        email: 'invalid-email',
      })

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should enforce password requirements', async () => {
      const weakPasswords = ['123', 'password', 'Password1']

      for (const password of weakPasswords) {
        const response = await api.post('/api/auth/register', {
          ...testUser,
          email: `weak-${Date.now()}@example.com`,
          password,
        })

        expect(response.status).toBe(400)
      }
    })
  })

  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data.user.email).toBe(testUser.email)

      authToken = response.data.token
    })

    it('should fail with invalid password', async () => {
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: 'WrongPassword123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should fail with non-existent email', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email', testUser.email)
      expect(response.data).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await api.get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should reject request with invalid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
        )
      )

      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(responses.every(r => r.data.email === testUser.email)).toBe(true)
    })

    it('should handle concurrent login attempts', async () => {
      const loginPromises = Array.from({ length: 10 }, () =>
        api.post('/api/auth/login', {
          email: testUser.email,
          password: testUser.password,
        })
      )

      const responses = await Promise.all(loginPromises)
      expect(responses.every(r => r.status === 200)).toBe(true)
    })
  })

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const response = await api.post(
        '/api/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      )

      expect(response.status).toBe(200)
    })

    it('should invalidate token after logout', async () => {
      // First logout
      await api.post(
        '/api/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      )

      // Try to use the same token
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const attempts = 20
      const responses = []

      for (let i = 0; i < attempts; i++) {
        const response = await api.post('/api/auth/login', {
          email: `ratelimit-${i}@example.com`,
          password: 'WrongPassword',
        })
        responses.push(response)
      }

      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await api.get('/api/health')

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
      ]

      for (const header of securityHeaders) {
        expect(response.headers).toHaveProperty(header)
      }
    })

    it('should not expose sensitive headers', async () => {
      const response = await api.get('/api/health')

      expect(response.headers['x-powered-by']).toBeUndefined()
    })
  })
})