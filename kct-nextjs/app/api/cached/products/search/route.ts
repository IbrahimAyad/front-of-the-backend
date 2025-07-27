import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache/cacheService';
import { withCacheAndPerformance } from '@/lib/middleware/cache';

interface ProductQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

async function performSearch(query: ProductQuery) {
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
    prisma.product.findMany({
      where,
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
    prisma.product.count({ where })
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

export const GET = withCacheAndPerformance(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    const query: ProductQuery = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Only cache simple searches without filters
    const useCache = query.search && !query.category && !query.minPrice && !query.maxPrice && query.inStock === undefined;
    
    let result;
    if (useCache) {
      const cacheKey = `${CacheKeys.productSearch(query.search)}:${query.limit}:${query.offset}`;
      
      result = await cacheService.getOrSet(
        cacheKey,
        () => performSearch(query),
        CacheTTL.POPULAR_SEARCHES
      );
    } else {
      result = await performSearch(query);
    }

    return Response.json({
      success: true,
      ...result
    });
  },
  {
    ttl: CacheTTL.POPULAR_SEARCHES,
    condition: (req) => {
      const { searchParams } = new URL(req.url);
      // Only cache simple searches
      return !!(searchParams.get('search') && 
               !searchParams.get('category') && 
               !searchParams.get('minPrice') && 
               !searchParams.get('maxPrice'));
    }
  }
);