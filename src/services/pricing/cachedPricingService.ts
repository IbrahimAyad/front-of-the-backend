import { FastifyInstance } from 'fastify';
import { CacheService, CacheKeys, CacheTTL } from '../cache/cacheService';
import { logger } from '../../utils/logger';

export interface PricingRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'BUNDLE' | 'VOLUME';
  value: number;
  minQuantity?: number;
  maxQuantity?: number;
  productIds?: string[];
  categoryIds?: string[];
  startDate?: Date;
  endDate?: Date;
  priority: number;
  active: boolean;
}

export interface BundleCalculation {
  products: Array<{
    id: string;
    quantity: number;
    basePrice: number;
  }>;
  bundleDiscount: number;
  totalPrice: number;
  savings: number;
  appliedRules: string[];
}

export class CachedPricingService {
  private cache: CacheService;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance, cache: CacheService) {
    this.fastify = fastify;
    this.cache = cache;
  }

  /**
   * Get active pricing rules with caching
   */
  async getActivePricingRules(): Promise<PricingRule[]> {
    const cacheKey = CacheKeys.pricingRules();
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Mock pricing rules until PricingRule model is added to schema
        const mockRules: PricingRule[] = [
          {
            id: '1',
            name: 'Volume Discount 10+',
            type: 'PERCENTAGE',
            value: 10,
            minQuantity: 10,
            priority: 100,
            active: true
          },
          {
            id: '2',
            name: 'Bundle Discount - Suit + Shirt',
            type: 'PERCENTAGE',
            value: 15,
            productIds: [],
            priority: 90,
            active: true
          }
        ];
        
        return mockRules;
      },
      CacheTTL.PRICING_RULES
    );
  }

  /**
   * Calculate bundle pricing with caching
   */
  async calculateBundlePrice(productIds: string[], quantities: number[]): Promise<BundleCalculation> {
    const cacheKey = CacheKeys.bundleCalculation(
      productIds.map((id, i) => `${id}:${quantities[i]}`).sort()
    );
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Fetch products
        const products = await this.fastify.prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: 'ACTIVE'
          }
        });

        if (products.length !== productIds.length) {
          throw new Error('Some products not found');
        }

        // Get pricing rules
        const rules = await this.getActivePricingRules();
        
        // Calculate base prices
        const productPrices = products.map((product, index) => ({
          id: product.id,
          quantity: quantities[index],
          basePrice: product.price * quantities[index]
        }));

        const baseTotal = productPrices.reduce((sum, p) => sum + p.basePrice, 0);
        
        // Apply bundle rules
        const bundleRules = rules.filter(rule => 
          rule.type === 'BUNDLE' && 
          rule.productIds && 
          this.isBundleMatch(productIds, rule.productIds)
        );

        let bundleDiscount = 0;
        const appliedRules: string[] = [];

        for (const rule of bundleRules) {
          const discountType = rule.type;
          if (discountType === 'PERCENTAGE') {
            bundleDiscount += baseTotal * (rule.value / 100);
          } else if (discountType === 'FIXED') {
            bundleDiscount += rule.value;
          }
          appliedRules.push(rule.id);
        }

        // Apply volume discounts
        const totalQuantity = quantities.reduce((sum, q) => sum + q, 0);
        const volumeRules = rules.filter(rule => 
          rule.type === 'VOLUME' &&
          (!rule.minQuantity || totalQuantity >= rule.minQuantity) &&
          (!rule.maxQuantity || totalQuantity <= rule.maxQuantity)
        );

        for (const rule of volumeRules) {
          const discountType = rule.type;
          if (discountType === 'PERCENTAGE') {
            bundleDiscount += baseTotal * (rule.value / 100);
          } else if (discountType === 'FIXED') {
            bundleDiscount += rule.value * totalQuantity;
          }
          appliedRules.push(rule.id);
        }

        const totalPrice = Math.max(0, baseTotal - bundleDiscount);

        return {
          products: productPrices,
          bundleDiscount,
          totalPrice,
          savings: bundleDiscount,
          appliedRules
        };
      },
      CacheTTL.BUNDLE_CALCULATIONS
    );
  }

  /**
   * Calculate product pricing with quantity discounts
   */
  async calculateProductPrice(productId: string, quantity: number = 1) {
    const cacheKey = CacheKeys.pricingCalculation(productId, quantity);
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const product = await this.fastify.prisma.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        const rules = await this.getActivePricingRules();
        const basePrice = product.price * quantity;
        let discount = 0;
        const appliedRules: string[] = [];

        // Apply product-specific rules
        const productRules = rules.filter(rule => 
          rule.productIds?.includes(productId) ||
          rule.categoryIds?.includes(product.category)
        );

        // Apply volume discounts
        const volumeRules = productRules.filter(rule => 
          rule.type === 'VOLUME' &&
          (!rule.minQuantity || quantity >= rule.minQuantity) &&
          (!rule.maxQuantity || quantity <= rule.maxQuantity)
        );

        for (const rule of volumeRules) {
          const discountType = rule.type;
          if (discountType === 'PERCENTAGE') {
            discount += basePrice * (rule.value / 100);
          } else if (discountType === 'FIXED') {
            discount += rule.value * quantity;
          }
          appliedRules.push(rule.id);
        }

        const finalPrice = Math.max(0, basePrice - discount);
        const unitPrice = finalPrice / quantity;

        return {
          productId,
          quantity,
          basePrice,
          discount,
          finalPrice,
          unitPrice,
          appliedRules
        };
      },
      CacheTTL.PRICING_RULES
    );
  }

  /**
   * Invalidate pricing caches
   */
  async invalidatePricingCaches() {
    const patterns = [
      'pricing:*',
      'bundles:calc:*' // Bundle calculations depend on pricing
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.cache.deletePattern(pattern);
      totalDeleted += deleted;
    }

    logger.info('Pricing caches invalidated', { totalDeleted });
    return totalDeleted;
  }

  /**
   * Check if products match bundle requirements
   */
  private isBundleMatch(productIds: string[], requiredIds: string[]): boolean {
    // Check if all required products are in the bundle
    return requiredIds.every(id => productIds.includes(id));
  }

  /**
   * Get promotional bundles
   */
  async getPromotionalBundles() {
    const cacheKey = 'pricing:bundles:promotional';
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const rules = await this.getActivePricingRules();
        const bundleRules = rules.filter(rule => rule.type === 'BUNDLE' && rule.productIds);

        const bundles = [];
        for (const rule of bundleRules) {
          if (!rule.productIds) continue;

          const products = await this.fastify.prisma.product.findMany({
            where: {
              id: { in: rule.productIds }
            },
            include: {
              images: {
                take: 1
              }
            }
          });

          if (products.length === rule.productIds.length) {
            bundles.push({
              id: rule.id,
              name: rule.name,
              products,
              discount: rule.value,
              discountType: rule.type === 'PERCENTAGE' ? 'percentage' : 'fixed'
            });
          }
        }

        return bundles;
      },
      CacheTTL.PRICING_RULES
    );
  }
}