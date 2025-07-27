import { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
  warmOnStartup?: boolean;
}

export enum CacheTTL {
  PRODUCT_CATALOG = 300, // 5 minutes
  BUNDLE_CALCULATIONS = 3600, // 1 hour
  PRICING_RULES = 600, // 10 minutes
  POPULAR_SEARCHES = 1800, // 30 minutes
  USER_SESSION = 900, // 15 minutes
}

export class CacheService {
  private redisClient: any;
  private hitCount: Map<string, number> = new Map();
  private missCount: Map<string, number> = new Map();
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.redisClient = fastify.redis;
  }

  /**
   * Get a value from cache with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      
      if (value) {
        this.recordHit(key);
        return JSON.parse(value);
      }
      
      this.recordMiss(key);
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Set a value in cache with automatic JSON stringification
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redisClient.setex(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      await this.redisClient.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: (error as Error).message });
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get or set a value using a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate the value
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;
    
    for (const tag of tags) {
      const deleted = await this.deletePattern(`*:${tag}:*`);
      totalDeleted += deleted;
    }
    
    return totalDeleted;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats: Record<string, any> = {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      patterns: {}
    };

    // Calculate totals
    this.hitCount.forEach((count, pattern) => {
      stats.totalHits += count;
      const prefix = pattern.split(':')[0];
      
      if (!stats.patterns[prefix]) {
        stats.patterns[prefix] = { hits: 0, misses: 0, hitRate: 0 };
      }
      
      stats.patterns[prefix].hits += count;
    });

    this.missCount.forEach((count, pattern) => {
      stats.totalMisses += count;
      const prefix = pattern.split(':')[0];
      
      if (!stats.patterns[prefix]) {
        stats.patterns[prefix] = { hits: 0, misses: 0, hitRate: 0 };
      }
      
      stats.patterns[prefix].misses += count;
    });

    // Calculate hit rates
    const total = stats.totalHits + stats.totalMisses;
    stats.hitRate = total > 0 ? (stats.totalHits / total) * 100 : 0;

    Object.keys(stats.patterns).forEach(prefix => {
      const pattern = stats.patterns[prefix];
      const patternTotal = pattern.hits + pattern.misses;
      pattern.hitRate = patternTotal > 0 ? (pattern.hits / patternTotal) * 100 : 0;
    });

    return stats;
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.hitCount.clear();
    this.missCount.clear();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp() {
    logger.info('Starting cache warm-up...');
    
    try {
      // Warm up product catalog by categories
      const categories = ['suits', 'shirts', 'accessories', 'shoes'];
      for (const category of categories) {
        const products = await this.fastify.prisma.product.findMany({
          where: { 
            category,
            status: 'ACTIVE'
          },
          include: {
            variants: true,
            images: true
          }
        });
        
        await this.set(
          `products:category:${category}`,
          products,
          CacheTTL.PRODUCT_CATALOG
        );
      }

      // Warm up pricing rules (if model exists)
      // Note: Implement when PricingRule model is added to schema

      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed', { error: (error as Error).message });
    }
  }

  private recordHit(key: string) {
    const pattern = this.getKeyPattern(key);
    this.hitCount.set(pattern, (this.hitCount.get(pattern) || 0) + 1);
  }

  private recordMiss(key: string) {
    const pattern = this.getKeyPattern(key);
    this.missCount.set(pattern, (this.missCount.get(pattern) || 0) + 1);
  }

  private getKeyPattern(key: string): string {
    // Extract pattern from key (e.g., "products:123" -> "products:*")
    const parts = key.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:*`;
    }
    return key;
  }
}

// Cache key generators
export const CacheKeys = {
  product: (id: string) => `products:${id}`,
  productCategory: (category: string) => `products:category:${category}`,
  productSearch: (query: string) => `products:search:${query.toLowerCase()}`,
  bundle: (id: string) => `bundles:${id}`,
  bundleCalculation: (productIds: string[]) => `bundles:calc:${productIds.sort().join('-')}`,
  pricingRules: () => 'pricing:rules:active',
  pricingCalculation: (productId: string, quantity: number) => `pricing:calc:${productId}:${quantity}`,
  userSession: (userId: string) => `session:${userId}`,
  outfit: (id: string) => `outfits:${id}`,
  popularSearches: () => 'search:popular',
};