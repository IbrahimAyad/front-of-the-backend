import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

// 6-drop sizing chart (chest size -> waist size)
const SIZING_CHART = {
  '36': { waist: '30', drop: 6 },
  '38': { waist: '32', drop: 6 },
  '40': { waist: '34', drop: 6 },
  '42': { waist: '36', drop: 6 },
  '44': { waist: '38', drop: 6 },
  '46': { waist: '40', drop: 6 },
  '48': { waist: '42', drop: 6 },
  '50': { waist: '44', drop: 6 },
  '52': { waist: '46', drop: 6 },
  '54': { waist: '48', drop: 6 },
  '56': { waist: '50', drop: 6 },
  '58': { waist: '52', drop: 6 },
  '60': { waist: '54', drop: 6 },
};

async function updateSuitsSizing() {
  console.log('🔧 Updating existing suits with 6-drop sizing data...\n');
  
  try {
    // Get all suit variants
    const variants = await prisma.productVariant.findMany({
      where: {
        product: {
          category: 'Suits'
        }
      },
      include: {
        product: true
      }
    });
    
    console.log(`Found ${variants.length} suit variants to update\n`);
    
    let updatedCount = 0;
    
    for (const variant of variants) {
      // Extract chest size from size field (e.g., "42R" -> "42")
      const sizeMatch = variant.size?.match(/^(\d+)[RSLT]?$/);
      
      if (sizeMatch) {
        const chestSize = sizeMatch[1];
        const sizingData = SIZING_CHART[chestSize as keyof typeof SIZING_CHART];
        
        if (sizingData) {
          // Update variant with sizing attributes
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              // Store as JSON in the material field temporarily
              // In production, you'd add a proper attributes JSON field
              material: JSON.stringify({
                pieceCount: variant.material || '2-Piece',
                measurements: {
                  chest: chestSize,
                  waist: sizingData.waist,
                  drop: sizingData.drop,
                  length: variant.size?.slice(-1) || 'R'
                }
              })
            }
          });
          
          updatedCount++;
          console.log(`✓ Updated ${variant.name} with chest ${chestSize}" → waist ${sizingData.waist}"`);
        }
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} variants with 6-drop sizing`);
    
    // Update product descriptions with sizing info
    const products = await prisma.product.findMany({
      where: { category: 'Suits' }
    });
    
    for (const product of products) {
      const updatedSmartAttributes = {
        ...(product.smartAttributes as any || {}),
        sizing: {
          type: 'nested',
          dropPattern: 6,
          description: 'Classic 6-drop sizing (6" difference between jacket chest and pants waist)'
        }
      };
      
      await prisma.product.update({
        where: { id: product.id },
        data: {
          smartAttributes: updatedSmartAttributes,
          styleNotes: product.styleNotes + ' Features classic 6-drop nested sizing for a tailored fit.'
        }
      });
    }
    
    console.log(`✅ Updated ${products.length} products with sizing information`);
    
  } catch (error) {
    console.error('❌ Error updating sizing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuitsSizing();