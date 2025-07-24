import { FastifyPluginAsync } from 'fastify';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get products with basic filtering
  fastify.get('/', async (request: any, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      
      // Mock products data for now - this prevents the 404 error
      const mockProducts = [
        {
          id: '1',
          name: 'Classic Navy Suit',
          description: 'Premium navy business suit',
          price: 599.99,
          category: 'suits',
          sku: 'SUIT-001',
          availableStock: 10,
          status: 'ACTIVE',
          isPublished: true,
          images: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Silk Tie Collection',
          description: 'Elegant silk ties',
          price: 49.99,
          category: 'ties',
          sku: 'TIE-001',
          availableStock: 25,
          status: 'ACTIVE',
          isPublished: true,
          images: [],
          createdAt: new Date().toISOString()
        }
      ];

      const total = mockProducts.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedProducts = mockProducts.slice(startIndex, endIndex);

      reply.send({
        success: true,
        data: {
          products: paginatedProducts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
          filters: {}
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get single product by ID
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      // Mock single product data
      const mockProduct = {
        id,
        name: `Product ${id}`,
        description: 'Mock product description',
        price: 299.99,
        category: 'suits',
        sku: `PRODUCT-${id}`,
        availableStock: 5,
        status: 'ACTIVE',
        isPublished: true,
        images: [],
        variants: [],
        createdAt: new Date().toISOString()
      };

      reply.send({
        success: true,
        data: mockProduct
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new product (Admin only)
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const productData = request.body;
      
      // Mock product creation
      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

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

  // Update product (Admin only)  
  fastify.put('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const productData = request.body;
      
      // Mock product update
      const updatedProduct = {
        id,
        ...productData,
        updatedAt: new Date().toISOString()
      };

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

  // Dashboard statistics
  fastify.get('/stats/dashboard', async (request: any, reply) => {
    try {
      const stats = {
        totalProducts: 25,
        activeProducts: 22,
        lowStockProducts: 3,
        outOfStockProducts: 1,
        totalVariants: 45,
        featuredProducts: 8,
        recentlyAdded: 2,
        totalInventoryValue: 15000,
        stockHealth: {
          healthy: 18,
          lowStock: 3,
          outOfStock: 1
        }
      };

      reply.send({
        success: true,
        data: stats
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
