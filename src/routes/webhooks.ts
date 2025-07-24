import { FastifyPluginAsync } from 'fastify';
import { SERVER_CONFIG } from '../config/server';

const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // Webhook Receiver (for push updates from MacOS Admin)
  fastify.post('/products', async (request: any, reply) => {
    try {
      // Check authentication from MacOS Admin
      const apiKey = request.headers['x-api-key'];
      if (apiKey !== SERVER_CONFIG.BACKEND_API_KEY) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized - Invalid API key'
        });
      }

      const { products } = request.body;

      if (!products || !Array.isArray(products)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid payload: products array required'
        });
      }

      let updatedCount = 0;

      // Update your database
      for (const product of products) {
        try {
          // Save to appropriate database based on category
          const category = product.category?.toLowerCase() || 'unknown';
          
          await fastify.prisma.product.upsert({
            where: { 
              sku: product.sku || `admin-${product.id}` 
            },
            update: {
              name: product.name,
              description: product.description,
              price: product.price,
              category: category,
              inStock: product.inStock || 0,
              updatedAt: new Date(),
            },
            create: {
              sku: product.sku || `admin-${product.id}`,
              name: product.name,
              description: product.description || '',
              price: product.price,
              category: category,
              inStock: product.inStock || 0,
              isActive: true,
            }
          });
          updatedCount++;
        } catch (productError) {
          fastify.log.error(`Failed to update product ${product.id}:`, productError);
        }
      }

      reply.send({ 
        success: true,
        updated: updatedCount,
        total: products.length
      });
    } catch (error: any) {
      fastify.log.error('Webhook error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
};

export default webhooksRoutes; 