import { FastifyPluginAsync } from 'fastify';

const cleanupRoutes: FastifyPluginAsync = async (fastify) => {
  // Remove mock products
  fastify.post('/mock-products', async (request, reply) => {
    try {
      // Delete only the 4 mock products
      const mockProducts = await fastify.prisma.product.deleteMany({
        where: {
          OR: [
            { sku: 'BLZR-CAS-001' },
            { sku: 'TUX-WED-001' },
            { sku: 'SUIT-BUS-001' },
            { sku: 'SUIT-3PC-001' }
          ]
        }
      });

      console.log(`✅ Removed ${mockProducts.count} mock products`);

      // Show remaining product count
      const remainingCount = await fastify.prisma.product.count();
      console.log(`📊 Remaining products: ${remainingCount}`);

      return reply.send({
        success: true,
        data: {
          removedCount: mockProducts.count,
          remainingProducts: remainingCount
        }
      });
    } catch (error) {
      fastify.log.error('Error removing mock products:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to remove mock products'
      });
    }
  });
};

export default cleanupRoutes;