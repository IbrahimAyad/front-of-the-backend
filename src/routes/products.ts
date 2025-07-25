import { FastifyPluginAsync } from 'fastify';
import { 
  getCachedProducts, 
  setCachedProducts, 
  getCachedProductById, 
  setCachedProductById,
  invalidateProductCache
} from '../services/cache/productCache';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Version check endpoint
  fastify.get('/version', async (request, reply) => {
    return reply.send({
      version: 'v4-diagnostics',
      timestamp: new Date().toISOString(),
      message: 'Product routes with comprehensive image diagnostics'
    });
  });
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
      
      // Try to get from cache first (only for default queries)
      if (!category && !subcategory && !search && page === 1 && status === 'ACTIVE') {
        const cachedProducts = await getCachedProducts();
        if (cachedProducts) {
          return reply.send({
            success: true,
            data: {
              products: cachedProducts.slice(0, limit),
              pagination: {
                page: 1,
                limit: parseInt(limit),
                total: cachedProducts.length,
                pages: Math.ceil(cachedProducts.length / limit)
              }
            },
            cached: true
          });
        }
      }
      
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

      // Cache the products if it's a default query
      if (!category && !subcategory && !search && page === 1 && status === 'ACTIVE') {
        await setCachedProducts(productsWithStock);
      }

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

      // Try to get from cache first
      const cachedProduct = await getCachedProductById(id);
      if (cachedProduct) {
        return reply.send({
          success: true,
          data: cachedProduct,
          cached: true
        });
      }

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

      // Cache the enhanced product
      await setCachedProductById(enhancedProduct);

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

      // Invalidate cache after creating product
      await invalidateProductCache();

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
      const updateData = request.body || {};

      // Version check - v6 minimal
      fastify.log.info(`🚀 Product update v6 starting for ${id}`);

      // Safe extraction with defaults
      const images = updateData.images || [];
      const variants = updateData.variants || [];

      // THEN: Remove computed fields and id
      const { id: productId, availableVariants, primaryImage, isShirt, isSuit, isTie, isDressShirt, smartSummary, createdAt, updatedAt, images: _images, variants: _variants, ...basicProductData } = updateData;

      // Convert arrays to proper format for Prisma
      if (basicProductData.occasions && Array.isArray(basicProductData.occasions)) {
        basicProductData.occasions = basicProductData.occasions;
      }
      if (basicProductData.styleAttributes && Array.isArray(basicProductData.styleAttributes)) {
        basicProductData.styleAttributes = basicProductData.styleAttributes;
      }
      if (basicProductData.fabricBenefits && Array.isArray(basicProductData.fabricBenefits)) {
        basicProductData.fabricBenefits = basicProductData.fabricBenefits;
      }
      if (basicProductData.occasionTags && Array.isArray(basicProductData.occasionTags)) {
        basicProductData.occasionTags = basicProductData.occasionTags;
      }
      if (basicProductData.trendingFor && Array.isArray(basicProductData.trendingFor)) {
        basicProductData.trendingFor = basicProductData.trendingFor;
      }
      if (basicProductData.pairsWellWith && Array.isArray(basicProductData.pairsWellWith)) {
        basicProductData.pairsWellWith = basicProductData.pairsWellWith;
      }
      if (basicProductData.localKeywords && Array.isArray(basicProductData.localKeywords)) {
        basicProductData.localKeywords = basicProductData.localKeywords;
      }
      if (basicProductData.tags && Array.isArray(basicProductData.tags)) {
        basicProductData.tags = basicProductData.tags;
      }

      // Build update data
      const updateDataForPrisma: any = {
        ...basicProductData,
        updatedAt: new Date()
      };
      
      // Handle images separately to ensure they save
      let imagesToUpdate = null;
      if (images && Array.isArray(images) && images.length > 0) {
        fastify.log.info(`📸 Images received for product ${id}:`, {
          count: images.length,
          images: images.map(img => ({ url: img.url, isPrimary: img.isPrimary }))
        });
        
        // Store images for separate handling after product update - simplified
        imagesToUpdate = images.map((img: any, index: number) => {
          const imageData: any = {
            productId: id,
            url: img.url || img.imageUrl,  // Support both field names
            altText: img.altText || img.alt || `Product image ${index + 1}`,
            isPrimary: Boolean(img.isPrimary || index === 0),
            position: index
          };
          
          // Only add optional fields if they exist
          if (img.caption) imageData.caption = img.caption;
          if (img.width && !isNaN(parseInt(img.width))) imageData.width = parseInt(img.width);
          if (img.height && !isNaN(parseInt(img.height))) imageData.height = parseInt(img.height);
          if (img.size && !isNaN(parseInt(img.size))) imageData.size = parseInt(img.size);
          
          return imageData;
        });
      } else {
        fastify.log.info(`⚠️ No images provided for product ${id}`);
      }
      
      // Handle variants if provided
      if (variants && Array.isArray(variants)) {
        updateDataForPrisma.variants = {
          deleteMany: {}, // Delete all existing variants
          create: variants.map((variant: any) => ({
            name: variant.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock || 0,
            price: variant.price,
            isActive: variant.isActive !== false
          }))
        };
      }

      // Debug: Log the update data
      fastify.log.info(`🔍 Update data for Prisma:`, JSON.stringify(updateDataForPrisma, null, 2));
      
      let product = await fastify.prisma.product.update({
        where: { id },
        data: updateDataForPrisma,
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

      // Now handle images separately if we have any
      if (imagesToUpdate && imagesToUpdate.length > 0) {
        fastify.log.info(`🎯 Attempting to save ${imagesToUpdate.length} images for product ${id}`);
        
        try {
          // First, let's test if we can create a single image
          fastify.log.info(`🧪 Testing single image creation...`);
          const testImage = {
            productId: id,
            url: imagesToUpdate[0].url,
            altText: 'Test image',
            isPrimary: true,
            position: 0
          };
          
          try {
            const testCreated = await fastify.prisma.productImage.create({
              data: testImage
            });
            fastify.log.info(`✅ Test image created successfully: ${testCreated.id}`);
            
            // If test succeeded, delete all and recreate
            await fastify.prisma.productImage.deleteMany({
              where: { productId: id }
            });
            
            // Now create all images
            for (let i = 0; i < imagesToUpdate.length; i++) {
              const imgData = imagesToUpdate[i];
              fastify.log.info(`📸 Creating image ${i + 1}: ${imgData.url.substring(0, 50)}...`);
              
              const created = await fastify.prisma.productImage.create({
                data: imgData
              });
              
              fastify.log.info(`✅ Image ${i + 1} saved with ID: ${created.id}`);
            }
          } catch (testError: any) {
            fastify.log.error(`❌ Test image creation failed:`, {
              error: testError.message,
              code: testError.code,
              meta: testError.meta
            });
          }
          
          // Fetch the updated product with images
          product = await fastify.prisma.product.findUnique({
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
          }) || product;
          
          fastify.log.info(`📊 Final image count: ${product.images?.length || 0}`);
        } catch (imageError: any) {
          fastify.log.error(`❌ Image operation failed:`, {
            error: imageError.message,
            code: imageError.code,
            stack: imageError.stack
          });
        }
      } else {
        fastify.log.info(`⚠️ No images to update for product ${id}`);
      }

      // Debug: Log what was returned
      fastify.log.info(`✅ Product updated. Images count: ${product.images?.length || 0}`);
      if (product.images && product.images.length > 0) {
        fastify.log.info(`📸 Saved images:`, product.images.map(img => ({ id: img.id, url: img.url })));
      }

      // Invalidate cache after updating product
      await invalidateProductCache(id);

      // Debug: Log the full response structure
      const response = {
        success: true,
        data: { product }
      };
      fastify.log.info(`📤 Sending response with ${product.images?.length || 0} images`);
      
      return reply.send(response);
    } catch (error) {
      fastify.log.error('Error updating product:', error);
      fastify.log.error('Update data:', JSON.stringify(request.body, null, 2));
      return reply.status(500).send({
        success: false,
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
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

      // Invalidate cache after patching product
      await invalidateProductCache(id);

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

      // Invalidate cache after deleting product
      await invalidateProductCache(id);

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
