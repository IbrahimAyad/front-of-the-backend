import { FastifyPluginAsync } from 'fastify';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Sales analytics
  fastify.get('/sales', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { period = '30d' } = request.query;
      
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const totalSales = await fastify.prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: {
          createdAt: { gte: startDate },
          paymentStatus: 'paid',
        },
      });

      const salesByStatus = await fastify.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
        where: { createdAt: { gte: startDate } },
      });

      reply.send({
        success: true,
        data: {
          totalSales: totalSales._sum.total || 0,
          totalOrders: totalSales._count,
          salesByStatus,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Lead conversion analytics
  fastify.get('/leads', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { period = '30d' } = request.query;
      
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const leadsByStatus = await fastify.prisma.lead.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      });

      const leadsBySource = await fastify.prisma.lead.groupBy({
        by: ['source'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      });

      reply.send({
        success: true,
        data: {
          leadsByStatus,
          leadsBySource,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default analyticsRoutes;
