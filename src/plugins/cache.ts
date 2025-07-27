import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CacheService } from '../services/cache/cacheService';
import { CachedProductService } from '../services/product/cachedProductService';
import { CachedPricingService } from '../services/pricing/cachedPricingService';
import { logger } from '../utils/logger';

declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
    cachedProducts: CachedProductService;
    cachedPricing: CachedPricingService;
  }
}

const cachePlugin: FastifyPluginAsync = async (fastify) => {
  // Initialize cache service
  const cacheService = new CacheService(fastify);
  const cachedProductService = new CachedProductService(fastify, cacheService);
  const cachedPricingService = new CachedPricingService(fastify, cacheService);

  // Decorate fastify instance
  fastify.decorate('cache', cacheService);
  fastify.decorate('cachedProducts', cachedProductService);
  fastify.decorate('cachedPricing', cachedPricingService);

  // Warm up cache on startup if enabled
  if (process.env.CACHE_WARMUP === 'true') {
    fastify.addHook('onReady', async () => {
      logger.info('Starting cache warm-up process...');
      
      try {
        // Warm up critical data in parallel
        await Promise.all([
          warmUpProducts(fastify),
          warmUpPricing(fastify),
          warmUpPopularSearches(fastify)
        ]);
        
        logger.info('Cache warm-up completed successfully');
      } catch (error) {
        logger.error('Cache warm-up failed', { error: (error as Error).message });
      }
    });
  }

  // Add cache statistics endpoint
  fastify.get('/cache/stats', async (request, reply) => {
    const stats = cacheService.getStats();
    return {
      success: true,
      stats,
      timestamp: new Date().toISOString()
    };
  });

  // Add cache management endpoints
  fastify.post('/cache/invalidate', {
    preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
    handler: async (request, reply) => {
      const { type, id } = request.body as { type: string; id?: string };
      
      let deleted = 0;
      switch (type) {
        case 'products':
          if (id) {
            await cachedProductService.invalidateProduct(id);
            deleted = 1;
          } else {
            deleted = await cachedProductService.invalidateAll();
          }
          break;
        
        case 'pricing':
          deleted = await cachedPricingService.invalidatePricingCaches();
          break;
        
        case 'all':
          deleted = await cacheService.deletePattern('*');
          break;
        
        default:
          return reply.code(400).send({
            success: false,
            error: 'Invalid cache type'
          });
      }
      
      return {
        success: true,
        deleted,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Reset cache statistics
  fastify.post('/cache/stats/reset', {
    preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
    handler: async (request, reply) => {
      cacheService.resetStats();
      return {
        success: true,
        message: 'Cache statistics reset',
        timestamp: new Date().toISOString()
      };
    }
  });
};

/**
 * Warm up product catalog cache
 */
async function warmUpProducts(fastify: any) {
  const categories = ['suits', 'shirts', 'accessories', 'shoes', 'outerwear'];
  
  // Warm up products by category
  for (const category of categories) {
    await fastify.cachedProducts.getProductsByCategory(category, 20, 0);
  }
  
  // Warm up featured products
  await fastify.cachedProducts.getFeaturedProducts();
  
  logger.info('Product catalog cache warmed up', { categories: categories.length });
}

/**
 * Warm up pricing rules cache
 */
async function warmUpPricing(fastify: any) {
  // Warm up pricing rules
  await fastify.cachedPricing.getActivePricingRules();
  
  // Warm up promotional bundles
  await fastify.cachedPricing.getPromotionalBundles();
  
  logger.info('Pricing rules cache warmed up');
}

/**
 * Warm up popular searches cache
 */
async function warmUpPopularSearches(fastify: any) {
  const popularSearches = [
    'suit',
    'shirt',
    'tie',
    'wedding',
    'business',
    'casual',
    'formal'
  ];
  
  // Warm up popular search terms
  for (const search of popularSearches) {
    await fastify.cachedProducts.searchProducts({ search, limit: 10 });
  }
  
  logger.info('Popular searches cache warmed up', { searches: popularSearches.length });
}

export default fp(cachePlugin, {
  dependencies: ['database', 'redis']
});
export { cachePlugin };