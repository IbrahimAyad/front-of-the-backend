import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function verifyAllVariants() {
  try {
    console.log('🔍 Comprehensive Product Variant Verification\n');
    console.log('='.repeat(60) + '\n');

    // 1. SUITS VERIFICATION
    console.log('🤵 SUITS VERIFICATION');
    console.log('=' .repeat(20) + '\n');
    
    const suits = await prisma.product.findMany({
      where: { category: 'Suits' },
      include: {
        variants: {
          orderBy: [
            { material: 'asc' },
            { size: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Total Suits: ${suits.length}\n`);
    
    // Check suit sizing
    const expectedSuitSizes = ['36S', '36R', '36L', '38S', '38R', '38L', '40S', '40R', '40L', 
                               '42S', '42R', '42L', '44S', '44R', '44L', '46S', '46R', '46L',
                               '48S', '48R', '48L', '50S', '50R', '50L'];
    
    let suitIssues = [];
    
    suits.forEach(suit => {
      console.log(`\n${suit.name}:`);
      console.log(`  SKU: ${suit.sku}`);
      console.log(`  Price: $${suit.price}`);
      console.log(`  Total Variants: ${suit.variants.length}`);
      
      // Group by piece type
      const twoPiece = suit.variants.filter(v => v.material?.includes('2-Piece'));
      const threePiece = suit.variants.filter(v => v.material?.includes('3-Piece'));
      
      console.log(`  - 2-Piece variants: ${twoPiece.length}`);
      console.log(`  - 3-Piece variants: ${threePiece.length}`);
      
      // Check sizes
      const sizes = [...new Set(suit.variants.map(v => v.size))].sort();
      const missingSizes = expectedSuitSizes.filter(size => !sizes.includes(size));
      
      if (missingSizes.length > 0 && twoPiece.length > 0) {
        suitIssues.push(`${suit.name}: Missing sizes ${missingSizes.join(', ')}`);
      }
      
      // Check pricing
      const pricingIssues = suit.variants.filter(v => {
        if (v.material?.includes('3-Piece')) {
          // 3-piece should be $100 more than base price
          const expectedPrice = parseFloat(suit.price.toString()) + 100;
          return Math.abs(parseFloat(v.price?.toString() || '0') - expectedPrice) > 0.01;
        } else {
          // 2-piece should match base price
          return Math.abs(parseFloat(v.price?.toString() || '0') - parseFloat(suit.price.toString())) > 0.01;
        }
      });
      
      if (pricingIssues.length > 0) {
        console.log(`  ⚠️  Pricing issues: ${pricingIssues.length} variants`);
        pricingIssues.slice(0, 3).forEach(v => {
          console.log(`     - ${v.name}: $${v.price} (expected: $${v.material?.includes('3-Piece') ? parseFloat(suit.price.toString()) + 100 : suit.price})`);
        });
      }
      
      // Check stock
      const lowStock = suit.variants.filter(v => v.stock < 3);
      if (lowStock.length > 0) {
        console.log(`  ⚠️  Low stock: ${lowStock.length} variants`);
      }
    });

    if (suitIssues.length > 0) {
      console.log('\n\n⚠️  SUIT ISSUES FOUND:');
      suitIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ All suits have correct sizing!');
    }

    // 2. SHIRTS VERIFICATION
    console.log('\n\n👔 SHIRTS VERIFICATION');
    console.log('=' .repeat(20) + '\n');
    
    const shirts = await prisma.product.findMany({
      where: { category: 'Shirts' },
      include: {
        variants: {
          orderBy: { size: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Total Shirts: ${shirts.length}\n`);
    
    const expectedShirtSizes = ['15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5'];
    let shirtIssues = [];
    
    shirts.forEach(shirt => {
      console.log(`\n${shirt.name}:`);
      console.log(`  Variants: ${shirt.variants.length}`);
      console.log(`  Price: $${shirt.price}`);
      
      const sizes = [...new Set(shirt.variants.map(v => v.size))].sort();
      const missingSizes = expectedShirtSizes.filter(size => !sizes.includes(size));
      
      if (missingSizes.length > 0) {
        shirtIssues.push(`${shirt.name}: Missing sizes ${missingSizes.join(', ')}`);
        console.log(`  ⚠️  Missing sizes: ${missingSizes.join(', ')}`);
      }
      
      // Check if all variants have same price as product
      const priceMismatch = shirt.variants.filter(v => 
        Math.abs(parseFloat(v.price?.toString() || '0') - parseFloat(shirt.price.toString())) > 0.01
      );
      
      if (priceMismatch.length > 0) {
        console.log(`  ⚠️  Price mismatch: ${priceMismatch.length} variants`);
      }
    });

    // 3. TIES VERIFICATION
    console.log('\n\n🎀 TIES VERIFICATION');
    console.log('=' .repeat(20) + '\n');
    
    const ties = await prisma.product.findMany({
      where: { category: 'Ties' },
      include: {
        variants: {
          orderBy: { color: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Total Tie Products: ${ties.length}\n`);
    
    const expectedTieColors = ['Navy', 'Black', 'Red', 'Green', 'Purple', 'Gold', 'Silver', 'Burgundy'];
    
    ties.forEach(tie => {
      console.log(`\n${tie.name}:`);
      console.log(`  Variants: ${tie.variants.length}`);
      console.log(`  Price: $${tie.price}`);
      
      const colors = [...new Set(tie.variants.map(v => v.color))].filter(c => c).sort();
      const missingColors = expectedTieColors.filter(color => !colors.includes(color));
      
      if (missingColors.length > 0) {
        console.log(`  ⚠️  Missing colors: ${missingColors.join(', ')}`);
      }
      
      console.log(`  Colors: ${colors.join(', ')}`);
    });

    // 4. OVERALL STATISTICS
    console.log('\n\n📊 OVERALL STATISTICS');
    console.log('=' .repeat(20) + '\n');
    
    const totalProducts = await prisma.product.count();
    const totalVariants = await prisma.productVariant.count();
    
    const variantsByCategory = await prisma.productVariant.groupBy({
      by: ['product'],
      _count: true
    });
    
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total Variants: ${totalVariants}`);
    console.log(`Average Variants per Product: ${(totalVariants / totalProducts).toFixed(1)}`);
    
    // Check for products without variants
    const productsWithoutVariants = await prisma.product.findMany({
      where: {
        variants: {
          none: {}
        }
      }
    });
    
    if (productsWithoutVariants.length > 0) {
      console.log(`\n⚠️  Products without variants: ${productsWithoutVariants.length}`);
      productsWithoutVariants.forEach(p => console.log(`  - ${p.name}`));
    }
    
    // Check variant integrity
    console.log('\n\n🔧 VARIANT INTEGRITY CHECKS');
    console.log('=' .repeat(25) + '\n');
    
    // Check for variants with missing critical fields
    const variantsWithIssues = await prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: null },
          { sku: '' },
          { price: null },
          { stock: null }
        ]
      },
      include: {
        product: {
          select: { name: true }
        }
      }
    });
    
    if (variantsWithIssues.length > 0) {
      console.log(`⚠️  Variants with missing data: ${variantsWithIssues.length}`);
      variantsWithIssues.slice(0, 5).forEach(v => {
        console.log(`  - ${v.product.name} - ${v.name}: Missing ${!v.sku ? 'SKU' : !v.price ? 'Price' : 'Stock'}`);
      });
    } else {
      console.log('✅ All variants have required fields!');
    }
    
    // Check for duplicate SKUs
    const skus = await prisma.productVariant.groupBy({
      by: ['sku'],
      _count: true,
      having: {
        sku: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    if (skus.length > 0) {
      console.log(`\n⚠️  Duplicate SKUs found: ${skus.length}`);
      skus.slice(0, 5).forEach(s => {
        console.log(`  - SKU "${s.sku}" appears ${s._count} times`);
      });
    } else {
      console.log('\n✅ No duplicate SKUs found!');
    }
    
    // Stock summary
    const stockSummary = await prisma.productVariant.aggregate({
      _sum: { stock: true },
      _avg: { stock: true },
      _min: { stock: true },
      _max: { stock: true }
    });
    
    console.log('\n\n📦 STOCK SUMMARY');
    console.log('=' .repeat(15));
    console.log(`Total Stock: ${stockSummary._sum.stock || 0}`);
    console.log(`Average Stock per Variant: ${Math.round(stockSummary._avg.stock || 0)}`);
    console.log(`Min Stock: ${stockSummary._min.stock || 0}`);
    console.log(`Max Stock: ${stockSummary._max.stock || 0}`);
    
    // Price range by category
    console.log('\n\n💰 PRICE RANGES BY CATEGORY');
    console.log('=' .repeat(25));
    
    const categories = ['Suits', 'Shirts', 'Ties'];
    for (const category of categories) {
      const priceRange = await prisma.productVariant.aggregate({
        where: {
          product: { category }
        },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true }
      });
      
      console.log(`\n${category}:`);
      console.log(`  Min: $${priceRange._min.price || 0}`);
      console.log(`  Max: $${priceRange._max.price || 0}`);
      console.log(`  Avg: $${(priceRange._avg.price || 0).toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllVariants();