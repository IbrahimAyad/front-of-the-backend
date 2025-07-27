import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { OrderService } from '@/lib/services/order.service'
import { OrderStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { ProductService } from '@/lib/services/product.service'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })
const orderService = new OrderService({ prisma, productService, cache: cacheService })

// GET /api/orders - Protected endpoint (ALL authenticated users see their own orders, ADMIN/STAFF see all)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(request.user!.role)
    
    // Parse filters
    const filters: any = {}
    
    // Non-admin users can only see their own orders
    if (!isAdminOrStaff) {
      filters.customerId = request.user!.id
    } else if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId')
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as OrderStatus
    }
    
    if (searchParams.get('paymentStatus')) {
      filters.paymentStatus = searchParams.get('paymentStatus')
    }
    
    if (searchParams.get('minTotal')) {
      filters.minTotal = parseFloat(searchParams.get('minTotal')!)
    }
    
    if (searchParams.get('maxTotal')) {
      filters.maxTotal = parseFloat(searchParams.get('maxTotal')!)
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    // Parse pagination
    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }
    
    const result = await orderService.getOrders(filters, pagination)
    
    return createApiResponse({
      data: result.orders,
      meta: {
        total: result.total,
        page: result.page,
        limit: pagination.limit,
        totalPages: result.totalPages,
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return createApiResponse({
      error: 'Failed to fetch orders',
      status: 500
    })
  }
})

// POST /api/orders - Protected endpoint (ALL authenticated users can create orders)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.customerId || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createApiResponse({
        error: 'customerId and items array are required',
        status: 400
      })
    }
    
    if (!body.shippingAddress) {
      return createApiResponse({
        error: 'shippingAddress is required',
        status: 400
      })
    }
    
    if (!body.shippingMethod || body.shippingCost === undefined) {
      return createApiResponse({
        error: 'shippingMethod and shippingCost are required',
        status: 400
      })
    }
    
    // For non-admin users, ensure they can only create orders for themselves
    if (request.user!.role === 'CUSTOMER' && body.customerId !== request.user!.id) {
      return createApiResponse({
        error: 'Unauthorized to create orders for other customers',
        status: 403
      })
    }
    
    // Validate items structure
    for (const item of body.items) {
      if (!item.productId || !item.variantId || !item.quantity || item.price === undefined) {
        return createApiResponse({
          error: 'Each item must have productId, variantId, quantity, and price',
          status: 400
        })
      }
    }
    
    const order = await orderService.createOrder({
      customerId: body.customerId,
      items: body.items,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      shippingMethod: body.shippingMethod,
      shippingCost: body.shippingCost,
      notes: body.notes,
    })
    
    return createApiResponse({
      data: order,
      status: 201
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    
    // Handle specific errors
    if (error.message?.includes('Insufficient stock')) {
      return createApiResponse({
        error: error.message,
        status: 400
      })
    }
    
    if (error.message?.includes('not found')) {
      return createApiResponse({
        error: error.message,
        status: 404
      })
    }
    
    return createApiResponse({
      error: 'Failed to create order',
      status: 500
    })
  }
})