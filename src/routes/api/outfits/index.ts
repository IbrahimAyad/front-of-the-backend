import { FastifyPluginAsync } from 'fastify';
import { OutfitService } from '../../../services/outfitService';
import { authenticate } from '../../../plugins/authenticate';
import logger from '../../../utils/logger';

const outfitService = new OutfitService();

interface CreateOutfitBody {
  sku: string;
  name: string;
  description?: string;
  category: 'BUSINESS' | 'WEDDING' | 'CASUAL' | 'FORMAL' | 'SEASONAL';
  components: Array<{
    productId: string;
    componentType: string;
    quantity: number;
    isRequired?: boolean;
    alternatives?: string[];
  }>;
  bundlePrice: number;
  minStock?: number;
  availabilityRule?: 'ALWAYS' | 'CHECK_COMPONENTS';
  tags?: string[];
}

interface CheckAvailabilityBody {
  outfitTemplateId: string;
  sizeSelections: Record<string, string>;
}

interface PurchaseOutfitBody {
  outfitTemplateId: string;
  customerId: string;
  sessionId: string;
  sizeSelections: Record<string, string>;
}

const outfits: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Get all outfit templates
  fastify.get('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { category, isActive = true } = request.query as any;
      
      const where: any = { isActive };
      if (category) where.category = category;

      const outfits = await fastify.prisma.outfitTemplate.findMany({
        where,
        include: {
          components: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.send({
        success: true,
        data: outfits
      });
    } catch (error) {
      logger.error('Error fetching outfits:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch outfits'
      });
    }
  });

  // Get single outfit template
  fastify.get('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const outfit = await fastify.prisma.outfitTemplate.findUnique({
        where: { id },
        include: {
          components: {
            include: {
              product: {
                include: {
                  productVariants: true
                }
              }
            }
          },
          holds: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!outfit) {
        return reply.code(404).send({
          success: false,
          error: 'Outfit not found'
        });
      }

      return reply.send({
        success: true,
        data: outfit
      });
    } catch (error) {
      logger.error('Error fetching outfit:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch outfit'
      });
    }
  });

  // Create new outfit template
  fastify.post<{ Body: CreateOutfitBody }>('/', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['sku', 'name', 'category', 'components', 'bundlePrice'],
        properties: {
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { enum: ['BUSINESS', 'WEDDING', 'CASUAL', 'FORMAL', 'SEASONAL'] },
          components: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'componentType', 'quantity'],
              properties: {
                productId: { type: 'string' },
                componentType: { type: 'string' },
                quantity: { type: 'number' },
                isRequired: { type: 'boolean' },
                alternatives: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          bundlePrice: { type: 'number' },
          minStock: { type: 'number' },
          availabilityRule: { enum: ['ALWAYS', 'CHECK_COMPONENTS'] },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const outfit = await outfitService.createOutfitTemplate(request.body);

      return reply.send({
        success: true,
        data: outfit
      });
    } catch (error) {
      logger.error('Error creating outfit:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create outfit'
      });
    }
  });

  // Update outfit template
  fastify.put<{ Params: { id: string }, Body: Partial<CreateOutfitBody> }>('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const outfit = await fastify.prisma.outfitTemplate.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          category: updateData.category,
          bundlePrice: updateData.bundlePrice,
          minStock: updateData.minStock,
          availabilityRule: updateData.availabilityRule,
          tags: updateData.tags,
          updatedAt: new Date()
        },
        include: {
          components: {
            include: {
              product: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: outfit
      });
    } catch (error) {
      logger.error('Error updating outfit:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update outfit'
      });
    }
  });

  // Check outfit availability
  fastify.post<{ Body: CheckAvailabilityBody }>('/check-availability', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { outfitTemplateId, sizeSelections } = request.body;

      const availability = await outfitService.checkOutfitAvailability(
        outfitTemplateId,
        sizeSelections
      );

      return reply.send({
        success: true,
        data: availability
      });
    } catch (error) {
      logger.error('Error checking outfit availability:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to check availability'
      });
    }
  });

  // Purchase outfit (create hold)
  fastify.post<{ Body: PurchaseOutfitBody }>('/purchase', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const result = await outfitService.purchaseOutfit(
        request.body.outfitTemplateId,
        request.body.customerId,
        request.body.sessionId,
        request.body.sizeSelections
      );

      return reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error purchasing outfit:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to purchase outfit'
      });
    }
  });

  // Get popular outfits
  fastify.get('/popular', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const outfits = await outfitService.getPopularOutfits();

      return reply.send({
        success: true,
        data: outfits
      });
    } catch (error) {
      logger.error('Error fetching popular outfits:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch popular outfits'
      });
    }
  });

  // Get customer's saved outfits
  fastify.get('/customer/:customerId', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { customerId } = request.params as { customerId: string };

      const customerOutfits = await fastify.prisma.customerOutfit.findMany({
        where: { customerId },
        include: {
          template: {
            include: {
              components: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      images: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.send({
        success: true,
        data: customerOutfits
      });
    } catch (error) {
      logger.error('Error fetching customer outfits:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch customer outfits'
      });
    }
  });

  // Delete outfit template (soft delete)
  fastify.delete('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if outfit has active holds
      const activeHolds = await fastify.prisma.outfitHold.count({
        where: {
          outfitTemplateId: id,
          status: 'ACTIVE'
        }
      });

      if (activeHolds > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot delete outfit with active holds'
        });
      }

      // Soft delete
      await fastify.prisma.outfitTemplate.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return reply.send({
        success: true,
        message: 'Outfit template deactivated'
      });
    } catch (error) {
      logger.error('Error deleting outfit:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete outfit'
      });
    }
  });
};

export default outfits;