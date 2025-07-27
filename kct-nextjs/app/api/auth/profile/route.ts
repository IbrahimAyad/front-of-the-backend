import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'

// GET /api/auth/profile - Get current user profile
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            dateOfBirth: true,
            profilePictureUrl: true,
            metadata: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PUT /api/auth/profile - Update current user profile
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { name, phone, address, city, state, postalCode, country, dateOfBirth } = body

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        name,
        customer: {
          upsert: {
            create: {
              phone,
              address,
              city,
              state,
              postalCode,
              country,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
            },
            update: {
              phone,
              address,
              city,
              state,
              postalCode,
              country,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        customer: true
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})