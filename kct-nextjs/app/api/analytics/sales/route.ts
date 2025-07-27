import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { OrderService } from '@/lib/services/order.service'
import { ProductService } from '@/lib/services/product.service'
import { OrderStatus, PaymentStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })
const orderService = new OrderService({ prisma, productService, cache: cacheService })

// GET /api/analytics/sales - Protected endpoint (ADMIN/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse date range (default to last 30 days)
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date()
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get period for revenue breakdown
    const period = (searchParams.get('period') || 'day') as 'day' | 'week' | 'month' | 'year'
    
    // Fetch sales data in parallel
    const [
      orderStats,
      revenueByPeriod,
      topSellingProducts,
      salesByCategory,
      conversionMetrics,
      averageOrderMetrics
    ] = await Promise.all([
      // Overall order statistics
      orderService.getOrderStats({ startDate, endDate }),
      
      // Revenue breakdown by period
      orderService.getRevenueByPeriod(period, { startDate, endDate }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: OrderStatus.CANCELLED }
          }
        },
        _sum: {
          quantity: true,
          total: true
        },
        _count: true,
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 10
      }).then(async (items) => {
        // Fetch product details
        const productIds = items.map(item => item.productId)
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, category: true, image: true }
        })
        
        const productMap = products.reduce((map, product) => {
          map[product.id] = product
          return map
        }, {} as Record<string, any>)
        
        return items.map(item => ({
          productId: item.productId,
          productName: productMap[item.productId]?.name || 'Unknown',
          category: productMap[item.productId]?.category || 'Unknown',
          image: productMap[item.productId]?.image,
          quantitySold: item._sum.quantity || 0,
          revenue: item._sum.total || 0,
          orderCount: item._count
        }))
      }),
      
      // Sales by category
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: OrderStatus.CANCELLED }
          }
        },
        _sum: {
          total: true,
          quantity: true
        }
      }).then(async (items) => {
        // Get product categories
        const productIds = items.map(item => item.productId)
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, category: true }
        })
        
        const productCategoryMap = products.reduce((map, product) => {
          map[product.id] = product.category
          return map
        }, {} as Record<string, string>)
        
        // Group by category
        const categoryData = items.reduce((acc, item) => {
          const category = productCategoryMap[item.productId] || 'Unknown'
          if (!acc[category]) {
            acc[category] = { revenue: 0, quantity: 0, orderCount: 0 }
          }
          acc[category].revenue += item._sum.total || 0
          acc[category].quantity += item._sum.quantity || 0
          acc[category].orderCount += 1
          return acc
        }, {} as Record<string, any>)
        
        return Object.entries(categoryData).map(([category, data]) => ({
          category,
          revenue: data.revenue,
          quantity: data.quantity,
          orderCount: data.orderCount
        })).sort((a, b) => b.revenue - a.revenue)
      }),
      
      // Conversion metrics
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }).then(results => {
        const metrics = results.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>)
        
        const total = Object.values(metrics).reduce((sum, count) => sum + count, 0)
        const completed = metrics[OrderStatus.DELIVERED] || 0
        const cancelled = metrics[OrderStatus.CANCELLED] || 0
        
        return {
          totalOrders: total,
          completedOrders: completed,
          cancelledOrders: cancelled,
          conversionRate: total > 0 ? (completed / total) * 100 : 0,
          cancellationRate: total > 0 ? (cancelled / total) * 100 : 0
        }
      }),
      
      // Average order metrics
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: OrderStatus.CANCELLED }
        },
        _avg: {
          total: true,
          subtotal: true,
          shipping: true,
          tax: true
        },
        _count: true
      })
    ])
    
    // Calculate additional metrics
    const totalRevenue = revenueByPeriod.reduce((sum, item) => sum + item.revenue, 0)
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageDailyRevenue = totalRevenue / daysInPeriod
    
    const salesAnalytics = {
      overview: {
        totalRevenue,
        totalOrders: orderStats.totalOrders,
        averageOrderValue: orderStats.averageOrderValue,
        averageDailyRevenue,
        daysInPeriod
      },
      orderStats,
      revenueByPeriod,
      topSellingProducts,
      salesByCategory,
      conversionMetrics,
      averageOrderMetrics: {
        averageOrderTotal: averageOrderMetrics._avg.total || 0,
        averageSubtotal: averageOrderMetrics._avg.subtotal || 0,
        averageShipping: averageOrderMetrics._avg.shipping || 0,
        averageTax: averageOrderMetrics._avg.tax || 0,
        orderCount: averageOrderMetrics._count
      },
      dateRange: {
        startDate,
        endDate
      }
    }
    
    return createApiResponse({
      data: salesAnalytics
    })
  } catch (error) {
    console.error('Error fetching sales analytics:', error)
    return createApiResponse({
      error: 'Failed to fetch sales analytics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })