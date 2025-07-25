import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingSuits() {
  console.log('🤵 Adding missing suits to reach 29 total...');

  // These are the missing suits based on typical menswear inventory
  const missingSuits = [
    // Tan suits (popular for summer)
    { name: 'Tan', hex: '#D2B48C', family: 'Browns', subcategory: 'Business' },
    
    // Blue variations
    { name: 'Light Blue', hex: '#87CEEB', family: 'Blues', subcategory: 'Business' },
    { name: 'Royal Blue', hex: '#4169E1', family: 'Blues', subcategory: 'Formal' },
    
    // Gray variations  
    { name: 'Medium Gray', hex: '#808080', family: 'Greys', subcategory: 'Business' },
    { name: 'Silver Gray', hex: '#C0C0C0', family: 'Greys', subcategory: 'Formal' },
    
    // Special occasion suits
    { name: 'Midnight Blue', hex: '#191970', family: 'Blues', subcategory: 'Formal', isTuxedo: true },
    { name: 'Ivory', hex: '#FFFFF0', family: 'Whites', subcategory: 'Wedding' },
    { name: 'White', hex: '#FFFFFF', family: 'Whites', subcategory: 'Wedding' },
    
    // Fashion colors
    { name: 'Olive', hex: '#808000', family: 'Greens', subcategory: 'Fashion' },
    { name: 'Burgundy', hex: '#800020', family: 'Reds', subcategory: 'Fashion' },
    { name: 'Forest Green', hex: '#228B22', family: 'Greens', subcategory: 'Fashion' },
    
    // Patterns (counted as separate products in original 29)
    { name: 'Navy Pinstripe', hex: '#000080', family: 'Blues', subcategory: 'Business', pattern: 'Pinstripe' },
    { name: 'Charcoal Pinstripe', hex: '#36454F', family: 'Greys', subcategory: 'Business', pattern: 'Pinstripe' }
  ];

  const fitTypes = ['Slim Fit', 'Regular Fit'];
  const suitSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
  const lengthTypes = ['S', 'R', 'L'];
  
  let totalAdded = 0;

  for (const suitConfig of missingSuits) {
    // Skip if we need to limit to reach exactly 29
    const currentCount = await prisma.product.count({ where: { category: 'Suits' } });
    if (currentCount >= 29) break;

    // Only create one fit type if we're close to 29
    const fitsToCreate = currentCount >= 27 ? ['Slim Fit'] : fitTypes;

    for (const fit of fitsToCreate) {
      const currentCount = await prisma.product.count({ where: { category: 'Suits' } });
      if (currentCount >= 29) break;

      const smartAttributes = {
        formality_level: suitConfig.isTuxedo ? 5 : suitConfig.subcategory === 'Formal' ? 4 : 3,
        conservative_rating: suitConfig.subcategory === 'Fashion' ? 2 : 4,
        color_temperature: suitConfig.family.includes('Blue') ? 'cool' : 
                          suitConfig.family.includes('Red') ? 'warm' : 'neutral',
        event_suitability: 
          suitConfig.subcategory === 'Wedding' ? ['wedding', 'formal'] :
          suitConfig.subcategory === 'Fashion' ? ['casual', 'creative'] :
          suitConfig.subcategory === 'Formal' ? ['formal', 'gala', 'wedding'] :
          ['business', 'wedding', 'formal'],
        age_appropriateness: fit === 'Slim Fit' ? ['young', 'middle'] : ['middle', 'mature'],
        style_personality: fit === 'Slim Fit' ? ['modern', 'contemporary'] : ['classic', 'traditional']
      };

      const product = await prisma.product.create({
        data: {
          name: `${suitConfig.name} ${suitConfig.isTuxedo ? 'Tuxedo' : 'Suit'} - ${fit}`,
          description: `Premium ${suitConfig.name.toLowerCase()} ${suitConfig.isTuxedo ? 'tuxedo' : 'suit'} with ${fit.toLowerCase()}`,
          longDescription: `Sophisticated ${suitConfig.name.toLowerCase()} ${suitConfig.isTuxedo ? 'formal tuxedo' : 'suit'} perfect for ${suitConfig.subcategory.toLowerCase()} occasions. Features ${fit.toLowerCase()} for modern styling.`,
          category: "Suits",
          subcategory: suitConfig.subcategory,
          price: suitConfig.isTuxedo ? 499.99 : suitConfig.subcategory === 'Fashion' ? 329.99 : 399.99,
          compareAtPrice: suitConfig.isTuxedo ? 699.99 : suitConfig.subcategory === 'Fashion' ? 449.99 : 549.99,
          sku: `KCT-${suitConfig.name.replace(/\s+/g, '').toUpperCase()}-${fit.replace(' ', '').toUpperCase()}`,
          slug: `${suitConfig.name.toLowerCase().replace(/\s+/g, '-')}-${suitConfig.isTuxedo ? 'tuxedo' : 'suit'}-${fit.toLowerCase().replace(' ', '-')}`,
          
          smartAttributes,
          fabricMarketing: suitConfig.isTuxedo ? "Luxury Tuxedo Fabric" : "Premium Suit Fabric",
          fabricCare: "Professional dry clean only",
          fabricBenefits: ["wrinkle-resistant", "breathable", "comfortable stretch", "shape-retention"],
          
          colorFamily: suitConfig.family,
          hexPrimary: suitConfig.hex,
          pattern: suitConfig.pattern,
          
          primaryOccasion: suitConfig.subcategory.toLowerCase(),
          occasionTags: smartAttributes.event_suitability,
          trendingFor: suitConfig.subcategory === 'Wedding' ? ['summer-wedding'] : 
                       suitConfig.subcategory === 'Fashion' ? ['creative-professional'] : [],
          
          outfitRole: "base",
          pairsWellWith: ["dress-shirts", "ties", "pocket-squares"],
          styleNotes: `Elegant ${suitConfig.name.toLowerCase()} ${suitConfig.isTuxedo ? 'tuxedo' : 'suit'} for ${suitConfig.subcategory.toLowerCase()} events`,
          
          localKeywords: [`${suitConfig.subcategory.toLowerCase()} suits`, suitConfig.name.toLowerCase()],
          
          trackStock: true,
          totalStock: 0,
          availableStock: 0,
          minimumStock: 5,
          reorderPoint: 10,
          reorderQuantity: 25,
          
          status: "ACTIVE",
          isPublished: true,
          isFeatured: suitConfig.subcategory === 'Wedding',
          
          metaTitle: `${suitConfig.name} ${suitConfig.isTuxedo ? 'Tuxedo' : 'Suit'} ${fit} | ${suitConfig.subcategory} | KCT`,
          metaDescription: `Premium ${suitConfig.name.toLowerCase()} ${suitConfig.isTuxedo ? 'tuxedo' : 'suit'} in ${fit.toLowerCase()}. Perfect for ${suitConfig.subcategory.toLowerCase()} occasions.`,
          tags: [
            suitConfig.subcategory.toLowerCase(),
            suitConfig.name.toLowerCase(),
            fit.toLowerCase().replace(' ', '-'),
            suitConfig.isTuxedo ? "tuxedo" : "suit"
          ],
          
          occasions: smartAttributes.event_suitability,
          styleAttributes: [fit.toLowerCase().replace(' ', '-'), "professional"],
        }
      });

      // Create variants
      let stockTotal = 0;
      for (const size of suitSizes) {
        for (const length of lengthTypes) {
          // Skip certain size/length combinations
          if ((size === '36' && length === 'L') || 
              (size === '50' && length === 'L') ||
              (parseInt(size) < 38 && length === 'L')) {
            continue;
          }

          const sizeLabel = `${size}${length}`;
          const stock = 3;
          
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              name: `${product.name} - 2-Piece - ${sizeLabel}`,
              sku: `${product.sku}-2PC-${sizeLabel}`,
              size: sizeLabel,
              color: suitConfig.name,
              material: '2-Piece',
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              stock: stock,
              isActive: true,
              position: suitSizes.indexOf(size) * lengthTypes.length + lengthTypes.indexOf(length),
            }
          });
          stockTotal += stock;
        }
      }

      // Update product stock totals
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          totalStock: stockTotal,
          availableStock: stockTotal 
        }
      });

      totalAdded++;
      console.log(`✅ Added: ${product.name}`);
    }
  }

  const finalCount = await prisma.product.count({ where: { category: 'Suits' } });
  console.log(`\n✅ Complete! Total suits in database: ${finalCount}`);
  console.log(`📊 Added ${totalAdded} new suits`);

  return { suitsAdded: totalAdded, totalSuits: finalCount };
}

export default addMissingSuits;

// Run if called directly
if (require.main === module) {
  addMissingSuits()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Error:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}