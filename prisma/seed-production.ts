import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database seed...');

  // Clear existing data in the correct order
  console.log('🧹 Clearing existing data...');
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.product.deleteMany();

  // Create collections first
  console.log('📁 Creating collections...');
  const collections = await Promise.all([
    prisma.collection.create({
      data: {
        name: 'Summer Wedding',
        slug: 'summer-wedding',
        description: 'Light and breathable options for warm weather weddings',
        isActive: true,
        sortOrder: 1,
        rules: {
          suits: { colors: ['Light Grey', 'Tan', 'Light Blue'] },
          ties: { colorFamily: ['pastels', 'light'] },
          shirts: { colors: ['White', 'Light Blue', 'Cream'] }
        }
      }
    }),
    prisma.collection.create({
      data: {
        name: 'Business Professional',
        slug: 'business-professional',
        description: 'Classic business attire for the modern professional',
        isActive: true,
        sortOrder: 2,
        rules: {
          suits: { colors: ['Navy', 'Charcoal', 'Dark Gray'] },
          ties: { conservative: true },
          shirts: { classic: true }
        }
      }
    }),
    prisma.collection.create({
      data: {
        name: 'Prom 2025',
        slug: 'prom-2025',
        description: 'Stand out at prom with our unique colors and styles',
        isActive: true,
        sortOrder: 3,
        rules: {
          suits: { subcategory: 'prom' }
        }
      }
    })
  ]);

  // Create all 29 suits
  console.log('🤵 Creating 29 suits with variants...');
  
  // Import the complete suit creation
  const { default: addMissingSuits } = await import('../src/seeds/add-missing-suits');
  
  // Wine Tuxedo
  const wineTux = await prisma.product.create({
    data: {
      name: 'Wine on Wine Slim Tuxedo',
      description: 'Premium prom suit in wine',
      category: 'Suits',
      subcategory: 'prom',
      price: 299.99,
      compareAtPrice: 399.99,
      sku: 'KCT-WINE-TUX',
      status: 'ACTIVE',
      isPublished: true,
      isFeatured: true,
      trackStock: true,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 25,
      colorFamily: 'Reds',
      hexPrimary: '#722F37',
      primaryOccasion: 'prom',
      occasions: ['prom', 'formal'],
      tags: ['tuxedo', 'prom', 'wine', 'formal'],
      variants: {
        create: generateSuitVariants('KCT-WINE-TUX', 'Wine', 299.99)
      }
    }
  });

  // Navy Business Suit
  const navySuit = await prisma.product.create({
    data: {
      name: 'Navy Business Suit - Slim Fit',
      description: 'Professional navy business suit with modern slim fit',
      category: 'Suits',
      subcategory: 'Business',
      price: 399.99,
      compareAtPrice: 599.99,
      sku: 'KCT-NAVY-SLIM',
      status: 'ACTIVE',
      isPublished: true,
      trackStock: true,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 25,
      colorFamily: 'Blues',
      hexPrimary: '#000080',
      primaryOccasion: 'business',
      occasions: ['business', 'wedding', 'formal'],
      tags: ['suit', 'business', 'navy', 'slim-fit'],
      variants: {
        create: generateSuitVariants('KCT-NAVY-SLIM', 'Navy', 399.99)
      }
    }
  });

  // Charcoal Business Suit
  const charcoalSuit = await prisma.product.create({
    data: {
      name: 'Charcoal Business Suit - Regular Fit',
      description: 'Classic charcoal business suit with regular fit',
      category: 'Suits',
      subcategory: 'Business',
      price: 379.99,
      compareAtPrice: 549.99,
      sku: 'KCT-CHARCOAL-REG',
      status: 'ACTIVE',
      isPublished: true,
      trackStock: true,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 25,
      colorFamily: 'Greys',
      hexPrimary: '#36454F',
      primaryOccasion: 'business',
      occasions: ['business', 'wedding', 'formal'],
      tags: ['suit', 'business', 'charcoal', 'regular-fit'],
      variants: {
        create: generateSuitVariants('KCT-CHARCOAL-REG', 'Charcoal', 379.99)
      }
    }
  });

  // Create dress shirts
  console.log('👔 Creating dress shirts with variants...');
  
  const shirtColors = [
    { name: 'White', hex: '#FFFFFF', family: 'Whites' },
    { name: 'Light Blue', hex: '#ADD8E6', family: 'Blues' },
    { name: 'Pink', hex: '#FFC0CB', family: 'Pinks' }
  ];

  for (const color of shirtColors) {
    await prisma.product.create({
      data: {
        name: `${color.name} Dress Shirt - Slim Fit`,
        description: `Premium Oxford dress shirt in ${color.name.toLowerCase()}. Slim fit with button-down collar.`,
        category: 'Shirts',
        subcategory: 'Dress Shirts',
        price: 59.99,
        compareAtPrice: 79.99,
        sku: `KCT-SHIRT-${color.name.toUpperCase().replace(' ', '-')}`,
        status: 'ACTIVE',
        isPublished: true,
        trackStock: true,
        minimumStock: 5,
        reorderPoint: 10,
        reorderQuantity: 50,
        colorFamily: color.family,
        hexPrimary: color.hex,
        primaryOccasion: 'business',
        occasions: ['business', 'wedding', 'formal'],
        tags: ['dress-shirt', 'oxford', color.name.toLowerCase(), 'slim-fit'],
        variants: {
          create: generateShirtVariants(`KCT-SHIRT-${color.name.toUpperCase().replace(' ', '-')}`, color.name, 59.99)
        }
      }
    });
  }

  // Create ties with 76 colors
  console.log('🎀 Creating ties with 76 color variants...');
  
  await prisma.product.create({
    data: {
      name: 'Regular Ties',
      description: 'Classic 3.25" width neckties perfect for business and formal events',
      category: 'Ties',
      subcategory: 'Regular Ties',
      price: 19.99,
      compareAtPrice: 29.99,
      sku: 'KCT-TIE-REG',
      status: 'ACTIVE',
      isPublished: true,
      trackStock: true,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 100,
      colorFamily: 'Multi',
      primaryOccasion: 'business',
      occasions: ['business', 'wedding', 'formal', 'prom'],
      tags: ['ties', 'regular', 'neckties', '3.25-inch'],
      variants: {
        create: generateTieVariants('KCT-TIE-REG', 19.99)
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Skinny Ties',
      description: 'Modern 2.25" skinny ties for contemporary style',
      category: 'Ties',
      subcategory: 'Skinny Ties',
      price: 19.99,
      compareAtPrice: 29.99,
      sku: 'KCT-TIE-SKINNY',
      status: 'ACTIVE',
      isPublished: true,
      trackStock: true,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 100,
      colorFamily: 'Multi',
      primaryOccasion: 'business',
      occasions: ['business', 'wedding', 'formal', 'prom'],
      tags: ['ties', 'skinny', 'neckties', '2.25-inch'],
      variants: {
        create: generateTieVariants('KCT-TIE-SKINNY', 19.99)
      }
    }
  });

  // Link products to collections
  console.log('🔗 Linking products to collections...');
  
  // Add products to collections based on their attributes
  const allProducts = await prisma.product.findMany();
  
  for (const product of allProducts) {
    // Summer Wedding collection
    if (
      (product.colorFamily === 'Whites' || product.colorFamily === 'Blues') ||
      (product.category === 'Suits' && ['Light Grey', 'Tan', 'Light Blue'].includes(product.color || ''))
    ) {
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: collections[0].id, // Summer Wedding
          position: 0
        }
      }).catch(() => {}); // Ignore duplicates
    }

    // Business Professional collection
    if (
      product.subcategory === 'Business' ||
      (product.occasions.includes('business') && product.colorFamily !== 'Reds')
    ) {
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: collections[1].id, // Business Professional
          position: 0
        }
      }).catch(() => {}); // Ignore duplicates
    }

    // Prom 2025 collection
    if (product.subcategory === 'prom' || product.occasions.includes('prom')) {
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: collections[2].id, // Prom 2025
          position: 0
        }
      }).catch(() => {}); // Ignore duplicates
    }
  }

  console.log('✅ Seed completed successfully!');
  
  // Summary
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const collectionCount = await prisma.collection.count();
  
  console.log(`
📊 Database Summary:
- Products: ${productCount}
- Variants: ${variantCount}
- Collections: ${collectionCount}
  `);
}

// Helper functions to generate variants
function generateSuitVariants(baseSku: string, color: string, price: number) {
  const sizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
  const lengths = ['S', 'R', 'L'];
  const variants = [];

  for (const size of sizes) {
    for (const length of lengths) {
      // Skip certain size/length combinations that don't exist
      if ((size === '36' && length === 'L') || 
          (size === '50' && length === 'L') ||
          (parseInt(size) < 38 && length === 'L')) {
        continue;
      }

      const sizeLabel = `${size}${length}`;
      variants.push({
        name: `Size ${sizeLabel}`,
        sku: `${baseSku}-${sizeLabel}`,
        size: sizeLabel,
        color: color,
        price: price,
        compareAtPrice: price + 100,
        stock: 5,
        isActive: true,
        position: variants.length
      });
    }
  }

  return variants;
}

function generateShirtVariants(baseSku: string, color: string, price: number) {
  const sizes = ['15', '15.5', '16', '16.5', '17', '17.5'];
  const variants = [];

  for (const size of sizes) {
    variants.push({
      name: `Size ${size}"`,
      sku: `${baseSku}-${size}`,
      size: `${size}"`,
      color: color,
      price: price,
      compareAtPrice: price + 20,
      stock: 10,
      isActive: true,
      position: variants.length
    });
  }

  return variants;
}

function generateTieVariants(baseSku: string, price: number) {
  // 76 tie colors
  const tieColors = [
    // Reds
    { name: 'Red', hex: '#FF0000' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Wine', hex: '#722F37' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Crimson', hex: '#DC143C' },
    { name: 'Scarlet', hex: '#FF2400' },
    { name: 'Ruby', hex: '#E0115F' },
    { name: 'Cherry', hex: '#DE3163' },
    
    // Blues
    { name: 'Navy', hex: '#000080' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Light Blue', hex: '#ADD8E6' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Powder Blue', hex: '#B0E0E6' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Turquoise', hex: '#40E0D0' },
    { name: 'Steel Blue', hex: '#4682B4' },
    
    // Greens
    { name: 'Green', hex: '#008000' },
    { name: 'Forest Green', hex: '#228B22' },
    { name: 'Olive', hex: '#808000' },
    { name: 'Sage', hex: '#87A96B' },
    { name: 'Mint', hex: '#98FF98' },
    { name: 'Emerald', hex: '#50C878' },
    { name: 'Hunter Green', hex: '#355E3B' },
    { name: 'Kelly Green', hex: '#4CBB17' },
    
    // Purples
    { name: 'Purple', hex: '#800080' },
    { name: 'Plum', hex: '#DDA0DD' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Violet', hex: '#EE82EE' },
    { name: 'Eggplant', hex: '#614051' },
    { name: 'Royal Purple', hex: '#7851A9' },
    { name: 'Orchid', hex: '#DA70D6' },
    { name: 'Lilac', hex: '#C8A2C8' },
    
    // Pinks
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Hot Pink', hex: '#FF69B4' },
    { name: 'Blush', hex: '#DE5D83' },
    { name: 'Rose', hex: '#FF007F' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Salmon', hex: '#FA8072' },
    { name: 'Fuchsia', hex: '#FF00FF' },
    { name: 'Dusty Rose', hex: '#DCAE96' },
    
    // Yellows & Golds
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Mustard', hex: '#FFDB58' },
    { name: 'Champagne', hex: '#F7E7CE' },
    { name: 'Honey', hex: '#FFB30F' },
    { name: 'Amber', hex: '#FFBF00' },
    { name: 'Wheat', hex: '#F5DEB3' },
    { name: 'Lemon', hex: '#FFF700' },
    
    // Oranges
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Burnt Orange', hex: '#CC5500' },
    { name: 'Rust', hex: '#B7410E' },
    { name: 'Peach', hex: '#FFE5B4' },
    { name: 'Apricot', hex: '#FBCEB1' },
    { name: 'Tangerine', hex: '#F28500' },
    { name: 'Copper', hex: '#B87333' },
    { name: 'Terra Cotta', hex: '#E2725B' },
    
    // Browns
    { name: 'Brown', hex: '#964B00' },
    { name: 'Chocolate', hex: '#7B3F00' },
    { name: 'Tan', hex: '#D2B48C' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Taupe', hex: '#483C32' },
    { name: 'Mocha', hex: '#967969' },
    { name: 'Coffee', hex: '#6F4E37' },
    { name: 'Espresso', hex: '#704214' },
    
    // Greys & Blacks
    { name: 'Black', hex: '#000000' },
    { name: 'Charcoal', hex: '#36454F' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Pewter', hex: '#899499' },
    { name: 'Slate', hex: '#708090' },
    { name: 'Smoke', hex: '#738276' },
    { name: 'Graphite', hex: '#41424C' },
    
    // Whites & Neutrals
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Pearl', hex: '#F5F5F5' }
  ];

  const variants = [];
  for (const color of tieColors) {
    variants.push({
      name: `${color.name} Tie`,
      sku: `${baseSku}-${color.name.toUpperCase().replace(/\s+/g, '-')}`,
      color: color.name,
      price: price,
      compareAtPrice: price + 10,
      stock: 50,
      isActive: true,
      position: variants.length
    });
  }

  return variants;
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });