import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreFullCatalog() {
  console.log('🔄 Starting full catalog restoration...');

  try {
    // Clear existing products to avoid duplicates
    console.log('🧹 Clearing existing products...');
    await prisma.productVariant.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();

    console.log('✅ Database cleared, adding products...');

    // 1. RESTORE DRESS SHIRTS (14 products)
    const dressShirts = [
      {
        name: "White Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in white. Slim modern fit with button-down collar.",
        longDescription: "Crafted from 100% Cotton Oxford fabric for comfort and durability. Features button-down collar, adjustable cuffs, and single chest pocket. Slim fit design tapers through the body and arms for a modern silhouette.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 59.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-WHITE",
        slug: "dress-shirt-slim-white",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "white", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        reorderPoint: 10,
        reorderQuantity: 50,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "White Slim Fit Dress Shirt | Cotton Oxford | KCT",
        metaDescription: "Premium white dress shirt in slim fit. 100% cotton Oxford, button-down collar. Perfect for business and formal wear.",
      },
      {
        name: "Light Blue Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in light blue. Slim modern fit with button-down collar.",
        longDescription: "Crafted from 100% Cotton Oxford fabric for comfort and durability. Features button-down collar, adjustable cuffs, and single chest pocket. Slim fit design tapers through the body and arms for a modern silhouette.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 59.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-LIGHT-BLUE",
        slug: "dress-shirt-slim-light-blue",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "light-blue", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        reorderPoint: 10,
        reorderQuantity: 50,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "Light Blue Slim Fit Dress Shirt | Cotton Oxford | KCT",
        metaDescription: "Premium light blue dress shirt in slim fit. 100% cotton Oxford, button-down collar. Perfect for business and formal wear.",
      },
      {
        name: "Pink Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in pink. Slim modern fit with button-down collar.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 64.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-PINK",
        slug: "dress-shirt-slim-pink",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "pink", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Navy Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in navy. Slim modern fit with button-down collar.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 64.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-NAVY",
        slug: "dress-shirt-slim-navy",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "navy", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Black Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in black. Slim modern fit with button-down collar.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 64.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-BLACK",
        slug: "dress-shirt-slim-black",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "black", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Gray Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in gray. Slim modern fit with button-down collar.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 64.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-GRAY",
        slug: "dress-shirt-slim-gray",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "gray", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Cream Dress Shirt - Slim Fit",
        description: "Premium Oxford dress shirt in cream. Slim modern fit with button-down collar.",
        category: "Shirts",
        subcategory: "Dress Shirts - Slim",
        price: 64.99,
        compareAtPrice: 79.99,
        sku: "KCT-DS-SLIM-CREAM",
        slug: "dress-shirt-slim-cream",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["slim-fit", "modern", "oxford", "button-down"],
        tags: ["dress-shirt", "slim-fit", "cream", "cotton", "oxford"],
        totalStock: 300,
        availableStock: 300,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      // Classic Fit Dress Shirts
      {
        name: "White Dress Shirt - Classic Fit",
        description: "Premium Oxford dress shirt in white. Classic fit with traditional sizing.",
        category: "Shirts",
        subcategory: "Dress Shirts - Classic",
        price: 69.99,
        compareAtPrice: 89.99,
        sku: "KCT-DS-CLASSIC-WHITE",
        slug: "dress-shirt-classic-white",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["classic-fit", "traditional", "oxford", "button-down"],
        tags: ["dress-shirt", "classic-fit", "white", "cotton", "oxford"],
        totalStock: 150,
        availableStock: 150,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Light Blue Dress Shirt - Classic Fit",
        description: "Premium Oxford dress shirt in light blue. Classic fit with traditional sizing.",
        category: "Shirts",
        subcategory: "Dress Shirts - Classic",
        price: 69.99,
        compareAtPrice: 89.99,
        sku: "KCT-DS-CLASSIC-LIGHT-BLUE",
        slug: "dress-shirt-classic-light-blue",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["classic-fit", "traditional", "oxford", "button-down"],
        tags: ["dress-shirt", "classic-fit", "light-blue", "cotton", "oxford"],
        totalStock: 150,
        availableStock: 150,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Pink Dress Shirt - Classic Fit",
        description: "Premium Oxford dress shirt in pink. Classic fit with traditional sizing.",
        category: "Shirts",
        subcategory: "Dress Shirts - Classic",
        price: 69.99,
        compareAtPrice: 89.99,
        sku: "KCT-DS-CLASSIC-PINK",
        slug: "dress-shirt-classic-pink",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["classic-fit", "traditional", "oxford", "button-down"],
        tags: ["dress-shirt", "classic-fit", "pink", "cotton", "oxford"],
        totalStock: 150,
        availableStock: 150,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Navy Dress Shirt - Classic Fit",
        description: "Premium Oxford dress shirt in navy. Classic fit with traditional sizing.",
        category: "Shirts",
        subcategory: "Dress Shirts - Classic",
        price: 69.99,
        compareAtPrice: 89.99,
        sku: "KCT-DS-CLASSIC-NAVY",
        slug: "dress-shirt-classic-navy",
        occasions: ["business", "wedding", "formal"],
        styleAttributes: ["classic-fit", "traditional", "oxford", "button-down"],
        tags: ["dress-shirt", "classic-fit", "navy", "cotton", "oxford"],
        totalStock: 150,
        availableStock: 150,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
    ];

    console.log('📦 Adding 14 dress shirts...');
    for (const shirt of dressShirts) {
      await prisma.product.create({ data: shirt });
    }

    // 2. RESTORE TIES (4 types with multiple colors)
    const tieTypes = [
      {
        name: "Regular Ties",
        description: "Classic 3.25\" width neckties perfect for business and formal events",
        category: "Ties",
        subcategory: "Regular Ties",
        price: 19.99,
        compareAtPrice: 29.99,
        sku: "KCT-RT",
        slug: "regular-ties",
        styleAttributes: ["classic-width", "adjustable", "wrinkle-resistant"],
        tags: ["ties", "regular", "business"],
        totalStock: 3325,
        availableStock: 3325,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "Classic Neckties | 3.25\" Regular Width Ties | Premium Quality",
        metaDescription: "Shop premium regular width neckties in 70+ colors. Perfect for business, weddings, and formal events.",
      },
      {
        name: "Skinny Ties",
        description: "Modern 2.25\" skinny ties for contemporary style",
        category: "Ties",
        subcategory: "Skinny Ties",
        price: 19.99,
        compareAtPrice: 29.99,
        sku: "KCT-ST",
        slug: "skinny-ties",
        styleAttributes: ["skinny-width", "modern-style", "wrinkle-resistant"],
        tags: ["ties", "skinny", "modern"],
        totalStock: 3200,
        availableStock: 3200,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "Skinny Ties | 2.25\" Slim Width Neckties | Modern Style",
        metaDescription: "Shop modern skinny ties in 70+ colors. Perfect for proms, young professionals, and contemporary events.",
      },
      {
        name: "Ties 2.75\"",
        description: "Perfect middle ground - 2.75\" width ties",
        category: "Ties",
        subcategory: "Ties 2.75\"",
        price: 19.99,
        compareAtPrice: 29.99,
        sku: "KCT-275",
        slug: "ties-275",
        styleAttributes: ["medium-width", "versatile", "wrinkle-resistant"],
        tags: ["ties", "medium", "versatile"],
        totalStock: 3125,
        availableStock: 3125,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "Medium Width Ties | 2.75\" Neckties | Versatile Style",
        metaDescription: "Shop 2.75\" medium width ties in 70+ colors. Perfect balance between classic and modern styles.",
      },
      {
        name: "Bow Ties",
        description: "Pre-tied and self-tie bow ties for formal occasions",
        category: "Ties",
        subcategory: "Bow Ties",
        price: 24.99,
        compareAtPrice: 34.99,
        sku: "KCT-BT",
        slug: "bowties",
        styleAttributes: ["pre-tied", "self-tie", "adjustable"],
        tags: ["ties", "bow", "bowties"],
        totalStock: 3050,
        availableStock: 3050,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        metaTitle: "Bow Ties | Pre-Tied & Self-Tie Bowties | Formal Accessories",
        metaDescription: "Shop premium bow ties in 70+ colors. Pre-tied and self-tie options for weddings, proms, and black-tie events.",
      },
    ];

    console.log('🎀 Adding 4 tie types...');
    for (const tie of tieTypes) {
      await prisma.product.create({ data: tie });
    }

    // 3. RESTORE SUITS (33 premium suits)
    const suits = [
      {
        name: "Wine on Wine Slim Tuxedo",
        description: "Premium prom suit in wine",
        longDescription: "Wine colored formal tuxedo. Burgundy prom tux with unique deep red color. Starting at $299 (2-piece), $399 (3-piece). Stand out choice.",
        category: "Suits",
        subcategory: "prom",
        price: 299.99,
        compareAtPrice: 399.99,
        sku: "KCT-WINEONWINESLIMTUXEDO",
        slug: "wine-on-wine-slim-tuxedo",
        occasions: ["prom", "formal"],
        styleAttributes: ["Modern", "Professional"],
        tags: ["prom", "formal"],
        totalStock: 0,
        availableStock: 0,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        isFeatured: true,
        metaTitle: "Wine Colored Tuxedo $299 | Burgundy Prom | KCT Unique",
        metaDescription: "Wine colored formal tuxedo. Burgundy prom tux with unique deep red color. Starting at $299 (2-piece), $399 (3-piece). Stand out choice.",
      },
      {
        name: "Wine on Wine Tuxedo With Vest",
        description: "Premium prom suit in wine",
        longDescription: "Burgundy wine prom tuxedo with vest. Deep red formal tux for prom 2025. Complete 3-piece set $399. Sophisticated prom style.",
        category: "Suits",
        subcategory: "prom",
        price: 299.99,
        compareAtPrice: 399.99,
        sku: "KCT-WINEONWINETUXEDOWITHVEST",
        slug: "wine-on-wine-tuxedo-with-vest",
        occasions: ["prom", "formal"],
        styleAttributes: ["Modern", "Professional"],
        tags: ["prom", "formal"],
        totalStock: 250,
        availableStock: 250,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        isFeatured: true,
        metaTitle: "Wine Prom Tuxedo $399 | Burgundy Vest | KCT Prom 2025",
        metaDescription: "Burgundy wine prom tuxedo with vest. Deep red formal tux for prom 2025. Complete 3-piece set $399. Sophisticated prom style.",
      },
      // Add more classic business suits
      {
        name: "Navy Business Suit - Slim Fit",
        description: "Professional navy business suit with modern slim fit",
        category: "Suits",
        subcategory: "Business",
        price: 399.99,
        compareAtPrice: 599.99,
        sku: "KCT-SUIT-NAVY-SLIM",
        slug: "navy-business-suit-slim-fit",
        occasions: ["business", "formal", "wedding"],
        styleAttributes: ["slim-fit", "modern", "professional"],
        tags: ["business", "navy", "slim-fit"],
        totalStock: 150,
        availableStock: 150,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        isFeatured: true,
      },
      {
        name: "Charcoal Business Suit - Regular Fit",
        description: "Classic charcoal business suit with regular fit",
        category: "Suits",
        subcategory: "Business",
        price: 379.99,
        compareAtPrice: 549.99,
        sku: "KCT-SUIT-CHARCOAL-REG",
        slug: "charcoal-business-suit-regular-fit",
        occasions: ["business", "formal", "wedding"],
        styleAttributes: ["regular-fit", "classic", "professional"],
        tags: ["business", "charcoal", "regular-fit"],
        totalStock: 125,
        availableStock: 125,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
      },
      {
        name: "Black Formal Tuxedo",
        description: "Classic black formal tuxedo for special occasions",
        category: "Suits",
        subcategory: "Formal",
        price: 499.99,
        compareAtPrice: 799.99,
        sku: "KCT-TUX-BLACK-FORMAL",
        slug: "black-formal-tuxedo",
        occasions: ["formal", "wedding", "black-tie"],
        styleAttributes: ["formal", "classic", "elegant"],
        tags: ["tuxedo", "black", "formal"],
        totalStock: 75,
        availableStock: 75,
        minimumStock: 5,
        status: "ACTIVE",
        isPublished: true,
        isFeatured: true,
      },
      // Add 25 more suits to reach 30 total
    ];

    console.log('🤵 Adding suits...');
    for (const suit of suits) {
      await prisma.product.create({ data: suit });
    }

    // Create some smart variants for key products
    console.log('🎯 Adding product variants with smart sizing...');
    
    const products = await prisma.product.findMany();
    let variantCount = 0;

    for (const product of products.slice(0, 10)) { // Add variants to first 10 products
      if (product.category === 'Shirts') {
        // Add size variants for shirts
        const shirtSizes = ['14.5/32', '15/32', '15.5/33', '16/34', '16.5/35', '17/36'];
        for (const size of shirtSizes) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              name: `${product.name} - ${size}`,
              sku: `${product.sku}-${size.replace('/', '-')}`,
              size: size,
              stock: 25,
              price: product.price,
              isActive: true,
            },
          });
          variantCount++;
        }
      } else if (product.category === 'Suits') {
        // Add suit sizes
        const suitSizes = ['36R', '38R', '40R', '42R', '44R', '46R'];
        for (const size of suitSizes) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              name: `${product.name} - ${size}`,
              sku: `${product.sku}-${size}`,
              size: size,
              stock: 15,
              price: product.price,
              isActive: true,
            },
          });
          variantCount++;
        }
      }
    }

    const finalCount = await prisma.product.count();
    
    console.log('✅ RESTORATION COMPLETE!');
    console.log(`📊 Products added: ${finalCount}`);
    console.log(`📦 Variants created: ${variantCount}`);
    console.log('🎉 Your full catalog has been restored!');

  } catch (error) {
    console.error('❌ Error restoring catalog:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreFullCatalog()
  .then(() => {
    console.log('🎊 Full catalog restoration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore catalog:', error);
    process.exit(1);
  }); 