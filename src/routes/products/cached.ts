import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

const productQuerySchema = Type.Object({
  category: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  minPrice: Type.Optional(Type.Number()),
  maxPrice: Type.Optional(Type.Number()),
  inStock: Type.Optional(Type.Boolean()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
});

async function cachedProductRoutes(fastify: FastifyInstance) {
  // Get product by ID (cached)
  fastify.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      
      try {
        const product = await fastify.cachedProducts.getProduct(id);
        
        // Set cache header
        reply.header('X-Cache-Hit', 'true');
        request.cacheHit = true;
        
        return {
          success: true,
          product
        };
      } catch (error) {
        if ((error as Error).message === 'Product not found') {
          reply.code(404);
          return {
            success: false,
            error: 'Product not found'
          };
        }
        throw error;
      }
    }
  });

  // Get products by category (cached)
  fastify.get('/category/:category', {
    schema: {
      params: Type.Object({
        category: Type.String()
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
        offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
      })
    },
    handler: async (request, reply) => {
      const { category } = request.params as { category: string };
      const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      const result = await fastify.cachedProducts.getProductsByCategory(category, limit, offset);
      
      // Set cache header
      reply.header('X-Cache-Hit', 'true');
      request.cacheHit = true;
      
      return {
        success: true,
        ...result
      };
    }
  });

  // Search products (cached for popular searches)
  fastify.get('/search', {
    schema: {
      querystring: productQuerySchema
    },
    handler: async (request, reply) => {
      const query = request.query as any;
      
      const result = await fastify.cachedProducts.searchProducts(query);
      
      // Check if this was a cached search
      if (query.search && !query.category && !query.minPrice && !query.maxPrice) {
        reply.header('X-Cache-Hit', 'true');
        request.cacheHit = true;
      }
      
      return {
        success: true,
        ...result
      };
    }
  });

  // Get featured products (cached)
  fastify.get('/featured', {
    handler: async (request, reply) => {
      const products = await fastify.cachedProducts.getFeaturedProducts();
      
      // Set cache header
      reply.header('X-Cache-Hit', 'true');
      request.cacheHit = true;
      
      return {
        success: true,
        products
      };
    }
  });

  // Calculate bundle price (cached)
  fastify.post('/bundle/calculate', {
    schema: {
      body: Type.Object({
        products: Type.Array(Type.Object({
          id: Type.String(),
          quantity: Type.Integer({ minimum: 1 })
        }))
      })
    },
    handler: async (request, reply) => {
      const { products } = request.body as { products: Array<{ id: string; quantity: number }> };
      
      const productIds = products.map(p => p.id);
      const quantities = products.map(p => p.quantity);
      
      const calculation = await fastify.cachedPricing.calculateBundlePrice(productIds, quantities);
      
      // Set cache header
      reply.header('X-Cache-Hit', 'true');
      request.cacheHit = true;
      
      return {
        success: true,
        bundle: calculation
      };
    }
  });

  // Calculate product price with quantity (cached)
  fastify.get('/:id/price', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      querystring: Type.Object({
        quantity: Type.Optional(Type.Integer({ minimum: 1, default: 1 }))
      })
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { quantity = 1 } = request.query as { quantity?: number };
      
      const pricing = await fastify.cachedPricing.calculateProductPrice(id, quantity);
      
      // Set cache header
      reply.header('X-Cache-Hit', 'true');
      request.cacheHit = true;
      
      return {
        success: true,
        pricing
      };
    }
  });

  // Get promotional bundles (cached)
  fastify.get('/bundles/promotional', {
    handler: async (request, reply) => {
      const bundles = await fastify.cachedPricing.getPromotionalBundles();
      
      // Set cache header
      reply.header('X-Cache-Hit', 'true');
      request.cacheHit = true;
      
      return {
        success: true,
        bundles
      };
    }
  });

  // Force cache refresh for a product
  fastify.post('/:id/refresh-cache', {
    preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN', 'STAFF'])],
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      
      // Get product details to find category
      const product = await fastify.prisma.product.findUnique({
        where: { id },
        select: { category: true }
      });
      
      if (!product) {
        reply.code(404);
        return {
          success: false,
          error: 'Product not found'
        };
      }
      
      // Invalidate product cache
      await fastify.cachedProducts.invalidateProduct(id, product.category);
      
      // Pre-warm the cache
      await fastify.cachedProducts.getProduct(id);
      
      return {
        success: true,
        message: 'Product cache refreshed',
        productId: id
      };
    }
  });
}

export default cachedProductRoutes;