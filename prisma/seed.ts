import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdminUser() {
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@kct.com' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@kct.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Admin user created');
  } else {
    console.log('✅ Admin user already exists');
  }
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Ensure admin user exists first
  await ensureAdminUser();

  // Check if already seeded
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log('✅ Database already has products, skipping seed');
    return;
  }

  // Import and run all seeds
  console.log('📦 Seeding products with variants...');

  // 1. Seed Suits (32 products with all size variants)
  const { seedSuits } = await import('../src/seeds/seed-suits');
  await seedSuits();

  // 2. Seed Shirts (14 products with size variants)
  const { seedShirts } = await import('../src/seeds/seed-shirts');
  await seedShirts();

  // 3. Seed Ties (4 products with 76 color variants each)
  const { default: add76TieColors } = await import('../src/seeds/add-76-tie-colors');
  await add76TieColors();

  // 4. Seed Collections
  const { default: seedCollections } = await import('../src/seeds/seed-collections');
  await seedCollections();

  // 5. Remove any mock/test data
  await cleanMockData();

  const finalCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();

  console.log('✅ Seed complete!');
  console.log(`📊 Created ${finalCount} products with ${variantCount} variants`);
}

async function cleanMockData() {
  // Remove any test products
  const deleted = await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { contains: 'Test' } },
        { name: { contains: 'Mock' } },
        { sku: { startsWith: 'TEST-' } },
        { sku: { startsWith: 'SUIT-' } },
        { sku: { startsWith: 'SHIRT-' } },
        { sku: { startsWith: 'TIE-' } },
        { name: { contains: 'Classic Business Suit' } },
        { name: { contains: 'Summer Wedding' } },
        // Products with single letter names
        { name: { in: ['B', 'L', 'D'] } }
      ]
    }
  });

  if (deleted.count > 0) {
    console.log(`🗑️ Removed ${deleted.count} mock products`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });