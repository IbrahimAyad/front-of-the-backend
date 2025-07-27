import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

interface BundleRequest {
  products: Array<{
    id: string;
    quantity: number;
  }>;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'BUNDLE' | 'VOLUME';
  value: number;
  minQuantity?: number;
  maxQuantity?: number;
  productIds?: string[];
  categoryIds?: string[];
  priority: number;
  active: boolean;
}

// Mock pricing rules until PricingRule model is added
const mockPricingRules: PricingRule[] = [
  {
    id: '1',
    name: 'Volume Discount 10+',
    type: 'VOLUME',
    value: 10,
    minQuantity: 10,
    priority: 100,
    active: true
  },
  {
    id: '2',
    name: 'Bundle Discount - Suit + Shirt',
    type: 'BUNDLE',
    value: 15,
    productIds: [],
    priority: 90,
    active: true
  }
];

export const POST = withCacheAndPerformance(
  async (request: NextRequest) => {
    const body: BundleRequest = await request.json();
    const { products } = body;
    
    const productIds = products.map(p => p.id);
    const quantities = products.map(p => p.quantity);
    
    const cacheKey = CacheKeys.bundleCalculation(
      products.map(p => `${p.id}:${p.quantity}`).sort()
    );
    
    const calculation = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Fetch products
        const dbProducts = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: 'ACTIVE'
          }
        });

        if (dbProducts.length !== productIds.length) {
          throw new Error('Some products not found');
        }

        // Calculate base prices
        const productPrices = dbProducts.map((product, index) => ({
          id: product.id,
          quantity: quantities[index],
          basePrice: Number(product.price) * quantities[index]
        }));

        const baseTotal = productPrices.reduce((sum, p) => sum + p.basePrice, 0);
        
        // Apply bundle rules (using mock rules for now)
        const bundleRules = mockPricingRules.filter(rule => 
          rule.type === 'BUNDLE'
        );

        let bundleDiscount = 0;
        const appliedRules: string[] = [];

        for (const rule of bundleRules) {
          if (rule.type === 'PERCENTAGE') {
            bundleDiscount += baseTotal * (rule.value / 100);
          } else if (rule.type === 'FIXED') {
            bundleDiscount += rule.value;
          }
          appliedRules.push(rule.id);
        }

        // Apply volume discounts
        const totalQuantity = quantities.reduce((sum, q) => sum + q, 0);
        const volumeRules = mockPricingRules.filter(rule => 
          rule.type === 'VOLUME' &&
          (!rule.minQuantity || totalQuantity >= rule.minQuantity) &&
          (!rule.maxQuantity || totalQuantity <= rule.maxQuantity)
        );

        for (const rule of volumeRules) {
          if (rule.type === 'PERCENTAGE') {
            bundleDiscount += baseTotal * (rule.value / 100);
          } else if (rule.type === 'FIXED') {
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

    return Response.json({
      success: true,
      bundle: calculation
    });
  },
  {
    ttl: CacheTTL.BUNDLE_CALCULATIONS
  }
);