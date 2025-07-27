import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { CustomerService } from '@/lib/services/customer.service'
import { OrderStatus, PaymentStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const customerService = new CustomerService(prisma, cacheService)

// GET /api/analytics/customers - Protected endpoint (ADMIN/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse date range (default to all time)
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date()
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(0)
    
    // Fetch customer analytics data in parallel
    const [
      totalCustomers,
      newCustomers,
      customerSegments,
      lifetimeValueDistribution,
      retentionMetrics,
      topCustomers,
      customerGrowth,
      locationDistribution
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),
      
      // New customers in period
      prisma.customer.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // Customer segments by order count
      prisma.customer.findMany({
        select: {
          _count: {
            select: { orders: true }
          }
        }
      }).then(customers => {
        const segments = {
          new: 0,        // 0 orders
          active: 0,     // 1-3 orders
          loyal: 0,      // 4-10 orders
          vip: 0         // 11+ orders
        }
        
        customers.forEach(customer => {
          const orderCount = customer._count.orders
          if (orderCount === 0) segments.new++
          else if (orderCount <= 3) segments.active++
          else if (orderCount <= 10) segments.loyal++
          else segments.vip++
        })
        
        return segments
      }),
      
      // Lifetime value distribution
      prisma.customer.findMany({
        select: {
          id: true,
          orders: {
            where: {
              paymentStatus: PaymentStatus.PAID
            },
            select: {
              total: true
            }
          }
        }
      }).then(customers => {
        const valueRanges = {
          '0-100': 0,
          '101-500': 0,
          '501-1000': 0,
          '1001-5000': 0,
          '5000+': 0
        }
        
        customers.forEach(customer => {
          const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
          if (totalSpent === 0) valueRanges['0-100']++
          else if (totalSpent <= 100) valueRanges['0-100']++
          else if (totalSpent <= 500) valueRanges['101-500']++
          else if (totalSpent <= 1000) valueRanges['501-1000']++
          else if (totalSpent <= 5000) valueRanges['1001-5000']++
          else valueRanges['5000+']++
        })
        
        return valueRanges
      }),
      
      // Retention metrics
      prisma.customer.findMany({
        where: {
          createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Created more than 30 days ago
        },
        select: {
          id: true,
          createdAt: true,
          orders: {
            select: {
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      }).then(customers => {
        const totalEligible = customers.length
        const activeIn30Days = customers.filter(customer => {
          if (customer.orders.length === 0) return false
          const lastOrderDate = customer.orders[0].createdAt
          const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastOrder <= 30
        }).length
        
        const activeIn60Days = customers.filter(customer => {
          if (customer.orders.length === 0) return false
          const lastOrderDate = customer.orders[0].createdAt
          const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastOrder <= 60
        }).length
        
        const activeIn90Days = customers.filter(customer => {
          if (customer.orders.length === 0) return false
          const lastOrderDate = customer.orders[0].createdAt
          const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastOrder <= 90
        }).length
        
        return {
          retention30Days: totalEligible > 0 ? (activeIn30Days / totalEligible) * 100 : 0,
          retention60Days: totalEligible > 0 ? (activeIn60Days / totalEligible) * 100 : 0,
          retention90Days: totalEligible > 0 ? (activeIn90Days / totalEligible) * 100 : 0,
          activeCustomers30Days: activeIn30Days,
          activeCustomers60Days: activeIn60Days,
          activeCustomers90Days: activeIn90Days,
          totalEligibleCustomers: totalEligible
        }
      }),
      
      // Top customers by revenue
      prisma.customer.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          orders: {
            where: {
              paymentStatus: PaymentStatus.PAID
            },
            select: {
              total: true
            }
          },
          _count: {
            select: { orders: true }
          }
        }
      }).then(customers => {
        return customers
          .map(customer => ({
            id: customer.id,
            email: customer.email,
            name: `${customer.firstName} ${customer.lastName}`,
            totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
            orderCount: customer._count.orders,
            averageOrderValue: customer._count.orders > 0 
              ? customer.orders.reduce((sum, order) => sum + order.total, 0) / customer._count.orders 
              : 0,
            customerSince: customer.createdAt
          }))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
      }),
      
      // Customer growth over time
      prisma.customer.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }).then(results => {
        // Group by month
        const monthlyGrowth = results.reduce((acc, item) => {
          const month = new Date(item.createdAt).toISOString().substring(0, 7) // YYYY-MM
          if (!acc[month]) {
            acc[month] = 0
          }
          acc[month] += item._count
          return acc
        }, {} as Record<string, number>)
        
        return Object.entries(monthlyGrowth)
          .map(([month, count]) => ({ month, newCustomers: count }))
          .sort((a, b) => a.month.localeCompare(b.month))
      }),
      
      // Location distribution (by country from addresses)
      prisma.address.groupBy({
        by: ['country'],
        _count: {
          customerId: true
        },
        orderBy: {
          _count: {
            customerId: 'desc'
          }
        },
        take: 10
      })
    ])
    
    // Calculate additional metrics
    const averageCustomerLifetimeValue = await prisma.customer.findMany({
      select: {
        orders: {
          where: {
            paymentStatus: PaymentStatus.PAID
          },
          select: {
            total: true
          }
        }
      }
    }).then(customers => {
      const totalRevenue = customers.reduce((sum, customer) => 
        sum + customer.orders.reduce((orderSum, order) => orderSum + order.total, 0), 0
      )
      return customers.length > 0 ? totalRevenue / customers.length : 0
    })
    
    const customerAnalytics = {
      overview: {
        totalCustomers,
        newCustomers,
        averageCustomerLifetimeValue,
        customerGrowthRate: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0
      },
      segments: customerSegments,
      lifetimeValueDistribution,
      retentionMetrics,
      topCustomers,
      customerGrowth,
      locationDistribution: locationDistribution.map(location => ({
        country: location.country,
        customerCount: location._count.customerId
      })),
      dateRange: {
        startDate,
        endDate
      }
    }
    
    return createApiResponse({
      data: customerAnalytics
    })
  } catch (error) {
    console.error('Error fetching customer analytics:', error)
    return createApiResponse({
      error: 'Failed to fetch customer analytics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })