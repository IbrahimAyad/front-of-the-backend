import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService } from '../../lib/services/auth.service'

// Mock dependencies
vi.mock('bcryptjs')
vi.mock('jsonwebtoken')

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService({
      jwtSecret: 'test-secret',
      jwtExpiresIn: '7d',
      saltRounds: 10,
    })
    vi.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'password123'
      const hashedPassword = 'hashed-password'
      
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword)

      const result = await authService.hashPassword(password)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })

    it('should throw error if hashing fails', async () => {
      const password = 'password123'
      
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error('Hashing failed'))

      await expect(authService.hashPassword(password)).rejects.toThrow(
        'Failed to hash password: Hashing failed'
      )
    })
  })

  describe('verifyPassword', () => {
    it('should verify valid password', async () => {
      const password = 'password123'
      const hashedPassword = 'hashed-password'
      
      vi.mocked(bcrypt.compare).mockResolvedValue(true)

      const result = await authService.verifyPassword(password, hashedPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for invalid password', async () => {
      const password = 'wrong-password'
      const hashedPassword = 'hashed-password'
      
      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      const result = await authService.verifyPassword(password, hashedPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })

    it('should throw error if verification fails', async () => {
      const password = 'password123'
      const hashedPassword = 'hashed-password'
      
      vi.mocked(bcrypt.compare).mockRejectedValue(new Error('Verification failed'))

      await expect(authService.verifyPassword(password, hashedPassword)).rejects.toThrow(
        'Failed to verify password: Verification failed'
      )
    })
  })

  describe('generateToken', () => {
    it('should generate token successfully', () => {
      const payload = {
        userId: '123',
        email: 'user@example.com',
        role: 'USER',
      }
      const token = 'jwt-token'
      
      vi.mocked(jwt.sign).mockReturnValue(token)

      const result = authService.generateToken(payload)

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-secret', {
        expiresIn: '7d',
      })
      expect(result).toBe(token)
    })

    it('should throw error if token generation fails', () => {
      const payload = {
        userId: '123',
        email: 'user@example.com',
      }
      
      vi.mocked(jwt.sign).mockImplementation(() => {
        throw new Error('Token generation failed')
      })

      expect(() => authService.generateToken(payload)).toThrow(
        'Failed to generate token: Token generation failed'
      )
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = 'valid-token'
      const decodedToken = {
        userId: '123',
        email: 'user@example.com',
        role: 'USER',
        iat: 1234567890,
        exp: 1234567890,
      }
      
      vi.mocked(jwt.verify).mockReturnValue(decodedToken)

      const result = authService.verifyToken(token)

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret')
      expect(result).toEqual(decodedToken)
    })

    it('should throw error for expired token', () => {
      const token = 'expired-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date())
      })

      expect(() => authService.verifyToken(token)).toThrow('Token has expired')
    })

    it('should throw error for invalid token', () => {
      const token = 'invalid-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      expect(() => authService.verifyToken(token)).toThrow('Invalid token')
    })

    it('should throw generic error for other failures', () => {
      const token = 'bad-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Unknown error')
      })

      expect(() => authService.verifyToken(token)).toThrow(
        'Failed to verify token: Unknown error'
      )
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = 'valid-token'
      const decodedToken = {
        userId: '123',
        email: 'user@example.com',
        iat: 1234567890,
        exp: 1234567890,
      }
      
      vi.mocked(jwt.verify).mockReturnValue(decodedToken)

      const result = authService.isTokenExpired(token)

      expect(result).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = 'expired-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date())
      })

      const result = authService.isTokenExpired(token)

      expect(result).toBe(true)
    })

    it('should return false for other token errors', () => {
      const token = 'invalid-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      const result = authService.isTokenExpired(token)

      expect(result).toBe(false)
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = 'valid-token'
      const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const decodedToken = {
        userId: '123',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp,
      }
      
      vi.mocked(jwt.verify).mockReturnValue(decodedToken)

      const result = authService.getTokenExpiration(token)

      expect(result).toEqual(new Date(exp * 1000))
    })

    it('should return null for invalid token', () => {
      const token = 'invalid-token'
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = authService.getTokenExpiration(token)

      expect(result).toBeNull()
    })
  })
})