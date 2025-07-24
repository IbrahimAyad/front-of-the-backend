import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

async function checkMigration() {
  console.log('🔍 Checking Migration Results...\n');
  
  const products = await prisma.product.count({ where: { category: 'Suits' } });
  const variants = await prisma.productVariant.count();
  const colors = await prisma.colorPalette.count();
  const events = await prisma.eventProfile.count();
  
  console.log('📊 Database Summary:');
  console.log(`  - Suit Products: ${products}`);
  console.log(`  - Product Variants: ${variants}`);
  console.log(`  - Color Palette: ${colors}`);
  console.log(`  - Event Profiles: ${events}`);
  
  console.log('\n👔 Sample Suit Products:');
  const sampleProducts = await prisma.product.findMany({
    where: { category: 'Suits' },
    take: 3,
    include: { 
      variants: { 
        take: 2,
        orderBy: { sku: 'asc' }
      } 
    }
  });
  
  for (const product of sampleProducts) {
    console.log(`\n${product.name}:`);
    console.log(`  - SKU: ${product.sku}`);
    console.log(`  - Price: $${product.price}`);
    console.log(`  - Fabric: ${product.fabricMarketing}`);
    console.log(`  - Occasions: ${product.occasionTags.join(', ')}`);
    console.log(`  - Variants: ${product.variants.length}`);
    if (product.variants.length > 0) {
      product.variants.forEach(v => {
        console.log(`    • ${v.name}: $${v.price} (${v.stock} in stock)`);
      });
    }
  }
  
  await prisma.$disconnect();
}

checkMigration();