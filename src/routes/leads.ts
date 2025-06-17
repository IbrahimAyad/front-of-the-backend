import { FastifyPluginAsync } from 'fastify';
import { createLeadSchema, updateLeadSchema } from '../schemas/lead';

const leadsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get leads with filters and pagination
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, source, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (source) where.source = source;
      if (search) {
        where.OR = [
          { customer: { name: { contains: search } } },
          { customer: { email: { contains: search } } },
          { notes: { contains: search } },
        ];
      }

      const [leads, total] = await Promise.all([
        fastify.prisma.lead.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { updatedAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        }),
        fastify.prisma.lead.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          leads,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
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

  // Create new lead
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createLeadSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const lead = await fastify.prisma.lead.create({
        data: {
          ...value,
          createdBy: request.user.id,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // Broadcast new lead event
      fastify.broadcast('lead_created', lead);

      reply.code(201).send({
        success: true,
        data: lead,
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

export default leadsRoutes;
