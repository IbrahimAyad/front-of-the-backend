import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function updateSuitVariants() {
  try {
    console.log('🔧 Updating suit variants to reflect 2-piece vs 3-piece...\n');

    // First, delete all existing suit variants
    const deletedCount = await prisma.productVariant.deleteMany({
      where: {
        product: {
          category: {
            contains: 'Suits',
            mode: 'insensitive'
          }
        }
      }
    });
    
    console.log(`🗑️  Deleted ${deletedCount.count} existing suit variants\n`);

    // Get all suits
    const suits = await prisma.product.findMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      }
    });

    console.log(`📦 Found ${suits.length} suits to create proper variants for\n`);

    // Standard sizes for suits
    const SUIT_SIZES = ['38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R'];
    
    // For each suit, create 2-piece and 3-piece variants
    for (const suit of suits) {
      console.log(`\n🎯 Processing: ${suit.name}`);
      
      const variants = [];
      
      // Determine color from product name or attributes
      const color = suit.colorFamily || 
                   (suit.name.includes('Navy') ? 'Navy' :
                    suit.name.includes('Charcoal') ? 'Charcoal' :
                    suit.name.includes('Black') ? 'Black' :
                    suit.name.includes('Gray') ? 'Gray' :
                    suit.name.includes('Brown') ? 'Brown' :
                    suit.name.includes('Light Gray') ? 'Light Gray' :
                    'Black'); // default
      
      // Create 2-piece variants (jacket + pants)
      for (const size of SUIT_SIZES) {
        variants.push({
          productId: suit.id,
          name: `${suit.name} - 2 Piece - ${size}`,
          sku: `${suit.sku}-2PC-${size.replace(' ', '')}`,
          size: size,
          color: color,
          material: '2-Piece (Jacket & Pants)',
          stock: 8 + Math.floor(Math.random() * 4), // Random stock 8-11
          price: suit.price,
          isActive: true,
          position: SUIT_SIZES.indexOf(size)
        });
      }
      
      // Create 3-piece variants (jacket + pants + vest) - $100 more
      for (const size of SUIT_SIZES) {
        const threePiecePrice = parseFloat(suit.price.toString()) + 100;
        
        variants.push({
          productId: suit.id,
          name: `${suit.name} - 3 Piece (with Vest) - ${size}`,
          sku: `${suit.sku}-3PC-${size.replace(' ', '')}`,
          size: size,
          color: color,
          material: '3-Piece (Jacket, Pants & Vest)',
          stock: 5 + Math.floor(Math.random() * 3), // Random stock 5-7 (less stock for 3-piece)
          price: threePiecePrice,
          isActive: true,
          position: SUIT_SIZES.indexOf(size) + 10 // Position after 2-piece variants
        });
      }

      // Create all variants for this suit
      const created = await prisma.productVariant.createMany({
        data: variants
      });

      console.log(`✅ Created ${created.count} variants (${SUIT_SIZES.length} sizes × 2 styles)`);
    }

    // Also update the suit names to be clearer
    console.log('\n\n📝 Updating suit descriptions...');
    
    await prisma.product.updateMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      },
      data: {
        description: 'Premium suit available in 2-piece (jacket & pants) or 3-piece (with matching vest) configurations. Tailored for the modern gentleman with attention to detail and superior craftsmanship.'
      }
    });

    // Final count
    const totalVariants = await prisma.productVariant.count({
      where: {
        product: {
          category: {
            contains: 'Suits',
            mode: 'insensitive'
          }
        }
      }
    });
    
    console.log(`\n\n🎉 Total suit variants created: ${totalVariants}`);
    console.log(`   - ${totalVariants/2} two-piece variants`);
    console.log(`   - ${totalVariants/2} three-piece variants`);

    // Show price difference example
    const sampleVariants = await prisma.productVariant.findMany({
      where: {
        product: {
          category: {
            contains: 'Suits',
            mode: 'insensitive'
          }
        },
        size: '42R'
      },
      take: 4,
      orderBy: {
        price: 'asc'
      }
    });

    console.log('\n💰 Sample Pricing (42R):');
    sampleVariants.forEach(v => {
      console.log(`   ${v.material}: $${v.price}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuitVariants();