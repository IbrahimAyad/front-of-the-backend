import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  sku: Joi.string().required(),
  category: Joi.string().valid('suits', 'tuxedos', 'shirts', 'accessories').required(),
  description: Joi.string().optional(),
  price: Joi.number().positive().required(),
  fabric: Joi.string().optional(),
  colors: Joi.string().default(''),
  sizes: Joi.string().default(''),
  stock: Joi.number().integer().min(0).default(0),
  minimumStock: Joi.number().integer().min(0).default(5),
  images: Joi.string().default(''),
});

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get products with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, category, status, search, lowStock } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (status) where.status = status;
      if (lowStock === 'true') {
        where.stock = { lte: 5 };
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.product.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          products,
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

  // Create new product
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createProductSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const product = await fastify.prisma.product.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Product with this SKU already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default productsRoutes;
