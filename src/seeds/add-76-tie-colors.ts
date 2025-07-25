import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive 76-color system organized by families
const colorSystem = {
  // Blues Family (18 colors)
  blues: [
    { name: "Navy Blue", hex: "#000080", tags: ["classic", "formal", "business", "blue-family"] },
    { name: "Royal Blue", hex: "#4169E1", tags: ["bold", "royal", "formal", "blue-family"] },
    { name: "Tiffany Blue", hex: "#0ABAB5", tags: ["luxury", "wedding", "pastel", "blue-family"] },
    { name: "Sky Blue", hex: "#87CEEB", tags: ["summer", "light", "casual", "blue-family"] },
    { name: "Steel Blue", hex: "#4682B4", tags: ["professional", "modern", "blue-family"] },
    { name: "Powder Blue", hex: "#B0E0E6", tags: ["pastel", "soft", "spring", "blue-family"] },
    { name: "Midnight Blue", hex: "#191970", tags: ["dark", "elegant", "formal", "blue-family"] },
    { name: "Cornflower Blue", hex: "#6495ED", tags: ["bright", "cheerful", "blue-family"] },
    { name: "Periwinkle", hex: "#CCCCFF", tags: ["pastel", "soft", "blue-family"] },
    { name: "Cerulean", hex: "#007BA7", tags: ["vibrant", "modern", "blue-family"] },
    { name: "Cobalt Blue", hex: "#0047AB", tags: ["deep", "rich", "blue-family"] },
    { name: "Electric Blue", hex: "#7DF9FF", tags: ["bright", "modern", "blue-family"] },
    { name: "Sapphire", hex: "#0F52BA", tags: ["gemstone", "luxury", "blue-family"] },
    { name: "Turquoise", hex: "#40E0D0", tags: ["tropical", "summer", "blue-family"] },
    { name: "Aquamarine", hex: "#7FFFD4", tags: ["gemstone", "light", "blue-family"] },
    { name: "Cadet Blue", hex: "#5F9EA0", tags: ["military", "muted", "blue-family"] },
    { name: "Slate Blue", hex: "#6A5ACD", tags: ["purple-blue", "sophisticated", "blue-family"] },
    { name: "Dodger Blue", hex: "#1E90FF", tags: ["sports", "bright", "blue-family"] }
  ],

  // Reds Family (12 colors)
  reds: [
    { name: "Crimson Red", hex: "#DC143C", tags: ["bold", "passionate", "red-family"] },
    { name: "Wine Red", hex: "#722F37", tags: ["sophisticated", "dark", "red-family"] },
    { name: "Cherry Red", hex: "#DE3163", tags: ["bright", "cheerful", "red-family"] },
    { name: "Burgundy", hex: "#800020", tags: ["luxury", "deep", "red-family"] },
    { name: "Coral Red", hex: "#FF7F50", tags: ["summer", "warm", "red-family"] },
    { name: "Rose Red", hex: "#FF033E", tags: ["romantic", "bright", "red-family"] },
    { name: "Maroon", hex: "#800000", tags: ["classic", "dark", "red-family"] },
    { name: "Scarlet", hex: "#FF2400", tags: ["vibrant", "bold", "red-family"] },
    { name: "Ruby Red", hex: "#E0115F", tags: ["gemstone", "luxury", "red-family"] },
    { name: "Brick Red", hex: "#CB4154", tags: ["earthy", "muted", "red-family"] },
    { name: "Fire Engine Red", hex: "#CE2029", tags: ["bright", "bold", "red-family"] },
    { name: "Cardinal Red", hex: "#C41E3A", tags: ["religious", "formal", "red-family"] }
  ],

  // Greens Family (10 colors)
  greens: [
    { name: "Forest Green", hex: "#355E3B", tags: ["nature", "dark", "green-family"] },
    { name: "Emerald Green", hex: "#50C878", tags: ["gemstone", "luxury", "green-family"] },
    { name: "Sage Green", hex: "#9CAF88", tags: ["muted", "sophisticated", "green-family"] },
    { name: "Mint Green", hex: "#98FB98", tags: ["pastel", "fresh", "green-family"] },
    { name: "Hunter Green", hex: "#355E3B", tags: ["traditional", "outdoor", "green-family"] },
    { name: "Olive Green", hex: "#808000", tags: ["military", "earthy", "green-family"] },
    { name: "Sea Green", hex: "#2E8B57", tags: ["ocean", "natural", "green-family"] },
    { name: "Lime Green", hex: "#32CD32", tags: ["bright", "modern", "green-family"] },
    { name: "Pine Green", hex: "#01796F", tags: ["nature", "winter", "green-family"] },
    { name: "Kelly Green", hex: "#4CBB17", tags: ["Irish", "bright", "green-family"] }
  ],

  // Purples Family (8 colors)
  purples: [
    { name: "Royal Purple", hex: "#7851A9", tags: ["luxury", "royal", "purple-family"] },
    { name: "Lavender", hex: "#E6E6FA", tags: ["pastel", "soft", "purple-family"] },
    { name: "Violet", hex: "#8A2BE2", tags: ["bright", "floral", "purple-family"] },
    { name: "Plum", hex: "#8E4585", tags: ["sophisticated", "muted", "purple-family"] },
    { name: "Amethyst", hex: "#9966CC", tags: ["gemstone", "luxury", "purple-family"] },
    { name: "Eggplant", hex: "#614051", tags: ["dark", "sophisticated", "purple-family"] },
    { name: "Mauve", hex: "#E0B0FF", tags: ["soft", "vintage", "purple-family"] },
    { name: "Orchid", hex: "#DA70D6", tags: ["floral", "bright", "purple-family"] }
  ],

  // Yellows & Golds Family (8 colors)
  yellows: [
    { name: "Golden Yellow", hex: "#FFD700", tags: ["luxury", "bright", "yellow-family"] },
    { name: "Mustard Yellow", hex: "#FFDB58", tags: ["vintage", "warm", "yellow-family"] },
    { name: "Lemon Yellow", hex: "#FFF700", tags: ["bright", "fresh", "yellow-family"] },
    { name: "Champagne", hex: "#F7E7CE", tags: ["luxury", "wedding", "yellow-family"] },
    { name: "Amber", hex: "#FFBF00", tags: ["warm", "golden", "yellow-family"] },
    { name: "Canary Yellow", hex: "#FFEF00", tags: ["bright", "cheerful", "yellow-family"] },
    { name: "Saffron", hex: "#F4C430", tags: ["spice", "warm", "yellow-family"] },
    { name: "Honey", hex: "#FFC30B", tags: ["natural", "warm", "yellow-family"] }
  ],

  // Oranges Family (6 colors)
  oranges: [
    { name: "Burnt Orange", hex: "#CC5500", tags: ["autumn", "warm", "orange-family"] },
    { name: "Tangerine", hex: "#F28500", tags: ["bright", "citrus", "orange-family"] },
    { name: "Peach", hex: "#FFCBA4", tags: ["pastel", "soft", "orange-family"] },
    { name: "Copper", hex: "#B87333", tags: ["metallic", "warm", "orange-family"] },
    { name: "Rust", hex: "#B7410E", tags: ["earthy", "muted", "orange-family"] },
    { name: "Apricot", hex: "#FBCEB1", tags: ["soft", "warm", "orange-family"] }
  ],

  // Pinks Family (6 colors)
  pinks: [
    { name: "Blush Pink", hex: "#DE5D83", tags: ["soft", "romantic", "pink-family"] },
    { name: "Rose Pink", hex: "#FF66CC", tags: ["floral", "bright", "pink-family"] },
    { name: "Dusty Rose", hex: "#DCAE96", tags: ["muted", "vintage", "pink-family"] },
    { name: "Hot Pink", hex: "#FF69B4", tags: ["bold", "bright", "pink-family"] },
    { name: "Salmon Pink", hex: "#FA8072", tags: ["warm", "soft", "pink-family"] },
    { name: "Magenta", hex: "#FF00FF", tags: ["vibrant", "bold", "pink-family"] }
  ],

  // Neutrals Family (8 colors)
  neutrals: [
    { name: "Charcoal Gray", hex: "#36454F", tags: ["sophisticated", "dark", "neutral-family"] },
    { name: "Silver Gray", hex: "#C0C0C0", tags: ["metallic", "modern", "neutral-family"] },
    { name: "Champagne Beige", hex: "#F5F5DC", tags: ["elegant", "light", "neutral-family"] },
    { name: "Taupe", hex: "#483C32", tags: ["earthy", "sophisticated", "neutral-family"] },
    { name: "Cream", hex: "#FFFDD0", tags: ["soft", "classic", "neutral-family"] },
    { name: "Ivory", hex: "#FFFFF0", tags: ["wedding", "elegant", "neutral-family"] },
    { name: "Platinum", hex: "#E5E4E2", tags: ["metallic", "luxury", "neutral-family"] },
    { name: "Pearl", hex: "#F8F6F0", tags: ["lustrous", "elegant", "neutral-family"] }
  ]
};

