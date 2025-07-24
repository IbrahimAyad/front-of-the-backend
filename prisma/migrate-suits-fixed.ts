import { PrismaClient } from '@prisma/client';
import { PrismaClient as SuitsClient } from './suits-client';

// First, let's create a simple script to copy the suits models
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

async function migrateSuits() {
  console.log('🚀 Starting Smart Products Migration...\n');
  
  try {
    // First, let's check what we have in the source database
    console.log('📊 Analyzing source database...');
    
    // Query using raw SQL since models might not match
    const suits = await sourcePrisma.$queryRaw`SELECT * FROM suits WHERE is_active = true LIMIT 10`;
    console.log(`Found ${(suits as any[]).length} active suits`);
    
    // Migrate suits as products
    console.log('\n👔 Migrating Suits as Smart Products...');
    
    let productCount = 0;
    for (const suit of suits as any[]) {
      console.log(`\nProcessing: ${suit.name}`);
      
      // Determine fabric marketing name
      const fabricMarketing = suit.is_tuxedo 
        ? "Premium Tuxedo Fabric" 
        : "Performance Fabric";
      
      // Create smart attributes
      const smartAttributes = {
        formality_level: suit.formality_level || 4,
        conservative_rating: 4,
        color_temperature: suit.base_color.includes('blue') ? 'cool' : 'neutral',
        event_suitability: suit.target_events || [],
        age_appropriateness: suit.prom_trending ? ['young'] : ['young', 'middle', 'mature'],
        style_personality: ['modern', 'classic']
      };
      
      try {
        // Create the product
        const product = await targetPrisma.product.create({
          data: {
            name: suit.name,
            description: suit.description || `Premium ${suit.category} suit in ${suit.base_color}`,
            longDescription: `${suit.meta_description || ''} Crafted with our signature performance fabric for all-day comfort and style.`,
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
                        suit.base_color.includes('burgundy') || suit.base_color.includes('red') ? 'Reds' : 'Other',
            
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
            totalStock: 0, // Will be updated from variants
            isPublished: suit.is_active,
            isFeatured: suit.prom_trending || false,
            
            // Outfit building
            outfitRole: 'base',
            styleNotes: `Perfect for ${suit.target_events ? suit.target_events.join(', ') : suit.category} occasions.`,
            
            // Set empty arrays for required fields
            occasions: suit.target_events || [],
            styleAttributes: ['Modern', 'Professional'],
            tags: suit.target_events || [],
            pairsWellWith: [],
            localKeywords: suit.local_keywords || [],
          }
        });
        
        console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);
        productCount++;
        
        // Get variants for this suit
        const variants = await sourcePrisma.$queryRaw`
          SELECT * FROM suit_variants 
          WHERE suit_id = ${suit.id} 
          AND is_active = true
        `;
        
        console.log(`  Found ${(variants as any[]).length} variants`);
        
        // Create variants
        for (const variant of variants as any[]) {
          const sizeLabel = `${variant.chest_size}${variant.length_type || 'R'}`;
          const pieceName = variant.piece_count === 3 ? '3-Piece' : '2-Piece';
          
          await targetPrisma.productVariant.create({
            data: {
              productId: product.id,
              name: `${suit.name} - ${pieceName} - ${sizeLabel}`,
              sku: variant.sku,
              size: sizeLabel,
              price: parseFloat(variant.price),
              compareAtPrice: parseFloat(variant.price) + 100,
              stock: variant.inventory_quantity || 0,
              isActive: variant.is_active,
              material: pieceName, // Store piece count info
            }
          });
        }
        
        // Update total stock
        const totalStock = (variants as any[]).reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
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
    
    console.log(`\n✅ Successfully migrated ${productCount} suits`);
    
    // Create color palette entries
    console.log('\n🎨 Creating Color Palette...');
    const colors = [
      { name: 'Navy Blue', slug: 'navy-blue', family: 'Blues', hexCode: '#000080' },
      { name: 'Royal Blue', slug: 'royal-blue', family: 'Blues', hexCode: '#4169E1' },
      { name: 'Classic Black', slug: 'classic-black', family: 'Blacks', hexCode: '#000000' },
      { name: 'Charcoal Grey', slug: 'charcoal-grey', family: 'Greys', hexCode: '#36454F' },
      { name: 'Light Grey', slug: 'light-grey', family: 'Greys', hexCode: '#D3D3D3' },
      { name: 'Burgundy', slug: 'burgundy', family: 'Reds', hexCode: '#800020' },
    ];
    
    for (const color of colors) {
      await targetPrisma.colorPalette.upsert({
        where: { slug: color.slug },
        update: {},
        create: {
          ...color,
          formalityScore: color.family === 'Blacks' ? 5 : 4,
          versatilityScore: 4,
          seasonality: ['fall', 'winter', 'spring'],
        }
      });
    }
    
    // Create event profiles
    console.log('\n🎉 Creating Event Profiles...');
    const events = [
      {
        name: 'Wedding',
        slug: 'wedding',
        description: 'Perfect attire for wedding ceremonies and receptions',
        formalityRange: [4, 5],
        seasonalPeak: ['spring', 'summer'],
        essentialItems: ['suit', 'shirt', 'tie', 'pocket-square'],
        popularColors: ['navy', 'charcoal', 'light-grey'],
      },
      {
        name: 'Prom',
        slug: 'prom',
        description: 'Trendy formal wear for prom night',
        formalityRange: [4, 5],
        seasonalPeak: ['spring'],
        typicalAge: '16-18',
        essentialItems: ['suit', 'shirt', 'tie', 'boutonniere'],
        popularColors: ['royal-blue', 'burgundy', 'black'],
        trendingStyles: ['slim-fit', 'bold-colors'],
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Professional attire for the modern workplace',
        formalityRange: [3, 4],
        seasonalPeak: ['all'],
        essentialItems: ['suit', 'shirt', 'tie'],
        popularColors: ['navy', 'charcoal', 'grey'],
        trendingStyles: ['modern-fit', 'classic'],
      },
    ];
    
    for (const event of events) {
      await targetPrisma.eventProfile.upsert({
        where: { slug: event.slug },
        update: {},
        create: event as any,
      });
    }
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run migration
migrateSuits();