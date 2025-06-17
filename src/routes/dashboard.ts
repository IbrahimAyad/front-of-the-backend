import { FastifyPluginAsync } from 'fastify';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // Dashboard statistics
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const [
        totalCustomers,
        totalOrders,
        totalLeads,
        pendingAppointments,
        recentOrders,
      ] = await Promise.all([
        fastify.prisma.customer.count(),
        fastify.prisma.order.count(),
        fastify.prisma.lead.count(),
        fastify.prisma.appointment.count({
          where: { status: 'SCHEDULED' },
        }),
        fastify.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
          },
        }),
      ]);

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
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Recent activities
  fastify.get('/recent', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const [recentOrders, recentLeads, recentAppointments] = await Promise.all([
        fastify.prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
        fastify.prisma.lead.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
        fastify.prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
      ]);

      reply.send({
        success: true,
        data: {
          recentOrders,
          recentLeads,
          recentAppointments,
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

export default dashboardRoutes;
