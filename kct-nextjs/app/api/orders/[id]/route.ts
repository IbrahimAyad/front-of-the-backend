import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { OrderService } from '@/lib/services/order.service'
import { OrderStatus, PaymentStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { ProductService } from '@/lib/services/product.service'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })
const orderService = new OrderService({ prisma, productService, cache: cacheService })

// GET /api/orders/[id] - Protected endpoint
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
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return createApiResponse({
      error: 'Failed to fetch order',
      status: 500
    })
  }
})

// PUT /api/orders/[id] - Protected endpoint (ADMIN/STAFF only)
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if order exists
    const existing = await orderService.getOrder(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Order not found',
        status: 404
      })
    }
    
    let updatedOrder = existing
    
    // Update order status if provided
    if (body.status && body.status !== existing.status) {
      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
      }
      
      if (!validTransitions[existing.status]?.includes(body.status)) {
        return createApiResponse({
          error: `Invalid status transition from ${existing.status} to ${body.status}`,
          status: 400
        })
      }
      
      updatedOrder = await orderService.updateOrderStatus(params.id, body.status)
    }
    
    // Update payment status if provided
    if (body.paymentStatus && body.paymentStatus !== existing.paymentStatus) {
      updatedOrder = await orderService.updatePaymentStatus(
        params.id, 
        body.paymentStatus,
        body.paymentDetails
      )
    }
    
    // Update tracking info if provided
    if (body.trackingNumber && body.trackingCarrier) {
      updatedOrder = await orderService.addTrackingInfo(
        params.id,
        body.trackingNumber,
        body.trackingCarrier
      )
    }
    
    return createApiResponse({
      data: updatedOrder
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return createApiResponse({
      error: error.message || 'Failed to update order',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })

// DELETE /api/orders/[id] - Protected endpoint (ADMIN only)
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if order exists
    const existing = await orderService.getOrder(params.id)
    if (!existing) {
      return createApiResponse({
        error: 'Order not found',
        status: 404
      })
    }
    
    // Only allow cancellation, not hard delete
    if (existing.status === OrderStatus.CANCELLED) {
      return createApiResponse({
        error: 'Order is already cancelled',
        status: 400
      })
    }
    
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(existing.status)) {
      return createApiResponse({
        error: 'Cannot cancel shipped or delivered orders',
        status: 400
      })
    }
    
    const cancelledOrder = await orderService.cancel(params.id, body.reason || 'Cancelled by admin')
    
    return createApiResponse({
      data: {
        message: 'Order cancelled successfully',
        order: cancelledOrder
      }
    })
  } catch (error: any) {
    console.error('Error cancelling order:', error)
    return createApiResponse({
      error: error.message || 'Failed to cancel order',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })