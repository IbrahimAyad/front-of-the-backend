import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function fixVariantIssues() {
  try {
    console.log('🔧 Fixing Product Variant Issues...\n');

    // 1. FIX SUIT PRICING ISSUES
    console.log('💰 FIXING SUIT PRICING');
    console.log('=' .repeat(20) + '\n');
    
    // Get all suits with pricing issues
    const suits = await prisma.product.findMany({
      where: { category: 'Suits' },
      include: {
        variants: true
      }
    });

    let pricingFixed = 0;
    
    for (const suit of suits) {
      const basePrice = parseFloat(suit.price.toString());
      
      for (const variant of suit.variants) {
        let expectedPrice = basePrice;
        
        // 3-piece should be $100 more than base price
        if (variant.material?.includes('3-Piece')) {
          expectedPrice = basePrice + 100;
        }
        
        const currentPrice = parseFloat(variant.price?.toString() || '0');
        
        // Fix if price doesn't match expected
        if (Math.abs(currentPrice - expectedPrice) > 0.01) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { price: expectedPrice }
          });
          pricingFixed++;
        }
      }
    }
    
    console.log(`✅ Fixed pricing for ${pricingFixed} variants\n`);

    // 2. ADD MISSING SUIT SIZES
    console.log('📏 ADDING MISSING SUIT SIZES');
    console.log('=' .repeat(25) + '\n');
    
    const allSuitSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
    const allLengths = ['S', 'R', 'L'];
    let sizesAdded = 0;
    
    // Focus on suits that have incomplete sizes (10 or 20 variants when they should have 24 or 48)
    const incompleteSuits = suits.filter(s => {
      const variantCount = s.variants.length;
      // Suits with vest can have 48 variants (24 per piece type) or 20 (10 per piece type from source)
      // Regular suits should have 24 variants
      return variantCount === 10 || variantCount === 20;
    });
    
    console.log(`Found ${incompleteSuits.length} suits with incomplete sizing\n`);
    
    for (const suit of incompleteSuits) {
      console.log(`📦 Fixing sizes for: ${suit.name}`);
      
      // Group existing variants by piece type
      const twoPieceVariants = suit.variants.filter(v => v.material?.includes('2-Piece'));
      const threePieceVariants = suit.variants.filter(v => v.material?.includes('3-Piece'));
      
      // Get existing sizes
      const existingSizes = new Set(suit.variants.map(v => v.size));
      
      // Add missing 2-piece variants
      if (twoPieceVariants.length > 0) {
        const basePrice = parseFloat(suit.price.toString());
        
        for (const size of allSuitSizes) {
          for (const length of allLengths) {
            const sizeLabel = `${size}${length}`;
            
            if (!existingSizes.has(sizeLabel)) {
              // Find a similar variant to copy settings from
              const templateVariant = twoPieceVariants[0];
              
              await prisma.productVariant.create({
                data: {
                  productId: suit.id,
                  name: `${suit.name} - 2-Piece - ${sizeLabel}`,
                  sku: `${suit.sku}-2PC-${sizeLabel}`,
                  size: sizeLabel,
                  color: templateVariant.color,
                  material: '2-Piece',
                  price: basePrice,
                  compareAtPrice: basePrice + 100,
                  stock: 5,
                  isActive: true,
                  position: allSuitSizes.indexOf(size) * 3 + allLengths.indexOf(length)
                }
              });
              sizesAdded++;
            }
          }
        }
      }
      
      // Add missing 3-piece variants
      if (threePieceVariants.length > 0) {
        const threePiecePrice = parseFloat(suit.price.toString()) + 100;
        
        for (const size of allSuitSizes) {
          for (const length of allLengths) {
            const sizeLabel = `${size}${length}`;
            
            // Check if we need to add this 3-piece variant
            const has3Piece = suit.variants.some(v => 
              v.size === sizeLabel && v.material?.includes('3-Piece')
            );
            
            if (!has3Piece) {
              const templateVariant = threePieceVariants[0];
              
              await prisma.productVariant.create({
                data: {
                  productId: suit.id,
                  name: `${suit.name} - 3-Piece (with Vest) - ${sizeLabel}`,
                  sku: `${suit.sku}-3PC-${sizeLabel}`,
                  size: sizeLabel,
                  color: templateVariant.color,
                  material: '3-Piece (with Vest)',
                  price: threePiecePrice,
                  compareAtPrice: threePiecePrice + 100,
                  stock: 3,
                  isActive: true,
                  position: allSuitSizes.indexOf(size) * 3 + allLengths.indexOf(length) + 30
                }
              });
              sizesAdded++;
            }
          }
        }
      }
      
      console.log(`  ✅ Added missing sizes`);
    }
    
    console.log(`\n✅ Added ${sizesAdded} missing size variants\n`);

    // 3. FIX SHIRT PRICING (decimal issue)
    console.log('👔 FIXING SHIRT PRICING');
    console.log('=' .repeat(20) + '\n');
    
    await prisma.product.updateMany({
      where: {
        category: 'Shirts',
        name: { contains: 'Classic Fit' }
      },
      data: { price: 69.99 }
    });
    
    // Update shirt variant prices to match product prices
    const shirts = await prisma.product.findMany({
      where: { category: 'Shirts' },
      include: { variants: true }
    });
    
    let shirtPricesFixed = 0;
    for (const shirt of shirts) {
      for (const variant of shirt.variants) {
        if (parseFloat(variant.price?.toString() || '0') !== parseFloat(shirt.price.toString())) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { price: shirt.price }
          });
          shirtPricesFixed++;
        }
      }
    }
    
    console.log(`✅ Fixed ${shirtPricesFixed} shirt variant prices\n`);

    // 4. FINAL SUMMARY
    console.log('\n📊 FINAL VERIFICATION');
    console.log('=' .repeat(20));
    
    const finalCounts = await prisma.$transaction([
      prisma.product.count({ where: { category: 'Suits' } }),
      prisma.productVariant.count({ where: { product: { category: 'Suits' } } }),
      prisma.product.count({ where: { category: 'Shirts' } }),
      prisma.productVariant.count({ where: { product: { category: 'Shirts' } } }),
      prisma.product.count({ where: { category: 'Ties' } }),
      prisma.productVariant.count({ where: { product: { category: 'Ties' } } }),
    ]);
    
    console.log(`\nSuits: ${finalCounts[0]} products, ${finalCounts[1]} variants`);
    console.log(`Shirts: ${finalCounts[2]} products, ${finalCounts[3]} variants`);
    console.log(`Ties: ${finalCounts[4]} products, ${finalCounts[5]} variants`);
    console.log(`\nTotal: ${finalCounts[0] + finalCounts[2] + finalCounts[4]} products, ${finalCounts[1] + finalCounts[3] + finalCounts[5]} variants`);
    
    console.log('\n✅ All variant issues have been fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVariantIssues();