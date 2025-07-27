import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'STAFF'
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!
  private static readonly JWT_EXPIRES_IN = '7d'

  static async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  static generateTokens(payload: JWTPayload) {
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    })

    // For refresh token, we'll use a longer expiry
    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '30d'
    })

    return { accessToken, refreshToken }
  }

  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as jwt.JwtPayload
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  static async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await this.hashPassword(newPassword)
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })
  }
}