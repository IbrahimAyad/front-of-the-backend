import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { ProductService } from '@/lib/services/product.service'
import { OrderStatus } from '@/lib/types/order.types'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService()
const productService = new ProductService({ prisma, cache: cacheService })

// GET /api/analytics/products - Protected endpoint (ADMIN/STAFF only)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse date range (default to last 90 days)
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date()
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    // Fetch product analytics data in parallel
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      productPerformance,
      categoryPerformance,
      inventoryMetrics,
      variantAnalysis,
      seasonalTrends
    ] = await Promise.all([
      // Total products
      prisma.product.count(),
      
      // Active products (with stock)
      prisma.product.count({
        where: {
          variants: {
            some: {
              stock: { gt: 0 }
            }
          }
        }
      }),
      
      // Low stock products
      productService.checkLowStock(),
      
      // Out of stock products
      prisma.product.findMany({
        where: {
          variants: {
            every: {
              stock: 0
            }
          }
        },
        select: {
          id: true,
          name: true,
          category: true
        }
      }),
      
      // Product performance
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
        _count: {
          orderId: true
        }
      }).then(async (items) => {
        // Get product details
        const productIds = items.map(item => item.productId)
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            variants: true
          }
        })
        
        const productMap = products.reduce((map, product) => {
          map[product.id] = product
          return map
        }, {} as Record<string, any>)
        
        return items.map(item => {
          const product = productMap[item.productId]
          const currentStock = product ? productService.calculateTotalStock(product) : 0
          const revenue = item._sum.total || 0
          const quantity = item._sum.quantity || 0
          
          return {
            productId: item.productId,
            productName: product?.name || 'Unknown',
            category: product?.category || 'Unknown',
            image: product?.image,
            quantitySold: quantity,
            revenue: revenue,
            orderCount: item._count.orderId,
            currentStock: currentStock,
            stockTurnover: currentStock > 0 ? quantity / currentStock : 0,
            averageOrderValue: item._count.orderId > 0 ? revenue / item._count.orderId : 0
          }
        }).sort((a, b) => b.revenue - a.revenue)
      }),
      
      // Category performance
      prisma.product.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      }).then(async (categories) => {
        // Get sales data for each category
        const categoryData = await Promise.all(
          categories.map(async (cat) => {
            const salesData = await prisma.orderItem.aggregate({
              where: {
                product: { category: cat.category },
                order: {
                  createdAt: { gte: startDate, lte: endDate },
                  status: { not: OrderStatus.CANCELLED }
                }
              },
              _sum: {
                quantity: true,
                total: true
              },
              _count: {
                orderId: true
              }
            })
            
            return {
              category: cat.category || 'Unknown',
              productCount: cat._count.id,
              quantitySold: salesData._sum.quantity || 0,
              revenue: salesData._sum.total || 0,
              orderCount: salesData._count.orderId || 0
            }
          })
        )
        
        return categoryData.sort((a, b) => b.revenue - a.revenue)
      }),
      
      // Inventory metrics
      prisma.productVariant.aggregate({
        _sum: {
          stock: true
        },
        _avg: {
          stock: true
        },
        _count: true
      }).then(async (metrics) => {
        // Calculate inventory value
        const variants = await prisma.productVariant.findMany({
          select: {
            stock: true,
            price: true
          }
        })
        
        const totalInventoryValue = variants.reduce((sum, variant) => 
          sum + (variant.stock * variant.price), 0
        )
        
        return {
          totalStockUnits: metrics._sum.stock || 0,
          averageStockPerVariant: metrics._avg.stock || 0,
          totalVariants: metrics._count,
          totalInventoryValue,
          averageInventoryValuePerVariant: metrics._count > 0 
            ? totalInventoryValue / metrics._count 
            : 0
        }
      }),
      
      // Variant analysis
      prisma.productVariant.findMany({
        where: {
          product: {
            orders: {
              some: {
                order: {
                  createdAt: { gte: startDate, lte: endDate },
                  status: { not: OrderStatus.CANCELLED }
                }
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          product: {
            select: {
              name: true,
              category: true
            }
          },
          orders: {
            where: {
              order: {
                createdAt: { gte: startDate, lte: endDate },
                status: { not: OrderStatus.CANCELLED }
              }
            },
            select: {
              quantity: true,
              total: true
            }
          }
        }
      }).then(variants => {
        return variants
          .map(variant => ({
            variantId: variant.id,
            variantName: variant.name,
            productName: variant.product.name,
            category: variant.product.category,
            currentStock: variant.stock,
            price: variant.price,
            quantitySold: variant.orders.reduce((sum, order) => sum + order.quantity, 0),
            revenue: variant.orders.reduce((sum, order) => sum + order.total, 0)
          }))
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, 20) // Top 20 variants
      }),
      
      // Seasonal trends (monthly breakdown)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: OrderStatus.CANCELLED }
          }
        },
        _sum: {
          quantity: true
        }
      }).then(async (items) => {
        // Get monthly breakdown for top products
        const topProductIds = items
          .sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0))
          .slice(0, 5)
          .map(item => item.productId)
        
        const monthlyData = await Promise.all(
          topProductIds.map(async (productId) => {
            const product = await prisma.product.findUnique({
              where: { id: productId },
              select: { name: true }
            })
            
            const monthlyOrders = await prisma.orderItem.groupBy({
              by: ['productId'],
              where: {
                productId,
                order: {
                  createdAt: { gte: startDate, lte: endDate },
                  status: { not: OrderStatus.CANCELLED }
                }
              },
              _sum: {
                quantity: true
              }
            })
            
            return {
              productId,
              productName: product?.name || 'Unknown',
              monthlySales: monthlyOrders
            }
          })
        )
        
        return monthlyData
      })
    ])
    
    // Calculate additional metrics
    const stockTurnoverRate = productPerformance.reduce((sum, product) => 
      sum + product.stockTurnover, 0
    ) / productPerformance.length
    
    const productAnalytics = {
      overview: {
        totalProducts,
        activeProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        averageStockTurnover: stockTurnoverRate
      },
      productPerformance: productPerformance.slice(0, 20), // Top 20 products
      categoryPerformance,
      inventoryMetrics,
      variantAnalysis,
      lowStockProducts: lowStockProducts.slice(0, 10), // Top 10 low stock
      outOfStockProducts: outOfStockProducts.slice(0, 10), // Top 10 out of stock
      seasonalTrends,
      dateRange: {
        startDate,
        endDate
      }
    }
    
    return createApiResponse({
      data: productAnalytics
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return createApiResponse({
      error: 'Failed to fetch product analytics',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })