import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createMeasurementSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  chest: Joi.number().positive().optional(),
  waist: Joi.number().positive().optional(),
  hips: Joi.number().positive().optional(),
  shoulders: Joi.number().positive().optional(),
  armLength: Joi.number().positive().optional(),
  inseam: Joi.number().positive().optional(),
  neck: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  notes: Joi.string().optional(),
});

const measurementsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get measurements
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, customerId } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (customerId) where.customerId = parseInt(customerId);

      const [measurements, total] = await Promise.all([
        fastify.prisma.measurement.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { dateRecorded: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        fastify.prisma.measurement.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          measurements,
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

  // Record new measurements
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createMeasurementSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const measurement = await fastify.prisma.measurement.create({
        data: {
          ...value,
          takenBy: request.user.id,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      reply.code(201).send({
        success: true,
        data: measurement,
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

export default measurementsRoutes;
