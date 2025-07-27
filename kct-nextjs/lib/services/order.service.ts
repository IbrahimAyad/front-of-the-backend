import { Order, OrderItem, Prisma, PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client'
import { executeRead, executeWrite, executeTransaction } from '@/lib/db/schema-aware-client'
import { CacheService } from './cache.service'
import { ProductService } from './product.service'

export type Period = 'day' | 'week' | 'month' | 'year'

export interface OrderFilters {
  customerId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  startDate?: Date
  endDate?: Date
  minTotal?: number
  maxTotal?: number
}

export interface OrderPagination {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  itemCount: number
}

export interface OrderQueryResult {
  orders: OrderWithItems[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<OrderStatus, number>
  ordersByPaymentStatus: Record<PaymentStatus, number>
}

export interface RevenueDataPoint {
  period: string
  revenue: number
  orders: number
}

export class OrderService {
  private cache: CacheService
  private productService: ProductService

  constructor(config: { prisma?: PrismaClient; cache: CacheService; productService: ProductService }) {
    this.cache = config.cache
    this.productService = config.productService
  }

  /**
   * Get orders with read/write splitting
   * Uses read replica for queries
   */
  async getOrders(
    filters: OrderFilters = {},
    pagination: OrderPagination = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<OrderQueryResult> {
    return executeRead(async (client) => {
      const where: Prisma.OrderWhereInput = {}

      // Apply filters
      if (filters.customerId) where.customerId = filters.customerId
      if (filters.status) where.status = filters.status
      if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      if (filters.minTotal !== undefined || filters.maxTotal !== undefined) {
        where.total = {}
        if (filters.minTotal !== undefined) where.total.gte = filters.minTotal
        if (filters.maxTotal !== undefined) where.total.lte = filters.maxTotal
      }

      const skip = (pagination.page - 1) * pagination.limit
      const orderBy: Prisma.OrderOrderByWithRelationInput = {}
      orderBy[pagination.sortBy || 'createdAt'] = pagination.sortOrder || 'desc'

      // Get total count and orders in parallel
      const [total, orders] = await Promise.all([
        client.order.count({ where }),
        client.order.findMany({
          where,
          include: {
            items: true
          },
          orderBy,
          skip,
          take: pagination.limit
        })
      ])

      const ordersWithItems: OrderWithItems[] = orders.map(order => ({
        ...order,
        itemCount: order.items.length
      }))

      return {
        orders: ordersWithItems,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      }
    })
  }

  /**
   * Get order by ID (read operation)
   */
  async getById(id: string): Promise<OrderWithItems | null> {
    return executeRead(async (client) => {
      const order = await client.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          },
          customer: true
        }
      })

      if (!order) return null

      return {
        ...order,
        itemCount: order.items.length
      }
    })
  }

  /**
   * Create new order (write operation with transaction)
   */
  async create(orderData: {
    customerId: string
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      price: number
    }>
    shippingAddress?: any
    notes?: string
  }): Promise<OrderWithItems> {
    return executeTransaction(async (client) => {
      // Calculate total
      const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      // Create order with items
      const order = await client.order.create({
        data: {
          customerId: orderData.customerId,
          total,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddress: orderData.shippingAddress,
          notes: orderData.notes,
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Update stock for each item
      for (const item of orderData.items) {
        if (item.variantId) {
          await client.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      // Invalidate caches
      await this.cache.invalidate('orders:*')
      await this.cache.invalidate('products:*')

      return {
        ...order,
        itemCount: order.items.length
      }
    })
  }

  /**
   * Update order status (write operation)
   */
  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    return executeWrite(async (client) => {
      const order = await client.order.update({
        where: { id },
        data: { status },
        include: {
          items: true
        }
      })

      // Invalidate cache
      await this.cache.invalidate('orders:*')

      return {
        ...order,
        itemCount: order.items.length
      }
    })
  }

  /**
   * Update payment status (write operation)
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<OrderWithItems> {
    return executeWrite(async (client) => {
      const order = await client.order.update({
        where: { id },
        data: { paymentStatus },
        include: {
          items: true
        }
      })

      // Invalidate cache
      await this.cache.invalidate('orders:*')

      return {
        ...order,
        itemCount: order.items.length
      }
    })
  }

  /**
   * Get order statistics (read operation)
   */
  async getOrderStats(filters: OrderFilters = {}): Promise<OrderStats> {
    return executeRead(async (client) => {
      const where: Prisma.OrderWhereInput = {}

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      const [
        totalOrders,
        revenueAgg,
        statusCounts,
        paymentStatusCounts
      ] = await Promise.all([
        client.order.count({ where }),
        client.order.aggregate({
          where,
          _sum: { total: true },
          _avg: { total: true }
        }),
        client.order.groupBy({
          by: ['status'],
          _count: { status: true },
          where
        }),
        client.order.groupBy({
          by: ['paymentStatus'],
          _count: { paymentStatus: true },
          where
        })
      ])

      const ordersByStatus = statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<OrderStatus, number>)

      const ordersByPaymentStatus = paymentStatusCounts.reduce((acc, item) => {
        acc[item.paymentStatus] = item._count.paymentStatus
        return acc
      }, {} as Record<PaymentStatus, number>)

      return {
        totalOrders,
        totalRevenue: revenueAgg._sum.total || 0,
        averageOrderValue: revenueAgg._avg.total || 0,
        ordersByStatus,
        ordersByPaymentStatus
      }
    })
  }

  /**
   * Get order metrics (read operation)
   */
  async getMetrics(filters: OrderFilters = {}) {
    return this.getOrderStats(filters)
  }

  /**
   * Get revenue by period (read operation)
   */
  async getRevenueByPeriod(
    period: Period,
    filters: OrderFilters = {}
  ): Promise<RevenueDataPoint[]> {
    return executeRead(async (client) => {
      const where: Prisma.OrderWhereInput = {
        paymentStatus: PaymentStatus.PAID
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      // Get date format based on period
      let dateFormat: string
      switch (period) {
        case 'day':
          dateFormat = 'YYYY-MM-DD'
          break
        case 'week':
          dateFormat = 'YYYY-"W"WW'
          break
        case 'month':
          dateFormat = 'YYYY-MM'
          break
        case 'year':
          dateFormat = 'YYYY'
          break
      }

      const orders = await client.order.findMany({
        where,
        select: {
          createdAt: true,
          total: true
        }
      })

      // Group by period
      const revenueMap = new Map<string, { revenue: number; orders: number }>()

      orders.forEach(order => {
        const periodKey = this.formatDateByPeriod(order.createdAt, period)
        const existing = revenueMap.get(periodKey) || { revenue: 0, orders: 0 }
        revenueMap.set(periodKey, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1
        })
      })

      return Array.from(revenueMap.entries()).map(([period, data]) => ({
        period,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.period.localeCompare(b.period))
    })
  }

  /**
   * Validate stock for order items (read operation)
   */
  async validateStock(items: Array<{ variantId: string; quantity: number }>): Promise<{
    valid: boolean
    issues: Array<{ variantId: string; available: number; requested: number }>
  }> {
    return executeRead(async (client) => {
      const issues: Array<{ variantId: string; available: number; requested: number }> = []

      for (const item of items) {
        const variant = await client.productVariant.findUnique({
          where: { id: item.variantId }
        })

        if (!variant || variant.stock < item.quantity) {
          issues.push({
            variantId: item.variantId,
            available: variant?.stock || 0,
            requested: item.quantity
          })
        }
      }

      return {
        valid: issues.length === 0,
        issues
      }
    })
  }

  /**
   * Helper method to format date by period
   */
  private formatDateByPeriod(date: Date, period: Period): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    switch (period) {
      case 'day':
        return `${year}-${month}-${day}`
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`
      case 'month':
        return `${year}-${month}`
      case 'year':
        return `${year}`
    }
  }
}