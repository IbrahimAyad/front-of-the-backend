import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway"
    }
  }
});

async function analyzeSuitsDB() {
  console.log('=== SUITS DATABASE ANALYSIS ===\n');
  
  try {
    // Count records in each table
    const [suitsCount, variantsCount, colorsCount, colorFamiliesCount, eventsCount, bundlesCount] = await Promise.all([
      prisma.suits.count(),
      prisma.suit_variants.count(),
      prisma.colors.count(),
      prisma.color_families.count(),
      prisma.event_categories.count(),
      prisma.bundle_configs.count(),
    ]);
    
    console.log('📊 TABLE COUNTS:');
    console.log(`  - Suits: ${suitsCount}`);
    console.log(`  - Suit Variants: ${variantsCount}`);
    console.log(`  - Colors: ${colorsCount}`);
    console.log(`  - Color Families: ${colorFamiliesCount}`);
    console.log(`  - Event Categories: ${eventsCount}`);
    console.log(`  - Bundle Configs: ${bundlesCount}`);
    
    // Sample suits
    console.log('\n🔍 SAMPLE SUITS:');
    const sampleSuits = await prisma.suits.findMany({ take: 5 });
    sampleSuits.forEach(suit => {
      console.log(`  - ${suit.name} (${suit.category}): $${suit.base_price_2pc} (2pc), $${suit.base_price_3pc} (3pc)`);
      console.log(`    Fit: ${suit.fit_type}, Fabric: ${suit.fabric_type}, Tuxedo: ${suit.is_tuxedo}`);
    });
    
    // Sample colors
    console.log('\n🎨 SAMPLE COLORS:');
    const sampleColors = await prisma.colors.findMany({ 
      take: 5,
      include: { color_families: true }
    });
    sampleColors.forEach(color => {
      console.log(`  - ${color.name}: ${color.hex_primary} (Family: ${color.color_families?.name || 'None'})`);
    });
    
    // Sample events
    console.log('\n🎉 EVENT CATEGORIES:');
    const events = await prisma.event_categories.findMany();
    events.forEach(event => {
      console.log(`  - ${event.name}: Formality ${event.formality_range?.join('-') || 'N/A'}`);
    });
    
    // Bundle configs
    console.log('\n📦 BUNDLE CONFIGURATIONS:');
    const bundles = await prisma.bundle_configs.findMany();
    bundles.forEach(bundle => {
      console.log(`  - ${bundle.name}: Min ${bundle.min_quantity} items, ${bundle.discount_percentage}% off`);
    });
    
    // Check some variants
    console.log('\n👔 SAMPLE VARIANTS:');
    const variants = await prisma.suit_variants.findMany({ 
      take: 5,
      include: { suits: true }
    });
    variants.forEach(variant => {
      console.log(`  - ${variant.suits.name} - ${variant.chest_size}${variant.length_type}: $${variant.price} (SKU: ${variant.sku})`);
    });
    
  } catch (error) {
    console.error('Error analyzing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSuitsDB();