import { cacheService, CacheKeys } from '@/lib/cache/cacheService';

/**
 * Cache invalidation utilities for Next.js
 */

export interface InvalidationConfig {
  type: 'product' | 'pricing' | 'order' | 'collection' | 'all';
  id?: string;
  category?: string;
}

/**
 * Invalidate cache based on mutation type
 */
export async function invalidateCache(config: InvalidationConfig): Promise<number> {
  let totalDeleted = 0;

  switch (config.type) {
    case 'product':
      if (config.id) {
        // Invalidate specific product
        await cacheService.delete(CacheKeys.product(config.id));
        totalDeleted++;
        
        // Also invalidate category if provided
        if (config.category) {
          await cacheService.deletePattern(`${CacheKeys.productCategory(config.category)}:*`);
        }
        
        // Invalidate featured products
        await cacheService.delete('products:featured');
      } else {
        // Invalidate all products
        totalDeleted += await cacheService.deletePattern('products:*');
        totalDeleted += await cacheService.deletePattern('bundles:*');
      }
      break;

    case 'pricing':
      totalDeleted += await cacheService.deletePattern('pricing:*');
      totalDeleted += await cacheService.deletePattern('bundles:calc:*');
      break;

    case 'order':
      // Orders might affect inventory, so invalidate products
      totalDeleted += await cacheService.deletePattern('products:*');
      break;

    case 'collection':
      // Collections affect product listings
      totalDeleted += await cacheService.deletePattern('products:*');
      break;

    case 'all':
      totalDeleted += await cacheService.deletePattern('*');
      break;
  }

  console.log(`Cache invalidated: ${config.type}`, { totalDeleted, id: config.id });
  return totalDeleted;
}

/**
 * Extract resource type and ID from API route
 */
export function extractResourceFromPath(path: string): { type?: string; id?: string } {
  const segments = path.split('/').filter(Boolean);
  
  // Look for common patterns
  if (segments.includes('products')) {
    const index = segments.indexOf('products');
    return {
      type: 'product',
      id: segments[index + 1]
    };
  }
  
  if (segments.includes('pricing')) {
    return { type: 'pricing' };
  }
  
  if (segments.includes('orders')) {
    return { type: 'order' };
  }
  
  if (segments.includes('collections')) {
    return { type: 'collection' };
  }
  
  return {};
}

/**
 * Automatic cache invalidation based on Prisma operations
 * This should be integrated into your data mutation functions
 */
export async function invalidateOnMutation(
  model: string,
  action: string,
  data?: any
): Promise<void> {
  switch (model.toLowerCase()) {
    case 'product':
      if (action === 'update' || action === 'delete') {
        await invalidateCache({
          type: 'product',
          id: data?.id,
          category: data?.category
        });
      } else {
        await invalidateCache({ type: 'product' });
      }
      break;

    case 'pricingrule':
      await invalidateCache({ type: 'pricing' });
      break;

    case 'collection':
    case 'productcollection':
      await invalidateCache({ type: 'collection' });
      break;

    case 'order':
    case 'orderitem':
      await invalidateCache({ type: 'order' });
      break;

    case 'productvariant':
    case 'productimage':
      if (data?.productId) {
        await invalidateCache({
          type: 'product',
          id: data.productId
        });
      }
      break;
  }
}

/**
 * Prisma middleware for automatic cache invalidation
 * Add this to your Prisma client initialization
 */
export function createCacheInvalidationMiddleware() {
  return async (params: any, next: any) => {
    const result = await next(params);
    
    // Only invalidate on successful mutations
    if (['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(params.action)) {
      await invalidateOnMutation(
        params.model || '',
        params.action,
        params.args?.where || params.args?.data
      );
    }
    
    return result;
  };
}

/**
 * Manual cache invalidation helper for API routes
 */
export async function handleCacheInvalidation(
  request: Request
): Promise<Response> {
  try {
    const { type, id } = await request.json();
    
    if (!type || !['product', 'pricing', 'order', 'collection', 'all'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid cache type' }),
        { status: 400 }
      );
    }
    
    const deleted = await invalidateCache({ type, id } as InvalidationConfig);
    
    return new Response(
      JSON.stringify({
        success: true,
        deleted,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to invalidate cache',
        message: (error as Error).message
      }),
      { status: 500 }
    );
  }
}