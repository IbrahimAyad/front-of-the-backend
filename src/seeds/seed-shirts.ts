import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedShirts() {
  console.log('👔 Seeding shirts with variants...');

  const shirtProducts = [
    { name: 'White Classic Fit Dress Shirt', sku: 'KCT-WCFS', fit: 'Classic', color: 'White' },
    { name: 'White Slim Fit Dress Shirt', sku: 'KCT-WSFS', fit: 'Slim', color: 'White' },
    { name: 'Light Blue Classic Fit Dress Shirt', sku: 'KCT-LBCFS', fit: 'Classic', color: 'Light Blue' },
    { name: 'Light Blue Slim Fit Dress Shirt', sku: 'KCT-LBSFS', fit: 'Slim', color: 'Light Blue' },
    { name: 'Pink Classic Fit Dress Shirt', sku: 'KCT-PCFS', fit: 'Classic', color: 'Pink' },
    { name: 'Pink Slim Fit Dress Shirt', sku: 'KCT-PSFS', fit: 'Slim', color: 'Pink' },
    { name: 'Lavender Classic Fit Dress Shirt', sku: 'KCT-LCFS', fit: 'Classic', color: 'Lavender' },
    { name: 'Lavender Slim Fit Dress Shirt', sku: 'KCT-LSFS', fit: 'Slim', color: 'Lavender' },
    { name: 'Mint Green Classic Fit Dress Shirt', sku: 'KCT-MGCFS', fit: 'Classic', color: 'Mint Green' },
    { name: 'Mint Green Slim Fit Dress Shirt', sku: 'KCT-MGSFS', fit: 'Slim', color: 'Mint Green' },
    { name: 'Cream Classic Fit Dress Shirt', sku: 'KCT-CCFS', fit: 'Classic', color: 'Cream' },
    { name: 'Cream Slim Fit Dress Shirt', sku: 'KCT-CSFS', fit: 'Slim', color: 'Cream' },
    { name: 'Silver Classic Fit Dress Shirt', sku: 'KCT-SICFS', fit: 'Classic', color: 'Silver' },
    { name: 'Silver Slim Fit Dress Shirt', sku: 'KCT-SISFS', fit: 'Slim', color: 'Silver' }
  ];

  for (const shirtData of shirtProducts) {
    const shirt = await prisma.product.create({
      data: {
        ...shirtData,
        description: `Premium ${shirtData.fit.toLowerCase()} fit dress shirt in ${shirtData.color.toLowerCase()}. Perfect for business and formal occasions.`,
        longDescription: `Expertly tailored ${shirtData.fit.toLowerCase()} fit dress shirt featuring premium cotton fabric, precise cut, and attention to detail. Available in multiple sizes for the perfect fit.`,
        category: 'Shirts',
        subcategory: 'Dress',
        price: 69.99,
        compareAtPrice: 99.99,
        status: 'ACTIVE',
        isPublished: true,
        trackStock: true,
        minimumStock: 5,
        reorderPoint: 10,
        smartAttributes: {
          fit_type: shirtData.fit.toLowerCase(),
          formality_level: 4,
          style_personality: shirtData.fit === 'Slim' ? ['modern', 'tailored'] : ['classic', 'traditional'],
          event_suitability: ['business', 'formal', 'wedding']
        },
        colorFamily: shirtData.color,
        primaryOccasion: 'business',
        occasionTags: ['business', 'formal', 'wedding', 'professional'],
        outfitRole: 'base',
        pairsWellWith: ['suits', 'ties', 'cufflinks', 'blazers'],
        metaTitle: `${shirtData.name} | Premium Dress Shirts | KCT Menswear`,
        metaDescription: `Shop our ${shirtData.name.toLowerCase()}. Premium cotton, perfect fit, professional quality.`,
        tags: [
          'dress-shirts',
          shirtData.color.toLowerCase().replace(' ', '-'),
          shirtData.fit.toLowerCase() + '-fit',
          'cotton',
          'formal'
        ],
        variants: {
          create: generateShirtVariants(shirtData)
        }
      }
    });

    console.log(`✅ Created ${shirt.name} with variants`);
  }
}

function generateShirtVariants(shirt: any): any[] {
  const variants: any[] = [];

  // Slim fit stops at 17.5, Classic fit goes to 22
  const sizes = shirt.fit === 'Slim'
    ? ['15', '15.5', '16', '16.5', '17', '17.5']
    : ['15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '20', '20.5', '21', '21.5', '22'];

  sizes.forEach((size, index) => {
    variants.push({
      name: `${shirt.name} - ${size}"`,
      sku: `${shirt.sku}-${size.replace('.', '')}`,
      size: `${size}"`,
      color: shirt.color,
      stock: 10,
      price: 69.99,
      isActive: true,
      position: index
    });
  });

  return variants;
} 