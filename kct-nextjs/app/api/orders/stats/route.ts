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

// GET /api/orders/stats - Protected endpoint (ADMIN/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse date range
    let dateRange: { startDate?: Date; endDate?: Date } | undefined
    
    if (searchParams.get('startDate') || searchParams.get('endDate')) {
      dateRange = {}
      
      if (searchParams.get('startDate')) {
        dateRange.startDate = new Date(searchParams.get('startDate')!)
      }
      
      if (searchParams.get('endDate')) {
        dateRange.endDate = new Date(searchParams.get('endDate')!)
      }
    }
    
    const stats = await orderService.getOrderStats(dateRange)
    
    return createApiResponse({
      data: stats
    })
  } catch (error) {
    console.error('Error fetching order stats:', error)
    return createApiResponse({
      error: 'Failed to fetch order statistics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })