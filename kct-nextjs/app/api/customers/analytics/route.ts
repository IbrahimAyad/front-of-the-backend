import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/services/customer.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const customerService = new CustomerService(prisma, cacheService)

// GET /api/customers/analytics - Public endpoint (for backward compatibility)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return createApiResponse({
        error: 'customerId is required',
        status: 400
      })
    }
    
    // Get customer analytics
    const analytics = await customerService.getAnalytics(customerId)
    
    if (!analytics) {
      return createApiResponse({
        error: 'Customer not found',
        status: 404
      })
    }
    
    return createApiResponse({
      data: analytics
    })
  } catch (error) {
    console.error('Error fetching customer analytics:', error)
    return createApiResponse({
      error: 'Failed to fetch customer analytics',
      status: 500
    })
  }
}