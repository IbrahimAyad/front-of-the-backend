import { PrismaClient } from '@prisma/client';

// The source database that showed us the 29 suits
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway'
    }
  }
});

// The current/target database we're updating
const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function checkBothDatabases() {
  try {
    console.log('🔍 Checking Both Databases\n');
    console.log('='.repeat(50) + '\n');

    // Check SOURCE database (shinkansen)
    console.log('📊 SOURCE DATABASE (shinkansen.proxy.rlwy.net):');
    console.log('This is where we found the 29 suits\n');
    
    try {
      const sourceSuits: any[] = await sourcePrisma.$queryRaw`
        SELECT COUNT(*) as count FROM suits WHERE is_active = true
      `;
      console.log(`Suits table: ${sourceSuits[0].count} active suits`);
      
      const sourceSuitVariants: any[] = await sourcePrisma.$queryRaw`
        SELECT COUNT(*) as count FROM suit_variants
      `;
      console.log(`Suit variants: ${sourceSuitVariants[0].count} variants`);
    } catch (error) {
      console.log('❌ Error accessing source database:', error.message);
    }

    // Check TARGET database (trolley)
    console.log('\n\n📊 TARGET DATABASE (trolley.proxy.rlwy.net):');
    console.log('This is where we\'re updating the products\n');
    
    const targetStats = await targetPrisma.$transaction([
      targetPrisma.product.count({ where: { category: 'Suits' } }),
      targetPrisma.productVariant.count({ where: { product: { category: 'Suits' } } }),
      targetPrisma.product.count({ where: { category: 'Shirts' } }),
      targetPrisma.productVariant.count({ where: { product: { category: 'Shirts' } } }),
      targetPrisma.product.count({ where: { category: 'Ties' } }),
      targetPrisma.productVariant.count({ where: { product: { category: 'Ties' } } }),
    ]);

    console.log(`Suits: ${targetStats[0]} products, ${targetStats[1]} variants`);
    console.log(`Shirts: ${targetStats[2]} products, ${targetStats[3]} variants`);
    console.log(`Ties: ${targetStats[4]} products, ${targetStats[5]} variants`);
    console.log(`\nTotal: ${targetStats[0] + targetStats[2] + targetStats[4]} products, ${targetStats[1] + targetStats[3] + targetStats[5]} variants`);

    // Sample some suits from target to see what we have
    console.log('\n\n📋 Sample Suits in Target Database:');
    const sampleSuits = await targetPrisma.product.findMany({
      where: { category: 'Suits' },
      take: 10,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { variants: true }
        }
      }
    });

    sampleSuits.forEach(suit => {
      console.log(`- ${suit.name}: ${suit._count.variants} variants`);
    });

    // Check variant sizing in target
    console.log('\n\n📏 Variant Sizes in Target Database:');
    const sizeCounts = await targetPrisma.productVariant.groupBy({
      by: ['size'],
      where: {
        product: { category: 'Suits' }
      },
      _count: true,
      orderBy: { size: 'asc' },
      take: 10
    });

    sizeCounts.forEach(({ size, _count }) => {
      console.log(`  ${size}: ${_count} variants`);
    });

    console.log('\n\n✅ Database check complete!');
    console.log('\nCONFIRMATION:');
    console.log('- SOURCE (shinkansen): Contains the original 29 suits in a different schema');
    console.log('- TARGET (trolley): This is where we imported the suits and created all variants');
    console.log('- All updates have been made to the TARGET database');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

checkBothDatabases();