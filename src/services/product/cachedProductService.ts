import { FastifyInstance } from 'fastify';
import { CacheService, CacheKeys, CacheTTL } from '../cache/cacheService';
import { logger } from '../../utils/logger';

export interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

export class CachedProductService {
  private cache: CacheService;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance, cache: CacheService) {
    this.fastify = fastify;
    this.cache = cache;
  }

  /**
   * Get product by ID with caching
   */
  async getProduct(id: string) {
    const cacheKey = CacheKeys.product(id);
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const product = await this.fastify.prisma.product.findUnique({
          where: { id },
          include: {
            variants: true,
            images: true,
            collections: {
              include: {
                collection: true
              }
            },
            // Reviews not in current schema
            // reviews: true
          }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        return product;
      },
      CacheTTL.PRODUCT_CATALOG
    );
  }

  /**
   * Get products by category with caching
   */
  async getProductsByCategory(category: string, limit: number = 50, offset: number = 0) {
    const cacheKey = `${CacheKeys.productCategory(category)}:${limit}:${offset}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const products = await this.fastify.prisma.product.findMany({
          where: {
            category,
            status: 'ACTIVE'
          },
          include: {
            variants: {
              take: 1
            },
            images: {
              take: 1
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        });

        // Get total count for pagination
        const totalCount = await this.fastify.prisma.product.count({
          where: {
            category,
            status: 'ACTIVE'
          }
        });

        return {
          products,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + products.length < totalCount
          }
        };
      },
      CacheTTL.PRODUCT_CATALOG
    );
  }

  /**
   * Search products with caching for popular searches
   */
  async searchProducts(query: ProductQuery) {
    const { search, category, minPrice, maxPrice, inStock, limit = 20, offset = 0 } = query;
    
    // Only cache simple searches without filters
    const useCache = search && !category && !minPrice && !maxPrice && inStock === undefined;
    
    if (useCache) {
      const cacheKey = `${CacheKeys.productSearch(search)}:${limit}:${offset}`;
      
      return this.cache.getOrSet(
        cacheKey,
        () => this.performSearch(query),
        CacheTTL.POPULAR_SEARCHES
      );
    }
    
    return this.performSearch(query);
  }

  /**
   * Get featured products with caching
   */
  async getFeaturedProducts() {
    const cacheKey = 'products:featured';
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const products = await this.fastify.prisma.product.findMany({
          where: {
            isFeatured: true,
            status: 'ACTIVE'
          },
          include: {
            variants: {
              take: 1
            },
            images: {
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        return products;
      },
      CacheTTL.PRODUCT_CATALOG
    );
  }

  /**
   * Invalidate product cache
   */
  async invalidateProduct(productId: string, category?: string) {
    const keysToDelete = [
      CacheKeys.product(productId),
      'products:featured'
    ];

    if (category) {
      // Invalidate all paginated category caches
      await this.cache.deletePattern(`${CacheKeys.productCategory(category)}:*`);
    }

    // Invalidate specific keys
    for (const key of keysToDelete) {
      await this.cache.delete(key);
    }

    logger.info('Product cache invalidated', { productId, category });
  }

  /**
   * Invalidate all product caches
   */
  async invalidateAll() {
    const patterns = [
      'products:*',
      'bundles:*' // Also invalidate bundles as they depend on products
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.cache.deletePattern(pattern);
      totalDeleted += deleted;
    }

    logger.info('All product caches invalidated', { totalDeleted });
    return totalDeleted;
  }

  /**
   * Perform the actual product search
   */
  private async performSearch(query: ProductQuery) {
    const { search, category, minPrice, maxPrice, inStock, limit = 20, offset = 0 } = query;
    
    const where: any = {
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock === true) {
      where.variants = {
        some: {
          inventory: { gt: 0 }
        }
      };
    }

    const [products, totalCount] = await Promise.all([
      this.fastify.prisma.product.findMany({
        where,
        include: {
          variants: {
            take: 1,
            orderBy: { createdAt: 'asc' }
          },
          images: {
            take: 1,
            orderBy: { position: 'asc' }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      this.fastify.prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + products.length < totalCount
      }
    };
  }
}