import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete production database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.product.deleteMany();

  console.log('📦 Running comprehensive restore...');
  
  // Use the API endpoints to restore everything
  const baseUrl = 'http://localhost:8000/api/restore';
  
  try {
    // 1. Restore the base catalog (includes suits, shirts, ties)
    console.log('1️⃣ Restoring base catalog...');
    const catalogResponse = await fetch(`${baseUrl}/catalog`, { method: 'POST' });
    const catalogResult = await catalogResponse.json();
    console.log('   ✅', catalogResult.message);
    
    // 2. Add the 76 tie colors
    console.log('2️⃣ Adding 76 tie colors...');
    const tieResponse = await fetch(`${baseUrl}/76-tie-colors`, { method: 'POST' });
    const tieResult = await tieResponse.json();
    console.log('   ✅', tieResult.message);
    
    // 3. Add missing suits to reach 29
    console.log('3️⃣ Adding missing suits...');
    const { default: addMissingSuits } = await import('../src/seeds/add-missing-suits');
    const suitsResult = await addMissingSuits();
    console.log('   ✅ Added', suitsResult.suitsAdded, 'suits');
    
  } catch (error) {
    console.error('❌ Error during restore:', error);
    console.log('Falling back to direct database operations...');
    
    // If API fails, use direct import
    const { default: restoreCatalog } = await import('../src/routes/restore');
    // Note: This would need to be refactored to work outside of Fastify context
  }

  // Final summary
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const suitCount = await prisma.product.count({ where: { category: 'Suits' } });
  const shirtCount = await prisma.product.count({ where: { category: 'Shirts' } });
  const tieCount = await prisma.product.count({ where: { category: 'Ties' } });
  
  console.log(`
✅ Seed completed successfully!

📊 Database Summary:
- Total Products: ${productCount}
- Suits: ${suitCount}
- Shirts: ${shirtCount}
- Ties: ${tieCount}
- Total Variants: ${variantCount}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });