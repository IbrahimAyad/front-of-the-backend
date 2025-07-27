import { Product, ProductVariant, Prisma, PrismaClient } from '@prisma/client'
import { executeRead, executeWrite } from '@/lib/db/schema-aware-client'
import { CacheService } from './cache.service'

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
}

export interface ProductPagination {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  totalStock: number
}

export interface ProductQueryResult {
  data: ProductWithVariants[]
  total: number
  page: number
  limit: number
  totalPages: number
  queryTime?: string
}

export class ProductService {
  private cache: CacheService

  constructor(config: { prisma?: PrismaClient; cache: CacheService }) {
    this.cache = config.cache
  }

  /**
   * Find all products with read/write splitting
   * Uses read replica for search operations
   */
  async findAll(
    filters: ProductFilters = {},
    pagination: ProductPagination = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<ProductQueryResult> {
    const startTime = Date.now()
    
    return executeRead(async (client) => {
      const where: Prisma.ProductWhereInput = {}

      // Apply filters
      if (filters.category) {
        where.category = filters.category
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Handle stock filtering
      if (filters.inStock !== undefined) {
        if (filters.inStock) {
          where.variants = {
            some: {
              stock: { gt: 0 }
            }
          }
        } else {
          where.variants = {
            every: {
              stock: { lte: 0 }
            }
          }
        }
      }

      const skip = (pagination.page - 1) * pagination.limit
      const orderBy: Prisma.ProductOrderByWithRelationInput = {}
      orderBy[pagination.sortBy as keyof Product] = pagination.sortOrder

      // Get total count and data in parallel
      const [total, products] = await Promise.all([
        client.product.count({ where }),
        client.product.findMany({
          where,
          include: {
            variants: true
          },
          orderBy,
          skip,
          take: pagination.limit
        })
      ])

      // Calculate total stock for each product
      const productsWithStock: ProductWithVariants[] = products.map(product => ({
        ...product,
        totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      }))

      const queryTime = `${Date.now() - startTime}ms`

      return {
        data: productsWithStock,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        queryTime
      }
    })
  }

  /**
   * Find product by ID (read operation)
   */
  async findById(id: string): Promise<ProductWithVariants | null> {
    return executeRead(async (client) => {
      const product = await client.product.findUnique({
        where: { id },
        include: {
          variants: true
        }
      })

      if (!product) return null

      return {
        ...product,
        totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      }
    })
  }

  /**
   * Create new product (write operation)
   */
  async create(data: Prisma.ProductCreateInput): Promise<ProductWithVariants> {
    return executeWrite(async (client) => {
      const product = await client.product.create({
        data,
        include: {
          variants: true
        }
      })

      // Invalidate cache after write
      await this.cache.invalidate('products:*')

      return {
        ...product,
        totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      }
    })
  }

  /**
   * Update product (write operation)
   */
  async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithVariants> {
    return executeWrite(async (client) => {
      const product = await client.product.update({
        where: { id },
        data,
        include: {
          variants: true
        }
      })

      // Invalidate cache after write
      await this.cache.invalidate('products:*')

      return {
        ...product,
        totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      }
    })
  }

  /**
   * Delete product (write operation)
   */
  async delete(id: string): Promise<void> {
    return executeWrite(async (client) => {
      await client.product.delete({
        where: { id }
      })

      // Invalidate cache after write
      await this.cache.invalidate('products:*')
    })
  }

  /**
   * Check low stock products (read operation)
   */
  async checkLowStock(threshold: number = 10): Promise<ProductWithVariants[]> {
    return executeRead(async (client) => {
      const products = await client.product.findMany({
        include: {
          variants: true
        }
      })

      return products
        .map(product => ({
          ...product,
          totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0)
        }))
        .filter(product => product.totalStock <= threshold)
    })
  }

  /**
   * Get product analytics (read operation)
   */
  async getAnalytics(dateRange?: { startDate: Date; endDate: Date }) {
    return executeRead(async (client) => {
      const where: Prisma.ProductWhereInput = {}
      
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      }

      const [
        totalProducts,
        categories,
        averagePrice,
        stockValue
      ] = await Promise.all([
        client.product.count({ where }),
        client.product.groupBy({
          by: ['category'],
          _count: { category: true },
          where
        }),
        client.product.aggregate({
          _avg: { price: true },
          where
        }),
        client.product.findMany({
          include: { variants: true },
          where
        }).then(products => 
          products.reduce((total, product) => {
            const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)
            return total + (stock * product.price)
          }, 0)
        )
      ])

      return {
        totalProducts,
        categories: categories.map(cat => ({
          category: cat.category,
          count: cat._count.category
        })),
        averagePrice: averagePrice._avg.price || 0,
        totalStockValue: stockValue
      }
    })
  }

  /**
   * Adjust product stock (write operation)
   */
  async adjustStock(productId: string, variantId: string, adjustment: number): Promise<ProductVariant> {
    return executeWrite(async (client) => {
      const variant = await client.productVariant.update({
        where: { id: variantId },
        data: {
          stock: {
            increment: adjustment
          }
        }
      })

      // Invalidate cache after write
      await this.cache.invalidate('products:*')

      return variant
    })
  }
}