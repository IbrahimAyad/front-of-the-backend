import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function finalVariantCheck() {
  try {
    console.log('✅ FINAL PRODUCT VARIANT VERIFICATION\n');
    console.log('='.repeat(50) + '\n');

    // 1. SUITS CHECK
    console.log('🤵 SUITS - FINAL CHECK');
    console.log('='.repeat(20) + '\n');
    
    const suits = await prisma.product.findMany({
      where: { category: 'Suits' },
      include: {
        _count: {
          select: { variants: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Group by variant count
    const suitsByVariantCount = new Map<number, string[]>();
    suits.forEach(suit => {
      const count = suit._count.variants;
      if (!suitsByVariantCount.has(count)) {
        suitsByVariantCount.set(count, []);
      }
      suitsByVariantCount.get(count)!.push(suit.name);
    });

    console.log('Suits grouped by variant count:');
    Array.from(suitsByVariantCount.entries())
      .sort((a, b) => b[0] - a[0])
      .forEach(([count, suitNames]) => {
        console.log(`\n${count} variants (${suitNames.length} suits):`);
        suitNames.slice(0, 5).forEach(name => console.log(`  - ${name}`));
        if (suitNames.length > 5) console.log(`  ... and ${suitNames.length - 5} more`);
      });

    // Check pricing
    console.log('\n\n💰 SUIT PRICING CHECK:');
    const pricingCheck = await prisma.$queryRaw<any[]>`
      SELECT 
        p.name,
        p.price as base_price,
        v.material,
        COUNT(*) as variant_count,
        MIN(v.price) as min_price,
        MAX(v.price) as max_price,
        AVG(v.price) as avg_price
      FROM products p
      JOIN product_variants v ON p.id = v.product_id
      WHERE p.category = 'Suits'
      GROUP BY p.id, p.name, p.price, v.material
      ORDER BY p.name, v.material
      LIMIT 10
    `;

    pricingCheck.forEach(item => {
      console.log(`\n${item.name} - ${item.material}:`);
      console.log(`  Base Price: $${item.base_price}`);
      console.log(`  Variant Prices: $${item.min_price} - $${item.max_price} (avg: $${parseFloat(item.avg_price).toFixed(2)})`);
      console.log(`  Variants: ${item.variant_count}`);
    });

    // 2. SHIRTS CHECK
    console.log('\n\n👔 SHIRTS - FINAL CHECK');
    console.log('='.repeat(20) + '\n');
    
    const shirts = await prisma.product.findMany({
      where: { category: 'Shirts' },
      include: {
        _count: {
          select: { variants: true }
        }
      }
    });

    console.log(`Total Shirts: ${shirts.length}`);
    console.log(`All shirts have 8 variants: ${shirts.every(s => s._count.variants === 8) ? '✅ Yes' : '❌ No'}`);
    
    const shirtPrices = [...new Set(shirts.map(s => s.price.toString()))].sort();
    console.log(`\nShirt Prices: ${shirtPrices.map(p => `$${p}`).join(', ')}`);

    // 3. TIES CHECK
    console.log('\n\n🎀 TIES - FINAL CHECK');
    console.log('='.repeat(20) + '\n');
    
    const ties = await prisma.product.findMany({
      where: { category: 'Ties' },
      include: {
        _count: {
          select: { variants: true }
        }
      }
    });

    console.log(`Total Tie Products: ${ties.length}`);
    ties.forEach(tie => {
      console.log(`${tie.name}: ${tie._count.variants} variants - $${tie.price}`);
    });

    // 4. OVERALL SUMMARY
    console.log('\n\n📊 FINAL SUMMARY');
    console.log('='.repeat(15) + '\n');
    
    const summary = await prisma.$queryRaw<any[]>`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(v.id) as variant_count,
        SUM(v.stock) as total_stock,
        MIN(v.price) as min_price,
        MAX(v.price) as max_price
      FROM products p
      JOIN product_variants v ON p.id = v.product_id
      GROUP BY p.category
      ORDER BY p.category
    `;

    summary.forEach(cat => {
      console.log(`${cat.category}:`);
      console.log(`  Products: ${cat.product_count}`);
      console.log(`  Variants: ${cat.variant_count}`);
      console.log(`  Total Stock: ${cat.total_stock}`);
      console.log(`  Price Range: $${cat.min_price} - $${cat.max_price}\n`);
    });

    // Check for any remaining issues
    console.log('\n🔍 ISSUE CHECK:');
    
    // Check for variants without price
    const noPriceVariants = await prisma.productVariant.count({
      where: { price: null }
    });
    console.log(`Variants without price: ${noPriceVariants === 0 ? '✅ None' : `❌ ${noPriceVariants}`}`);
    
    // Check for variants without SKU
    const noSkuVariants = await prisma.productVariant.count({
      where: { OR: [{ sku: null }, { sku: '' }] }
    });
    console.log(`Variants without SKU: ${noSkuVariants === 0 ? '✅ None' : `❌ ${noSkuVariants}`}`);
    
    // Check for inactive variants
    const inactiveVariants = await prisma.productVariant.count({
      where: { isActive: false }
    });
    console.log(`Inactive variants: ${inactiveVariants === 0 ? '✅ None' : `⚠️  ${inactiveVariants}`}`);
    
    // Check for out of stock variants
    const outOfStock = await prisma.productVariant.count({
      where: { stock: 0 }
    });
    console.log(`Out of stock variants: ${outOfStock === 0 ? '✅ None' : `⚠️  ${outOfStock}`}`);

    console.log('\n\n✅ VERIFICATION COMPLETE!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVariantCheck();