import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createOrderSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required(),
      customizations: Joi.string().optional(),
    })
  ).min(1).required(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
});

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  // Get orders with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, paymentStatus, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { customer: { name: { contains: search } } },
          { customer: { email: { contains: search } } },
        ];
      }

      const [orders, total] = await Promise.all([
        fastify.prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
            items: {
              include: {
                product: {
                  select: { name: true, sku: true, category: true },
                },
              },
            },
          },
        }),
        fastify.prisma.order.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          orders,
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

  // Create new order
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createOrderSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { customerId, items, dueDate, notes } = value;

      // Calculate total
      const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      // Create order with items
      const order = await fastify.prisma.order.create({
        data: {
          customerId,
          total,
          dueDate,
          notes,
          items: {
            create: items,
          },
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      });

      // Broadcast new order event
      fastify.broadcast('order_created', order);

      reply.code(201).send({
        success: true,
        data: order,
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

export default ordersRoutes;
