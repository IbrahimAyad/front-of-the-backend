import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

// Validation Schemas
const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).required(),
  contactName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  zipCode: Joi.string().optional(),
  website: Joi.string().uri().optional(),
  taxId: Joi.string().optional(),
  terms: Joi.string().optional(),
  leadTime: Joi.number().integer().min(1).optional(),
  minimumOrder: Joi.number().positive().optional(),
  rating: Joi.number().min(1).max(5).optional(),
  onTimeDelivery: Joi.number().min(0).max(100).optional(),
  qualityRating: Joi.number().min(1).max(5).optional(),
  isActive: Joi.boolean().default(true),
  isPreferred: Joi.boolean().default(false),
});

const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().required(),
  orderNumber: Joi.string().optional(),
  totalAmount: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  expectedDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  shippingCost: Joi.number().positive().optional(),
  taxAmount: Joi.number().positive().optional(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().optional(),
      variantId: Joi.string().optional(),
      description: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitCost: Joi.number().positive().required(),
    })
  ).min(1).required(),
});

const suppliersRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all suppliers
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search,
        isActive,
        isPreferred,
        sortBy = 'name',
        sortOrder = 'asc'
      } = request.query;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (isPreferred !== undefined) where.isPreferred = isPreferred === 'true';
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'rating') orderBy.rating = sortOrder;
      else if (sortBy === 'leadTime') orderBy.leadTime = sortOrder;
      else orderBy.name = sortOrder;

      const [suppliers, total] = await Promise.all([
        fastify.prisma.supplier.findMany({
          where,
          include: {
            _count: {
              select: {
                products: true,
                purchaseOrders: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy,
        }),
        fastify.prisma.supplier.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          suppliers,
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

  // Get single supplier
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      const supplier = await fastify.prisma.supplier.findUnique({
        where: { id },
        include: {
          products: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          purchaseOrders: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              products: true,
              purchaseOrders: true
            }
          }
        },
      });

      if (!supplier) {
        return reply.code(404).send({
          success: false,
          error: 'Supplier not found',
        });
      }

      reply.send({
        success: true,
        data: supplier,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new supplier
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createSupplierSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const supplier = await fastify.prisma.supplier.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: supplier,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Update supplier
  fastify.put('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { error, value } = createSupplierSchema.validate(request.body);
      
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const supplier = await fastify.prisma.supplier.update({
        where: { id },
        data: value,
      });

      reply.send({
        success: true,
        data: supplier,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Purchase Orders Routes
  fastify.get('/:id/purchase-orders', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { page = 1, limit = 20, status } = request.query;
      const skip = (page - 1) * limit;

      const where: any = { supplierId: id };
      if (status) where.status = status;

      const purchaseOrders = await fastify.prisma.purchaseOrder.findMany({
        where,
        include: {
          items: {
            include: {
              purchaseOrder: false
            }
          },
          supplier: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      reply.send({
        success: true,
        data: purchaseOrders,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create purchase order
  fastify.post('/purchase-orders', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createPurchaseOrderSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      // Generate order number if not provided
      if (!value.orderNumber) {
        const timestamp = Date.now();
        value.orderNumber = `PO-${timestamp}`;
      }

      // Calculate total from items if not provided
      const itemsTotal = value.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitCost);
      }, 0);

      const poData = {
        supplierId: value.supplierId,
        orderNumber: value.orderNumber,
        status: 'PENDING',
        totalAmount: value.totalAmount || itemsTotal,
        currency: value.currency,
        expectedDate: value.expectedDate,
        notes: value.notes,
        shippingCost: value.shippingCost,
        taxAmount: value.taxAmount,
      };

      const purchaseOrder = await fastify.prisma.purchaseOrder.create({
        data: {
          ...poData,
          items: {
            create: value.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            }))
          }
        },
        include: {
          items: true,
          supplier: true
        }
      });

      reply.code(201).send({
        success: true,
        data: purchaseOrder,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Purchase order with this number already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Receive purchase order (update stock)
  fastify.post('/purchase-orders/:id/receive', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { items, partialReceive = false } = request.body;

      const purchaseOrder = await fastify.prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true,
          supplier: true
        }
      });

      if (!purchaseOrder) {
        return reply.code(404).send({
          success: false,
          error: 'Purchase order not found',
        });
      }

      if (purchaseOrder.status === 'RECEIVED') {
        return reply.code(400).send({
          success: false,
          error: 'Purchase order already received',
        });
      }

      // Process received items
      for (const receivedItem of items) {
        const poItem = purchaseOrder.items.find(item => item.id === receivedItem.id);
        if (!poItem) continue;

        const quantityReceived = receivedItem.quantityReceived;

        // Update purchase order item
        await fastify.prisma.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: {
              increment: quantityReceived
            }
          }
        });

        // Update product/variant stock
        if (poItem.productId) {
          await fastify.prisma.product.update({
            where: { id: poItem.productId },
            data: {
              availableStock: { increment: quantityReceived },
              totalStock: { increment: quantityReceived }
            }
          });

          // Create inventory log
          await fastify.prisma.inventoryLog.create({
            data: {
              productId: poItem.productId,
              type: 'PURCHASE',
              quantity: quantityReceived,
              previousStock: 0, // We'd need to query this
              newStock: 0, // We'd need to calculate this
              reason: 'Purchase order received',
              reference: purchaseOrder.orderNumber,
              userId: request.user?.id
            }
          });
        }

        if (poItem.variantId) {
          await fastify.prisma.productVariant.update({
            where: { id: poItem.variantId },
            data: {
              stock: { increment: quantityReceived }
            }
          });

          // Create inventory log
          await fastify.prisma.inventoryLog.create({
            data: {
              variantId: poItem.variantId,
              type: 'PURCHASE',
              quantity: quantityReceived,
              previousStock: 0, // We'd need to query this
              newStock: 0, // We'd need to calculate this
              reason: 'Purchase order received',
              reference: purchaseOrder.orderNumber,
              userId: request.user?.id
            }
          });
        }
      }

      // Update purchase order status
      const allItemsReceived = purchaseOrder.items.every(item => 
        item.quantityReceived >= item.quantity
      );

      const newStatus = allItemsReceived ? 'RECEIVED' : 'SHIPPED';
      
      const updatedPO = await fastify.prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          receivedDate: allItemsReceived ? new Date() : undefined
        },
        include: {
          items: true,
          supplier: true
        }
      });

      reply.send({
        success: true,
        data: updatedPO,
        message: `Purchase order ${allItemsReceived ? 'fully' : 'partially'} received`
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Supplier performance analytics
  fastify.get('/:id/analytics', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { startDate, endDate } = request.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const where: any = { supplierId: id };
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }

      const [
        totalOrders,
        completedOrders,
        totalSpent,
        averageOrderValue,
        onTimeDeliveries,
        supplierData
      ] = await Promise.all([
        fastify.prisma.purchaseOrder.count({ where }),
        fastify.prisma.purchaseOrder.count({ 
          where: { ...where, status: 'RECEIVED' } 
        }),
        fastify.prisma.purchaseOrder.aggregate({
          where,
          _sum: { totalAmount: true }
        }),
        fastify.prisma.purchaseOrder.aggregate({
          where,
          _avg: { totalAmount: true }
        }),
        fastify.prisma.purchaseOrder.count({
          where: {
            ...where,
            status: 'RECEIVED',
            receivedDate: { lte: new Date() }
          }
        }),
        fastify.prisma.supplier.findUnique({
          where: { id },
          select: {
            name: true,
            rating: true,
            onTimeDelivery: true,
            qualityRating: true
          }
        })
      ]);

      const onTimePercentage = totalOrders > 0 
        ? (onTimeDeliveries / totalOrders) * 100 
        : 0;

      reply.send({
        success: true,
        data: {
          supplier: supplierData,
          performance: {
            totalOrders,
            completedOrders,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
            totalSpent: totalSpent._sum.totalAmount || 0,
            averageOrderValue: averageOrderValue._avg.totalAmount || 0,
            onTimeDeliveryRate: onTimePercentage
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

export default suppliersRoutes; 