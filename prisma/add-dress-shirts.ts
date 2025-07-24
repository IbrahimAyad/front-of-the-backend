import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dressShirts = [
  {
    name: 'Classic White Dress Shirt - French Cuff',
    description: 'Premium white dress shirt with French cuffs and spread collar',
    longDescription: 'Essential white dress shirt crafted from premium Egyptian cotton. Features French cuffs, mother-of-pearl buttons, and a spread collar. Perfect for business meetings, weddings, and formal events.',
    category: 'Shirts',
    subcategory: 'Dress',
    price: '89.99',
    compareAtPrice: '129.99',
    sku: 'KCT-SHIRT-WHITE-FC',
    slug: 'classic-white-dress-shirt-french-cuff',
    fabric: 'Egyptian Cotton',
    pattern: 'Solid',
    season: 'All Season',
    occasions: ['Business', 'Wedding', 'Formal', 'Interview'],
    styleAttributes: ['Classic Fit', 'French Cuff', 'Spread Collar', 'Premium Cotton'],
    care: 'Machine wash cold, hang dry or professional launder',
    
    // Smart attributes
    smartAttributes: {
      formality_level: 5,
      conservative_rating: 5,
      color_temperature: 'neutral',
      event_suitability: ['wedding', 'business', 'formal', 'interview'],
      age_appropriateness: ['young', 'middle', 'mature'],
      style_personality: ['classic', 'professional', 'timeless']
    },
    
    fabricMarketing: 'Premium Egyptian Cotton - All-Day Comfort',
    fabricCare: 'Machine washable or professional launder',
    fabricBenefits: ['breathable', 'wrinkle-resistant', 'premium-cotton', 'comfortable'],
    
    colorFamily: 'Whites',
    hexPrimary: '#FFFFFF',
    
    primaryOccasion: 'business',
    occasionTags: ['business', 'wedding', 'formal', 'interview', 'professional'],
    
    outfitRole: 'essential',
    pairsWellWith: ['navy-suit', 'charcoal-suit', 'black-tuxedo', 'any-tie'],
    styleNotes: 'The ultimate versatile dress shirt. Pairs perfectly with any suit or tuxedo.',
    
    localKeywords: ['white dress shirt', 'french cuff shirt', 'wedding shirt', 'business shirt'],
    
    totalStock: 150,
    availableStock: 145,
    minimumStock: 25,
    reorderPoint: 35,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    
    metaTitle: 'Classic White Dress Shirt French Cuff | Premium Egyptian Cotton',
    metaDescription: 'Premium white dress shirt with French cuffs. Made from Egyptian cotton. Perfect for weddings, business, and formal events.',
    tags: ['white', 'dress shirt', 'french cuff', 'egyptian cotton', 'wedding', 'business']
  },
  
  {
    name: 'Light Blue Dress Shirt - Spread Collar',
    description: 'Sophisticated light blue dress shirt with spread collar',
    longDescription: 'Elevate your professional wardrobe with this light blue dress shirt. Made from premium cotton with a subtle texture. Features a spread collar and barrel cuffs for a modern professional look.',
    category: 'Shirts',
    subcategory: 'Dress',
    price: '79.99',
    compareAtPrice: '109.99',
    sku: 'KCT-SHIRT-LIGHTBLUE-SC',
    slug: 'light-blue-dress-shirt-spread-collar',
    fabric: 'Premium Cotton',
    pattern: 'Solid',
    season: 'All Season',
    occasions: ['Business', 'Casual Friday', 'Meeting', 'Professional'],
    styleAttributes: ['Modern Fit', 'Spread Collar', 'Barrel Cuff', 'Professional'],
    care: 'Machine wash cold, tumble dry low',
    
    smartAttributes: {
      formality_level: 4,
      conservative_rating: 4,
      color_temperature: 'cool',
      event_suitability: ['business', 'professional', 'casual-friday'],
      age_appropriateness: ['young', 'middle'],
      style_personality: ['modern', 'professional', 'approachable']
    },
    
    fabricMarketing: 'Premium Cotton Blend - Professional Comfort',
    fabricCare: 'Easy care machine washable',
    fabricBenefits: ['wrinkle-resistant', 'breathable', 'easy-care', 'professional'],
    
    colorFamily: 'Blues',
    hexPrimary: '#ADD8E6',
    
    primaryOccasion: 'business',
    occasionTags: ['business', 'professional', 'casual-friday', 'meeting'],
    
    outfitRole: 'versatile',
    pairsWellWith: ['navy-suit', 'grey-suit', 'charcoal-suit', 'navy-tie'],
    styleNotes: 'Perfect for business meetings and professional settings. Adds subtle color while maintaining professionalism.',
    
    localKeywords: ['light blue dress shirt', 'business shirt', 'professional shirt', 'spread collar'],
    
    totalStock: 120,
    availableStock: 115,
    minimumStock: 20,
    reorderPoint: 30,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    
    metaTitle: 'Light Blue Dress Shirt Spread Collar | Professional Business Shirt',
    metaDescription: 'Sophisticated light blue dress shirt perfect for business and professional settings. Premium cotton with spread collar.',
    tags: ['light blue', 'dress shirt', 'business', 'professional', 'spread collar']
  },
  
  {
    name: 'Navy Pinstripe Dress Shirt',
    description: 'Classic navy shirt with subtle pinstripes for professional elegance',
    longDescription: 'Sophisticated navy dress shirt featuring subtle pinstripes that add visual interest while maintaining business appropriateness. Made from premium cotton blend with modern fit.',
    category: 'Shirts',
    subcategory: 'Dress',
    price: '84.99',
    compareAtPrice: '119.99',
    sku: 'KCT-SHIRT-NAVY-PINSTRIPE',
    slug: 'navy-pinstripe-dress-shirt',
    fabric: 'Cotton Blend',
    pattern: 'Pinstripe',
    season: 'All Season',
    occasions: ['Business', 'Professional', 'Meeting', 'Conference'],
    styleAttributes: ['Modern Fit', 'Point Collar', 'Barrel Cuff', 'Pinstripe'],
    care: 'Machine wash cold, hang dry',
    
    smartAttributes: {
      formality_level: 4,
      conservative_rating: 4,
      color_temperature: 'cool',
      event_suitability: ['business', 'professional', 'conference'],
      age_appropriateness: ['middle', 'mature'],
      style_personality: ['classic', 'professional', 'distinguished']
    },
    
    fabricMarketing: 'Premium Cotton Blend - Professional Durability',
    fabricCare: 'Easy care machine washable',
    fabricBenefits: ['wrinkle-resistant', 'durable', 'professional', 'pattern-interest'],
    
    colorFamily: 'Blues',
    hexPrimary: '#000080',
    hexSecondary: '#FFFFFF',
    
    primaryOccasion: 'business',
    occasionTags: ['business', 'professional', 'meeting', 'conference'],
    
    outfitRole: 'statement',
    pairsWellWith: ['grey-suit', 'charcoal-suit', 'solid-tie'],
    styleNotes: 'The pinstripe pattern adds sophisticated detail while remaining business-appropriate.',
    
    localKeywords: ['navy pinstripe shirt', 'business pinstripe', 'professional shirt', 'pattern shirt'],
    
    totalStock: 80,
    availableStock: 75,
    minimumStock: 15,
    reorderPoint: 25,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    
    metaTitle: 'Navy Pinstripe Dress Shirt | Professional Pattern Shirt',
    metaDescription: 'Classic navy pinstripe dress shirt for business professionals. Premium cotton blend with sophisticated pattern.',
    tags: ['navy', 'pinstripe', 'dress shirt', 'business', 'professional', 'pattern']
  },
  
  {
    name: 'Charcoal Grey Dress Shirt',
    description: 'Modern charcoal grey dress shirt for contemporary professional style',
    longDescription: 'Contemporary charcoal grey dress shirt that offers a modern alternative to traditional white and blue. Perfect for the fashion-forward professional who wants to stand out subtly.',
    category: 'Shirts',
    subcategory: 'Dress',
    price: '79.99',
    compareAtPrice: '109.99',
    sku: 'KCT-SHIRT-CHARCOAL-GREY',
    slug: 'charcoal-grey-dress-shirt',
    fabric: 'Performance Cotton',
    pattern: 'Solid',
    season: 'All Season',
    occasions: ['Business', 'Modern Professional', 'Creative', 'Evening'],
    styleAttributes: ['Slim Fit', 'Spread Collar', 'Barrel Cuff', 'Modern'],
    care: 'Machine wash cold, tumble dry low',
    
    smartAttributes: {
      formality_level: 4,
      conservative_rating: 3,
      color_temperature: 'neutral',
      event_suitability: ['business', 'creative', 'modern-professional'],
      age_appropriateness: ['young', 'middle'],
      style_personality: ['modern', 'contemporary', 'distinctive']
    },
    
    fabricMarketing: 'Performance Cotton - Modern Professional Comfort',
    fabricCare: 'Easy care performance fabric',
    fabricBenefits: ['wrinkle-resistant', 'moisture-wicking', 'stretch', 'modern'],
    
    colorFamily: 'Greys',
    hexPrimary: '#36454F',
    
    primaryOccasion: 'business',
    occasionTags: ['business', 'modern-professional', 'creative', 'contemporary'],
    
    outfitRole: 'modern-alternative',
    pairsWellWith: ['navy-suit', 'black-suit', 'patterned-tie', 'solid-tie'],
    styleNotes: 'A sophisticated alternative to traditional white shirts. Perfect for the modern professional.',
    
    localKeywords: ['charcoal dress shirt', 'grey dress shirt', 'modern professional', 'contemporary shirt'],
    
    totalStock: 90,
    availableStock: 85,
    minimumStock: 18,
    reorderPoint: 28,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    
    metaTitle: 'Charcoal Grey Dress Shirt | Modern Professional Style',
    metaDescription: 'Contemporary charcoal grey dress shirt for modern professionals. Performance cotton with sophisticated style.',
    tags: ['charcoal', 'grey', 'dress shirt', 'modern', 'professional', 'contemporary']
  }
];

const shirtVariants = [
  // White French Cuff variants
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '14.5', color: 'White', stock: 12 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '15', color: 'White', stock: 18 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '15.5', color: 'White', stock: 25 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '16', color: 'White', stock: 30 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '16.5', color: 'White', stock: 28 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '17', color: 'White', stock: 20 },
  { productSku: 'KCT-SHIRT-WHITE-FC', size: '17.5', color: 'White', stock: 12 },
  
  // Light Blue variants
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '14.5', color: 'Light Blue', stock: 10 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '15', color: 'Light Blue', stock: 15 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '15.5', color: 'Light Blue', stock: 20 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '16', color: 'Light Blue', stock: 25 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '16.5', color: 'Light Blue', stock: 23 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '17', color: 'Light Blue', stock: 15 },
  { productSku: 'KCT-SHIRT-LIGHTBLUE-SC', size: '17.5', color: 'Light Blue', stock: 7 },
  
  // Navy Pinstripe variants
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '15', color: 'Navy', stock: 8 },
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '15.5', color: 'Navy', stock: 12 },
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '16', color: 'Navy', stock: 18 },
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '16.5', color: 'Navy', stock: 20 },
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '17', color: 'Navy', stock: 12 },
  { productSku: 'KCT-SHIRT-NAVY-PINSTRIPE', size: '17.5', color: 'Navy', stock: 5 },
  
  // Charcoal Grey variants
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '15', color: 'Charcoal', stock: 10 },
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '15.5', color: 'Charcoal', stock: 15 },
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '16', color: 'Charcoal', stock: 20 },
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '16.5', color: 'Charcoal', stock: 22 },
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '17', color: 'Charcoal', stock: 13 },
  { productSku: 'KCT-SHIRT-CHARCOAL-GREY', size: '17.5', color: 'Charcoal', stock: 5 },
];

async function addDressShirts() {
  console.log('🔄 Starting dress shirt collection update...');
  
  try {
    let addedCount = 0;
    let variantCount = 0;
    
    for (const shirt of dressShirts) {
      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { sku: shirt.sku }
      });
      
      if (existing) {
        console.log(`⚠️  Product ${shirt.sku} already exists, skipping...`);
        continue;
      }
      
      // Create the product
      const product = await prisma.product.create({
        data: {
          ...shirt,
          price: shirt.price,
          compareAtPrice: shirt.compareAtPrice,
        }
      });
      
      console.log(`✅ Added: ${product.name} (${product.sku})`);
      addedCount++;
      
      // Add variants for this product
      const productVariants = shirtVariants.filter(v => v.productSku === shirt.sku);
      
      for (const variant of productVariants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${variant.size} - ${variant.color}`,
            sku: `${shirt.sku}-${variant.size}`,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            price: shirt.price,
            isActive: true,
          }
        });
        variantCount++;
      }
    }
    
    console.log(`\n🎉 Dress shirt update complete!`);
    console.log(`📊 Added: ${addedCount} products`);
    console.log(`📊 Added: ${variantCount} variants`);
    console.log(`\n✨ Your dress shirt collection now includes:`);
    console.log(`   • Classic White French Cuff - Essential formal shirt`);
    console.log(`   • Light Blue Spread Collar - Professional versatility`);
    console.log(`   • Navy Pinstripe - Sophisticated pattern`);
    console.log(`   • Charcoal Grey - Modern alternative`);
    console.log(`\n🧠 Smart features added:`);
    console.log(`   • Color intelligence and pairing rules`);
    console.log(`   • Formality and occasion scoring`);
    console.log(`   • Style personality matching`);
    console.log(`   • Comprehensive size variants (14.5" - 17.5")`);
    
  } catch (error) {
    console.error('❌ Error adding dress shirts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDressShirts(); 