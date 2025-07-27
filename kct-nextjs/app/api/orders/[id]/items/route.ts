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

// GET /api/orders/[id]/items - Protected endpoint
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const order = await orderService.getOrder(params.id)
    
    if (!order) {
      return createApiResponse({
        error: 'Order not found',
        status: 404
      })
    }
    
    // Check access permissions
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(request.user!.role)
    if (!isAdminOrStaff && order.customerId !== request.user!.id) {
      return createApiResponse({
        error: 'Unauthorized to view this order',
        status: 403
      })
    }
    
    return createApiResponse({
      data: order.items
    })
  } catch (error) {
    console.error('Error fetching order items:', error)
    return createApiResponse({
      error: 'Failed to fetch order items',
      status: 500
    })
  }
})

// POST /api/orders/[id]/items - Protected endpoint (ADMIN/STAFF only, for adding items to existing orders)
export const POST = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if order exists
    const order = await orderService.getOrder(params.id)
    if (!order) {
      return createApiResponse({
        error: 'Order not found',
        status: 404
      })
    }
    
    // Only allow adding items to pending orders
    if (order.status !== OrderStatus.PENDING) {
      return createApiResponse({
        error: 'Can only add items to pending orders',
        status: 400
      })
    }
    
    // Validate item data
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createApiResponse({
        error: 'items array is required',
        status: 400
      })
    }
    
    // Validate each item
    for (const item of body.items) {
      if (!item.productId || !item.variantId || !item.quantity || item.price === undefined) {
        return createApiResponse({
          error: 'Each item must have productId, variantId, quantity, and price',
          status: 400
        })
      }
    }
    
    const updatedOrder = await orderService.addOrderItems(params.id, body.items)
    
    return createApiResponse({
      data: updatedOrder,
      status: 201
    })
  } catch (error: any) {
    console.error('Error adding order items:', error)
    
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
      error: 'Failed to add order items',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })