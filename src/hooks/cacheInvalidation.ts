import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Register cache invalidation hooks
 */
export function registerCacheInvalidationHooks(fastify: FastifyInstance) {
  // Invalidate product cache on product updates
  fastify.addHook('onRequest', async (request, reply) => {
    // Track if this is a mutation request
    const method = request.method;
    const url = request.url;
    
    // Store mutation info for post-processing
    if (method !== 'GET' && method !== 'HEAD') {
      request.isMutation = true;
      request.mutationPath = url;
    }
  });

  // Handle cache invalidation after successful mutations
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (!request.isMutation || reply.statusCode >= 400) {
      return payload;
    }

    const path = request.mutationPath;
    if (!path) return payload;
    
    try {
      // Product mutations
      if (path.includes('/products')) {
        const productId = extractIdFromPath(path);
        
        if (productId) {
          // Invalidate specific product
          await fastify.cachedProducts.invalidateProduct(productId);
          logger.info('Product cache invalidated', { productId, path });
        } else {
          // Invalidate all products if no specific ID
          await fastify.cachedProducts.invalidateAll();
          logger.info('All product caches invalidated', { path });
        }
      }
      
      // Pricing rule mutations
      else if (path.includes('/pricing') || path.includes('/rules')) {
        await fastify.cachedPricing.invalidatePricingCaches();
        logger.info('Pricing caches invalidated', { path });
      }
      
      // Order mutations (might affect inventory)
      else if (path.includes('/orders')) {
        // Invalidate product caches as inventory might have changed
        await fastify.cache.deletePattern('products:*');
        logger.info('Product caches invalidated due to order', { path });
      }
      
      // Collection mutations
      else if (path.includes('/collections')) {
        // Invalidate product caches as collections affect product listings
        await fastify.cache.deletePattern('products:*');
        logger.info('Product caches invalidated due to collection change', { path });
      }
    } catch (error) {
      logger.error('Cache invalidation failed', { 
        error: (error as Error).message,
        path 
      });
    }

    return payload;
  });
}

/**
 * Extract ID from API path
 */
function extractIdFromPath(path: string): string | null {
  // Match UUID pattern
  const uuidMatch = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Match numeric ID pattern
  const numericMatch = path.match(/\/(\d+)(?:\/|$)/);
  if (numericMatch) {
    return numericMatch[1];
  }

  return null;
}

/**
 * Setup automatic cache invalidation based on database events
 */
export function setupDatabaseCacheInvalidation(fastify: FastifyInstance) {
  // Use Prisma middleware for automatic cache invalidation
  fastify.prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // Only invalidate on successful mutations
    if (['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(params.action)) {
      const model = params.model?.toLowerCase();
      
      switch (model) {
        case 'product':
          if (params.action === 'update' || params.action === 'delete') {
            const productId = params.args.where?.id;
            if (productId) {
              await fastify.cachedProducts.invalidateProduct(productId);
            }
          } else {
            await fastify.cachedProducts.invalidateAll();
          }
          break;
          
        case 'pricingrule':
          await fastify.cachedPricing.invalidatePricingCaches();
          break;
          
        case 'collection':
        case 'productcollection':
          // Collections affect product listings
          await fastify.cache.deletePattern('products:*');
          break;
          
        case 'productvariant':
        case 'productimage':
          // Variant/image changes affect parent product
          if (params.args.where?.productId) {
            await fastify.cachedProducts.invalidateProduct(params.args.where.productId);
          }
          break;
      }
      
      logger.debug('Cache invalidated via database middleware', {
        model,
        action: params.action
      });
    }
    
    return result;
  });
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    isMutation?: boolean;
    mutationPath?: string;
  }
}