import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify current token
    let payload
    try {
      payload = AuthService.verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const { accessToken, refreshToken } = AuthService.generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    })

    return NextResponse.json({
      token: accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}