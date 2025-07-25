import { FastifyPluginAsync } from 'fastify';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic analytics endpoints to stop 404s
  fastify.get('/sales', async (request, reply) => {
    return {
      success: true,
      data: {
        sales: [],
        total: 0,
        revenue: 0,
        period: "week",
        growth: 0
      }
    };
  });

  fastify.get('/leads', async (request, reply) => {
    return {
      success: true,
      data: {
        leads: [],
        total: 0,
        converted: 0,
        conversion_rate: 0,
        period: "week"
      }
    };
  });

  // Additional common analytics endpoints
  fastify.get('/overview', async (request, reply) => {
    return {
      success: true,
      data: {
        total_products: 47,
        total_orders: 0,
        total_revenue: 0,
        total_customers: 0
      }
    };
  });
};

export default analyticsRoutes;
