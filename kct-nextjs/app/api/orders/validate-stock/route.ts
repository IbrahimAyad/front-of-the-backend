import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { OrderService } from '@/lib/services/order.service'
import { prisma } from '@/lib/prisma'
import { ProductService } from '@/lib/services/product.service'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })
const orderService = new OrderService({ prisma, productService, cache: cacheService })

// POST /api/orders/validate-stock - Protected endpoint (ALL authenticated users)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createApiResponse({
        error: 'items array is required',
        status: 400
      })
    }
    
    // Validate each item
    for (const item of body.items) {
      if (!item.productId || !item.variantId || !item.quantity) {
        return createApiResponse({
          error: 'Each item must have productId, variantId, and quantity',
          status: 400
        })
      }
      
      if (item.quantity <= 0) {
        return createApiResponse({
          error: 'Quantity must be greater than 0',
          status: 400
        })
      }
    }
    
    const validationResult = await orderService.validateOrderStock(body.items)
    
    return createApiResponse({
      data: validationResult
    })
  } catch (error: any) {
    console.error('Error validating stock:', error)
    
    if (error.message?.includes('not found')) {
      return createApiResponse({
        error: error.message,
        status: 404
      })
    }
    
    return createApiResponse({
      error: 'Failed to validate stock',
      status: 500
    })
  }
})