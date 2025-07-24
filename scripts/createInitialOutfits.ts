import { PrismaClient } from '@prisma/client';
import { OutfitService } from '../src/services/outfitService';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();
const outfitService = new OutfitService();

interface OutfitDefinition {
  sku: string;
  name: string;
  description: string;
  category: 'BUSINESS' | 'WEDDING' | 'CASUAL' | 'FORMAL' | 'SEASONAL';
  bundlePrice: number;
  minStock: number;
  availabilityRule: 'ALWAYS' | 'CHECK_COMPONENTS';
  tags: string[];
  components: Array<{
    sku: string;
    type: string;
    quantity: number;
  }>;
}

const initialOutfits: OutfitDefinition[] = [
  {
    sku: 'OUTFIT-BLK-CLASSIC',
    name: 'Classic Black Suit Outfit',
    description: 'Timeless black suit with white shirt and black tie - perfect for any formal occasion',
    category: 'FORMAL',
    bundlePrice: 899.99,
    minStock: 10,
    availabilityRule: 'ALWAYS',
    tags: ['classic', 'formal', 'business', 'wedding'],
    components: [
      { sku: 'SUIT-BLK-001', type: 'suit', quantity: 1 },
      { sku: 'SHRT-WHT-001', type: 'shirt', quantity: 1 },
      { sku: 'ACC-TIE-001', type: 'tie', quantity: 1 }
    ]
  },
  {
    sku: 'OUTFIT-NVY-BUSINESS',
    name: 'Navy Business Professional',
    description: 'Sharp navy suit paired with light blue shirt and striped tie for the modern professional',
    category: 'BUSINESS',
    bundlePrice: 849.99,
    minStock: 15,
    availabilityRule: 'ALWAYS',
    tags: ['business', 'professional', 'navy', 'office'],
    components: [
      { sku: 'SUIT-NAV-001', type: 'suit', quantity: 1 },
      { sku: 'SHRT-BLU-001', type: 'shirt', quantity: 1 },
      { sku: 'ACC-TIE-002', type: 'tie', quantity: 1 }
    ]
  },
  {
    sku: 'OUTFIT-GRY-WEDDING',
    name: 'Grey Wedding Guest',
    description: 'Elegant grey suit with pink shirt and burgundy tie - perfect for wedding celebrations',
    category: 'WEDDING',
    bundlePrice: 799.99,
    minStock: 5,
    availabilityRule: 'ALWAYS',
    tags: ['wedding', 'guest', 'grey', 'elegant'],
    components: [
      { sku: 'SUIT-LGY-001', type: 'suit', quantity: 1 },
      { sku: 'SHRT-PNK-001', type: 'shirt', quantity: 1 },
      { sku: 'ACC-TIE-003', type: 'tie', quantity: 1 }
    ]
  },
  {
    sku: 'OUTFIT-TWD-AUTUMN',
    name: 'Autumn Tweed Collection',
    description: 'Brown tweed suit with cream shirt and knit tie - sophisticated autumn style',
    category: 'SEASONAL',
    bundlePrice: 999.99,
    minStock: 3,
    availabilityRule: 'CHECK_COMPONENTS',
    tags: ['autumn', 'tweed', 'seasonal', 'sophisticated'],
    components: [
      { sku: 'SUIT-TWD-001', type: 'suit', quantity: 1 },
      { sku: 'SHRT-WHT-001', type: 'shirt', quantity: 1 },
      { sku: 'ACC-TIE-005', type: 'tie', quantity: 1 }
    ]
  },
  {
    sku: 'OUTFIT-CHR-EXECUTIVE',
    name: 'Executive Charcoal Power Suit',
    description: 'Commanding charcoal suit with white shirt and power red tie',
    category: 'BUSINESS',
    bundlePrice: 899.99,
    minStock: 8,
    availabilityRule: 'ALWAYS',
    tags: ['executive', 'power', 'charcoal', 'business'],
    components: [
      { sku: 'SUIT-CHR-001', type: 'suit', quantity: 1 },
      { sku: 'SHRT-WHT-001', type: 'shirt', quantity: 1 },
      { sku: 'ACC-TIE-002', type: 'tie', quantity: 1 }
    ]
  }
];

async function createInitialOutfits() {
  try {
    logger.info('Creating initial outfit templates...');

    for (const outfitDef of initialOutfits) {
      try {
        // Find product IDs by SKU
        const components = await Promise.all(
          outfitDef.components.map(async (comp) => {
            const product = await prisma.product.findUnique({
              where: { sku: comp.sku }
            });
            
            if (!product) {
              logger.warn(`Product not found: ${comp.sku}`);
              return null;
            }
            
            return {
              productId: product.id,
              componentType: comp.type,
              quantity: comp.quantity,
              isRequired: true
            };
          })
        );

        // Filter out null components
        const validComponents = components.filter(c => c !== null);

        if (validComponents.length !== outfitDef.components.length) {
          logger.warn(`Skipping outfit ${outfitDef.sku} - missing components`);
          continue;
        }

        // Check if outfit already exists
        const existing = await prisma.outfitTemplate.findUnique({
          where: { sku: outfitDef.sku }
        });

        if (existing) {
          logger.info(`Outfit ${outfitDef.sku} already exists, skipping`);
          continue;
        }

        // Create outfit
        const outfit = await outfitService.createOutfitTemplate({
          sku: outfitDef.sku,
          name: outfitDef.name,
          description: outfitDef.description,
          category: outfitDef.category,
          components: validComponents as any,
          bundlePrice: outfitDef.bundlePrice,
          minStock: outfitDef.minStock,
          availabilityRule: outfitDef.availabilityRule,
          tags: outfitDef.tags
        });

        logger.info(`Created outfit: ${outfit.name} (${outfit.sku})`);
      } catch (error) {
        logger.error(`Error creating outfit ${outfitDef.sku}:`, error);
      }
    }

    logger.info('Initial outfit creation completed');
  } catch (error) {
    logger.error('Error in outfit creation script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createInitialOutfits();