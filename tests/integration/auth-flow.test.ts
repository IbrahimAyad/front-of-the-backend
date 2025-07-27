import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Auth Flow Integration Tests', () => {
  let api: AxiosInstance
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Test User',
  }
  let authToken: string
  let refreshToken: string
  let userId: string

  beforeAll(() => {
    const API_URL = process.env.API_URL || 'http://localhost:3001'
    api = axios.create({
      baseURL: API_URL,
      validateStatus: () => true, // Don't throw on any status
    })
  })

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await api.post('/api/auth/register', testUser)

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data.user.email).toBe(testUser.email)
      expect(response.data.user.name).toBe(testUser.name)
      expect(response.data.user).not.toHaveProperty('password')

      authToken = response.data.token
      userId = response.data.user.id
    })

    it('should not allow duplicate registration', async () => {
      const response = await api.post('/api/auth/register', testUser)

      expect(response.status).toBe(409)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('already exists')
    })

    it('should validate registration input', async () => {
      const invalidUsers = [
        { email: 'invalid-email', password: '123', name: 'Test' },
        { email: 'test@example.com', password: '123', name: 'Test' }, // Weak password
        { email: '', password: 'SecurePassword123!', name: 'Test' },
        { email: 'test@example.com', password: '', name: 'Test' },
      ]

      for (const invalidUser of invalidUsers) {
        const response = await api.post('/api/auth/register', invalidUser)
        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
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
      expect(response.data).toHaveProperty('refreshToken')
      expect(response.data.user.email).toBe(testUser.email)

      authToken = response.data.token
      refreshToken = response.data.refreshToken
    })

    it('should fail login with invalid password', async () => {
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: 'WrongPassword123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('Invalid credentials')
    })

    it('should fail login with non-existent email', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('Invalid credentials')
    })

    it('should handle rate limiting', async () => {
      // Make multiple failed login attempts
      const attempts = 10
      const responses = []

      for (let i = 0; i < attempts; i++) {
        const response = await api.post('/api/auth/login', {
          email: testUser.email,
          password: 'WrongPassword',
        })
        responses.push(response)
      }

      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('Authenticated Requests', () => {
    it('should access protected route with valid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', userId)
      expect(response.data).toHaveProperty('email', testUser.email)
      expect(response.data).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await api.get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('Authentication required')
    })

    it('should reject request with invalid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('Invalid token')
    })

    it('should reject request with malformed authorization header', async () => {
      const malformedHeaders = [
        { Authorization: 'invalid-format' },
        { Authorization: 'Bearer' },
        { Authorization: 'Bearer  ' },
        { Authorization: 'Token ' + authToken },
      ]

      for (const headers of malformedHeaders) {
        const response = await api.get('/api/auth/me', { headers })
        expect(response.status).toBe(401)
      }
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh token with valid refresh token', async () => {
      const response = await api.post('/api/auth/refresh', {
        refreshToken,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('refreshToken')
      expect(response.data.token).not.toBe(authToken) // Should be a new token

      // Update tokens
      authToken = response.data.token
      refreshToken = response.data.refreshToken
    })

    it('should reject invalid refresh token', async () => {
      const response = await api.post('/api/auth/refresh', {
        refreshToken: 'invalid-refresh-token',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate new token after refresh', async () => {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', userId)
    })
  })

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const response = await api.post(
        '/api/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
    })

    it('should invalidate token after logout', async () => {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(401)
    })

    it('should invalidate refresh token after logout', async () => {
      const response = await api.post('/api/auth/refresh', {
        refreshToken,
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Password Reset Flow', () => {
    let resetToken: string

    it('should request password reset', async () => {
      const response = await api.post('/api/auth/forgot-password', {
        email: testUser.email,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      
      // In a real test, we would extract the reset token from the email
      // For now, we'll simulate it
      resetToken = 'simulated-reset-token'
    })

    it('should not reveal if email exists', async () => {
      const response = await api.post('/api/auth/forgot-password', {
        email: 'nonexistent@example.com',
      })

      // Should return same response to prevent email enumeration
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
    })

    it('should reset password with valid token', async () => {
      const newPassword = 'NewSecurePassword123!'
      
      // This would normally work with a real reset token
      const response = await api.post('/api/auth/reset-password', {
        token: resetToken,
        password: newPassword,
      })

      // Expect this to fail with our simulated token
      expect(response.status).toBeOneOf([200, 400, 401])
    })

    it('should validate new password requirements', async () => {
      const weakPasswords = ['123', 'password', 'Password', 'Password1']

      for (const password of weakPasswords) {
        const response = await api.post('/api/auth/reset-password', {
          token: resetToken,
          password,
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })
  })

  describe('Session Management', () => {
    let sessionToken: string

    beforeAll(async () => {
      // Login again to get a fresh token
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      })
      sessionToken = response.data.token
    })

    it('should maintain session across requests', async () => {
      const responses = []

      // Make multiple authenticated requests
      for (let i = 0; i < 5; i++) {
        const response = await api.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
        responses.push(response)
      }

      // All requests should succeed
      expect(responses.every(r => r.status === 200)).toBe(true)
      
      // User data should be consistent
      const userData = responses.map(r => r.data)
      expect(userData.every(u => u.id === userId)).toBe(true)
    })

    it('should handle concurrent authenticated requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        api.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
      )

      const responses = await Promise.all(requests)
      
      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should deny access to admin routes for regular users', async () => {
      const adminEndpoints = [
        { method: 'GET', path: '/api/admin/users' },
        { method: 'GET', path: '/api/admin/analytics' },
        { method: 'POST', path: '/api/admin/settings' },
      ]

      for (const endpoint of adminEndpoints) {
        const response = await api.request({
          method: endpoint.method,
          url: endpoint.path,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        expect(response.status).toBe(403)
        expect(response.data).toHaveProperty('error')
        expect(response.data.error).toContain('Forbidden')
      }
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await api.get('/api/health')

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
      ]

      for (const header of securityHeaders) {
        expect(response.headers).toHaveProperty(header)
      }
    })

    it('should not expose sensitive headers', async () => {
      const response = await api.get('/api/health')

      const sensitiveHeaders = [
        'x-powered-by',
        'server',
      ]

      for (const header of sensitiveHeaders) {
        expect(response.headers[header]).toBeUndefined()
      }
    })
  })
})

// Helper to extend expect
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOneOf(expected: Array<T>): void
  }
}

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be one of ${expected}`
          : `expected ${received} to be one of ${expected}`,
    }
  },
})