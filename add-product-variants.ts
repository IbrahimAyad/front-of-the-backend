import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

// Standard suit sizes
const SUIT_SIZES = ['38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R'];
const SUIT_COLORS = {
  'Brown': ['Brown'],
  'Light Gray': ['Light Gray'],
  'Dark Gray': ['Dark Gray', 'Charcoal'],
  'Black': ['Black'],
  'Navy': ['Navy', 'Navy Blue'],
  'Charcoal': ['Charcoal', 'Dark Gray']
};

async function addProductVariants() {
  try {
    console.log('🚀 Adding variants to products...\n');

    // Get all suits
    const suits = await prisma.product.findMany({
      where: {
        category: {
          contains: 'Suits',
          mode: 'insensitive'
        }
      }
    });

    console.log(`Found ${suits.length} suits to add variants to\n`);

    for (const suit of suits) {
      console.log(`\n📦 Processing: ${suit.name}`);
      
      // Determine color from product name
      let productColor = 'Black'; // default
      for (const [colorKey, colorVariants] of Object.entries(SUIT_COLORS)) {
        if (suit.name.toLowerCase().includes(colorKey.toLowerCase())) {
          productColor = colorVariants[0];
          break;
        }
      }

      // Create variants for each size
      const variants = [];
      for (const size of SUIT_SIZES) {
        const variant = {
          productId: suit.id,
          name: `${suit.name} - ${size}`,
          sku: `${suit.sku}-${size.replace(' ', '')}`,
          size: size,
          color: productColor,
          stock: 10 + Math.floor(Math.random() * 5), // Random stock 10-14
          price: suit.price,
          isActive: true,
          position: SUIT_SIZES.indexOf(size)
        };
        variants.push(variant);
      }

      // Create all variants
      const created = await prisma.productVariant.createMany({
        data: variants,
        skipDuplicates: true
      });

      console.log(`✅ Created ${created.count} variants`);
    }

    // Add variants for dress shirts if any
    const shirts = await prisma.product.findMany({
      where: {
        OR: [
          { category: { contains: 'Shirts', mode: 'insensitive' } },
          { subcategory: { contains: 'Dress', mode: 'insensitive' } }
        ]
      }
    });

    if (shirts.length > 0) {
      console.log(`\n\n👔 Found ${shirts.length} shirts to add variants to`);
      
      const SHIRT_SIZES = ['14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18'];
      
      for (const shirt of shirts) {
        console.log(`\n📦 Processing: ${shirt.name}`);
        
        const variants = [];
        for (const size of SHIRT_SIZES) {
          const variant = {
            productId: shirt.id,
            name: `${shirt.name} - ${size}`,
            sku: `${shirt.sku}-${size.replace('.', '')}`,
            size: size,
            color: shirt.colorFamily || 'White',
            stock: 15 + Math.floor(Math.random() * 10), // Random stock 15-24
            price: shirt.price,
            isActive: true,
            position: SHIRT_SIZES.indexOf(size)
          };
          variants.push(variant);
        }

        const created = await prisma.productVariant.createMany({
          data: variants,
          skipDuplicates: true
        });

        console.log(`✅ Created ${created.count} variants`);
      }
    }

    // Final count
    const totalVariants = await prisma.productVariant.count();
    console.log(`\n\n🎉 Total variants in database: ${totalVariants}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProductVariants();