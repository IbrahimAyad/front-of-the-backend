import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ProductService } from '@/lib/services/product.service'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

const productService = new ProductService({ prisma })

// GET /api/products/alerts/stock - Protected endpoint (ADMIN/MANAGER/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Get low stock products
    const lowStockProducts = await productService.checkLowStock()
    
    // Format response to match Fastify structure
    const alerts = lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      totalStock: productService.calculateTotalStock(product),
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        stock: variant.stock,
        sku: variant.sku
      }))
    }))
    
    return createApiResponse({
      data: {
        alerts,
        threshold: 10, // Low stock threshold
        totalAlerts: alerts.length
      }
    })
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return createApiResponse({
      error: 'Failed to fetch stock alerts',
      status: 500
    })
  }
})