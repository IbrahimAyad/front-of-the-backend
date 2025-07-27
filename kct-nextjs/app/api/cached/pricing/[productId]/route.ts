import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

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
    name: 'Volume Discount 5+',
    type: 'VOLUME',
    value: 5,
    minQuantity: 5,
    maxQuantity: 9,
    priority: 100,
    active: true
  },
  {
    id: '2',
    name: 'Volume Discount 10+',
    type: 'VOLUME',
    value: 10,
    minQuantity: 10,
    priority: 110,
    active: true
  }
];

export const GET = withCacheAndPerformance(
  async (request: NextRequest, { params }: { params: { productId: string } }) => {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const quantity = parseInt(searchParams.get('quantity') || '1');
    
    const cacheKey = CacheKeys.pricingCalculation(productId, quantity);
    
    const pricing = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        const basePrice = Number(product.price) * quantity;
        let discount = 0;
        const appliedRules: string[] = [];

        // Apply volume discounts from mock rules
        const volumeRules = mockPricingRules.filter(rule => 
          rule.type === 'VOLUME' &&
          (!rule.minQuantity || quantity >= rule.minQuantity) &&
          (!rule.maxQuantity || quantity <= rule.maxQuantity)
        );

        for (const rule of volumeRules) {
          if (rule.type === 'PERCENTAGE') {
            discount += basePrice * (rule.value / 100);
          } else if (rule.type === 'FIXED') {
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

    return Response.json({
      success: true,
      pricing
    });
  },
  {
    ttl: CacheTTL.PRICING_RULES,
    key: (req) => {
      const url = new URL(req.url);
      const productId = url.pathname.split('/').slice(-1)[0];
      const quantity = url.searchParams.get('quantity') || '1';
      return CacheKeys.pricingCalculation(productId, parseInt(quantity));
    }
  }
);