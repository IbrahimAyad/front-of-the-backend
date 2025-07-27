import { FastifyPluginAsync } from 'fastify';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // Dashboard statistics with better error handling
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      // Use individual try-catch for each query to handle failures gracefully
      let totalCustomers = 0;
      let totalOrders = 0;
      let totalLeads = 0;
      let pendingAppointments = 0;
      let recentOrders = [];

      try {
        totalCustomers = await fastify.prisma.customer.count();
      } catch (e) {
        fastify.log.warn('Failed to count customers:', e);
      }

      try {
        totalOrders = await fastify.prisma.order.count();
      } catch (e) {
        fastify.log.warn('Failed to count orders:', e);
      }

      try {
        totalLeads = await fastify.prisma.lead.count();
      } catch (e) {
        fastify.log.warn('Failed to count leads:', e);
      }

      try {
        pendingAppointments = await fastify.prisma.appointment.count({
          where: { status: 'SCHEDULED' },
        });
      } catch (e) {
        fastify.log.warn('Failed to count appointments:', e);
      }

      try {
        recentOrders = await fastify.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { 
              select: { 
                name: true,
                email: true 
              } 
            },
          },
        });
      } catch (e) {
        fastify.log.warn('Failed to fetch recent orders:', e);
        recentOrders = [];
      }

      reply.send({
        success: true,
        data: {
          totalCustomers,
          totalOrders,
          totalLeads,
          pendingAppointments,
          recentOrders,
        },
      });
    } catch (error) {
      fastify.log.error('Dashboard stats error:', error);
      // Send default data instead of failing
      reply.send({
        success: true,
        data: {
          totalCustomers: 0,
          totalOrders: 0,
          totalLeads: 0,
          pendingAppointments: 0,
          recentOrders: [],
        },
      });
    }
  });

  // Recent activities with better error handling
  fastify.get('/recent', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      let recentOrders = [];
      let recentLeads = [];
      let recentAppointments = [];

      try {
        recentOrders = await fastify.prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { 
              select: { 
                name: true, 
                email: true 
              } 
            },
          },
        });
      } catch (e) {
        fastify.log.warn('Failed to fetch recent orders:', e);
      }

      try {
        recentLeads = await fastify.prisma.lead.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            customer: { 
              select: { 
                name: true, 
                email: true 
              } 
            },
          },
        });
      } catch (e) {
        fastify.log.warn('Failed to fetch recent leads:', e);
      }

      try {
        recentAppointments = await fastify.prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { 
              select: { 
                name: true, 
                email: true 
              } 
            },
          },
        });
      } catch (e) {
        fastify.log.warn('Failed to fetch recent appointments:', e);
      }

      reply.send({
        success: true,
        data: {
          recentOrders,
          recentLeads,
          recentAppointments,
        },
      });
    } catch (error) {
      fastify.log.error('Dashboard recent error:', error);
      // Send empty data instead of failing
      reply.send({
        success: true,
        data: {
          recentOrders: [],
          recentLeads: [],
          recentAppointments: [],
        },
      });
    }
  });
};

export default dashboardRoutes;