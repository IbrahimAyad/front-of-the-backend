import { Customer, Address, Prisma, PrismaClient } from '@prisma/client'
import { executeRead, executeWrite } from '@/lib/db/schema-aware-client'
import { CacheService } from './cache.service'

export interface CustomerFilters {
  search?: string
  minSpent?: number
  maxSpent?: number
  hasOrders?: boolean
  createdAfter?: Date
  createdBefore?: Date
}

export interface CustomerPagination {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface CustomerWithDetails extends Customer {
  addresses: Address[]
  totalSpent: number
  orderCount: number
  lastOrderDate?: Date
}

export interface CustomerQueryResult {
  data: CustomerWithDetails[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class CustomerService {
  private cache: CacheService

  constructor(prisma: PrismaClient, cache: CacheService) {
    this.cache = cache
  }

  /**
   * Find all customers with smart read/write routing
   * Uses read replica for search operations
   */
  async findAll(
    filters: CustomerFilters = {},
    pagination: CustomerPagination = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<CustomerQueryResult> {
    return executeRead(async (client) => {
      const where: Prisma.CustomerWhereInput = {}

      // Apply search filter
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Apply date filters
      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {}
        if (filters.createdAfter) where.createdAt.gte = filters.createdAfter
        if (filters.createdBefore) where.createdAt.lte = filters.createdBefore
      }

      // Apply order-related filters
      if (filters.hasOrders !== undefined) {
        if (filters.hasOrders) {
          where.orders = { some: {} }
        } else {
          where.orders = { none: {} }
        }
      }

      const skip = (pagination.page - 1) * pagination.limit
      const orderBy: Prisma.CustomerOrderByWithRelationInput = {}
      orderBy[pagination.sortBy as keyof Customer] = pagination.sortOrder

      // Get total count and customers in parallel
      const [total, customers] = await Promise.all([
        client.customer.count({ where }),
        client.customer.findMany({
          where,
          include: {
            addresses: true,
            orders: {
              select: {
                total: true,
                createdAt: true
              }
            }
          },
          orderBy,
          skip,
          take: pagination.limit
        })
      ])

      // Calculate customer metrics
      const customersWithDetails: CustomerWithDetails[] = customers.map(customer => {
        const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
        const orderCount = customer.orders.length
        const lastOrderDate = customer.orders.length > 0 
          ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
          : undefined

        // Apply spending filters post-query if needed
        const meetsSpendingCriteria = 
          (filters.minSpent === undefined || totalSpent >= filters.minSpent) &&
          (filters.maxSpent === undefined || totalSpent <= filters.maxSpent)

        return {
          ...customer,
          totalSpent,
          orderCount,
          lastOrderDate,
          meetsSpendingCriteria
        }
      }).filter(customer => customer.meetsSpendingCriteria)

      return {
        data: customersWithDetails.map(c => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          dateOfBirth: c.dateOfBirth,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          addresses: c.addresses,
          totalSpent: c.totalSpent,
          orderCount: c.orderCount,
          lastOrderDate: c.lastOrderDate
        })),
        total: customersWithDetails.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(customersWithDetails.length / pagination.limit)
      }
    })
  }

  /**
   * Find customer by ID (read operation)
   */
  async findById(id: string): Promise<CustomerWithDetails | null> {
    return executeRead(async (client) => {
      const customer = await client.customer.findUnique({
        where: { id },
        include: {
          addresses: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      if (!customer) return null

      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = customer.orders.length
      const lastOrderDate = customer.orders.length > 0 
        ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
        : undefined

      return {
        ...customer,
        totalSpent,
        orderCount,
        lastOrderDate
      }
    })
  }

  /**
   * Find customer by email (read operation)
   */
  async findByEmail(email: string): Promise<CustomerWithDetails | null> {
    return executeRead(async (client) => {
      const customer = await client.customer.findUnique({
        where: { email },
        include: {
          addresses: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      if (!customer) return null

      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = customer.orders.length
      const lastOrderDate = customer.orders.length > 0 
        ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
        : undefined

      return {
        ...customer,
        totalSpent,
        orderCount,
        lastOrderDate
      }
    })
  }

  /**
   * Create new customer (write operation)
   */
  async create(data: Prisma.CustomerCreateInput): Promise<CustomerWithDetails> {
    return executeWrite(async (client) => {
      const customer = await client.customer.create({
        data,
        include: {
          addresses: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      // Invalidate cache after write
      await this.cache.invalidate('customers:*')

      return {
        ...customer,
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: undefined
      }
    })
  }

  /**
   * Update customer (write operation)
   */
  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<CustomerWithDetails> {
    return executeWrite(async (client) => {
      const customer = await client.customer.update({
        where: { id },
        data,
        include: {
          addresses: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      // Invalidate cache after write
      await this.cache.invalidate('customers:*')

      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = customer.orders.length
      const lastOrderDate = customer.orders.length > 0 
        ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
        : undefined

      return {
        ...customer,
        totalSpent,
        orderCount,
        lastOrderDate
      }
    })
  }

  /**
   * Delete customer (write operation)
   */
  async delete(id: string): Promise<void> {
    return executeWrite(async (client) => {
      await client.customer.delete({
        where: { id }
      })

      // Invalidate cache after write
      await this.cache.invalidate('customers:*')
    })
  }

  /**
   * Get customer analytics (read operation)
   */
  async getAnalytics(dateRange?: { startDate: Date; endDate: Date }) {
    return executeRead(async (client) => {
      const where: Prisma.CustomerWhereInput = {}
      
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      }

      const [
        totalCustomers,
        newCustomers,
        activeCustomers,
        topCustomers
      ] = await Promise.all([
        // Total customers
        client.customer.count({ where }),
        
        // New customers in period
        client.customer.count({
          where: {
            ...where,
            createdAt: dateRange ? {
              gte: dateRange.startDate,
              lte: dateRange.endDate
            } : {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        
        // Customers with orders in period
        client.customer.count({
          where: {
            ...where,
            orders: {
              some: dateRange ? {
                createdAt: {
                  gte: dateRange.startDate,
                  lte: dateRange.endDate
                }
              } : {}
            }
          }
        }),
        
        // Top customers by total spent
        client.customer.findMany({
          include: {
            orders: {
              select: { total: true }
            }
          },
          take: 10
        }).then(customers => 
          customers
            .map(customer => ({
              id: customer.id,
              email: customer.email,
              name: `${customer.firstName} ${customer.lastName}`,
              totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
              orderCount: customer.orders.length
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5)
        )
      ])

      return {
        totalCustomers,
        newCustomers,
        activeCustomers,
        topCustomers,
        customerRetentionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
      }
    })
  }

  /**
   * Search customers (read operation optimized for search)
   */
  async search(query: string, limit: number = 10): Promise<CustomerWithDetails[]> {
    return executeRead(async (client) => {
      const customers = await client.customer.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          addresses: true,
          orders: {
            select: {
              total: true,
              createdAt: true
            }
          }
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      })

      return customers.map(customer => {
        const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
        const orderCount = customer.orders.length
        const lastOrderDate = customer.orders.length > 0 
          ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
          : undefined

        return {
          ...customer,
          totalSpent,
          orderCount,
          lastOrderDate
        }
      })
    })
  }
}