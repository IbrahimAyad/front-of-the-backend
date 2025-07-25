import { PrismaClient } from '@prisma/client';

const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway'
    }
  }
});

async function analyzeSourceSuits() {
  try {
    console.log('🔍 Analyzing suits in source database...\n');

    // Get all suits
    const suits: any[] = await sourcePrisma.$queryRaw`
      SELECT * FROM suits 
      WHERE is_active = true
      ORDER BY name, fit_type;
    `;

    console.log(`📊 Found ${suits.length} active suits in source database\n`);

    // Group by base name and fit type
    const suitsByName = new Map<string, any[]>();
    
    suits.forEach(suit => {
      const baseName = suit.name;
      if (!suitsByName.has(baseName)) {
        suitsByName.set(baseName, []);
      }
      suitsByName.get(baseName)!.push(suit);
    });

    console.log('📋 Suits in Source Database:');
    console.log('===========================\n');

    let suitIndex = 1;
    suitsByName.forEach((suitGroup, baseName) => {
      console.log(`${baseName}:`);
      suitGroup.forEach(suit => {
        console.log(`  ${suitIndex}. ${suit.name} - ${suit.fit_type}`);
        console.log(`     - Category: ${suit.category}`);
        console.log(`     - Color: ${suit.base_color}`);
        console.log(`     - Price: $${suit.base_price_2pc} (2pc) / $${suit.base_price_3pc} (3pc)`);
        console.log(`     - Tuxedo: ${suit.is_tuxedo ? 'Yes' : 'No'}`);
        console.log(`     - Prom: ${suit.prom_trending ? 'Yes' : 'No'}`);
        suitIndex++;
      });
      console.log('');
    });

    // Get variant counts
    const variantCounts: any[] = await sourcePrisma.$queryRaw`
      SELECT s.name, s.fit_type, COUNT(sv.id) as variant_count
      FROM suits s
      LEFT JOIN suit_variants sv ON s.id = sv.suit_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.fit_type
      ORDER BY s.name, s.fit_type;
    `;

    console.log('\n📦 Variant Counts:');
    console.log('==================');
    variantCounts.forEach(item => {
      console.log(`${item.name} - ${item.fit_type}: ${item.variant_count} variants`);
    });

    // Get unique colors
    const uniqueColors: any[] = await sourcePrisma.$queryRaw`
      SELECT DISTINCT base_color
      FROM suits
      WHERE is_active = true
      ORDER BY base_color;
    `;

    console.log('\n🎨 Unique Colors:');
    console.log(uniqueColors.map(c => c.base_color).join(', '));

    // Get categories
    const categories: any[] = await sourcePrisma.$queryRaw`
      SELECT DISTINCT category, COUNT(*) as count
      FROM suits
      WHERE is_active = true
      GROUP BY category
      ORDER BY category;
    `;

    console.log('\n📂 Categories:');
    categories.forEach(cat => {
      console.log(`${cat.category}: ${cat.count} suits`);
    });

    // Sample some variants
    console.log('\n\n🔍 Sample Suit Variants:');
    const sampleVariants: any[] = await sourcePrisma.$queryRaw`
      SELECT sv.*, s.name as suit_name, s.fit_type
      FROM suit_variants sv
      JOIN suits s ON sv.suit_id = s.id
      WHERE s.is_active = true
      LIMIT 10;
    `;

    sampleVariants.forEach(variant => {
      console.log(`\n${variant.suit_name} - ${variant.fit_type}:`);
      console.log(`  - Size: ${variant.chest_size}${variant.length_type}`);
      console.log(`  - Pieces: ${variant.piece_count}`);
      console.log(`  - SKU: ${variant.sku}`);
      console.log(`  - Price: $${variant.price}`);
      console.log(`  - Stock: ${variant.inventory_quantity}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sourcePrisma.$disconnect();
  }
}

analyzeSourceSuits();