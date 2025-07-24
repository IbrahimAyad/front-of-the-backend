import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:gkeCuJOQGwvjxRAMCKzXKBruHXRJYTHQ@junction.proxy.rlwy.net:28388/railway'
    }
  }
});

async function removeMockProducts() {
  try {
    // Delete only the 4 mock products
    const mockProducts = await prisma.product.deleteMany({
      where: {
        OR: [
          { sku: 'BLZR-CAS-001' },
          { sku: 'TUX-WED-001' },
          { sku: 'SUIT-BUS-001' },
          { sku: 'SUIT-3PC-001' }
        ]
      }
    });

    console.log(`✅ Removed ${mockProducts.count} mock products`);

    // Show remaining product count
    const remainingCount = await prisma.product.count();
    console.log(`📊 Remaining products: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeMockProducts();
