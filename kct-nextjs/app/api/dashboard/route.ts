import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { OrderService } from '@/lib/services/order.service'
import { ProductService } from '@/lib/services/product.service'
import { CustomerService } from '@/lib/services/customer.service'
import { OrderStatus, PaymentStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })
const customerService = new CustomerService(prisma, cacheService)
const orderService = new OrderService({ prisma, productService, cache: cacheService })

// GET /api/dashboard - Protected endpoint (ADMIN/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get date range for filtering (default to last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    // Override with query params if provided
    if (searchParams.get('startDate')) {
      startDate.setTime(new Date(searchParams.get('startDate')!).getTime())
    }
    if (searchParams.get('endDate')) {
      endDate.setTime(new Date(searchParams.get('endDate')!).getTime())
    }
    
    // Fetch all data in parallel
    const [
      orderStats,
      recentOrders,
      lowStockProducts,
      topCustomers,
      orderMetrics,
      productCount,
      customerCount,
      revenueData
    ] = await Promise.all([
      // Order statistics
      orderService.getOrderStats({ startDate, endDate }),
      
      // Recent orders (last 10)
      orderService.getOrders(
        { startDate, endDate },
        { page: 1, limit: 10 }
      ),
      
      // Low stock products
      productService.checkLowStock(),
      
      // Top customers by order count
      prisma.customer.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          _count: {
            select: { orders: true }
          },
          orders: {
            select: {
              total: true
            }
          }
        },
        orderBy: {
          orders: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Order metrics
      orderService.getMetrics({ startDate, endDate }),
      
      // Total products
      prisma.product.count(),
      
      // Total customers
      prisma.customer.count(),
      
      // Revenue by period (last 7 days)
      orderService.getRevenueByPeriod('day', {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    ])
    
    // Format top customers data
    const formattedTopCustomers = topCustomers.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      orderCount: customer._count.orders,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0)
    }))
    
    // Calculate additional metrics
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        },
        paymentStatus: PaymentStatus.PAID
      },
      _sum: {
        total: true
      }
    })
    
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: OrderStatus.PENDING
      }
    })
    
    const dashboardData = {
      overview: {
        totalOrders: orderMetrics.totalOrders,
        totalRevenue: orderMetrics.totalRevenue,
        averageOrderValue: orderMetrics.averageOrderValue,
        todayRevenue: todayRevenue._sum.total || 0,
        totalProducts: productCount,
        totalCustomers: customerCount,
        pendingOrders: pendingOrdersCount,
        lowStockAlerts: lowStockProducts.length
      },
      orderStats,
      recentOrders: recentOrders.orders,
      lowStockProducts: lowStockProducts.slice(0, 5), // Top 5 low stock
      topCustomers: formattedTopCustomers,
      ordersByStatus: orderMetrics.ordersByStatus,
      ordersByPaymentStatus: orderMetrics.ordersByPaymentStatus,
      revenueChart: revenueData,
      dateRange: {
        startDate,
        endDate
      }
    }
    
    return createApiResponse({
      data: dashboardData
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return createApiResponse({
      error: 'Failed to fetch dashboard data',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })