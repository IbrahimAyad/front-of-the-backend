import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function verifySuitMigration() {
  try {
    console.log('🔍 Verifying suit migration...\n');

    // Get all suits
    const suits = await prisma.product.findMany({
      where: {
        category: 'Suits'
      },
      include: {
        _count: {
          select: {
            variants: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Total Suits: ${suits.length}\n`);

    // Group by color
    const suitsByColor = new Map<string, any[]>();
    suits.forEach(suit => {
      const color = suit.colorFamily || 'Unknown';
      if (!suitsByColor.has(color)) {
        suitsByColor.set(color, []);
      }
      suitsByColor.get(color)!.push(suit);
    });

    console.log('🎨 Suits by Color Family:');
    console.log('========================');
    suitsByColor.forEach((suits, color) => {
      console.log(`\n${color} (${suits.length} suits):`);
      suits.forEach(suit => {
        console.log(`  - ${suit.name} - ${suit._count.variants} variants`);
      });
    });

    // Check for special/colorful suits
    const specialColors = ['Brick Rust', 'Hunter Green', 'Indigo', 'Off White', 'Red', 'Royal Blue', 'Tan', 'White'];
    console.log('\n\n🌈 Special Color Suits:');
    console.log('======================');
    
    for (const color of specialColors) {
      const colorSuits = suits.filter(s => s.name.includes(color));
      if (colorSuits.length > 0) {
        console.log(`\n${color}:`);
        colorSuits.forEach(suit => {
          console.log(`  ✅ ${suit.name} - $${suit.price}`);
        });
      } else {
        console.log(`\n${color}: ❌ Not found`);
      }
    }

    // Check fit types
    const slimCutSuits = suits.filter(s => s.name.includes('Slim Cut'));
    const regularFitSuits = suits.filter(s => s.name.includes('Regular Fit'));
    
    console.log('\n\n👔 Suit Fit Types:');
    console.log('==================');
    console.log(`Slim Cut: ${slimCutSuits.length} suits`);
    console.log(`Regular Fit: ${regularFitSuits.length} suits`);

    // Check tuxedos
    const tuxedos = suits.filter(s => s.name.toLowerCase().includes('tuxedo'));
    console.log(`\nTuxedos: ${tuxedos.length} suits`);
    tuxedos.forEach(tux => {
      console.log(`  - ${tux.name}`);
    });

    // Check variant distribution
    const variantCounts = await prisma.productVariant.groupBy({
      by: ['material'],
      where: {
        product: {
          category: 'Suits'
        }
      },
      _count: true
    });

    console.log('\n\n📦 Variant Distribution:');
    console.log('=======================');
    variantCounts.forEach(vc => {
      console.log(`${vc.material || 'No material'}: ${vc._count} variants`);
    });

    // Sample a few products with variants
    console.log('\n\n🔍 Sample Suit Details:');
    console.log('======================');
    
    const samples = await prisma.product.findMany({
      where: {
        category: 'Suits',
        name: {
          in: ['Hunter Green Suit with Vest - Slim Cut', 'Royal Blue Slim Tuxedo - Slim Cut', 'Navy Business Suit - Regular Fit']
        }
      },
      include: {
        variants: {
          take: 3,
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    samples.forEach(suit => {
      console.log(`\n${suit.name}:`);
      console.log(`  Price: $${suit.price}`);
      console.log(`  SKU: ${suit.sku}`);
      console.log(`  Subcategory: ${suit.subcategory}`);
      console.log(`  Color: ${suit.colorFamily}`);
      console.log(`  Sample Variants:`);
      suit.variants.forEach(v => {
        console.log(`    - ${v.size} ${v.material} - $${v.price} - Stock: ${v.stock}`);
      });
    });

    // Total summary
    const totalVariants = await prisma.productVariant.count({
      where: {
        product: {
          category: 'Suits'
        }
      }
    });

    console.log('\n\n✅ MIGRATION VERIFICATION COMPLETE');
    console.log('==================================');
    console.log(`Total Suits: ${suits.length}`);
    console.log(`Total Suit Variants: ${totalVariants}`);
    console.log(`Slim Cut Suits: ${slimCutSuits.length}`);
    console.log(`Regular Fit Suits: ${regularFitSuits.length}`);
    console.log(`Tuxedos: ${tuxedos.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuitMigration();