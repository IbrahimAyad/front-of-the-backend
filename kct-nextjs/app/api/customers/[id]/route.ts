import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { CustomerService } from '@/lib/services/customer.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const customerService = new CustomerService(prisma, cacheService)

// GET /api/customers/[id] - Protected endpoint (ALL authenticated users)
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const customer = await customerService.findById(params.id)
    
    if (!customer) {
      return createApiResponse({
        error: 'Customer not found',
        status: 404
      })
    }
    
    return createApiResponse({
      data: customer
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return createApiResponse({
      error: 'Failed to fetch customer',
      status: 500
    })
  }
})

// PUT /api/customers/[id] - Protected endpoint (ADMIN/STAFF only)
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if customer exists
    const existing = await customerService.findById(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Customer not found',
        status: 404
      })
    }
    
    // If email is being changed, check for conflicts
    if (body.email && body.email !== existing.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email: body.email }
      })
      
      if (emailExists) {
        return createApiResponse({
          error: 'Email already in use',
          status: 409
        })
      }
    }
    
    const customer = await customerService.update(params.id, {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    })
    
    return createApiResponse({
      data: customer
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return createApiResponse({
      error: 'Failed to update customer',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

// DELETE /api/customers/[id] - Protected endpoint (ADMIN only)
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if customer exists
    const existing = await customerService.findById(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Customer not found',
        status: 404
      })
    }
    
    // Check if customer has orders
    const orderCount = await prisma.order.count({
      where: { customerId: params.id }
    })
    
    if (orderCount > 0) {
      return createApiResponse({
        error: 'Cannot delete customer with existing orders',
        status: 400
      })
    }
    
    await customerService.delete(params.id)
    
    return createApiResponse({
      data: { message: 'Customer deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return createApiResponse({
      error: 'Failed to delete customer',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })