import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createAppointmentSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  service: Joi.string().valid('consultation', 'measurements', 'fitting', 'pickup').required(),
  date: Joi.date().required(),
  time: Joi.string().required(),
  duration: Joi.number().integer().min(15).default(60),
  notes: Joi.string().optional(),
});

const appointmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get appointments with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, service, date, customerId } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (service) where.service = service;
      if (customerId) where.customerId = parseInt(customerId);
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        where.date = {
          gte: startDate,
          lt: endDate,
        };
      }

      const [appointments, total] = await Promise.all([
        fastify.prisma.appointment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date: 'asc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        }),
        fastify.prisma.appointment.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          appointments,
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

  // Schedule new appointment
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createAppointmentSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const appointment = await fastify.prisma.appointment.create({
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

      // Broadcast new appointment event
      fastify.broadcast('appointment_scheduled', appointment);

      reply.code(201).send({
        success: true,
        data: appointment,
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

export default appointmentsRoutes;
