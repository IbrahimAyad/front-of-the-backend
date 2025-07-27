import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

export const GET = withCacheAndPerformance(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    
    try {
      const product = await cacheService.getOrSet(
        CacheKeys.product(id),
        async () => {
          const product = await prisma.product.findUnique({
            where: { id },
            include: {
              variants: true,
              images: true,
              collections: {
                include: {
                  collection: true
                }
              }
            }
          });

          if (!product) {
            throw new Error('Product not found');
          }

          return product;
        },
        CacheTTL.PRODUCT_CATALOG
      );

      return Response.json({
        success: true,
        product
      });
    } catch (error) {
      if ((error as Error).message === 'Product not found') {
        return Response.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  },
  {
    ttl: CacheTTL.PRODUCT_CATALOG,
    key: (req) => {
      const url = new URL(req.url);
      const id = url.pathname.split('/').pop();
      return CacheKeys.product(id!);
    }
  }
);