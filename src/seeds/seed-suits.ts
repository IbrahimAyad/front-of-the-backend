import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSuits() {
  console.log('🤵 Seeding suits with variants...');

  const suitProducts = [
    { name: 'Navy Business Suit - Slim Fit', sku: 'KCT-NBS-SLIMFIT', color: 'Navy', fit: 'Slim' },
    { name: 'Navy Business Suit - Regular Fit', sku: 'KCT-NBS-REGULARFIT', color: 'Navy', fit: 'Regular' },
    { name: 'Charcoal Business Suit - Slim Fit', sku: 'KCT-CBS-SLIMFIT', color: 'Charcoal', fit: 'Slim' },
    { name: 'Charcoal Business Suit - Regular Fit', sku: 'KCT-CBS-REGULARFIT', color: 'Charcoal', fit: 'Regular' },
    { name: 'Black Formal Suit - Slim Fit', sku: 'KCT-BFS-SLIMFIT', color: 'Black', fit: 'Slim' },
    { name: 'Black Formal Suit - Regular Fit', sku: 'KCT-BFS-REGULARFIT', color: 'Black', fit: 'Regular' },
    { name: 'Light Grey Business Suit - Slim Fit', sku: 'KCT-LGBS-SLIMFIT', color: 'Light Grey', fit: 'Slim' },
    { name: 'Light Grey Business Suit - Regular Fit', sku: 'KCT-LGBS-REGULARFIT', color: 'Light Grey', fit: 'Regular' },
    { name: 'Dark Blue Formal Suit - Slim Fit', sku: 'KCT-DBFS-SLIMFIT', color: 'Dark Blue', fit: 'Slim' },
    { name: 'Dark Blue Formal Suit - Regular Fit', sku: 'KCT-DBFS-REGULARFIT', color: 'Dark Blue', fit: 'Regular' },
    { name: 'Brown Business Suit - Slim Fit', sku: 'KCT-BrBS-SLIMFIT', color: 'Brown', fit: 'Slim' },
    { name: 'Brown Business Suit - Regular Fit', sku: 'KCT-BrBS-REGULARFIT', color: 'Brown', fit: 'Regular' },
    { name: 'Classic Black Tuxedo - Slim Fit', sku: 'KCT-CBT-SLIMFIT', color: 'Black', fit: 'Slim' },
    { name: 'Classic Black Tuxedo - Regular Fit', sku: 'KCT-CBT-REGULARFIT', color: 'Black', fit: 'Regular' },
    { name: 'Midnight Blue Tuxedo - Slim Fit', sku: 'KCT-MBT-SLIMFIT', color: 'Midnight Blue', fit: 'Slim' },
    { name: 'Midnight Blue Tuxedo - Regular Fit', sku: 'KCT-MBT-REGULARFIT', color: 'Midnight Blue', fit: 'Regular' },
    { name: 'Pinstripe Navy Suit - Slim Fit', sku: 'KCT-PNS-SLIMFIT', color: 'Navy', fit: 'Slim' },
    { name: 'Pinstripe Navy Suit - Regular Fit', sku: 'KCT-PNS-REGULARFIT', color: 'Navy', fit: 'Regular' },
    { name: 'Pinstripe Charcoal Suit - Slim Fit', sku: 'KCT-PCS-SLIMFIT', color: 'Charcoal', fit: 'Slim' },
    { name: 'Pinstripe Charcoal Suit - Regular Fit', sku: 'KCT-PCS-REGULARFIT', color: 'Charcoal', fit: 'Regular' },
    { name: 'Light Blue Summer Suit - Slim Fit', sku: 'KCT-LBSS-SLIMFIT', color: 'Light Blue', fit: 'Slim' },
    { name: 'Light Blue Summer Suit - Regular Fit', sku: 'KCT-LBSS-REGULARFIT', color: 'Light Blue', fit: 'Regular' },
    { name: 'Tan Summer Suit - Slim Fit', sku: 'KCT-TSS-SLIMFIT', color: 'Tan', fit: 'Slim' },
    { name: 'Tan Summer Suit - Regular Fit', sku: 'KCT-TSS-REGULARFIT', color: 'Tan', fit: 'Regular' },
    { name: 'Cream Wedding Suit - Slim Fit', sku: 'KCT-CWS-SLIMFIT', color: 'Cream', fit: 'Slim' },
    { name: 'Cream Wedding Suit - Regular Fit', sku: 'KCT-CWS-REGULARFIT', color: 'Cream', fit: 'Regular' },
    { name: 'Wine Prom Tuxedo - Slim Fit', sku: 'KCT-WPT-SLIMFIT', color: 'Wine', fit: 'Slim' },
    { name: 'Wine Prom Tuxedo - Regular Fit', sku: 'KCT-WPT-REGULARFIT', color: 'Wine', fit: 'Regular' },
    { name: 'Forest Green Formal Suit - Slim Fit', sku: 'KCT-FGFS-SLIMFIT', color: 'Forest Green', fit: 'Slim' },
    { name: 'Forest Green Formal Suit - Regular Fit', sku: 'KCT-FGFS-REGULARFIT', color: 'Forest Green', fit: 'Regular' },
    { name: 'Royal Blue Wedding Suit - Slim Fit', sku: 'KCT-RBWS-SLIMFIT', color: 'Royal Blue', fit: 'Slim' },
    { name: 'Royal Blue Wedding Suit - Regular Fit', sku: 'KCT-RBWS-REGULARFIT', color: 'Royal Blue', fit: 'Regular' }
  ];

  for (const suitData of suitProducts) {
    const isTuxedo = suitData.name.includes('Tuxedo');
    const isProm = suitData.name.includes('Prom');
    const isWedding = suitData.name.includes('Wedding') || suitData.name.includes('Summer');
    
    const suit = await prisma.product.create({
      data: {
        ...suitData,
        description: `Premium ${suitData.fit.toLowerCase()} fit ${suitData.color.toLowerCase()} suit perfect for ${isTuxedo ? 'formal events' : isWedding ? 'weddings and special occasions' : 'business and professional settings'}`,
        longDescription: `Expertly tailored ${suitData.fit.toLowerCase()} fit suit in ${suitData.color.toLowerCase()}. Crafted from premium materials with attention to detail and modern styling.`,
        category: 'Suits',
        subcategory: isTuxedo ? 'Formal' : isWedding ? 'Wedding' : 'Business',
        price: isProm ? 299.99 : isTuxedo ? 599.99 : isWedding ? 499.99 : 399.99,
        compareAtPrice: isProm ? 399.99 : isTuxedo ? 799.99 : isWedding ? 649.99 : 599.99,
        status: 'ACTIVE',
        isPublished: true,
        trackStock: true,
        minimumStock: 5,
        reorderPoint: 10,
        smartAttributes: {
          fit_type: suitData.fit.toLowerCase().replace(' ', '_'),
          formality_level: isTuxedo ? 5 : isWedding ? 4 : 3,
          style_personality: suitData.fit === 'Slim' ? ['modern', 'contemporary'] : ['classic', 'traditional'],
          event_suitability: isTuxedo ? ['black-tie', 'formal'] : isWedding ? ['wedding', 'celebration'] : ['business', 'professional']
        },
        colorFamily: suitData.color,
        primaryOccasion: isTuxedo ? 'formal' : isWedding ? 'wedding' : 'business',
        occasionTags: isTuxedo ? ['formal', 'black-tie', 'gala'] : isWedding ? ['wedding', 'celebration', 'summer'] : ['business', 'professional', 'corporate'],
        outfitRole: 'base',
        pairsWellWith: ['dress-shirts', 'ties', 'pocket-squares', 'dress-shoes'],
        metaTitle: `${suitData.name} | Premium Tailored Suits | KCT Menswear`,
        metaDescription: `Shop our ${suitData.name.toLowerCase()}. Premium quality, expert tailoring, perfect fit guaranteed.`,
        tags: [
          'suits',
          suitData.color.toLowerCase().replace(' ', '-'),
          suitData.fit.toLowerCase().replace(' ', '-'),
          isTuxedo ? 'tuxedo' : isWedding ? 'wedding-suit' : 'business-suit'
        ],
        variants: {
          create: generateSuitVariants(suitData)
        }
      }
    });

    console.log(`✅ Created ${suit.name} with variants`);
  }
}

function generateSuitVariants(suit: any): any[] {
  const variants: any[] = [];
  const sizes = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];

  sizes.forEach(size => {
    // Regular length (all sizes)
    variants.push({
      name: `${suit.name} - ${size}R`,
      sku: `${suit.sku}-${size}R`,
      size: `${size}R`,
      color: suit.color,
      stock: 5,
      price: suit.name.includes('Prom') ? 299.99 : suit.name.includes('Tuxedo') ? 599.99 : suit.name.includes('Wedding') || suit.name.includes('Summer') ? 499.99 : 399.99,
      isActive: true,
      position: sizes.indexOf(size) * 3
    });

    // Short length (up to 50)
    if (parseInt(size) <= 50) {
      variants.push({
        name: `${suit.name} - ${size}S`,
        sku: `${suit.sku}-${size}S`,
        size: `${size}S`,
        color: suit.color,
        stock: 3,
        price: suit.name.includes('Prom') ? 299.99 : suit.name.includes('Tuxedo') ? 599.99 : suit.name.includes('Wedding') || suit.name.includes('Summer') ? 499.99 : 399.99,
        isActive: true,
        position: sizes.indexOf(size) * 3 + 1
      });
    }

    // Long length (38 and up)
    if (parseInt(size) >= 38) {
      variants.push({
        name: `${suit.name} - ${size}L`,
        sku: `${suit.sku}-${size}L`,
        size: `${size}L`,
        color: suit.color,
        stock: 3,
        price: suit.name.includes('Prom') ? 299.99 : suit.name.includes('Tuxedo') ? 599.99 : suit.name.includes('Wedding') || suit.name.includes('Summer') ? 499.99 : 399.99,
        isActive: true,
        position: sizes.indexOf(size) * 3 + 2
      });
    }
  });

  return variants;
} 