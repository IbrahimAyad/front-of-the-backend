import { PrismaClient } from '@prisma/client';

// Source database that contains the suits we need
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway'
    }
  }
});

// Current database
const currentPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function analyzeSourceDatabase() {
  try {
    console.log('🔍 Analyzing source database for suits...\n');

    // Get all suits from source database
    const sourceSuits = await sourcePrisma.product.findMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            variants: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Source Database Suits: ${sourceSuits.length} total\n`);

    // Get current database suits
    const currentSuits = await currentPrisma.product.findMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Current Database Suits: ${currentSuits.length} total\n`);

    // Group source suits by base name
    const sourceSuitNames = new Set<string>();
    const sourceSuitDetails = new Map<string, any[]>();

    sourceSuits.forEach(suit => {
      const baseName = suit.name
        .replace(/ - (Slim Fit|Regular Fit|Modern Fit)/gi, '')
        .replace(/ Slim Cut/gi, '')
        .trim();
      
      sourceSuitNames.add(baseName);
      
      if (!sourceSuitDetails.has(baseName)) {
        sourceSuitDetails.set(baseName, []);
      }
      sourceSuitDetails.get(baseName)!.push({
        name: suit.name,
        sku: suit.sku,
        price: suit.price,
        variants: suit._count.variants
      });
    });

    // Group current suits
    const currentSuitNames = new Set<string>();
    currentSuits.forEach(suit => {
      const baseName = suit.name
        .replace(/ - (Slim Fit|Regular Fit|Modern Fit)/gi, '')
        .replace(/ Slim Cut/gi, '')
        .trim();
      currentSuitNames.add(baseName);
    });

    // Find missing suits
    const missingSuits = Array.from(sourceSuitNames).filter(name => !currentSuitNames.has(name));

    console.log('📋 Source Database Suit Styles:');
    console.log('================================\n');
    
    let totalSourceVariants = 0;
    sourceSuitDetails.forEach((suits, baseName) => {
      console.log(`${baseName}:`);
      suits.forEach(suit => {
        console.log(`  - ${suit.name} (${suit.sku}) - $${suit.price} - ${suit.variants} variants`);
        totalSourceVariants += suit.variants;
      });
      console.log('');
    });

    console.log(`\n📊 Source Summary:`);
    console.log(`- Unique Suit Styles: ${sourceSuitNames.size}`);
    console.log(`- Total Suit Products: ${sourceSuits.length}`);
    console.log(`- Total Variants: ${totalSourceVariants}`);

    if (missingSuits.length > 0) {
      console.log('\n\n⚠️  MISSING SUITS IN CURRENT DATABASE:');
      console.log('=====================================');
      missingSuits.forEach(name => {
        console.log(`\n❌ ${name}:`);
        const details = sourceSuitDetails.get(name);
        details?.forEach(suit => {
          console.log(`   - ${suit.name} (${suit.sku}) - $${suit.price}`);
        });
      });
    } else {
      console.log('\n\n✅ All source suit styles exist in current database!');
    }

    // Check for extra suits in current that aren't in source
    const extraSuits = Array.from(currentSuitNames).filter(name => !sourceSuitNames.has(name));
    if (extraSuits.length > 0) {
      console.log('\n\n📦 Extra suits in current database (not in source):');
      extraSuits.forEach(name => console.log(`  - ${name}`));
    }

    // Sample some suits from source for details
    console.log('\n\n🔍 Sample Source Suit Details:');
    const sampleSuits = await sourcePrisma.product.findMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      },
      take: 5,
      include: {
        variants: {
          take: 3
        }
      }
    });

    sampleSuits.forEach(suit => {
      console.log(`\n${suit.name}:`);
      console.log(`  Price: $${suit.price}`);
      console.log(`  SKU: ${suit.sku}`);
      console.log(`  Variants: ${suit.variants.length > 0 ? '' : 'None'}`);
      suit.variants.forEach(v => {
        console.log(`    - ${v.name} (${v.size}) - Stock: ${v.stock}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await currentPrisma.$disconnect();
  }
}

analyzeSourceDatabase();