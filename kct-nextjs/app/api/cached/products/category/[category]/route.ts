import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

export const GET = withCacheAndPerformance(
  async (request: NextRequest, { params }: { params: { category: string } }) => {
    const { category } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const cacheKey = `${CacheKeys.productCategory(category)}:${limit}:${offset}`;
    
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const [products, totalCount] = await Promise.all([
          prisma.product.findMany({
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
          }),
          prisma.product.count({
            where: {
              category,
              status: 'ACTIVE'
            }
          })
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
      },
      CacheTTL.PRODUCT_CATALOG
    );

    return Response.json({
      success: true,
      ...result
    });
  },
  {
    ttl: CacheTTL.PRODUCT_CATALOG,
    key: (req) => {
      const url = new URL(req.url);
      const category = url.pathname.split('/').slice(-1)[0];
      const limit = url.searchParams.get('limit') || '50';
      const offset = url.searchParams.get('offset') || '0';
      return `${CacheKeys.productCategory(category)}:${limit}:${offset}`;
    }
  }
);