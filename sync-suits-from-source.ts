import { PrismaClient } from '@prisma/client';

// Source database with all suits
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway'
    }
  }
});

// Target database to update
const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway'
    }
  }
});

// Color mapping from source to our color names
const colorMap: Record<string, string> = {
  'classic-black': 'Black',
  'brick-rust': 'Brick Rust',
  'burgundy': 'Burgundy', 
  'dark-grey': 'Dark Gray',
  'hunter-green': 'Hunter Green',
  'indigo': 'Indigo',
  'light-brown': 'Light Brown',
  'light-grey': 'Light Gray',
  'navy-blue': 'Navy',
  'off-white': 'Off White',
  'pure-white': 'White',
  'red': 'Red',
  'royal-blue': 'Royal Blue',
  'tan': 'Tan',
  'wine': 'Wine'
};

// Hex color codes
const hexColors: Record<string, string> = {
  'Black': '#000000',
  'Brick Rust': '#B22222',
  'Burgundy': '#800020',
  'Dark Gray': '#A9A9A9',
  'Hunter Green': '#355E3B',
  'Indigo': '#4B0082',
  'Light Brown': '#D2691E',
  'Light Gray': '#D3D3D3',
  'Navy': '#000080',
  'Off White': '#FAF0E6',
  'White': '#FFFFFF',
  'Red': '#FF0000',
  'Royal Blue': '#002366',
  'Tan': '#D2B48C',
  'Wine': '#722F37'
};

// Standard sizes for suit variants
const suitSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
const lengthTypes = ['S', 'R', 'L']; // Short, Regular, Long

async function syncSuitsFromSource() {
  try {
    console.log('🔄 Starting suit synchronization from source database...\n');

    // Step 1: Delete all existing suits to start fresh
    console.log('🧹 Clearing existing suits...');
    await targetPrisma.productVariant.deleteMany({
      where: {
        product: {
          category: 'Suits'
        }
      }
    });
    await targetPrisma.product.deleteMany({
      where: {
        category: 'Suits'
      }
    });

    // Step 2: Get all suits from source
    const sourceSuits: any[] = await sourcePrisma.$queryRaw`
      SELECT * FROM suits 
      WHERE is_active = true
      ORDER BY name;
    `;

    console.log(`📊 Found ${sourceSuits.length} suits to sync\n`);

    let createdProducts = 0;
    let createdVariants = 0;
    const variantBatch = [];

    // Step 3: Process each suit
    for (const sourceSuit of sourceSuits) {
      console.log(`\n🎯 Processing: ${sourceSuit.name}`);
      
      const mappedColor = colorMap[sourceSuit.base_color] || 'Black';
      const hexColor = hexColors[mappedColor] || '#000000';
      
      // Determine subcategory based on source category
      let subcategory = 'Business';
      if (sourceSuit.category === 'prom') subcategory = 'Prom';
      else if (sourceSuit.category === 'wedding') subcategory = 'Wedding';
      else if (sourceSuit.category === 'formal') subcategory = 'Formal';
      else if (sourceSuit.category === 'casual') subcategory = 'Casual';

      // Create product name with Slim Cut designation
      const productName = `${sourceSuit.name} - ${sourceSuit.fit_type}`;

      // Smart attributes based on suit type
      const smartAttributes = {
        fit_type: 'slim_cut',
        lapel_style: sourceSuit.is_tuxedo ? 'peak' : 'notch',
        vent_style: 'double',
        button_count: 2,
        canvas_type: 'half_canvas',
        formality_level: sourceSuit.formality_level || (sourceSuit.is_tuxedo ? 5 : 4),
        conservative_rating: 7,
        weather_suitability: {
          spring: 9,
          summer: 7,
          fall: 9,
          winter: 8
        }
      };

      // Create the product
      const product = await targetPrisma.product.create({
        data: {
          name: productName,
          description: sourceSuit.description || `Premium ${mappedColor.toLowerCase()} suit with modern slim cut tailoring`,
          longDescription: `${sourceSuit.description || ''} Features modern slim cut tailoring for the contemporary gentleman. ${sourceSuit.is_tuxedo ? 'Tuxedo styling with satin lapels.' : ''} Perfect for ${subcategory.toLowerCase()} occasions.`,
          category: "Suits",
          subcategory: subcategory,
          price: parseFloat(sourceSuit.base_price_2pc),
          compareAtPrice: parseFloat(sourceSuit.base_price_2pc) + 100,
          sku: `KCT-${sourceSuit.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 20)}-${sourceSuit.id}`,
          slug: sourceSuit.slug || sourceSuit.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          
          // Smart Product Attributes
          smartAttributes,
          fabricMarketing: sourceSuit.is_tuxedo ? "Premium Tuxedo Fabric" : "Performance Suit Fabric",
          fabricCare: "Professional dry clean recommended",
          fabricBenefits: [
            "wrinkle-resistant",
            "breathable", 
            "comfortable stretch",
            "shape-retention"
          ],
          
          // Color Intelligence
          colorFamily: mappedColor.includes('Gray') ? 'Greys' : 
                      mappedColor.includes('Blue') ? 'Blues' :
                      mappedColor.includes('Black') ? 'Blacks' :
                      mappedColor.includes('Red') || mappedColor === 'Wine' || mappedColor === 'Burgundy' ? 'Reds' :
                      mappedColor.includes('Brown') || mappedColor === 'Tan' ? 'Browns' :
                      mappedColor.includes('Green') ? 'Greens' :
                      mappedColor.includes('White') ? 'Whites' : 'Others',
          hexPrimary: hexColor,
          
          // Event & Occasion
          primaryOccasion: sourceSuit.category,
          occasionTags: sourceSuit.target_events || [sourceSuit.category],
          trendingFor: sourceSuit.prom_trending ? ['prom2025'] : [],
          
          // Outfit Building Helpers
          outfitRole: "base",
          pairsWellWith: ["dress-shirts", "ties", "pocket-squares", "dress-shoes"],
          styleNotes: `${sourceSuit.fit_type} styling perfect for ${subcategory.toLowerCase()} events`,
          
          // Local SEO
          localKeywords: sourceSuit.local_keywords || [`${mappedColor.toLowerCase()} suit`, `${subcategory.toLowerCase()} suit`, "slim cut"],
          targetLocation: sourceSuit.target_location || "USA",
          
          // Inventory Management
          trackStock: true,
          totalStock: 0, // Will be calculated from variants
          availableStock: 0,
          reservedStock: 0,
          minimumStock: 5,
          reorderPoint: 10,
          reorderQuantity: 25,
          
          // Status & Visibility
          status: "ACTIVE",
          isPublished: true,
          isFeatured: sourceSuit.prom_trending || false,
          isOnSale: false,
          
          // SEO & Marketing
          metaTitle: sourceSuit.meta_title || `${productName} | ${mappedColor} Slim Cut Suit | KCT`,
          metaDescription: sourceSuit.meta_description || `Premium ${mappedColor.toLowerCase()} slim cut suit perfect for ${subcategory.toLowerCase()}. Modern tailoring with classic style.`,
          tags: [
            subcategory.toLowerCase(),
            mappedColor.toLowerCase(),
            "slim-cut",
            sourceSuit.is_tuxedo ? "tuxedo" : "suit",
            ...(sourceSuit.prom_trending ? ["prom", "prom2025"] : [])
          ],
          
          occasions: [subcategory.toLowerCase()],
          styleAttributes: ["slim-cut", "modern", sourceSuit.is_tuxedo ? "formal" : "versatile"],
        }
      });

      createdProducts++;
      console.log(`✅ Created product: ${product.name}`);

      // Create variants based on source variants if they exist
      const sourceVariants: any[] = await sourcePrisma.$queryRaw`
        SELECT * FROM suit_variants 
        WHERE suit_id = ${sourceSuit.id}
        AND is_active = true;
      `;

      let stockTotal = 0;

      if (sourceVariants.length > 0) {
        // Use actual variants from source
        for (const sourceVariant of sourceVariants) {
          const sizeLabel = `${sourceVariant.chest_size}${sourceVariant.length_type}`;
          const pieces = sourceVariant.piece_count === 3 ? '3-Piece (with Vest)' : '2-Piece';
          const variantPrice = parseFloat(sourceVariant.price);
          
          variantBatch.push({
            productId: product.id,
            name: `${product.name} - ${pieces} - ${sizeLabel}`,
            sku: sourceVariant.sku,
            size: sizeLabel,
            color: mappedColor,
            material: pieces,
            price: variantPrice,
            compareAtPrice: variantPrice + 100,
            stock: sourceVariant.inventory_quantity || 10,
            isActive: sourceVariant.is_active,
            position: suitSizes.indexOf(sourceVariant.chest_size.toString()) * lengthTypes.length + 
                     lengthTypes.indexOf(sourceVariant.length_type)
          });
          
          stockTotal += sourceVariant.inventory_quantity || 10;
          createdVariants++;
        }
      } else {
        // Create standard variants if source has none
        const hasVest = sourceSuit.name.includes('with Vest') || sourceSuit.name.includes('With Vest');
        const pieceOptions = hasVest ? ['2-Piece', '3-Piece (with Vest)'] : ['2-Piece'];
        
        for (const pieces of pieceOptions) {
          for (const size of suitSizes) {
            for (const length of lengthTypes) {
              const sizeLabel = `${size}${length}`;
              const variantPrice = pieces.includes('3-Piece') ? 
                parseFloat(sourceSuit.base_price_3pc) : 
                parseFloat(sourceSuit.base_price_2pc);
              const stock = 5;
              
              variantBatch.push({
                productId: product.id,
                name: `${product.name} - ${pieces} - ${sizeLabel}`,
                sku: `${product.sku}-${pieces.replace(/[^A-Z0-9]/g, '')}-${sizeLabel}`,
                size: sizeLabel,
                color: mappedColor,
                material: pieces,
                price: variantPrice,
                compareAtPrice: variantPrice + 100,
                stock: stock,
                isActive: true,
                position: suitSizes.indexOf(size) * lengthTypes.length + lengthTypes.indexOf(length)
              });
              
              stockTotal += stock;
              createdVariants++;
            }
          }
        }
      }

      // Update product stock totals
      await targetPrisma.product.update({
        where: { id: product.id },
        data: { 
          totalStock: stockTotal,
          availableStock: stockTotal 
        }
      });
    }

    // Process all variants in batches
    console.log(`\n\n📦 Creating ${variantBatch.length} variants in batches...`);
    const batchSize = 100;
    for (let i = 0; i < variantBatch.length; i += batchSize) {
      const batch = variantBatch.slice(i, i + batchSize);
      await targetPrisma.productVariant.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(variantBatch.length / batchSize)} complete`);
    }

    // Step 4: Add Regular Fit versions for business suits
    console.log('\n\n🔧 Adding Regular Fit versions for business suits...');
    
    const businessSuits = ['Navy', 'Charcoal', 'Black', 'Dark Gray', 'Light Gray', 'Brown'];
    let regularFitProducts = 0;

    for (const color of businessSuits) {
      // Check if we have a slim cut version
      const slimSuit = await targetPrisma.product.findFirst({
        where: {
          category: 'Suits',
          name: {
            contains: color,
            mode: 'insensitive'
          }
        }
      });

      if (slimSuit && !slimSuit.name.includes('Regular Fit')) {
        // Create Regular Fit version
        const regularFitName = slimSuit.name.replace('Slim Cut', 'Regular Fit').replace('Suit -', 'Business Suit -');
        
        const regularFit = await targetPrisma.product.create({
          data: {
            ...slimSuit,
            id: undefined,
            name: regularFitName,
            sku: slimSuit.sku + '-REGULARFIT',
            slug: slimSuit.slug + '-regular-fit',
            description: slimSuit.description?.replace('slim cut', 'regular fit') || '',
            longDescription: slimSuit.longDescription?.replace('slim cut', 'regular fit').replace('modern', 'classic') || '',
            smartAttributes: {
              ...slimSuit.smartAttributes as any,
              fit_type: 'regular_fit'
            },
            styleNotes: 'Classic regular fit perfect for traditional business wear',
            createdAt: undefined,
            updatedAt: undefined
          }
        });

        regularFitProducts++;

        // Create variants for regular fit
        const slimVariants = await targetPrisma.productVariant.findMany({
          where: { productId: slimSuit.id }
        });

        for (const variant of slimVariants) {
          await targetPrisma.productVariant.create({
            data: {
              ...variant,
              id: undefined,
              productId: regularFit.id,
              name: variant.name.replace('Slim Cut', 'Regular Fit'),
              sku: variant.sku + '-RF',
              createdAt: undefined,
              updatedAt: undefined
            }
          });
        }
      }
    }

    console.log(`✅ Created ${regularFitProducts} Regular Fit versions`);

    // Final summary
    console.log('\n\n🎉 SUIT SYNCHRONIZATION COMPLETE!');
    console.log(`📊 Created ${createdProducts} Slim Cut products from source`);
    console.log(`📊 Created ${regularFitProducts} Regular Fit versions`);
    console.log(`📊 Total products: ${createdProducts + regularFitProducts}`);
    console.log(`📊 Total variants created: ${createdVariants + (regularFitProducts * 48)}`); // Assuming 48 variants per regular fit

    // Verify final counts
    const finalProductCount = await targetPrisma.product.count({
      where: { category: 'Suits' }
    });
    const finalVariantCount = await targetPrisma.productVariant.count({
      where: {
        product: { category: 'Suits' }
      }
    });

    console.log(`\n✅ Verified: ${finalProductCount} suit products with ${finalVariantCount} variants`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

syncSuitsFromSource();