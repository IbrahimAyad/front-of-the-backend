import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { AuthService } from '@/lib/services/auth.service'

// Public routes that don't require authentication
const publicRoutes = [
  '/api/products',
  '/api/customers/public',
  '/api/health',
  '/api/auth',
  '/login',
  '/register',
  '/'
]

// Admin-only routes
const adminRoutes = [
  '/api/admin'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Try to get NextAuth token first
  let token = await getToken({ req: request })
  
  // If no NextAuth token, check for Fastify JWT in Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7)
      
      try {
        // Verify Fastify JWT token using AuthService
        const decoded = AuthService.verifyToken(jwtToken)
        
        token = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        }
      } catch (error) {
        // Invalid token
        console.error('Invalid JWT token:', error)
      }
    }
  }

  // No valid token found
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Redirect to login for web pages
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
  }

  // Add user info to request headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.userId)
    requestHeaders.set('x-user-email', token.email)
    requestHeaders.set('x-user-role', token.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ]
}