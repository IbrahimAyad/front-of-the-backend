import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function checkProductVariants() {
  try {
    console.log('🔍 Checking Product Variants in Railway Database...\n');

    // 1. Count total variants
    const variantCount = await prisma.productVariant.count();
    console.log(`📊 Total Product Variants: ${variantCount}\n`);

    // 2. Get sample of variants
    const sampleVariants = await prisma.productVariant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            category: true,
          }
        }
      }
    });

    console.log('📦 Sample Product Variants (Latest 10):');
    console.log('=====================================');
    
    sampleVariants.forEach((variant, index) => {
      console.log(`\n${index + 1}. ${variant.name}`);
      console.log(`   Product: ${variant.product.name} (${variant.product.category})`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Size: ${variant.size || 'N/A'}`);
      console.log(`   Color: ${variant.color || 'N/A'}`);
      console.log(`   Stock: ${variant.stock}`);
      console.log(`   Price: $${variant.price || 'N/A'}`);
      console.log(`   Active: ${variant.isActive ? '✅' : '❌'}`);
    });

    // 3. Group by product
    const productsWithVariants = await prisma.product.findMany({
      where: {
        variants: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            variants: true
          }
        }
      },
      orderBy: {
        variants: {
          _count: 'desc'
        }
      },
      take: 10
    });

    console.log('\n\n🏷️  Products with Most Variants:');
    console.log('================================');
    
    productsWithVariants.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.category}) - ${product._count.variants} variants`);
    });

    // 4. Check for size distribution
    const sizeDistribution = await prisma.productVariant.groupBy({
      by: ['size'],
      _count: true,
      orderBy: {
        _count: {
          size: 'desc'
        }
      }
    });

    console.log('\n\n📏 Size Distribution:');
    console.log('====================');
    
    sizeDistribution.forEach(size => {
      console.log(`${size.size || 'No Size'}: ${size._count} variants`);
    });

    // 5. Check for color distribution
    const colorDistribution = await prisma.productVariant.groupBy({
      by: ['color'],
      _count: true,
      orderBy: {
        _count: {
          color: 'desc'
        }
      },
      take: 10
    });

    console.log('\n\n🎨 Color Distribution (Top 10):');
    console.log('==============================');
    
    colorDistribution.forEach(color => {
      console.log(`${color.color || 'No Color'}: ${color._count} variants`);
    });

    // 6. Check stock levels
    const stockSummary = await prisma.productVariant.aggregate({
      _sum: {
        stock: true,
        reservedStock: true
      },
      _avg: {
        stock: true
      }
    });

    console.log('\n\n📈 Stock Summary:');
    console.log('================');
    console.log(`Total Stock: ${stockSummary._sum.stock || 0}`);
    console.log(`Reserved Stock: ${stockSummary._sum.reservedStock || 0}`);
    console.log(`Average Stock per Variant: ${Math.round(stockSummary._avg.stock || 0)}`);

    // 7. Find variants with low stock
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: {
          lte: 5
        },
        isActive: true
      },
      include: {
        product: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });

    console.log('\n\n⚠️  Low Stock Variants (≤5):');
    console.log('===========================');
    
    if (lowStockVariants.length === 0) {
      console.log('No low stock variants found!');
    } else {
      lowStockVariants.forEach(variant => {
        console.log(`- ${variant.name} (${variant.product.name}) - Stock: ${variant.stock}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductVariants();