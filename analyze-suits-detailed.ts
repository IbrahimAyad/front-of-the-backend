import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway"
    }
  }
});

async function analyzeDetailedStructure() {
  console.log('=== DETAILED SUITS DATABASE STRUCTURE ===\n');
  
  try {
    // Analyze suit structure
    console.log('📋 SUIT FIELDS AND VALUES:');
    const firstSuit = await prisma.suits.findFirst({
      include: {
        suit_variants: true
      }
    });
    
    if (firstSuit) {
      console.log('\nSample Suit Structure:');
      console.log(JSON.stringify(firstSuit, null, 2));
    }
    
    // Analyze color structure
    console.log('\n\n🎨 COLOR STRUCTURE:');
    const firstColor = await prisma.colors.findFirst({
      include: {
        color_families: true
      }
    });
    
    if (firstColor) {
      console.log(JSON.stringify(firstColor, null, 2));
    }
    
    // Get unique values
    console.log('\n\n📊 UNIQUE VALUES IN DATABASE:');
    
    // Categories
    const categories = await prisma.suits.findMany({
      select: { category: true },
      distinct: ['category']
    });
    console.log('\nSuit Categories:', categories.map(c => c.category));
    
    // Fit types
    const fitTypes = await prisma.suits.findMany({
      select: { fit_type: true },
      distinct: ['fit_type']
    });
    console.log('Fit Types:', fitTypes.map(f => f.fit_type));
    
    // Fabric types
    const fabricTypes = await prisma.suits.findMany({
      select: { fabric_type: true },
      distinct: ['fabric_type']
    });
    console.log('Fabric Types:', fabricTypes.map(f => f.fabric_type));
    
    // Chest sizes
    const chestSizes = await prisma.suit_variants.findMany({
      select: { chest_size: true },
      distinct: ['chest_size'],
      orderBy: { chest_size: 'asc' }
    });
    console.log('Chest Sizes:', chestSizes.map(c => c.chest_size).filter(Boolean));
    
    // Length types
    const lengthTypes = await prisma.suit_variants.findMany({
      select: { length_type: true },
      distinct: ['length_type']
    });
    console.log('Length Types:', lengthTypes.map(l => l.length_type).filter(Boolean));
    
    // Check price ranges
    const priceStats = await prisma.suits.aggregate({
      _min: { base_price_2pc: true, base_price_3pc: true },
      _max: { base_price_2pc: true, base_price_3pc: true },
      _avg: { base_price_2pc: true, base_price_3pc: true }
    });
    console.log('\nPrice Statistics:', priceStats);
    
    // Check bundle details
    console.log('\n\n📦 BUNDLE DETAILS:');
    const bundles = await prisma.bundle_configs.findMany();
    bundles.forEach(bundle => {
      console.log(`\n${bundle.name}:`);
      console.log(`  - Min Quantity: ${bundle.min_quantity}`);
      console.log(`  - Discount: ${bundle.discount_percentage}%`);
      console.log(`  - Free Items: ${bundle.free_items || 0}`);
      console.log(`  - Description: ${bundle.description || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDetailedStructure();