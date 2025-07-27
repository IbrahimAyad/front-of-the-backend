import NextAuth from 'next-auth'
import type { NextAuthOptions, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/services/auth.service'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: 'ADMIN' | 'CUSTOMER' | 'STAFF'
  }
  
  interface Session {
    user: User
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    email: string
    role: 'ADMIN' | 'CUSTOMER' | 'STAFF'
    accessToken?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await AuthService.validatePassword(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role as 'ADMIN' | 'CUSTOMER' | 'STAFF'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // 7 days (same as Fastify)
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    encode: async ({ secret, token }) => {
      // Use AuthService to generate tokens
      const { accessToken } = AuthService.generateTokens({
        userId: token?.userId as string,
        email: token?.email as string,
        role: token?.role as 'ADMIN' | 'CUSTOMER' | 'STAFF'
      })
      
      return accessToken
    },
    decode: async ({ secret, token }) => {
      if (!token) return null
      
      try {
        // Use AuthService to verify tokens
        const decoded = AuthService.verifyToken(token)
        
        return {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        }
      } catch {
        return null
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.role = user.role
      }
      
      // Generate backward-compatible JWT
      if (account && user) {
        const { accessToken } = AuthService.generateTokens({
          userId: user.id,
          email: user.email,
          role: user.role
        })
        token.accessToken = accessToken
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.userId,
          email: token.email,
          role: token.role
        }
        session.accessToken = token.accessToken || ''
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }