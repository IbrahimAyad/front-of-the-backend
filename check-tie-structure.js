const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

async function checkTies() {
  try {
    const ties = await prisma.product.findMany({
      where: { category: 'Ties' },
      include: {
        variants: {
          select: {
            id: true,
            color: true,
            name: true,
            sku: true,
            stock: true,
            price: true
          }
        }
      }
    });
    
    console.log('CURRENT TIE PRODUCTS:');
    console.log('====================\n');
    
    ties.forEach(tie => {
      console.log(`${tie.name} (${tie.variants.length} variants):`);
      console.log(`- SKU: ${tie.sku}`);
      console.log(`- Price: $${tie.price}`);
      console.log(`- Tags: ${tie.tags.join(', ')}`);
      
      const colors = [...new Set(tie.variants.map(v => v.color))].filter(c => c);
      console.log(`- Colors: ${colors.join(', ')}`);
      console.log(`- Sample variants:`);
      tie.variants.slice(0, 3).forEach(v => {
        console.log(`  * ${v.name} (${v.sku}) - Color: ${v.color}, Stock: ${v.stock}`);
      });
      console.log('');
    });
    
    // Check variant structure
    const firstTie = ties[0];
    if (firstTie && firstTie.variants.length > 0) {
      console.log('\nVARIANT STRUCTURE EXAMPLE:');
      console.log('========================');
      const variant = firstTie.variants[0];
      console.log(JSON.stringify(variant, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTies();