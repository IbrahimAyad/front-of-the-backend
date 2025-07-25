import { FastifyPluginAsync } from 'fastify';

const collectionsRoutes: FastifyPluginAsync = async (fastify) => {

  // Get all active collections
  fastify.get('/', async (request: any, reply) => {
    try {
      const collections = await fastify.prisma.collection.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          heroImage: true,
          metaTitle: true,
          metaDescription: true,
          _count: {
            select: { products: true }
          }
        }
      });

      return reply.send({
        success: true,
        data: { collections }
      });
    } catch (error) {
      fastify.log.error('Error fetching collections:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch collections'
      });
    }
  });

  // Get collection by slug with basic info
  fastify.get('/:slug', async (request: any, reply) => {
    try {
      const { slug } = request.params;

      const collection = await fastify.prisma.collection.findUnique({
        where: { slug, isActive: true },
        include: {
          products: {
            include: {
              product: {
                include: {
                  variants: {
                    orderBy: [
                      { size: 'asc' },
                      { color: 'asc' }
                    ]
                  },
                  images: {
                    orderBy: { position: 'asc' }
                  }
                }
              }
            },
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!collection) {
        return reply.status(404).send({
          success: false,
          error: 'Collection not found'
        });
      }

      return reply.send({
        success: true,
        data: { collection }
      });
    } catch (error) {
      fastify.log.error('Error fetching collection:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch collection'
      });
    }
  });

  // Get products matching collection rules (dynamic filtering)
  fastify.post('/:slug/products', async (request: any, reply) => {
    try {
      const { slug } = request.params;
      const { page = 1, limit = 20, additionalFilters = {} } = request.body;

      const collection = await fastify.prisma.collection.findUnique({
        where: { slug, isActive: true }
      });

      if (!collection || !collection.rules) {
        return reply.status(404).send({
          success: false,
          error: 'Collection not found or has no rules'
        });
      }

      const rules = collection.rules as any;
      const skip = (page - 1) * limit;
      
      // Build dynamic where clause based on collection rules
      const whereConditions: any[] = [];

      // Process rules for each category
      Object.entries(rules).forEach(([category, categoryRules]: [string, any]) => {
        const categoryCondition: any = {
          category: { equals: category, mode: 'insensitive' }
        };

        // Color family filtering
        if (categoryRules.colorFamilies && Array.isArray(categoryRules.colorFamilies)) {
          categoryCondition.variants = {
            some: {
              OR: categoryRules.colorFamilies.map((family: string) => ({
                tags: { has: `${family}-family` }
              }))
            }
          };
        }

        // Direct color filtering
        if (categoryRules.colors && Array.isArray(categoryRules.colors)) {
          categoryCondition.variants = {
            some: {
              color: { in: categoryRules.colors }
            }
          };
        }

        // Tag inclusion
        if (categoryRules.tags && Array.isArray(categoryRules.tags)) {
          categoryCondition.tags = {
            hasEvery: categoryRules.tags
          };
        }

        // Tag exclusion
        if (categoryRules.excludeTags && Array.isArray(categoryRules.excludeTags)) {
          categoryCondition.NOT = {
            tags: { hasSome: categoryRules.excludeTags }
          };
        }

        // Name filtering (for specific products like "Tuxedo")
        if (categoryRules.names && Array.isArray(categoryRules.names)) {
          categoryCondition.name = {
            contains: categoryRules.names.join('|'), // Simple OR matching
            mode: 'insensitive'
          };
        }

        whereConditions.push(categoryCondition);
      });

      // Apply additional filters from request
      if (additionalFilters.priceRange) {
        whereConditions.forEach(condition => {
          condition.price = {
            gte: additionalFilters.priceRange.min || 0,
            lte: additionalFilters.priceRange.max || 99999
          };
        });
      }

      // Execute query with OR conditions for different categories
      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where: {
            OR: whereConditions,
            status: 'ACTIVE',
            isPublished: true
          },
          skip,
          take: parseInt(limit),
          include: {
            variants: {
              orderBy: [
                { size: 'asc' },
                { color: 'asc' }
              ]
            },
            images: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        fastify.prisma.product.count({
          where: {
            OR: whereConditions,
            status: 'ACTIVE',
            isPublished: true
          }
        })
      ]);

      return reply.send({
        success: true,
        data: {
          collection: {
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            description: collection.description,
            heroImage: collection.heroImage
          },
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error filtering collection products:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to filter collection products',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get collections that contain a specific product
  fastify.get('/by-product/:productId', async (request: any, reply) => {
    try {
      const { productId } = request.params;

      const collections = await fastify.prisma.collection.findMany({
        where: {
          isActive: true,
          products: {
            some: { productId }
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          heroImage: true
        },
        orderBy: { sortOrder: 'asc' }
      });

      return reply.send({
        success: true,
        data: { collections }
      });
    } catch (error) {
      fastify.log.error('Error fetching product collections:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch product collections'
      });
    }
  });

  // Seed collections endpoint (admin only)
  fastify.post('/seed', async (request: any, reply) => {
    try {
      console.log('🌱 Starting collection seeding via API...');
      
      // Import and execute the seed script
      const seedCollections = await import('../../prisma/seed-collections');
      const result = await seedCollections.default();
      
      return reply.send({
        success: true,
        message: 'Collections seeded successfully!',
        data: result
      });
      
    } catch (error) {
      fastify.log.error('Error seeding collections:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to seed collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto-populate collection products based on rules
  fastify.post('/:slug/auto-populate', async (request: any, reply) => {
    try {
      const { slug } = request.params;

      const collection = await fastify.prisma.collection.findUnique({
        where: { slug, isActive: true }
      });

      if (!collection || !collection.rules) {
        return reply.status(404).send({
          success: false,
          error: 'Collection not found or has no rules'
        });
      }

      // Use the same filtering logic as the products endpoint
      const { data } = await fastify.inject({
        method: 'POST',
        url: `/api/collections/${slug}/products`,
        payload: { page: 1, limit: 1000 } // Get all matching products
      });

      const response = JSON.parse(data);
      if (!response.success) {
        throw new Error('Failed to fetch matching products');
      }

      // Clear existing product associations
      await fastify.prisma.productCollection.deleteMany({
        where: { collectionId: collection.id }
      });

      // Add matching products to collection
      const productAssociations = response.data.products.map((product: any, index: number) => ({
        productId: product.id,
        collectionId: collection.id,
        position: index
      }));

      await fastify.prisma.productCollection.createMany({
        data: productAssociations
      });

      return reply.send({
        success: true,
        message: `Auto-populated collection with ${productAssociations.length} products`,
        data: {
          collectionId: collection.id,
          productsAdded: productAssociations.length
        }
      });

    } catch (error) {
      fastify.log.error('Error auto-populating collection:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to auto-populate collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

};

export default collectionsRoutes; 