import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { CustomerService } from '@/lib/services/customer.service'
import { createApiResponse } from '@/lib/api/response'
import { withQueryRouting, withDatabaseHealth } from '@/middleware/query-routing'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const customerService = new CustomerService({} as any, cacheService)

// GET /api/customers - Protected endpoint with query routing
export const GET = withAuth(withQueryRouting(withDatabaseHealth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters = {
      search: searchParams.get('search') || undefined,
      minSpent: searchParams.get('minSpent') ? parseFloat(searchParams.get('minSpent')!) : undefined,
      maxSpent: searchParams.get('maxSpent') ? parseFloat(searchParams.get('maxSpent')!) : undefined,
      hasOrders: searchParams.get('hasOrders') ? searchParams.get('hasOrders') === 'true' : undefined,
    }
    
    // Parse pagination
    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    }
    
    const result = await customerService.findAll(filters, pagination)
    
    return createApiResponse({
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return createApiResponse({
      error: 'Failed to fetch customers',
      status: 500
    })
  }
})))

// POST /api/customers - Protected endpoint (ADMIN/STAFF only)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName) {
      return createApiResponse({
        error: 'Email, firstName, and lastName are required',
        status: 400
      })
    }
    
    // Check if customer with email already exists
    const existing = await prisma.customer.findUnique({
      where: { email: body.email }
    })
    
    if (existing) {
      return createApiResponse({
        error: 'Customer with this email already exists',
        status: 409
      })
    }
    
    const customer = await customerService.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      addresses: body.addresses ? {
        create: body.addresses
      } : undefined
    })
    
    return createApiResponse({
      data: customer,
      status: 201
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return createApiResponse({
      error: 'Failed to create customer',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })