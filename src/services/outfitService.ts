import { PrismaClient } from '@prisma/client';
// import { MacOSAdminClient } from './macosAdminClient'; // FUTURE: MacOS Admin integration
import logger from '../utils/logger';

const prisma = new PrismaClient();
// const macosAdmin = new MacOSAdminClient(); // FUTURE: MacOS Admin integration

interface CreateOutfitTemplateDto {
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

export class OutfitService {
  /**
   * Create a new outfit template with optional standing hold
   */
  async createOutfitTemplate(data: CreateOutfitTemplateDto) {
    try {
      // Calculate savings
      const componentPrices = await Promise.all(
        data.components.map(async (comp) => {
          const product = await prisma.product.findUnique({
            where: { id: comp.productId },
            select: { price: true }
          });
          return (product?.price || 0) * comp.quantity;
        })
      );
      
      const basePrice = componentPrices.reduce((sum, price) => sum + price, 0);
      const savingsAmount = basePrice - data.bundlePrice;

      // Create outfit template
      const outfitTemplate = await prisma.outfitTemplate.create({
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description,
          category: data.category,
          basePrice,
          bundlePrice: data.bundlePrice,
          savingsAmount,
          minStock: data.minStock || 0,
          availabilityRule: data.availabilityRule || 'CHECK_COMPONENTS',
          tags: data.tags || [],
          components: {
            create: data.components.map(comp => ({
              productId: comp.productId,
              componentType: comp.componentType,
              quantity: comp.quantity,
              isRequired: comp.isRequired ?? true,
              alternatives: comp.alternatives || []
            }))
          }
        },
        include: {
          components: {
            include: {
              product: true
            }
          }
        }
      });

      // FUTURE: Create standing hold if "always available"
      // if (data.availabilityRule === 'ALWAYS' && data.minStock > 0) {
      //   await this.createStandingHold(outfitTemplate);
      // }

      return outfitTemplate;
    } catch (error) {
      logger.error('Error creating outfit template:', error);
      throw error;
    }
  }

  /**
   * Create a standing hold in MacOS Admin for guaranteed availability
   */
  // FUTURE: MacOS Admin integration for standing holds
  // private async createStandingHold(outfitTemplate: any) {
  //   try {
  //     const holdItems = outfitTemplate.components.map((comp: any) => ({
  //       sku: comp.product.sku,
  //       quantity: comp.quantity * outfitTemplate.minStock
  //     }));
  //
  //     const standingHold = await macosAdmin.createHold({
  //       items: holdItems,
  //       holdType: 'standing',
  //       outfitId: outfitTemplate.id,
  //       duration: 999999999 // Effectively permanent
  //     });
  //
  //     // Update outfit template with standing hold ID
  //     await prisma.outfitTemplate.update({
  //       where: { id: outfitTemplate.id },
  //       data: { standingHoldId: standingHold.holdId }
  //     });
  //
  //     // Track the hold
  //     await prisma.outfitHold.create({
  //       data: {
  //         outfitTemplateId: outfitTemplate.id,
  //         holdId: standingHold.holdId,
  //         holdType: 'STANDING',
  //         items: holdItems,
  //         status: 'ACTIVE'
  //       }
  //     });
  //
  //     logger.info(`Created standing hold ${standingHold.holdId} for outfit ${outfitTemplate.sku}`);
  //   } catch (error) {
  //     logger.error('Error creating standing hold:', error);
  //     // Don't throw - outfit can still work without standing hold
  //   }
  // }

  /**
   * Check outfit availability for specific size selections
   */
  async checkOutfitAvailability(
    outfitTemplateId: string, 
    sizeSelections: Record<string, string>
  ) {
    const outfit = await prisma.outfitTemplate.findUnique({
      where: { id: outfitTemplateId },
      include: {
        components: {
          include: {
            product: {
              include: {
                productVariants: true
              }
            }
          }
        }
      }
    });

    if (!outfit) {
      throw new Error('Outfit template not found');
    }

    // For "always available" outfits
    if (outfit.availabilityRule === 'ALWAYS') {
      // FUTURE: Check against standing holds in MacOS Admin
      // For now, check local inventory
      const hasStock = outfit.components.every(comp => comp.product.stock >= comp.quantity);
      return {
        available: hasStock,
        components: outfit.components.map(comp => ({
          productId: comp.product.id,
          sku: comp.product.sku,
          name: comp.product.name,
          available: comp.product.stock >= comp.quantity,
          availableQuantity: comp.product.stock
        }))
      };
    }

    // Check real-time availability
    const availabilityChecks = await Promise.all(
      outfit.components.map(async (comp) => {
        const size = sizeSelections[comp.componentType];
        const variant = comp.product.productVariants.find(
          v => v.size === size || v.color === size
        );

        if (!variant) {
          return {
            productId: comp.product.id,
            sku: comp.product.sku,
            name: comp.product.name,
            available: false,
            reason: 'Size not available'
          };
        }

        // Check local inventory
        // FUTURE: Check with MacOS Admin for real-time availability
        const availableStock = variant.stock || comp.product.stock;
        
        return {
          productId: comp.product.id,
          sku: comp.product.sku,
          name: comp.product.name,
          available: availableStock >= comp.quantity,
          availableQuantity: availableStock
        };
      })
    );

    const allAvailable = availabilityChecks.every(check => check.available);

    return {
      available: allAvailable,
      components: availabilityChecks
    };
  }

  /**
   * Purchase an outfit - allocate from standing hold or create temporary hold
   */
  async purchaseOutfit(
    outfitTemplateId: string,
    customerId: string,
    sessionId: string,
    sizeSelections: Record<string, string>
  ) {
    const outfit = await prisma.outfitTemplate.findUnique({
      where: { id: outfitTemplateId },
      include: {
        components: {
          include: {
            product: {
              include: {
                productVariants: true
              }
            }
          }
        }
      }
    });

    if (!outfit) {
      throw new Error('Outfit template not found');
    }

    // Prepare hold items with specific variants
    const holdItems = outfit.components.map(comp => {
      const size = sizeSelections[comp.componentType];
      const variant = comp.product.productVariants.find(
        v => v.size === size || v.color === size
      );

      return {
        sku: comp.product.sku,
        quantity: comp.quantity,
        variant: variant ? { size: variant.size, color: variant.color } : undefined
      };
    });

    // Create local hold
    // FUTURE: Integrate with MacOS Admin for standing holds
    const holdId = `HOLD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Deduct from local inventory temporarily
    for (const comp of outfit.components) {
      const size = sizeSelections[comp.componentType];
      const variant = comp.product.productVariants.find(
        v => v.size === size || v.color === size
      );
      
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: comp.quantity } }
        });
      } else {
        await prisma.product.update({
          where: { id: comp.product.id },
          data: { stock: { decrement: comp.quantity } }
        });
      }
    }

    // Track the hold
    await prisma.outfitHold.create({
      data: {
        outfitTemplateId: outfit.id,
        holdId,
        holdType: 'TEMPORARY',
        customerId,
        sessionId,
        items: holdItems,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        status: 'ACTIVE'
      }
    });

    // Save customer outfit
    const customerOutfit = await prisma.customerOutfit.create({
      data: {
        customerId,
        templateId: outfit.id,
        name: `${outfit.name} - ${new Date().toLocaleDateString()}`,
        sizeSelections,
        isFavorite: false
      }
    });

    return {
      holdId,
      customerOutfitId: customerOutfit.id,
      outfit: {
        name: outfit.name,
        bundlePrice: outfit.bundlePrice,
        savings: outfit.savingsAmount
      }
    };
  }

  /**
   * Get popular outfit templates
   */
  async getPopularOutfits() {
    return prisma.outfitTemplate.findMany({
      where: {
        isActive: true,
        availabilityRule: 'ALWAYS'
      },
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
      },
      orderBy: {
        minStock: 'desc'
      },
      take: 10
    });
  }

  /**
   * Monitor and maintain outfit availability
   */
  // FUTURE: MacOS Admin integration for outfit availability maintenance
  async maintainOutfitAvailability() {
    // For now, just log status of always-available outfits
    const outfitsToCheck = await prisma.outfitTemplate.findMany({
      where: {
        availabilityRule: 'ALWAYS',
        minStock: { gt: 0 },
        isActive: true
      },
      include: {
        components: {
          include: {
            product: true
          }
        }
      }
    });

    for (const outfit of outfitsToCheck) {
      try {
        // Check local inventory levels
        const hasMinStock = outfit.components.every(
          comp => comp.product.stock >= comp.quantity * outfit.minStock
        );
        
        if (!hasMinStock) {
          logger.warn(`Outfit ${outfit.sku} below minimum stock levels`);
          // FUTURE: Create alert or reorder
        }
      } catch (error) {
        logger.error(`Error checking availability for outfit ${outfit.sku}:`, error);
      }
    }
  }
}