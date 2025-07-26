import { FastifyPluginAsync } from 'fastify';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer';

const customersRoutes: FastifyPluginAsync = async (fastify) => {
  // Public endpoint for customer data (for development/dashboard)
  fastify.get('/public', async (request: any, reply) => {
    try {
      const { page = 1, limit = 50, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true, // Include customer profiles for enhanced data
          },
        }),
        fastify.prisma.customer.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          customers,
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

  // Get customers with pagination (authenticated)
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 50, search } = request.query; // Increased default limit
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true, // Include customer profiles for enhanced data
          },
        }),
        fastify.prisma.customer.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          customers,
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

  // Create new customer
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createCustomerSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const customer = await fastify.prisma.customer.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: {
          customer: customer  // Wrap customer in object for consistent API response
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Customer with this email already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get customer details
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      // Validate ID parameter - check if it's a valid string ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Invalid customer ID'
        });
      }

      const customer = await fastify.prisma.customer.findUnique({
        where: { id: id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leads: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          appointments: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          measurements: {
            orderBy: { dateRecorded: 'desc' },
            take: 1,
          },
        },
      });

      if (!customer) {
        return reply.code(404).send({
          success: false,
          error: 'Customer not found',
        });
      }

      reply.send({
        success: true,
        data: customer,
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

export default customersRoutes;
