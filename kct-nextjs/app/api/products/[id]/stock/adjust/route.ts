import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ProductService } from '@/lib/services/product.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

const productService = new ProductService({ prisma })

// POST /api/products/[id]/stock/adjust - Protected endpoint (ADMIN/MANAGER/STAFF only)
export const POST = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.variantId || body.quantity === undefined || !body.operation) {
      return createApiResponse({
        error: 'variantId, quantity, and operation are required',
        status: 400
      })
    }
    
    // Validate operation
    if (!['increment', 'decrement', 'set'].includes(body.operation)) {
      return createApiResponse({
        error: 'Invalid operation. Must be increment, decrement, or set',
        status: 400
      })
    }
    
    // Check if product and variant exist
    const product = await productService.findById(params.id)
    if (!product) {
      return createApiResponse({
        error: 'Product not found',
        status: 404
      })
    }
    
    const variant = product.variants.find(v => v.id === body.variantId)
    if (!variant) {
      return createApiResponse({
        error: 'Variant not found',
        status: 404
      })
    }
    
    // Update stock
    await productService.updateStock(body.variantId, body.quantity, body.operation)
    
    // Get updated variant
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: body.variantId }
    })
    
    // Log stock adjustment
    await prisma.stockAdjustment.create({
      data: {
        variantId: body.variantId,
        quantity: body.quantity,
        operation: body.operation,
        reason: body.reason || 'Manual adjustment',
        adjustedBy: request.user!.email
      }
    })
    
    return createApiResponse({
      data: {
        message: 'Stock adjusted successfully',
        variant: updatedVariant
      }
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return createApiResponse({
      error: 'Failed to adjust stock',
      status: 500
    })
  }
})