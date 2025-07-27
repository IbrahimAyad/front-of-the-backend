import { NextRequest, NextResponse } from 'next/server'
import { AuthService, JWTPayload } from '@/lib/services/auth.service'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: {
    requireRole?: 'ADMIN' | 'CUSTOMER' | 'STAFF'
  }
) {
  return async (req: NextRequest) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized: No token provided' },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)
      
      // Verify token
      let user: JWTPayload
      try {
        user = AuthService.verifyToken(token)
      } catch (error) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid token' },
          { status: 401 }
        )
      }

      // Check role if required
      if (options?.requireRole && user.role !== options.requireRole) {
        return NextResponse.json(
          { error: `Forbidden: ${options.requireRole} role required` },
          { status: 403 }
        )
      }

      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user

      // Call the handler
      return handler(authenticatedReq)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return AuthService.verifyToken(token)
  } catch {
    return null
  }
}