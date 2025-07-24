import { PrismaClient } from '@prisma/client';

const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway"
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

// 6-drop sizing chart
const SIZING_CHART = {
  '36': { waist: '30', drop: 6 },
  '38': { waist: '32', drop: 6 },
  '40': { waist: '34', drop: 6 },
  '42': { waist: '36', drop: 6 },
  '44': { waist: '38', drop: 6 },
  '46': { waist: '40', drop: 6 },
  '48': { waist: '42', drop: 6 },
  '50': { waist: '44', drop: 6 },
  '52': { waist: '46', drop: 6 },
  '54': { waist: '48', drop: 6 },
  '56': { waist: '50', drop: 6 },
  '58': { waist: '52', drop: 6 },
  '60': { waist: '54', drop: 6 },
};

async function importRemainingSuits() {
  console.log('🚀 Importing remaining 19 suits with 6-drop sizing...\n');
  
  try {
    // Get already migrated suit slugs
    const existingSuits = await targetPrisma.product.findMany({
      where: { category: 'Suits' },
      select: { slug: true }
    });
    const existingSlugs = new Set(existingSuits.map(s => s.slug));
    
    // Get remaining suits from source
    const remainingSuits = await sourcePrisma.$queryRaw`
      SELECT * FROM suits 
      WHERE is_active = true 
      AND slug NOT IN (${existingSlugs.size > 0 ? Array.from(existingSlugs).join("','") : "''"})
      ORDER BY name
    `;
    
    console.log(`Found ${(remainingSuits as any[]).length} suits to import\n`);
    
    let productCount = 0;
    let variantCount = 0;
    
    for (const suit of remainingSuits as any[]) {
      console.log(`\n📦 Processing: ${suit.name}`);
      
      // Determine fabric marketing name
      const fabricMarketing = suit.is_tuxedo 
        ? "Premium Tuxedo Fabric" 
        : "Performance Fabric";
      
      // Create smart attributes with sizing info
      const smartAttributes = {
        formality_level: suit.formality_level || 4,
        conservative_rating: 4,
        color_temperature: suit.base_color.includes('blue') ? 'cool' : 'neutral',
        event_suitability: suit.target_events || [],
        age_appropriateness: suit.prom_trending ? ['young'] : ['young', 'middle', 'mature'],
        style_personality: ['modern', 'classic'],
        sizing: {
          type: 'nested',
          dropPattern: 6,
          description: 'Classic 6-drop sizing (6" difference between jacket chest and pants waist)'
        }
      };
      
      try {
        // Create the product
        const product = await targetPrisma.product.create({
          data: {
            name: suit.name,
            description: suit.description || `Premium ${suit.category} suit in ${suit.base_color}`,
            longDescription: `${suit.meta_description || ''} Crafted with our signature performance fabric for all-day comfort and style. Features classic 6-drop nested sizing.`,
            category: 'Suits',
            subcategory: suit.category,
            price: parseFloat(suit.base_price_2pc),
            compareAtPrice: parseFloat(suit.base_price_2pc) + 100,
            sku: `KCT-${suit.slug.toUpperCase().replace(/-/g, '')}`,
            slug: suit.slug,
            
            // Smart attributes
            smartAttributes,
            fabricMarketing,
            fabricCare: "Professional dry clean recommended",
            fabricBenefits: [
              "wrinkle-resistant",
              "breathable",
              "comfortable stretch",
              "shape-retention"
            ],
            
            // Color
            colorFamily: suit.base_color.includes('blue') ? 'Blues' : 
                        suit.base_color.includes('grey') || suit.base_color.includes('gray') ? 'Greys' :
                        suit.base_color.includes('black') ? 'Blacks' : 
                        suit.base_color.includes('burgundy') || suit.base_color.includes('red') ? 'Reds' : 
                        suit.base_color.includes('green') ? 'Greens' : 'Other',
            
            // Occasions
            primaryOccasion: suit.category,
            occasionTags: suit.target_events || [],
            trendingFor: suit.prom_trending ? ['prom2025'] : [],
            
            // SEO
            metaTitle: suit.meta_title,
            metaDescription: suit.meta_description,
            localKeywords: suit.local_keywords || [],
            targetLocation: suit.target_location,
            
            // Inventory
            totalStock: 0,
            isPublished: suit.is_active,
            isFeatured: suit.prom_trending || false,
            
            // Outfit building
            outfitRole: 'base',
            styleNotes: `Perfect for ${suit.target_events ? suit.target_events.join(', ') : suit.category} occasions. Features classic 6-drop nested sizing for a tailored fit.`,
            
            // Set empty arrays for required fields
            occasions: suit.target_events || [],
            styleAttributes: ['Modern', 'Professional'],
            tags: suit.target_events || [],
            pairsWellWith: [],
            localKeywords: suit.local_keywords || [],
          }
        });
        
        console.log(`✅ Created product: ${product.name}`);
        productCount++;
        
        // Get variants for this suit
        const variants = await sourcePrisma.$queryRaw`
          SELECT * FROM suit_variants 
          WHERE suit_id = ${suit.id} 
          AND is_active = true
          ORDER BY chest_size, length_type, piece_count
        `;
        
        console.log(`  📏 Creating ${(variants as any[]).length} variants with 6-drop sizing...`);
        
        // Create variants with 6-drop sizing
        let totalStock = 0;
        for (const variant of variants as any[]) {
          const chestSize = variant.chest_size?.toString();
          const lengthType = variant.length_type || 'R';
          const sizeLabel = `${chestSize}${lengthType}`;
          const pieceName = variant.piece_count === 3 ? '3-Piece' : '2-Piece';
          
          // Get 6-drop sizing data
          const sizingData = SIZING_CHART[chestSize as keyof typeof SIZING_CHART];
          
          if (sizingData) {
            const variantData = await targetPrisma.productVariant.create({
              data: {
                productId: product.id,
                name: `${suit.name} - ${pieceName} - ${sizeLabel}`,
                sku: variant.sku,
                size: sizeLabel,
                price: parseFloat(variant.price),
                compareAtPrice: parseFloat(variant.price) + 100,
                stock: variant.inventory_quantity || 0,
                isActive: variant.is_active,
                // Store sizing data as JSON in material field
                material: JSON.stringify({
                  pieceCount: pieceName,
                  measurements: {
                    chest: chestSize,
                    waist: sizingData.waist,
                    drop: sizingData.drop,
                    length: lengthType
                  }
                })
              }
            });
            
            totalStock += variant.inventory_quantity || 0;
            variantCount++;
            console.log(`    ✓ ${sizeLabel}: Chest ${chestSize}" → Waist ${sizingData.waist}" (${variant.inventory_quantity || 0} in stock)`);
          }
        }
        
        // Update total stock
        await targetPrisma.product.update({
          where: { id: product.id },
          data: { 
            totalStock, 
            availableStock: totalStock 
          }
        });
        
      } catch (error) {
        console.error(`❌ Error creating product ${suit.name}:`, error);
      }
    }
    
    console.log(`\n✅ Successfully imported ${productCount} suits with ${variantCount} variants`);
    console.log('✅ All variants include 6-drop sizing data');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

importRemainingSuits();