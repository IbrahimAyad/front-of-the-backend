import { FastifyPluginAsync } from 'fastify';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get products with enhanced filtering - PUBLIC ROUTE (no auth required for admin dashboard)
  fastify.get('/', async (request: any, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = 'ACTIVE',
        category,
        subcategory,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query;
      
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = { status };
      
      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
      }
      
      if (subcategory) {
        where.subcategory = { contains: subcategory, mode: 'insensitive' };
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } }
        ];
      }
      
      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get products from database with ALL fields including smart attributes
      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy,
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
        }),
        fastify.prisma.product.count({ where })
      ]);

      // Calculate aggregated stock for each product
      const productsWithStock = products.map(product => {
        const totalVariantStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
        const availableVariants = product.variants.filter(v => v.isActive && v.stock > 0).length;
        
        return {
          ...product,
          totalStock: totalVariantStock,
          availableVariants,
          primaryImage: product.images.find(img => img.isPrimary) || product.images[0] || null,
          // Smart categorization
          isShirt: product.category?.toLowerCase() === 'shirts',
          isSuit: product.category?.toLowerCase() === 'suits',
          isTie: product.category?.toLowerCase() === 'ties',
          // Dress shirt specific
          isDressShirt: product.category?.toLowerCase() === 'shirts' && 
                       product.subcategory?.toLowerCase() === 'dress',
          // Smart attributes summary
          smartSummary: product.smartAttributes ? {
            formalityLevel: (product.smartAttributes as any)?.formality_level || 3,
            occasions: (product.smartAttributes as any)?.event_suitability || [],
            stylePersonality: (product.smartAttributes as any)?.style_personality || []
          } : null
        };
      });

      return reply.send({
        success: true,
        data: {
          products: productsWithStock,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          filters: {
            categories: await fastify.prisma.product.groupBy({
              by: ['category'],
              where: { status: 'ACTIVE' },
              _count: { category: true }
            }),
            subcategories: await fastify.prisma.product.groupBy({
              by: ['subcategory'],
              where: { status: 'ACTIVE', ...(category && { category: { contains: category, mode: 'insensitive' } }) },
              _count: { subcategory: true }
            })
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching products:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch products',
        details: (error as Error).message
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
            orderBy: [
              { size: 'asc' },
              { color: 'asc' }
            ]
          },
          images: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        });
      }

      // Enhanced product data
      const enhancedProduct = {
        ...product,
        totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
        availableVariants: product.variants.filter(v => v.isActive && v.stock > 0).length,
        sizeRange: product.variants.length > 0 ? {
          min: product.variants[0]?.size,
          max: product.variants[product.variants.length - 1]?.size
        } : null,
        colorOptions: [...new Set(product.variants.map(v => v.color))],
        // Smart pairing suggestions
        pairingSuggestions: product.pairsWellWith || [],
        smartAttributes: product.smartAttributes || {},
        // Category-specific data
        isDressShirt: product.category?.toLowerCase() === 'shirts' && 
                     product.subcategory?.toLowerCase() === 'dress'
      };

      return reply.send({
        success: true,
        data: { product: enhancedProduct }
      });
    } catch (error) {
      fastify.log.error('Error fetching product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch product'
      });
    }
  });

  // Get dashboard stats - PUBLIC ROUTE
  fastify.get('/stats/dashboard', async (request: any, reply) => {
    try {
      const [
        totalProducts,
        totalVariants,
        lowStockProducts,
        categoryStats,
        recentProducts
      ] = await Promise.all([
        fastify.prisma.product.count({ where: { status: 'ACTIVE' } }),
        fastify.prisma.productVariant.count({ where: { isActive: true } }),
        fastify.prisma.product.count({ 
          where: { 
            status: 'ACTIVE',
            totalStock: { lte: fastify.prisma.product.fields.minimumStock }
          } 
        }),
        fastify.prisma.product.groupBy({
          by: ['category'],
          where: { status: 'ACTIVE' },
          _count: { category: true },
          _sum: { totalStock: true }
        }),
        fastify.prisma.product.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            category: true,
            subcategory: true,
            price: true,
            totalStock: true,
            createdAt: true
          }
        })
      ]);

      // Enhanced category breakdown
      const categoryBreakdown = categoryStats.map(stat => ({
        category: stat.category,
        productCount: stat._count.category,
        totalStock: stat._sum.totalStock || 0,
        // Special highlighting for dress shirts
        isDressShirts: stat.category?.toLowerCase() === 'shirts'
      }));

      return reply.send({
        success: true,
        data: {
          overview: {
            totalProducts,
            totalVariants,
            lowStockProducts,
            activeCategories: categoryStats.length
          },
          categories: categoryBreakdown,
          recentProducts: recentProducts.map(product => ({
            ...product,
            isDressShirt: product.category?.toLowerCase() === 'shirts' && 
                         product.subcategory?.toLowerCase() === 'dress'
          })),
          // Dress shirt specific stats
          dressShirtStats: {
            total: await fastify.prisma.product.count({
              where: { 
                status: 'ACTIVE',
                category: { contains: 'shirts', mode: 'insensitive' },
                subcategory: { contains: 'dress', mode: 'insensitive' }
              }
            }),
            totalStock: await fastify.prisma.product.aggregate({
              where: { 
                status: 'ACTIVE',
                category: { contains: 'shirts', mode: 'insensitive' },
                subcategory: { contains: 'dress', mode: 'insensitive' }
              },
              _sum: { totalStock: true }
            }).then(result => result._sum.totalStock || 0)
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching dashboard stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  });

  // Create product - REQUIRES AUTHENTICATION
  fastify.post('/', { preHandler: fastify.authenticate }, async (request: any, reply) => {
    try {
      const productData = request.body;
      
      const product = await fastify.prisma.product.create({
        data: {
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          variants: true,
          images: true
        }
      });

      return reply.status(201).send({
        success: true,
        data: { product }
      });
    } catch (error) {
      fastify.log.error('Error creating product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create product'
      });
    }
  });

  // Update product - PUBLIC ROUTE (no auth required for admin dashboard)  
  fastify.put('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const product = await fastify.prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          variants: true,
          images: true
        }
      });

      return reply.send({
        success: true,
        data: { product }
      });
    } catch (error) {
      fastify.log.error('Error updating product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update product'
      });
    }
  });

  // Patch product (partial update) - PUBLIC ROUTE (no auth required for admin dashboard)
  fastify.patch('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const product = await fastify.prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      return reply.send({
        success: true,
        data: { product }
      });
    } catch (error) {
      fastify.log.error('Error patching product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to patch product'
      });
    }
  });

  // Delete product - PUBLIC ROUTE (no auth required for admin dashboard)
  fastify.delete('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.product.update({
        where: { id },
        data: { 
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      });

      return reply.send({
        success: true,
        message: 'Product deactivated successfully'
      });
    } catch (error) {
      fastify.log.error('Error deleting product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete product'
      });
    }
  });
};

export default productsRoutes;
