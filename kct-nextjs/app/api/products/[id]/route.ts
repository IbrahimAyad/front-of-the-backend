import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ProductService } from '@/lib/services/product.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

const productService = new ProductService({ prisma })

// GET /api/products/[id] - Public endpoint
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
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return createApiResponse({
      error: 'Failed to fetch product',
      status: 500
    })
  }
}

// PUT /api/products/[id] - Protected endpoint (ADMIN/MANAGER only)
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if product exists
    const existing = await productService.findById(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Product not found',
        status: 404
      })
    }
    
    const product = await productService.update(params.id, {
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      image: body.image,
    })
    
    return createApiResponse({
      data: product
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return createApiResponse({
      error: 'Failed to update product',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

// DELETE /api/products/[id] - Protected endpoint (ADMIN only)
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,  
  { params }: { params: { id: string } }
) => {
  try {
    // Check if product exists
    const existing = await productService.findById(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Product not found',
        status: 404
      })
    }
    
    await productService.delete(params.id)
    
    return createApiResponse({
      data: { message: 'Product deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return createApiResponse({
      error: 'Failed to delete product',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })