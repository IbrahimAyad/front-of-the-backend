import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ProductService } from '@/lib/services/product.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

const productService = new ProductService({ prisma })

// GET /api/products/[id]/variants - Public endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productService.findById(params.id)
    
    if (!product) {
      return createApiResponse({
        error: 'Product not found',
        status: 404
      })
    }
    
    return createApiResponse({
      data: product.variants
    })
  } catch (error) {
    console.error('Error fetching product variants:', error)
    return createApiResponse({
      error: 'Failed to fetch product variants',
      status: 500
    })
  }
}

// POST /api/products/[id]/variants - Protected endpoint (ADMIN/MANAGER only)
export const POST = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if product exists
    const product = await productService.findById(params.id)
    if (!product) {
      return createApiResponse({
        error: 'Product not found',
        status: 404
      })
    }
    
    // Validate required fields
    if (!body.name || body.price === undefined || body.stock === undefined) {
      return createApiResponse({
        error: 'Name, price, and stock are required',
        status: 400
      })
    }
    
    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: params.id,
        name: body.name,
        price: body.price,
        stock: body.stock,
        sku: body.sku,
        attributes: body.attributes || {}
      }
    })
    
    return createApiResponse({
      data: variant,
      status: 201
    })
  } catch (error) {
    console.error('Error creating product variant:', error)
    return createApiResponse({
      error: 'Failed to create product variant',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

// PUT /api/products/[id]/variants/[variantId] would go in a separate file
// DELETE /api/products/[id]/variants/[variantId] would go in a separate file