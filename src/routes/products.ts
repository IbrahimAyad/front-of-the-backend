import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

// Validation Schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().optional(),
  longDescription: Joi.string().optional(),
  category: Joi.string().valid('suits', 'tuxedos', 'shirts', 'ties', 'vests', 'accessories', 'wedding-services').required(),
  subcategory: Joi.string().optional(),
  price: Joi.number().positive().required(),
  compareAtPrice: Joi.number().positive().optional(),
  costPrice: Joi.number().positive().optional(),
  sku: Joi.string().required(),
  barcode: Joi.string().optional(),
  slug: Joi.string().optional(),
  brand: Joi.string().optional(),
  fabric: Joi.string().optional(),
  pattern: Joi.string().optional(),
  season: Joi.string().optional(),
  occasions: Joi.array().items(Joi.string()).default([]),
  styleAttributes: Joi.array().items(Joi.string()).default([]),
  care: Joi.string().optional(),
  trackStock: Joi.boolean().default(true),
  totalStock: Joi.number().integer().min(0).default(0),
  availableStock: Joi.number().integer().min(0).default(0),
  minimumStock: Joi.number().integer().min(0).default(5),
  reorderPoint: Joi.number().integer().min(0).default(10),
  reorderQuantity: Joi.number().integer().min(1).default(50),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DISCONTINUED').default('ACTIVE'),
  isPublished: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
  isOnSale: Joi.boolean().default(false),
  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).default([]),
  weight: Joi.number().positive().optional(),
  dimensions: Joi.string().optional(),
  supplierId: Joi.string().optional(),
  supplierSku: Joi.string().optional(),
  leadTime: Joi.number().integer().min(1).optional(),
});

const createVariantSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().required(),
  barcode: Joi.string().optional(),
  size: Joi.string().optional(),
  color: Joi.string().optional(),
  material: Joi.string().optional(),
  fit: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  compareAtPrice: Joi.number().positive().optional(),
  costPrice: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).default(0),
  minimumStock: Joi.number().integer().min(0).default(2),
  reorderPoint: Joi.number().integer().min(0).default(5),
  weight: Joi.number().positive().optional(),
  isActive: Joi.boolean().default(true),
  position: Joi.number().integer().min(0).default(0),
});

