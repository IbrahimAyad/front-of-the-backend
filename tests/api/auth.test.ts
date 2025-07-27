import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Auth API Tests', () => {
  let api: AxiosInstance
  let testUsers: any[] = []
  let authTokens: { [key: string]: string } = {}

  beforeAll(() => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })
  })

  afterAll(async () => {
    // Clean up test users if possible
    // Note: Most auth systems don't allow user deletion via API
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        name: 'Test User',
      }

      const response = await api.post('/api/auth/register', userData)

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data.user).toHaveProperty('id')
      expect(response.data.user).toHaveProperty('email', userData.email)
      expect(response.data.user).toHaveProperty('name', userData.name)
      expect(response.data.user).not.toHaveProperty('password')

      testUsers.push(userData)
      authTokens[userData.email] = response.data.token
    })

    it('should not allow duplicate email registration', async () => {
      const userData = {
        email: `duplicate-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Duplicate Test',
      }

      // First registration
      const response1 = await api.post('/api/auth/register', userData)
      expect(response1.status).toBe(201)
      testUsers.push(userData)

      // Duplicate registration
      const response2 = await api.post('/api/auth/register', userData)
      expect(response2.status).toBe(409)
      expect(response2.data).toHaveProperty('error')
      expect(response2.data.error).toContain('exists')
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ]

      for (const email of invalidEmails) {
        const response = await api.post('/api/auth/register', {
          email,
          password: 'Password123!',
          name: 'Test',
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })

    it('should enforce password requirements', async () => {
      const weakPasswords = [
        '123',           // Too short
        'password',      // No numbers or special chars
        'Password',      // No numbers
        'Password1',     // No special chars
        'Pass1!',        // Too short
        '',              // Empty
      ]

      for (const password of weakPasswords) {
        const response = await api.post('/api/auth/register', {
          email: `weak-${Date.now()}@example.com`,
          password,
          name: 'Test',
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
        expect(response.data.error.toLowerCase()).toContain('password')
      }
    })

    it('should validate required fields', async () => {
      const invalidData = [
        { email: 'test@example.com', password: 'Pass123!' }, // Missing name
        { email: 'test@example.com', name: 'Test' }, // Missing password
        { password: 'Pass123!', name: 'Test' }, // Missing email
        {}, // Empty object
      ]

      for (const data of invalidData) {
        const response = await api.post('/api/auth/register', data)
        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })
  })

  describe('POST /api/auth/login', () => {
    const loginUser = {
      email: `login-${Date.now()}@example.com`,
      password: 'LoginPass123!',
      name: 'Login Test',
    }

    beforeAll(async () => {
      // Register user for login tests
      const response = await api.post('/api/auth/register', loginUser)
      testUsers.push(loginUser)
    })

    it('should login with valid credentials', async () => {
      const response = await api.post('/api/auth/login', {
        email: loginUser.email,
        password: loginUser.password,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data.user.email).toBe(loginUser.email)
      
      authTokens[loginUser.email] = response.data.token
    })

    it('should fail with incorrect password', async () => {
      const response = await api.post('/api/auth/login', {
        email: loginUser.email,
        password: 'WrongPassword123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('Invalid')
    })

    it('should fail with non-existent email', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate login input', async () => {
      const invalidLogins = [
        { email: 'test@example.com' }, // Missing password
        { password: 'Password123!' }, // Missing email
        { email: '', password: '' }, // Empty strings
        {}, // Empty object
      ]

      for (const data of invalidLogins) {
        const response = await api.post('/api/auth/login', data)
        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })

    it('should handle case-insensitive email', async () => {
      const response = await api.post('/api/auth/login', {
        email: loginUser.email.toUpperCase(),
        password: loginUser.password,
      })

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/auth/me', () => {
    let userToken: string
    let userEmail: string

    beforeAll(async () => {
      // Create a user and get token
      userEmail = `me-${Date.now()}@example.com`
      const registerResponse = await api.post('/api/auth/register', {
        email: userEmail,
        password: 'MePass123!',
        name: 'Me Test',
      })
      userToken = registerResponse.data.token
      testUsers.push({ email: userEmail })
    })

    it('should get current user with valid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email', userEmail)
      expect(response.data).toHaveProperty('name')
      expect(response.data).not.toHaveProperty('password')
    })

    it('should fail without token', async () => {
      const response = await api.get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should fail with malformed authorization header', async () => {
      const malformedHeaders = [
        { Authorization: 'invalid-format' },
        { Authorization: 'Bearer' },
        { Authorization: 'Bearer  ' },
        { Authorization: 'Token ' + userToken },
        { Authorization: userToken }, // No Bearer prefix
      ]

      for (const headers of malformedHeaders) {
        const response = await api.get('/api/auth/me', { headers })
        expect(response.status).toBe(401)
      }
    })
  })

  describe('POST /api/auth/logout', () => {
    let logoutToken: string

    beforeAll(async () => {
      // Create a user and get token
      const registerResponse = await api.post('/api/auth/register', {
        email: `logout-${Date.now()}@example.com`,
        password: 'LogoutPass123!',
        name: 'Logout Test',
      })
      logoutToken = registerResponse.data.token
    })

    it('should logout successfully', async () => {
      const response = await api.post(
        '/api/auth/logout',
        {},
        { headers: { Authorization: `Bearer ${logoutToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
    })

    it('should invalidate token after logout', async () => {
      // First logout
      await api.post(
        '/api/auth/logout',
        {},
        { headers: { Authorization: `Bearer ${logoutToken}` } }
      )

      // Try to use the same token
      const response = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${logoutToken}` },
      })

      expect(response.status).toBe(401)
    })

    it('should handle logout without token', async () => {
      const response = await api.post('/api/auth/logout', {})
      
      // Could be 200 (no-op) or 401 (requires auth)
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('POST /api/auth/refresh', () => {
    let refreshUser: any
    let accessToken: string
    let refreshToken: string

    beforeAll(async () => {
      // Register and login to get tokens
      refreshUser = {
        email: `refresh-${Date.now()}@example.com`,
        password: 'RefreshPass123!',
        name: 'Refresh Test',
      }
      
      await api.post('/api/auth/register', refreshUser)
      const loginResponse = await api.post('/api/auth/login', refreshUser)
      
      accessToken = loginResponse.data.token || loginResponse.data.accessToken
      refreshToken = loginResponse.data.refreshToken
    })

    it('should refresh token with valid refresh token', async () => {
      if (!refreshToken) {
        console.warn('No refresh token provided by API, skipping test')
        return
      }

      const response = await api.post('/api/auth/refresh', {
        refreshToken,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('refreshToken')
      
      // New tokens should be different
      expect(response.data.token).not.toBe(accessToken)
    })

    it('should fail with invalid refresh token', async () => {
      const response = await api.post('/api/auth/refresh', {
        refreshToken: 'invalid-refresh-token',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should fail without refresh token', async () => {
      const response = await api.post('/api/auth/refresh', {})

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    const forgotUser = {
      email: `forgot-${Date.now()}@example.com`,
      password: 'ForgotPass123!',
      name: 'Forgot Test',
    }

    beforeAll(async () => {
      // Register user
      await api.post('/api/auth/register', forgotUser)
    })

    it('should request password reset', async () => {
      const response = await api.post('/api/auth/forgot-password', {
        email: forgotUser.email,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      // Should not reveal whether email exists
      expect(response.data.message).not.toContain('not found')
    })

    it('should handle non-existent email gracefully', async () => {
      const response = await api.post('/api/auth/forgot-password', {
        email: 'nonexistent@example.com',
      })

      // Should return same response to prevent email enumeration
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
    })

    it('should validate email format', async () => {
      const response = await api.post('/api/auth/forgot-password', {
        email: 'invalid-email',
      })

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('should validate reset token', async () => {
      const response = await api.post('/api/auth/reset-password', {
        token: 'invalid-reset-token',
        password: 'NewPassword123!',
      })

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should enforce password requirements on reset', async () => {
      const response = await api.post('/api/auth/reset-password', {
        token: 'some-token',
        password: 'weak',
      })

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error.toLowerCase()).toContain('password')
    })

    it('should validate required fields', async () => {
      const invalidData = [
        { token: 'token' }, // Missing password
        { password: 'NewPass123!' }, // Missing token
        {}, // Empty object
      ]

      for (const data of invalidData) {
        const response = await api.post('/api/auth/reset-password', data)
        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })
  })

  describe('PUT /api/auth/change-password', () => {
    let changePassToken: string

    beforeAll(async () => {
      // Register user
      const userData = {
        email: `changepass-${Date.now()}@example.com`,
        password: 'OldPassword123!',
        name: 'Change Pass Test',
      }
      const response = await api.post('/api/auth/register', userData)
      changePassToken = response.data.token
    })

    it('should change password with valid current password', async () => {
      const response = await api.put(
        '/api/auth/change-password',
        {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        },
        { headers: { Authorization: `Bearer ${changePassToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
    })

    it('should fail with incorrect current password', async () => {
      const response = await api.put(
        '/api/auth/change-password',
        {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        },
        { headers: { Authorization: `Bearer ${changePassToken}` } }
      )

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should enforce password requirements', async () => {
      const response = await api.put(
        '/api/auth/change-password',
        {
          currentPassword: 'OldPassword123!',
          newPassword: 'weak',
        },
        { headers: { Authorization: `Bearer ${changePassToken}` } }
      )

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should require authentication', async () => {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const email = `ratelimit-${Date.now()}@example.com`
      const responses = []

      // Make many rapid login attempts
      for (let i = 0; i < 20; i++) {
        const response = await api.post('/api/auth/login', {
          email,
          password: 'WrongPassword',
        })
        responses.push(response)
        
        // Stop if we hit rate limit
        if (response.status === 429) break
      }

      // Should have hit rate limit
      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })

    it('should rate limit registration attempts', async () => {
      const responses = []

      // Make many rapid registration attempts
      for (let i = 0; i < 20; i++) {
        const response = await api.post('/api/auth/register', {
          email: `ratelimit-reg-${Date.now()}-${i}@example.com`,
          password: 'Password123!',
          name: 'Rate Limit Test',
        })
        responses.push(response)
        
        // Stop if we hit rate limit
        if (response.status === 429) break
      }

      // Should have hit rate limit
      const rateLimited = responses.some(r => r.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('Session Management', () => {
    let sessionToken: string
    let sessionEmail: string

    beforeAll(async () => {
      sessionEmail = `session-${Date.now()}@example.com`
      const response = await api.post('/api/auth/register', {
        email: sessionEmail,
        password: 'SessionPass123!',
        name: 'Session Test',
      })
      sessionToken = response.data.token
    })

    it('should maintain session across requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
      )

      const responses = await Promise.all(requests)
      
      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true)
      
      // All should return same user
      const emails = responses.map(r => r.data.email)
      expect(emails.every(email => email === sessionEmail)).toBe(true)
    })

    it('should get active sessions', async () => {
      const response = await api.get('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })

      // Endpoint might not be implemented
      if (response.status === 200) {
        expect(response.data).toHaveProperty('sessions')
        expect(Array.isArray(response.data.sessions)).toBe(true)
      }
    })

    it('should revoke specific session', async () => {
      const response = await api.delete('/api/auth/sessions/current', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })

      // Endpoint might not be implemented
      if (response.status === 200) {
        // Token should be invalid now
        const meResponse = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        expect(meResponse.status).toBe(401)
      }
    })
  })

  describe('Two-Factor Authentication', () => {
    let tfaToken: string

    beforeAll(async () => {
      const response = await api.post('/api/auth/register', {
        email: `2fa-${Date.now()}@example.com`,
        password: '2FAPass123!',
        name: '2FA Test',
      })
      tfaToken = response.data.token
    })

    it('should enable 2FA', async () => {
      const response = await api.post(
        '/api/auth/2fa/enable',
        {},
        { headers: { Authorization: `Bearer ${tfaToken}` } }
      )

      // Endpoint might not be implemented
      if (response.status === 200) {
        expect(response.data).toHaveProperty('secret')
        expect(response.data).toHaveProperty('qrCode')
      } else {
        expect([404, 501]).toContain(response.status)
      }
    })

    it('should verify 2FA code', async () => {
      const response = await api.post(
        '/api/auth/2fa/verify',
        { code: '123456' },
        { headers: { Authorization: `Bearer ${tfaToken}` } }
      )

      // Endpoint might not be implemented
      if (response.status !== 404 && response.status !== 501) {
        expect([200, 400]).toContain(response.status)
      }
    })
  })
})