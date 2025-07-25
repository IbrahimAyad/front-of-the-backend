import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function checkAllProducts() {
  try {
    console.log('📊 Checking all products in Railway database...\n');

    // Get category distribution
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    console.log('📦 Products by Category:');
    console.log('========================');
    categories.forEach(cat => {
      console.log(`${cat.category}: ${cat._count} products`);
    });

    // Get total count
    const total = await prisma.product.count();
    console.log(`\nTotal Products: ${total}`);

    // Get products with variants count
    const productsWithVariants = await prisma.product.count({
      where: {
        variants: {
          some: {}
        }
      }
    });
    console.log(`Products with Variants: ${productsWithVariants}`);

    // Sample products from each category
    console.log('\n📋 Sample Products:');
    console.log('==================');
    
    for (const cat of categories) {
      const samples = await prisma.product.findMany({
        where: { category: cat.category },
        take: 3,
        select: {
          name: true,
          sku: true,
          _count: {
            select: {
              variants: true
            }
          }
        }
      });
      
      console.log(`\n${cat.category}:`);
      samples.forEach(p => {
        console.log(`  - ${p.name} (${p.sku}) - ${p._count.variants} variants`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProducts();