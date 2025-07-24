import { PrismaClient } from '@prisma/client';

// Source database (suits)
const suitsDB = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway"
    }
  }
});

// Target database (main)
const mainDB = new PrismaClient();

async function migrateSmartProducts() {
  console.log('🚀 Starting Smart Products Migration...\n');
  
  try {
    // Step 1: Migrate Color Palette
    console.log('🎨 Migrating Color Palette...');
    const colors = await suitsDB.colors.findMany({
      include: { color_families: true }
    });
    
    for (const color of colors) {
      await mainDB.colorPalette.upsert({
        where: { slug: color.slug },
        update: {},
        create: {
          name: color.name,
          slug: color.slug,
          family: color.color_families?.name || 'Other',
          hexCode: color.hex_primary,
          displayOrder: color.sort_order,
          formalityScore: color.formality_level || 3,
          versatilityScore: color.conservative_rating || 3,
          seasonality: color.season_tags,
        }
      });
    }
    console.log(`✅ Migrated ${colors.length} colors`);
    
    // Step 2: Migrate Event Profiles
    console.log('\n🎉 Migrating Event Profiles...');
    const events = await suitsDB.event_categories.findMany();
    
    for (const event of events) {
      await mainDB.eventProfile.upsert({
        where: { slug: event.slug },
        update: {},
        create: {
          name: event.name,
          slug: event.slug,
          description: event.description,
          formalityRange: event.formality_range,
          seasonalPeak: event.peak_seasons,
          typicalAge: event.target_age_group,
          essentialItems: ['suit', 'shirt', 'tie'], // Default
          popularColors: ['navy', 'charcoal', 'black'], // Default
          trendingStyles: ['slim-fit', 'modern'], // Default
        }
      });
    }
    console.log(`✅ Migrated ${events.length} event profiles`);
    
    // Step 3: Migrate Suits as Smart Products
    console.log('\n👔 Migrating Suits as Smart Products...');
    const suits = await suitsDB.suits.findMany({
      include: { suit_variants: true }
    });
    
    let productCount = 0;
    let variantCount = 0;
    
    for (const suit of suits) {
      // Determine fabric marketing name
      const fabricMarketing = suit.is_tuxedo 
        ? "Premium Tuxedo Fabric" 
        : "Performance Fabric";
      
      // Create smart attributes
      const smartAttributes = {
        formality_level: suit.formality_level || 4,
        conservative_rating: 4,
        color_temperature: suit.base_color.includes('blue') ? 'cool' : 'neutral',
        event_suitability: suit.target_events,
        age_appropriateness: suit.prom_trending ? ['young'] : ['young', 'middle', 'mature'],
        style_personality: ['modern', 'classic']
      };
      
      // Create the product
      const product = await mainDB.product.create({
        data: {
          name: suit.name,
          description: suit.description || `Premium ${suit.category} suit in ${suit.base_color}`,
          longDescription: `${suit.meta_description || ''} Crafted with our signature performance fabric for all-day comfort and style.`,
          category: 'Suits',
          subcategory: suit.category,
          price: suit.base_price_2pc,
          compareAtPrice: parseFloat(suit.base_price_2pc.toString()) + 100,
          sku: `KCT-${suit.slug.toUpperCase()}`,
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
                      suit.base_color.includes('grey') ? 'Greys' :
                      suit.base_color.includes('black') ? 'Blacks' : 'Other',
          
          // Occasions
          primaryOccasion: suit.category,
          occasionTags: suit.target_events,
          trendingFor: suit.prom_trending ? ['prom2025'] : [],
          
          // SEO
          metaTitle: suit.meta_title,
          metaDescription: suit.meta_description,
          localKeywords: suit.local_keywords || [],
          targetLocation: suit.target_location,
          
          // Inventory
          totalStock: 0, // Will be updated from variants
          isPublished: suit.is_active,
          isFeatured: suit.prom_trending,
          
          // Outfit building
          outfitRole: 'base',
          styleNotes: `Perfect for ${suit.target_events.join(', ')} occasions.`,
        }
      });
      
      productCount++;
      
      // Create variants for each size/length combination
      for (const variant of suit.suit_variants) {
        if (!variant.is_active) continue;
        
        const sizeLabel = `${variant.chest_size}${variant.length_type}`;
        const pieceName = variant.piece_count === 3 ? '3-Piece' : '2-Piece';
        
        await mainDB.productVariant.create({
          data: {
            productId: product.id,
            name: `${suit.name} - ${pieceName} - ${sizeLabel}`,
            sku: variant.sku,
            size: sizeLabel,
            price: variant.price,
            compareAtPrice: parseFloat(variant.price.toString()) + 100,
            stock: variant.inventory_quantity,
            isActive: variant.is_active,
            // Store piece count in material field temporarily
            material: `${pieceName}`,
          }
        });
        
        variantCount++;
      }
      
      // Update total stock
      const totalStock = suit.suit_variants
        .filter(v => v.is_active)
        .reduce((sum, v) => sum + v.inventory_quantity, 0);
      
      await mainDB.product.update({
        where: { id: product.id },
        data: { totalStock, availableStock: totalStock }
      });
    }
    
    console.log(`✅ Migrated ${productCount} suits with ${variantCount} variants`);
    
    // Step 4: Create smart outfit templates
    console.log('\n👔 Creating Smart Outfit Templates...');
    
    const outfitTemplates = [
      {
        name: "Classic Business Professional",
        category: "Business",
        description: "Timeless business outfit perfect for meetings and office wear",
        basePrice: 1499,
      },
      {
        name: "Modern Wedding Guest",
        category: "Wedding",
        description: "Stylish wedding guest outfit with contemporary flair",
        basePrice: 1699,
      },
      {
        name: "Prom Night Special",
        category: "Formal",
        description: "Stand out at prom with this trendy complete outfit",
        basePrice: 1299,
      }
    ];
    
    for (const template of outfitTemplates) {
      await mainDB.outfitTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          description: template.description,
          basePrice: template.basePrice,
          isActive: true,
          isFeatured: true,
        }
      });
    }
    
    console.log(`✅ Created ${outfitTemplates.length} outfit templates`);
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await suitsDB.$disconnect();
    await mainDB.$disconnect();
  }
}

// Run migration
migrateSmartProducts();