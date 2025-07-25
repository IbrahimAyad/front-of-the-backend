import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

// Correct sizing specifications
const SHIRT_SIZES = {
  slimFit: ['15', '15.5', '16', '16.5', '17', '17.5'], // Stops at 17.5
  classicFit: ['15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '20', '20.5', '21', '21.5', '22'] // Goes up to 22
};

const SUIT_SIZES = {
  // Regular: 34R-54R (all even sizes)
  regular: {
    sizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'],
    length: 'R'
  },
  // Short: 34S-50S (all even sizes)
  short: {
    sizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50'],
    length: 'S'
  },
  // Long: 38L-54L (all even sizes starting from 38)
  long: {
    sizes: ['38', '40', '42', '44', '46', '48', '50', '52', '54'],
    length: 'L'
  }
};

async function fixCorrectSizing() {
  try {
    console.log('🔧 Fixing Product Sizing to Correct Specifications\n');
    console.log('='.repeat(50) + '\n');

    // 1. FIX SHIRT SIZING
    console.log('👔 FIXING SHIRT SIZING');
    console.log('='.repeat(20) + '\n');
    console.log('Slim Fit: 15-17.5');
    console.log('Classic Fit: 15-22\n');

    // Delete all existing shirt variants first
    await prisma.productVariant.deleteMany({
      where: {
        product: {
          category: 'Shirts'
        }
      }
    });
    console.log('✅ Cleared existing shirt variants\n');

    // Get all shirts
    const shirts = await prisma.product.findMany({
      where: { category: 'Shirts' }
    });

    let shirtVariantsCreated = 0;

    for (const shirt of shirts) {
      console.log(`\n📦 Processing: ${shirt.name}`);
      
      // Determine which sizes to use based on fit
      const isSlimFit = shirt.name.includes('Slim Fit');
      const sizes = isSlimFit ? SHIRT_SIZES.slimFit : SHIRT_SIZES.classicFit;
      
      console.log(`   Fit: ${isSlimFit ? 'Slim' : 'Classic'}`);
      console.log(`   Creating ${sizes.length} size variants`);

      // Extract color from product name
      const color = shirt.name.split(' ')[0]; // First word is usually the color

      // Create variants for each size
      for (const size of sizes) {
        await prisma.productVariant.create({
          data: {
            productId: shirt.id,
            name: `${shirt.name} - Size ${size}`,
            sku: `${shirt.sku}-${size.replace('.', '')}`,
            size: size,
            color: color,
            price: shirt.price,
            compareAtPrice: shirt.compareAtPrice,
            stock: 20,
            isActive: true,
            position: sizes.indexOf(size)
          }
        });
        shirtVariantsCreated++;
      }
    }

    console.log(`\n✅ Created ${shirtVariantsCreated} shirt variants with correct sizing\n`);

    // 2. FIX SUIT SIZING
    console.log('\n🤵 FIXING SUIT SIZING');
    console.log('='.repeat(20) + '\n');
    console.log('Regular: 34R-54R');
    console.log('Short: 34S-50S');
    console.log('Long: 38L-54L\n');

    // Delete all existing suit variants
    await prisma.productVariant.deleteMany({
      where: {
        product: {
          category: 'Suits'
        }
      }
    });
    console.log('✅ Cleared existing suit variants\n');

    // Get all suits
    const suits = await prisma.product.findMany({
      where: { category: 'Suits' }
    });

    let suitVariantsCreated = 0;

    for (const suit of suits) {
      console.log(`\n🎯 Processing: ${suit.name}`);
      
      // Determine if suit has vest option
      const hasVest = suit.name.includes('with Vest') || suit.name.includes('With Vest');
      const pieceOptions = hasVest ? ['2-Piece', '3-Piece (with Vest)'] : ['2-Piece'];
      
      console.log(`   Piece options: ${pieceOptions.join(', ')}`);

      // Extract color from suit
      const color = suit.colorFamily || 'Black';

      // Create variants for each piece option
      for (const pieces of pieceOptions) {
        const basePrice = parseFloat(suit.price.toString());
        const variantPrice = pieces.includes('3-Piece') ? basePrice + 100 : basePrice;
        
        // Create Regular sizes (34R-54R)
        for (const size of SUIT_SIZES.regular.sizes) {
          const sizeLabel = `${size}${SUIT_SIZES.regular.length}`;
          await prisma.productVariant.create({
            data: {
              productId: suit.id,
              name: `${suit.name} - ${pieces} - ${sizeLabel}`,
              sku: `${suit.sku}-${pieces.replace(/[^A-Z0-9]/g, '')}-${sizeLabel}`,
              size: sizeLabel,
              color: color,
              material: pieces,
              price: variantPrice,
              compareAtPrice: variantPrice + 100,
              stock: 5,
              isActive: true,
              position: SUIT_SIZES.regular.sizes.indexOf(size)
            }
          });
          suitVariantsCreated++;
        }
        
        // Create Short sizes (34S-50S)
        for (const size of SUIT_SIZES.short.sizes) {
          const sizeLabel = `${size}${SUIT_SIZES.short.length}`;
          await prisma.productVariant.create({
            data: {
              productId: suit.id,
              name: `${suit.name} - ${pieces} - ${sizeLabel}`,
              sku: `${suit.sku}-${pieces.replace(/[^A-Z0-9]/g, '')}-${sizeLabel}`,
              size: sizeLabel,
              color: color,
              material: pieces,
              price: variantPrice,
              compareAtPrice: variantPrice + 100,
              stock: 5,
              isActive: true,
              position: 20 + SUIT_SIZES.short.sizes.indexOf(size)
            }
          });
          suitVariantsCreated++;
        }
        
        // Create Long sizes (38L-54L)
        for (const size of SUIT_SIZES.long.sizes) {
          const sizeLabel = `${size}${SUIT_SIZES.long.length}`;
          await prisma.productVariant.create({
            data: {
              productId: suit.id,
              name: `${suit.name} - ${pieces} - ${sizeLabel}`,
              sku: `${suit.sku}-${pieces.replace(/[^A-Z0-9]/g, '')}-${sizeLabel}`,
              size: sizeLabel,
              color: color,
              material: pieces,
              price: variantPrice,
              compareAtPrice: variantPrice + 100,
              stock: 5,
              isActive: true,
              position: 40 + SUIT_SIZES.long.sizes.indexOf(size)
            }
          });
          suitVariantsCreated++;
        }
      }
      
      // Calculate expected variants
      const expectedVariants = pieceOptions.length * (
        SUIT_SIZES.regular.sizes.length + 
        SUIT_SIZES.short.sizes.length + 
        SUIT_SIZES.long.sizes.length
      );
      console.log(`   ✅ Created ${expectedVariants} variants`);
    }

    console.log(`\n✅ Created ${suitVariantsCreated} suit variants with correct sizing\n`);

    // 3. UPDATE PRODUCT STOCK TOTALS
    console.log('\n📦 UPDATING PRODUCT STOCK TOTALS');
    console.log('='.repeat(30) + '\n');

    const allProducts = await prisma.product.findMany({
      where: {
        OR: [
          { category: 'Suits' },
          { category: 'Shirts' }
        ]
      },
      include: {
        variants: {
          select: { stock: true }
        }
      }
    });

    for (const product of allProducts) {
      const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      await prisma.product.update({
        where: { id: product.id },
        data: {
          totalStock: totalStock,
          availableStock: totalStock
        }
      });
    }

    console.log('✅ Updated stock totals for all products\n');

    // 4. FINAL SUMMARY
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(15) + '\n');

    const finalCounts = await prisma.$transaction([
      prisma.product.count({ where: { category: 'Suits' } }),
      prisma.productVariant.count({ where: { product: { category: 'Suits' } } }),
      prisma.product.count({ where: { category: 'Shirts' } }),
      prisma.productVariant.count({ where: { product: { category: 'Shirts' } } }),
    ]);

    console.log(`Suits: ${finalCounts[0]} products, ${finalCounts[1]} variants`);
    console.log(`  - Each suit without vest: ${SUIT_SIZES.regular.sizes.length + SUIT_SIZES.short.sizes.length + SUIT_SIZES.long.sizes.length} variants (29 sizes)`);
    console.log(`  - Each suit with vest: ${(SUIT_SIZES.regular.sizes.length + SUIT_SIZES.short.sizes.length + SUIT_SIZES.long.sizes.length) * 2} variants (58 sizes)`);
    
    console.log(`\nShirts: ${finalCounts[2]} products, ${finalCounts[3]} variants`);
    console.log(`  - Slim Fit shirts: ${SHIRT_SIZES.slimFit.length} sizes (15-17.5)`);
    console.log(`  - Classic Fit shirts: ${SHIRT_SIZES.classicFit.length} sizes (15-22)`);

    // Show size distributions
    console.log('\n\n📏 SIZE DISTRIBUTIONS:');
    console.log('='.repeat(20));
    
    const suitSizeCount = await prisma.productVariant.groupBy({
      by: ['size'],
      where: {
        product: { category: 'Suits' }
      },
      _count: true,
      orderBy: {
        size: 'asc'
      }
    });

    console.log('\nSuit Sizes:');
    suitSizeCount.forEach(({ size, _count }) => {
      console.log(`  ${size}: ${_count} variants`);
    });

    const shirtSizeCount = await prisma.productVariant.groupBy({
      by: ['size'],
      where: {
        product: { category: 'Shirts' }
      },
      _count: true,
      orderBy: {
        size: 'asc'
      }
    });

    console.log('\nShirt Sizes:');
    shirtSizeCount.forEach(({ size, _count }) => {
      console.log(`  ${size}: ${_count} variants`);
    });

    console.log('\n\n✅ All sizing has been corrected!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorrectSizing();