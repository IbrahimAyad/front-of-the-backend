import { PrismaClient } from '@prisma/client';

const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:RqSEeoKLQwnXPDJFLmQqRMbrzPjkRUzV@ballast.proxy.rlwy.net:22627/railway"
    }
  }
});

const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

// Color harmony rules for smart pairing
const COLOR_PAIRING_RULES = {
  // Suit color -> Recommended tie colors
  'navy': ['burgundy', 'silver', 'red', 'pink', 'gold', 'orange'],
  'charcoal': ['burgundy', 'red', 'silver', 'blue', 'purple', 'pink'],
  'black': ['silver', 'white', 'red', 'gold', 'royal-blue'],
  'grey': ['burgundy', 'navy', 'pink', 'purple', 'green'],
  'brown': ['orange', 'gold', 'green', 'burgundy', 'blue'],
  'tan': ['navy', 'brown', 'green', 'burgundy', 'orange']
};

// Event formality mapping
const EVENT_FORMALITY = {
  'weddings': 4,
  'proms': 4,
  'business': 4,
  'homecoming': 3,
  'graduations': 4,
  'galas': 5,
  'holiday-parties': 3
};

async function migrateTies() {
  console.log('🎀 Starting Tie Migration with Smart Pairing...\n');
  
  try {
    // Step 1: Import Colors
    console.log('🎨 Step 1: Importing Tie Colors...');
    const sourceColors = await sourcePrisma.$queryRaw`
      SELECT c.*, cf.name as family_name 
      FROM colors c 
      JOIN color_families cf ON c.color_family_id = cf.id
    `;
    
    let colorMap = new Map();
    let newColorCount = 0;
    
    for (const color of sourceColors as any[]) {
      // Check if color already exists
      const existingColor = await targetPrisma.colorPalette.findFirst({
        where: { 
          OR: [
            { slug: color.slug },
            { name: color.name }
          ]
        }
      });
      
      if (!existingColor) {
        const newColor = await targetPrisma.colorPalette.create({
          data: {
            name: color.name,
            slug: color.slug,
            family: color.family_name,
            hexCode: color.hex_primary,
            displayOrder: color.sort_order || 99,
            formalityScore: color.is_formal ? 4 : 3,
            versatilityScore: 4,
            seasonality: ['spring', 'summer', 'fall', 'winter']
          }
        });
        colorMap.set(color.id, newColor.id);
        newColorCount++;
      } else {
        colorMap.set(color.id, existingColor.id);
      }
    }
    
    console.log(`✅ Imported ${newColorCount} new colors (${colorMap.size} total mapped)\n`);
    
    // Step 2: Import Tie Products
    console.log('👔 Step 2: Importing Tie Products...');
    const tieProducts = await sourcePrisma.$queryRaw`SELECT * FROM products`;
    
    let productMap = new Map();
    
    for (const tie of tieProducts as any[]) {
      console.log(`\n📦 Creating: ${tie.name}`);
      
      // Determine width category
      const widthCategory = tie.width_inches === 3.25 ? 'regular' :
                           tie.width_inches === 2.25 ? 'skinny' :
                           tie.width_inches === 2.75 ? 'medium' : 'bow';
      
      // Create smart attributes for pairing
      const smartAttributes = {
        // Tie specifications
        widthCategory,
        widthInches: tie.width_inches,
        lengthInches: tie.length_inches,
        tieType: tie.product_type,
        
        // Style scoring
        formalityLevel: widthCategory === 'skinny' ? 3 : 4,
        versatilityScore: widthCategory === 'medium' ? 5 : 4,
        ageAppropriate: widthCategory === 'skinny' ? ['young', 'middle'] : ['young', 'middle', 'mature'],
        
        // Smart pairing rules
        suitPairing: {
          recommendedSuits: ['navy', 'charcoal', 'grey'],
          avoidWithSuits: [], // Will be populated based on color
          formalityRange: [3, 5]
        },
        
        // Visual harmony
        patternType: 'solid',
        textureType: 'smooth',
        shineLevel: 'matte'
      };
      
      const product = await targetPrisma.product.create({
        data: {
          name: tie.name,
          description: tie.description,
          longDescription: `${tie.description} Made from premium microfiber for a luxurious feel and wrinkle resistance.`,
          category: 'Ties',
          subcategory: tie.name,
          price: parseFloat(tie.base_price),
          compareAtPrice: parseFloat(tie.base_price) + 10,
          sku: tie.sku_prefix,
          slug: tie.slug,
          
          // Smart attributes
          smartAttributes,
          fabricMarketing: "Premium Microfiber",
          fabricCare: tie.care_instructions,
          fabricBenefits: ['wrinkle-resistant', 'stain-resistant', 'colorfast', 'soft-touch'],
          
          // SEO
          metaTitle: tie.meta_title,
          metaDescription: tie.meta_description,
          
          // Inventory
          totalStock: 0, // Will be updated from variants
          isPublished: tie.is_active,
          status: tie.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          
          // Outfit building
          outfitRole: 'accent',
          styleNotes: `Width: ${tie.width_inches}". ${widthCategory === 'skinny' ? 'Perfect for modern, youthful looks.' : 'Classic professional style.'}`,
          
          // Arrays
          occasions: [],
          styleAttributes: tie.features || [],
          tags: ['ties', widthCategory, tie.product_type],
          pairsWellWith: [],
          localKeywords: [],
          fabricBenefits: ['wrinkle-resistant', 'stain-resistant']
        }
      });
      
      productMap.set(tie.id, product.id);
      console.log(`✅ Created: ${product.name}`);
    }
    
    // Step 3: Import Variants with Smart Color Pairing
    console.log('\n\n🎨 Step 3: Importing Tie Variants with Color Intelligence...');
    const variants = await sourcePrisma.$queryRaw`
      SELECT pv.*, c.name as color_name, c.slug as color_slug, c.hex_primary,
             cf.name as color_family
      FROM product_variants pv
      JOIN colors c ON pv.color_id = c.id
      JOIN color_families cf ON c.color_family_id = cf.id
      WHERE pv.stock_quantity > 0
      ORDER BY pv.product_id, c.name
    `;
    
    let variantCount = 0;
    let currentProductId = null;
    let productStockTotals = new Map();
    
    for (const variant of variants as any[]) {
      const targetProductId = productMap.get(variant.product_id);
      if (!targetProductId) continue;
      
      if (currentProductId !== variant.product_id) {
        currentProductId = variant.product_id;
        console.log(`\n🎀 Importing variants for Product ID: ${variant.product_id}`);
      }
      
      // Determine which suit colors this tie pairs well with
      const tieColorFamily = variant.color_family.toLowerCase();
      const pairsWellWithSuits = [];
      const avoidWithSuits = [];
      
      // Apply color harmony rules
      for (const [suitColor, recommendedTies] of Object.entries(COLOR_PAIRING_RULES)) {
        if (recommendedTies.some(tc => 
          variant.color_slug.includes(tc) || 
          variant.color_name.toLowerCase().includes(tc)
        )) {
          pairsWellWithSuits.push(suitColor);
        }
        
        // Avoid same color pairing
        if (variant.color_slug.includes(suitColor) && !variant.color_name.toLowerCase().includes('pattern')) {
          avoidWithSuits.push(suitColor);
        }
      }
      
      // Enhanced variant data
      const variantName = `${variant.color_name} Tie`;
      
      await targetPrisma.productVariant.create({
        data: {
          productId: targetProductId,
          name: variantName,
          sku: variant.sku,
          barcode: variant.barcode,
          
          // Store color and pairing data in material field as JSON
          material: JSON.stringify({
            color: {
              name: variant.color_name,
              hex: variant.hex_primary,
              family: variant.color_family
            },
            pairing: {
              suitColors: pairsWellWithSuits,
              avoidWith: avoidWithSuits,
              contrastLevel: tieColorFamily === 'blacks' || tieColorFamily === 'whites' ? 'high' : 'medium'
            }
          }),
          
          size: 'One Size', // Ties are typically one size
          color: variant.color_name,
          
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          stock: variant.stock_quantity || 0,
          isActive: variant.is_active
        }
      });
      
      // Track total stock
      const currentTotal = productStockTotals.get(targetProductId) || 0;
      productStockTotals.set(targetProductId, currentTotal + (variant.stock_quantity || 0));
      
      variantCount++;
      if (variantCount % 10 === 0) {
        console.log(`  ✓ Imported ${variantCount} variants...`);
      }
    }
    
    console.log(`\n✅ Imported ${variantCount} tie variants`);
    
    // Step 4: Update product stock totals
    console.log('\n📊 Step 4: Updating Stock Totals...');
    for (const [productId, totalStock] of productStockTotals) {
      await targetPrisma.product.update({
        where: { id: productId },
        data: { 
          totalStock,
          availableStock: totalStock
        }
      });
    }
    
    // Step 5: Import Events and Link to Products
    console.log('\n🎉 Step 5: Importing Event Associations...');
    const events = await sourcePrisma.$queryRaw`SELECT * FROM events`;
    
    for (const event of events as any[]) {
      // Update products with event associations
      await targetPrisma.product.updateMany({
        where: { category: 'Ties' },
        data: {
          occasionTags: {
            push: event.slug
          }
        }
      });
      
      // Create or update event profile
      await targetPrisma.eventProfile.upsert({
        where: { slug: event.slug },
        update: {
          popularColors: {
            push: event.preferred_colors || []
          }
        },
        create: {
          name: event.name,
          slug: event.slug,
          description: event.description,
          formalityRange: [EVENT_FORMALITY[event.slug as keyof typeof EVENT_FORMALITY] || 3, 5],
          seasonalPeak: event.season_relevance || ['all'],
          essentialItems: ['suit', 'shirt', 'tie'],
          popularColors: event.preferred_colors || [],
          trendingStyles: ['modern-fit', 'slim-fit']
        }
      });
    }
    
    console.log('\n✨ Tie migration completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`  - ${newColorCount} new colors added`);
    console.log(`  - ${productMap.size} tie products imported`);
    console.log(`  - ${variantCount} color variants created`);
    console.log(`  - Smart pairing rules applied to all variants`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateTies();