import { PrismaClient } from '@prisma/client';
import { SLIM_FIT_MAPPING, CLASSIC_FIT_MAPPING, getShirtRecommendation } from './shirt-size-mapping';

const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

// Dress shirt colors from GitHub service
const SHIRT_COLORS = [
  { name: 'White', slug: 'white', hex: '#FFFFFF', family: 'Whites', universal: true },
  { name: 'Light Blue', slug: 'light-blue', hex: '#ADD8E6', family: 'Blues', universal: true },
  { name: 'Pink', slug: 'pink', hex: '#FFC0CB', family: 'Pinks', bestWith: ['navy', 'charcoal'] },
  { name: 'Navy', slug: 'navy', hex: '#000080', family: 'Blues', bestWith: ['grey', 'tan'] },
  { name: 'Black', slug: 'black', hex: '#000000', family: 'Blacks', formal: true },
  { name: 'Gray', slug: 'gray', hex: '#808080', family: 'Greys', universal: true },
  { name: 'Cream', slug: 'cream', hex: '#FFFDD0', family: 'Whites', seasonal: 'summer' },
  { name: 'Charcoal', slug: 'charcoal', hex: '#36454F', family: 'Greys', formal: true },
  { name: 'Lavender', slug: 'lavender', hex: '#E6E6FA', family: 'Purples', bestWith: ['navy', 'charcoal'] },
  { name: 'Mint', slug: 'mint', hex: '#98FF98', family: 'Greens', seasonal: 'spring' }
];

// Shirt to suit pairing rules
const SHIRT_SUIT_PAIRING = {
  'white': ['all'],
  'light-blue': ['all'],
  'pink': ['navy', 'charcoal', 'grey'],
  'navy': ['light-grey', 'tan', 'beige'],
  'black': ['black', 'charcoal'],
  'gray': ['navy', 'charcoal', 'black'],
  'cream': ['navy', 'brown', 'tan'],
  'charcoal': ['light-grey', 'black'],
  'lavender': ['navy', 'charcoal', 'grey'],
  'mint': ['navy', 'light-grey', 'charcoal']
};

// Shirt to tie pairing rules
const SHIRT_TIE_PAIRING = {
  'white': { avoid: [], recommend: ['all'] },
  'light-blue': { avoid: ['light-blue'], recommend: ['burgundy', 'navy', 'red', 'gold'] },
  'pink': { avoid: ['orange', 'red'], recommend: ['navy', 'grey', 'burgundy'] },
  'navy': { avoid: ['black'], recommend: ['burgundy', 'gold', 'silver', 'red'] },
  'black': { avoid: ['navy', 'brown'], recommend: ['silver', 'white', 'red', 'gold'] },
  'gray': { avoid: [], recommend: ['burgundy', 'navy', 'pink', 'purple'] },
  'cream': { avoid: ['white'], recommend: ['navy', 'brown', 'burgundy', 'green'] },
  'charcoal': { avoid: ['black'], recommend: ['silver', 'light-blue', 'pink', 'burgundy'] },
  'lavender': { avoid: ['pink'], recommend: ['navy', 'purple', 'grey', 'burgundy'] },
  'mint': { avoid: ['green'], recommend: ['navy', 'brown', 'burgundy', 'grey'] }
};

async function migrateDressShirts() {
  console.log('👔 Starting Dress Shirt Migration with Smart Sizing...\n');
  
  try {
    // Step 1: Create Slim Fit Products (from GitHub service)
    console.log('📦 Step 1: Creating Slim Fit Dress Shirts...');
    
    let productCount = 0;
    let variantCount = 0;
    
    for (const color of SHIRT_COLORS) {
      console.log(`\nCreating Slim Fit - ${color.name}`);
      
      // Smart attributes for pairing
      const smartAttributes = {
        // Shirt specifications
        shirtType: 'dress-shirt',
        fitType: 'slim',
        collarType: 'button-down',
        cuffType: 'adjustable',
        fabric: '100% Cotton Oxford',
        weave: 'oxford',
        
        // Fit intelligence
        fitFormality: 4,
        slimCut: true,
        chestReduction: 2, // 2" slimmer than classic
        
        // Color intelligence
        colorUniversal: color.universal || false,
        colorFormal: color.formal || false,
        colorSeasonal: color.seasonal || 'all-season',
        
        // Pairing rules
        suitPairing: {
          universal: color.universal || false,
          bestWith: SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || [],
          colorHarmony: color.family
        },
        
        tiePairing: SHIRT_TIE_PAIRING[color.slug as keyof typeof SHIRT_TIE_PAIRING] || {},
        
        // Sizing intelligence
        sizeMapping: SLIM_FIT_MAPPING,
        sizeRuns: 'small', // Important note for customers
        sizeRecommendation: 'Size up if between sizes or prefer relaxed fit'
      };
      
      const product = await targetPrisma.product.create({
        data: {
          name: `${color.name} Dress Shirt - Slim Fit`,
          description: `Premium Oxford dress shirt in ${color.name.toLowerCase()}. Slim modern fit with button-down collar.`,
          longDescription: `Crafted from 100% Cotton Oxford fabric for comfort and durability. Features button-down collar, adjustable cuffs, and single chest pocket. Slim fit design tapers through the body and arms for a modern silhouette.`,
          category: 'Shirts',
          subcategory: 'Dress Shirts - Slim',
          price: color.name === 'White' || color.name === 'Light Blue' ? 59.99 : 64.99,
          compareAtPrice: 79.99,
          sku: `KCT-DS-SLIM-${color.slug.toUpperCase()}`,
          slug: `dress-shirt-slim-${color.slug}`,
          
          // Smart attributes
          smartAttributes,
          fabricMarketing: "Premium Cotton Oxford",
          fabricCare: "Machine wash cold, tumble dry low, warm iron",
          fabricBenefits: ['breathable', 'durable', 'easy-care', 'all-day-comfort'],
          
          // Color
          colorFamily: color.family,
          
          // Outfit building
          outfitRole: 'base',
          pairsWellWith: SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || [],
          styleNotes: color.universal ? 
            'Universal color - pairs with all suit colors' : 
            `Best with ${(SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || []).join(', ')} suits`,
          
          // SEO
          metaTitle: `${color.name} Slim Fit Dress Shirt | Cotton Oxford | KCT`,
          metaDescription: `Premium ${color.name.toLowerCase()} dress shirt in slim fit. 100% cotton Oxford, button-down collar. Perfect for business and formal wear.`,
          
          // Status
          totalStock: 0,
          isPublished: true,
          status: 'ACTIVE',
          
          // Arrays
          occasions: ['business', 'wedding', 'formal'],
          styleAttributes: ['slim-fit', 'modern', 'oxford', 'button-down'],
          tags: ['dress-shirt', 'slim-fit', color.slug, 'cotton', 'oxford'],
          localKeywords: [`${color.name} dress shirt`, 'slim fit shirt', 'oxford shirt'],
          fabricBenefits: ['breathable', 'durable', 'easy-care', 'all-day-comfort']
        }
      });
      
      productCount++;
      
      // Create variants for each size
      const slimSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      for (const size of slimSizes) {
        const sizeData = Object.entries(SLIM_FIT_MAPPING).find(([, v]) => v.size === size)?.[1];
        
        await targetPrisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${color.name} Slim Fit - Size ${size}`,
            sku: `${product.sku}-${size}`,
            size,
            color: color.name,
            // Store detailed sizing in material field
            material: JSON.stringify({
              fit: 'slim',
              measurements: sizeData || { size },
              suitMapping: Object.entries(SLIM_FIT_MAPPING)
                .filter(([, v]) => v.size === size)
                .map(([suit]) => suit)
            }),
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: 50, // Default stock
            isActive: true
          }
        });
        variantCount++;
      }
      
      // Update total stock
      await targetPrisma.product.update({
        where: { id: product.id },
        data: { 
          totalStock: 300, // 50 per size * 6 sizes
          availableStock: 300
        }
      });
    }
    
    console.log(`\n✅ Created ${productCount} slim fit products with ${variantCount} variants`);
    
    // Step 2: Create Classic Fit Products
    console.log('\n\n📦 Step 2: Creating Classic Fit Dress Shirts...');
    
    // For now, we'll create classic fit for key colors only
    const classicColors = ['white', 'light-blue', 'pink', 'navy'];
    
    for (const colorSlug of classicColors) {
      const color = SHIRT_COLORS.find(c => c.slug === colorSlug);
      if (!color) continue;
      
      console.log(`\nCreating Classic Fit - ${color.name}`);
      
      const smartAttributes = {
        shirtType: 'dress-shirt',
        fitType: 'classic',
        collarType: 'button-down',
        cuffType: 'adjustable',
        fabric: '100% Cotton Oxford',
        weave: 'oxford',
        fitFormality: 4,
        classicCut: true,
        chestReduction: 0,
        colorUniversal: color.universal || false,
        suitPairing: {
          universal: color.universal || false,
          bestWith: SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || [],
        },
        tiePairing: SHIRT_TIE_PAIRING[color.slug as keyof typeof SHIRT_TIE_PAIRING] || {},
        sizeMapping: 'neck-x-sleeve',
        sizeRuns: 'true-to-size',
        sizeRecommendation: 'Order your normal dress shirt size'
      };
      
      const product = await targetPrisma.product.create({
        data: {
          name: `${color.name} Dress Shirt - Classic Fit`,
          description: `Premium Oxford dress shirt in ${color.name.toLowerCase()}. Classic fit with traditional sizing.`,
          longDescription: `Crafted from 100% Cotton Oxford fabric. Traditional generous cut provides comfortable room through body and arms. Available in neck/sleeve sizing for precise fit.`,
          category: 'Shirts',
          subcategory: 'Dress Shirts - Classic',
          price: 69.99,
          compareAtPrice: 89.99,
          sku: `KCT-DS-CLASSIC-${color.slug.toUpperCase()}`,
          slug: `dress-shirt-classic-${color.slug}`,
          smartAttributes,
          fabricMarketing: "Premium Cotton Oxford",
          fabricCare: "Machine wash cold, tumble dry low, warm iron",
          fabricBenefits: ['breathable', 'durable', 'easy-care', 'all-day-comfort'],
          colorFamily: color.family,
          outfitRole: 'base',
          pairsWellWith: SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || [],
          styleNotes: `Classic fit - true to size. ${color.universal ? 'Pairs with all suits' : `Best with ${(SHIRT_SUIT_PAIRING[color.slug as keyof typeof SHIRT_SUIT_PAIRING] || []).join(', ')} suits`}`,
          metaTitle: `${color.name} Classic Fit Dress Shirt | Cotton Oxford | KCT`,
          metaDescription: `Premium ${color.name.toLowerCase()} dress shirt in classic fit. Traditional sizing, 100% cotton Oxford.`,
          totalStock: 0,
          isPublished: true,
          status: 'ACTIVE',
          occasions: ['business', 'wedding', 'formal'],
          styleAttributes: ['classic-fit', 'traditional', 'oxford', 'button-down'],
          tags: ['dress-shirt', 'classic-fit', color.slug, 'cotton', 'oxford'],
          localKeywords: [`${color.name} dress shirt`, 'classic fit shirt', 'traditional fit'],
          fabricBenefits: ['breathable', 'durable', 'easy-care', 'all-day-comfort']
        }
      });
      
      productCount++;
      
      // Create key classic sizes (subset for demo)
      const keySizes = [
        { neck: 15.5, sleeve: '34-35' },
        { neck: 16, sleeve: '34-35' },
        { neck: 16.5, sleeve: '34-35' },
        { neck: 17, sleeve: '34-35' },
        { neck: 17.5, sleeve: '34-35' }
      ];
      
      for (const size of keySizes) {
        const sizeLabel = `${size.neck} x ${size.sleeve}`;
        
        await targetPrisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${color.name} Classic - ${sizeLabel}`,
            sku: `${product.sku}-${size.neck}-${size.sleeve.replace('-', '')}`,
            size: sizeLabel,
            color: color.name,
            material: JSON.stringify({
              fit: 'classic',
              measurements: { neck: size.neck, sleeve: size.sleeve },
              suitMapping: getSuitMappingForClassicSize(size.neck, size.sleeve)
            }),
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: 30,
            isActive: true
          }
        });
        variantCount++;
      }
      
      await targetPrisma.product.update({
        where: { id: product.id },
        data: { 
          totalStock: 150, // 30 per size * 5 sizes
          availableStock: 150
        }
      });
    }
    
    console.log(`\n✅ Total: ${productCount} products with ${variantCount} variants created`);
    
    // Step 3: Create Bundle Templates
    console.log('\n\n🎁 Step 3: Creating Shirt Bundle Templates...');
    
    // Professional Bundle
    await targetPrisma.outfitTemplate.create({
      data: {
        name: 'Professional Shirt Collection',
        description: 'Essential dress shirts for the workplace',
        category: 'Business',
        season: 'All Season',
        basePrice: 149.99,
        discount: 20, // 20% off
        isActive: true,
        isFeatured: true
      }
    });
    
    // Wedding Party Bundle
    await targetPrisma.outfitTemplate.create({
      data: {
        name: 'Wedding Party Shirts',
        description: 'Matching shirts for groomsmen',
        category: 'Wedding',
        season: 'All Season',
        basePrice: 249.99,
        discount: 25, // 25% off for bulk
        isActive: true,
        isFeatured: true
      }
    });
    
    console.log('✅ Created shirt bundle templates');
    
    console.log('\n\n✨ Dress shirt migration completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`  - ${SHIRT_COLORS.length} colors imported`);
    console.log(`  - ${productCount} total products created`);
    console.log(`  - ${variantCount} size variants created`);
    console.log(`  - Smart sizing system implemented`);
    console.log(`  - Pairing rules applied to all products`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await targetPrisma.$disconnect();
  }
}

// Helper function to map classic shirt sizes to suit sizes
function getSuitMappingForClassicSize(neck: number, sleeve: string): string[] {
  const suitMappings: Record<string, string[]> = {
    '15.5-34-35': ['40R'],
    '16-34-35': ['42R'],
    '16.5-34-35': ['44R'],
    '17-34-35': ['46R'],
    '17.5-34-35': ['48R'],
  };
  
  return suitMappings[`${neck}-${sleeve}`] || [];
}

migrateDressShirts();