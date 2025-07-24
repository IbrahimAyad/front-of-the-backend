import { FastifyPluginAsync } from 'fastify';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get products with basic filtering - PUBLIC ROUTE (no auth required for admin dashboard)
  fastify.get('/', async (request: any, reply) => {
    try {
      const { page = 1, limit = 20, status = 'ACTIVE' } = request.query;
      const skip = (page - 1) * limit;

      // Get products from database
      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where: { status },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                size: true,
                color: true,
                stock: true,
                price: true,
                isActive: true,
              }
            }
          }
        }),
        fastify.prisma.product.count({ where: { status } })
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
          filters: {
            status,
            priceRange: {}
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get single product by ID - PUBLIC ROUTE
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      const product = await fastify.prisma.product.findUnique({
        where: { id },
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              size: true,
              color: true,
              stock: true,
              price: true,
              isActive: true,
            }
          }
        }
      });

      if (!product) {
        return reply.code(404).send({
          success: false,
          error: 'Product not found'
        });
      }

      reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new product (Admin only) - REQUIRES AUTH
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const productData = request.body;
      
      const newProduct = await fastify.prisma.product.create({
        data: {
          ...productData,
          price: productData.price.toString(), // Convert to string for Prisma
        },
        include: {
          variants: true
        }
      });

      reply.code(201).send({
        success: true,
        data: newProduct,
        message: 'Product created successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Update product (Admin only) - REQUIRES AUTH
  fastify.put('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const productData = request.body;

      const updatedProduct = await fastify.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          price: productData.price.toString(), // Convert to string for Prisma
          updatedAt: new Date(),
        },
        include: {
          variants: true
        }
      });

      reply.send({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Delete product (Admin only) - REQUIRES AUTH
  fastify.delete('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.product.delete({
        where: { id }
      });

      reply.send({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get product dashboard stats - PUBLIC ROUTE for admin dashboard
  fastify.get('/stats/dashboard', async (request: any, reply) => {
    try {
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts
      ] = await Promise.all([
        fastify.prisma.product.count(),
        fastify.prisma.product.count({ where: { status: 'ACTIVE' } }),
        fastify.prisma.product.count({ 
          where: { 
            status: 'ACTIVE',
            availableStock: { lte: fastify.prisma.product.fields.minimumStock }
          } 
        }),
        fastify.prisma.product.count({ 
          where: { 
            status: 'ACTIVE',
            availableStock: 0
          } 
        })
      ]);

      reply.send({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          categories: await fastify.prisma.product.groupBy({
            by: ['category'],
            _count: { category: true }
          })
        }
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

export default productsRoutes;