// Flatten all colors into a single array
const allColors = Object.values(colorSystem).flat();

async function add76TieColors() {
  try {
    console.log('🎨 Starting 76-color tie system implementation...');

    // Get all existing tie products
    const tieProducts = await prisma.product.findMany({
      where: {
        category: 'Ties'
      },
      include: {
        variants: true
      }
    });

    console.log(`📦 Found ${tieProducts.length} tie products`);

    let totalVariantsCreated = 0;

    for (const product of tieProducts) {
      console.log(`\n🔄 Processing: ${product.name}`);
      
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: product.id }
      });
      console.log('  ❌ Deleted existing variants');

      // Create color hex map for smart attributes
      const colorHexMap: Record<string, string> = {};
      allColors.forEach(color => {
        colorHexMap[color.name] = color.hex;
      });

      // Update product with color hex map in smart attributes
      await prisma.product.update({
        where: { id: product.id },
        data: {
          smartAttributes: {
            colorHexMap,
            totalColors: allColors.length,
            colorFamilies: Object.keys(colorSystem)
          }
        }
      });

      // Create 76 color variants for this product
      const variants = allColors.map((color, index) => ({
        productId: product.id,
        name: `${product.name} - ${color.name}`,
        sku: `${product.sku}-${color.name.toUpperCase().replace(/\s+/g, '-')}`,
        color: color.name,
        size: null,
        material: product.fabric || 'Silk',
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: 50, // Initial stock for each color
        isActive: true,
        position: index,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Create variants in batches of 20 to avoid database limits
      const batchSize = 20;
      for (let i = 0; i < variants.length; i += batchSize) {
        const batch = variants.slice(i, i + batchSize);
        await prisma.productVariant.createMany({
          data: batch
        });
        console.log(`  ✅ Created variants ${i + 1}-${Math.min(i + batchSize, variants.length)}`);
      }

      // Update product tags to include color family tags
      const allTags = new Set(product.tags || []);
      allColors.forEach(color => {
        color.tags.forEach(tag => allTags.add(tag));
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          tags: Array.from(allTags),
          totalStock: variants.length * 50,
          availableStock: variants.length * 50
        }
      });

      totalVariantsCreated += variants.length;
      console.log(`  🎯 Created ${variants.length} color variants for ${product.name}`);
    }

    console.log('\n🎉 76-Color Tie System Implementation Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Products updated: ${tieProducts.length}`);
    console.log(`   Total variants created: ${totalVariantsCreated}`);
    console.log(`   Colors per product: ${allColors.length}`);
    console.log(`   Color families: ${Object.keys(colorSystem).length}`);

    return {
      success: true,
      productsUpdated: tieProducts.length,
      totalVariants: totalVariantsCreated,
      colorsPerProduct: allColors.length,
      colorFamilies: Object.keys(colorSystem).length
    };

  } catch (error) {
    console.error('❌ Error implementing 76-color tie system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow direct execution
if (require.main === module) {
  add76TieColors()
    .then(result => {
      console.log('✅ Success:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed:', error);
      process.exit(1);
    });
}

export default add76TieColors; 