const stockAdjustmentSchema = Joi.object({
  type: Joi.string().valid('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER').required(),
  quantity: Joi.number().integer().required(),
  reason: Joi.string().optional(),
  reference: Joi.string().optional(),
});

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get products with comprehensive filtering and pagination
  fastify.get('/', async (request: any, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        subcategory,
        status = 'ACTIVE',
        search, 
        lowStock,
        inStock,
        onSale,
        featured,
        published,
        priceMin,
        priceMax,
        brand,
        fabric,
        season,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeVariants = false,
        includeImages = false,
        includeSupplier = false
      } = request.query;

      const skip = (page - 1) * limit;
      const where: any = {};

      // Build filters
      if (category) where.category = category;
      if (subcategory) where.subcategory = subcategory;
      if (status) where.status = status;
      if (brand) where.brand = brand;
      if (fabric) where.fabric = fabric;
      if (season) where.season = season;
      if (onSale === 'true') where.isOnSale = true;
      if (featured === 'true') where.isFeatured = true;
      if (published === 'true') where.isPublished = true;
      
      if (lowStock === 'true') {
        where.OR = [
          { availableStock: { lte: { field: 'minimumStock' } } },
          { variants: { some: { stock: { lte: 5 } } } }
        ];
      }
      
      if (inStock === 'true') {
        where.OR = [
          { availableStock: { gt: 0 } },
          { variants: { some: { stock: { gt: 0 } } } }
        ];
      }

      if (priceMin || priceMax) {
        where.price = {};
        if (priceMin) where.price.gte = parseFloat(priceMin);
        if (priceMax) where.price.lte = parseFloat(priceMax);
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
          { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }
        ];
      }

      // Build include object
      const include: any = {};
      if (includeVariants === 'true') include.variants = { orderBy: { position: 'asc' } };
      if (includeImages === 'true') include.images = { orderBy: { position: 'asc' } };
      if (includeSupplier === 'true') include.supplier = true;

      // Build sort object
      const orderBy: any = {};
      if (sortBy === 'price') orderBy.price = sortOrder;
      else if (sortBy === 'name') orderBy.name = sortOrder;
      else if (sortBy === 'stock') orderBy.availableStock = sortOrder;
      else orderBy.createdAt = sortOrder;

      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where,
          include,
          skip,
          take: parseInt(limit),
          orderBy,
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
          filters: {
            category,
            subcategory,
            status,
            search,
            lowStock,
            inStock,
            onSale,
            featured,
            priceRange: { min: priceMin, max: priceMax }
          }
        },
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

  // Get single product with full details
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      const product = await fastify.prisma.product.findUnique({
        where: { id },
        include: {
          variants: {
            orderBy: { position: 'asc' }
          },
          images: {
            orderBy: { position: 'asc' }
          },
          supplier: true,
          reviews: {
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              variants: true,
              images: true,
              reviews: true
            }
          }
        },
      });

      if (!product) {
        return reply.code(404).send({
          success: false,
          error: 'Product not found',
        });
      }

      // Calculate aggregate data
      const totalVariantStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
      const averageRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      reply.send({
        success: true,
        data: {
          ...product,
          totalVariantStock,
          averageRating,
          reviewCount: product._count.reviews
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

  // Create new product (Admin only)
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

      // Generate slug if not provided
      if (!value.slug) {
        value.slug = value.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      const product = await fastify.prisma.product.create({
        data: value,
        include: {
          variants: true,
          images: true,
          supplier: true
        }
      });

      // Create inventory log
      await fastify.prisma.inventoryLog.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: value.totalStock || 0,
          previousStock: 0,
          newStock: value.totalStock || 0,
          reason: 'Initial stock creation',
          reference: `PRODUCT_CREATE_${product.id}`,
          userId: request.user?.id?.toString()
        }
      });

      reply.code(201).send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Product with this SKU or slug already exists',
        });
      }
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
      const { error, value } = createProductSchema.validate(request.body);
      
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const existingProduct = await fastify.prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return reply.code(404).send({
          success: false,
          error: 'Product not found',
        });
      }

      const product = await fastify.prisma.product.update({
        where: { id },
        data: value,
        include: {
          variants: true,
          images: true,
          supplier: true
        }
      });

      reply.send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Product with this SKU or slug already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Product Variants Routes
  fastify.get('/:id/variants', async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      const variants = await fastify.prisma.productVariant.findMany({
        where: { productId: id },
        orderBy: { position: 'asc' }
      });

      reply.send({
        success: true,
        data: variants,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  fastify.post('/:id/variants', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { error, value } = createVariantSchema.validate(request.body);
      
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const variant = await fastify.prisma.productVariant.create({
        data: {
          ...value,
          productId: id
        }
      });

      // Update product total stock
      await fastify.prisma.product.update({
        where: { id },
        data: {
          totalStock: {
            increment: value.stock || 0
          },
          availableStock: {
            increment: value.stock || 0
          }
        }
      });

      // Create inventory log
      await fastify.prisma.inventoryLog.create({
        data: {
          productId: id,
          variantId: variant.id,
          type: 'PURCHASE',
          quantity: value.stock || 0,
          previousStock: 0,
          newStock: value.stock || 0,
          reason: 'Variant creation',
          reference: `VARIANT_CREATE_${variant.id}`,
          userId: request.user?.id?.toString()
        }
      });

      reply.code(201).send({
        success: true,
        data: variant,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Variant with this SKU already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Stock Management Routes
  fastify.post('/:id/stock/adjust', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { error, value } = stockAdjustmentSchema.validate(request.body);
      
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const product = await fastify.prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return reply.code(404).send({
          success: false,
          error: 'Product not found',
        });
      }

      const previousStock = product.availableStock;
      const newStock = previousStock + value.quantity;

      if (newStock < 0) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient stock for this adjustment',
        });
      }

      // Update stock
      const updatedProduct = await fastify.prisma.product.update({
        where: { id },
        data: {
          availableStock: newStock,
          totalStock: newStock
        }
      });

      // Create inventory log
      await fastify.prisma.inventoryLog.create({
        data: {
          productId: id,
          type: value.type,
          quantity: value.quantity,
          previousStock,
          newStock,
          reason: value.reason,
          reference: value.reference,
          userId: request.user?.id?.toString()
        }
      });

      // Check for low stock alert
      if (newStock <= product.minimumStock) {
        await fastify.prisma.stockAlert.create({
          data: {
            productId: id,
            type: newStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            message: `Product ${product.name} is ${newStock === 0 ? 'out of stock' : 'running low'} (${newStock} remaining)`,
            priority: newStock === 0 ? 'CRITICAL' : 'HIGH'
          }
        });
      }

      reply.send({
        success: true,
        data: updatedProduct,
        message: `Stock adjusted: ${value.quantity > 0 ? '+' : ''}${value.quantity} units`
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get inventory logs
  fastify.get('/:id/inventory-logs', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { page = 1, limit = 50 } = request.query;
      const skip = (page - 1) * limit;

      const logs = await fastify.prisma.inventoryLog.findMany({
        where: { 
          OR: [
            { productId: id },
            { variant: { productId: id } }
          ]
        },
        include: {
          variant: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      reply.send({
        success: true,
        data: logs,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get stock alerts
  fastify.get('/alerts/stock', async (request: any, reply) => {
    try {
      const { resolved = false, priority } = request.query;
      
      const where: any = { isResolved: resolved === 'true' };
      if (priority) where.priority = priority;

      const alerts = await fastify.prisma.stockAlert.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 100
      });

      reply.send({
        success: true,
        data: alerts,
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
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalVariants,
        featuredProducts,
        recentlyAdded
      ] = await Promise.all([
        fastify.prisma.product.count(),
        fastify.prisma.product.count({ where: { status: 'ACTIVE' } }),
        fastify.prisma.product.count({ 
          where: { 
            availableStock: { lte: 5 },
            status: 'ACTIVE'
          } 
        }),
        fastify.prisma.product.count({ 
          where: { 
            availableStock: 0,
            status: 'ACTIVE'
          } 
        }),
        fastify.prisma.productVariant.count(),
        fastify.prisma.product.count({ where: { isFeatured: true } }),
        fastify.prisma.product.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      const totalInventoryValue = await fastify.prisma.product.aggregate({
        _sum: {
          availableStock: true
        },
        where: {
          status: 'ACTIVE'
        }
      });

      reply.send({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          totalVariants,
          featuredProducts,
          recentlyAdded,
          totalInventoryValue: totalInventoryValue._sum.availableStock || 0,
          stockHealth: {
            healthy: activeProducts - lowStockProducts - outOfStockProducts,
            lowStock: lowStockProducts,
            outOfStock: outOfStockProducts
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
};

export default productsRoutes;
