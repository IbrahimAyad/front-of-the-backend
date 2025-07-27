import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

export const GET = withCacheAndPerformance(
  async (request: NextRequest) => {
    const cacheKey = 'products:featured';
    
    const products = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const products = await prisma.product.findMany({
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

    return Response.json({
      success: true,
      products
    });
  },
  {
    ttl: CacheTTL.PRODUCT_CATALOG,
    key: 'products:featured'
  }
);