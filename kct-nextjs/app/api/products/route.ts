import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ProductService } from '@/lib/services/product.service'
import { createApiResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/error-handler'
import { withRateLimit, defaultLimiter } from '@/lib/rate-limit'
import { withQueryRouting, withDatabaseHealth } from '@/middleware/query-routing'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ cache: cacheService })

// GET /api/products - Public endpoint with caching and query routing
export const GET = withRateLimit(withQueryRouting(withDatabaseHealth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Create cache key from search params
    const cacheKey = `products:${searchParams.toString()}`
    
    // Check cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      const parsedCache = JSON.parse(cached)
      return NextResponse.json(createApiResponse({
        data: parsedCache.data,
        meta: {
          ...parsedCache.meta,
          cached: true,
          cacheTime: new Date().toISOString()
        }
      }))
    }
    
    // Parse filters with validation
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
    }
    
    // Validate price range
    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      throw new Error('Invalid price range: minimum price cannot be greater than maximum price')
    }
    
    // Parse pagination with limits
    const pagination = {
      page: Math.max(1, searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1),
      limit: Math.min(100, Math.max(1, searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20)),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    }
    
    const startTime = Date.now()
    const result = await productService.findAll(filters, pagination)
    const duration = Date.now() - startTime
    
    const response = {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        queryTime: `${duration}ms`,
        cached: false
      }
    }
    
    // Cache the result for 5 minutes
    await cacheService.set(cacheKey, JSON.stringify(response), 300)
    
    return NextResponse.json(createApiResponse(response))
  } catch (error) {
    return handleApiError(error, 'Products GET')
  }
})), defaultLimiter, 30) // 30 requests per minute for public endpoint

// POST /api/products - Protected endpoint (ADMIN only)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.price) {
      throw new Error('Name and price are required')
    }
    
    // Validate price
    if (typeof body.price !== 'number' || body.price <= 0) {
      throw new Error('Price must be a positive number')
    }
    
    // Validate name length
    if (body.name.length < 1 || body.name.length > 200) {
      throw new Error('Product name must be between 1 and 200 characters')
    }
    
    const startTime = Date.now()
    const product = await productService.create({
      name: body.name.trim(),
      description: body.description?.trim(),
      price: body.price,
      category: body.category?.trim(),
      image: body.image?.trim(),
      variants: body.variants ? {
        create: body.variants.map((variant: any) => ({
          ...variant,
          name: variant.name?.trim(),
          sku: variant.sku?.trim()
        }))
      } : undefined
    })
    
    const duration = Date.now() - startTime
    
    // Invalidate products cache
    await cacheService.invalidate('products:*')
    
    return NextResponse.json(createApiResponse({
      data: product,
      meta: {
        created: true,
        queryTime: `${duration}ms`
      }
    }), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Products POST')
  }
}, { requireRole: 'ADMIN' })