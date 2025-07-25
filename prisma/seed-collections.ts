import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Smart collection definitions with filtering rules
const collections = [
  {
    name: "Summer Wedding Guest",
    slug: "summer-wedding",
    description: "Light, breathable pieces perfect for outdoor summer weddings and warm-weather celebrations",
    heroImage: "/images/collections/summer-wedding-hero.jpg",
    sortOrder: 1,
    metaTitle: "Summer Wedding Guest Attire | Light & Elegant",
    metaDescription: "Perfect summer wedding guest outfits. Light colors, breathable fabrics, and elegant styles for outdoor celebrations.",
    rules: {
      ties: {
        colorFamilies: ["blues", "pinks", "neutrals"],
        tags: ["summer", "wedding", "light", "pastel"],
        excludeColors: ["Black", "Dark Colors"]
      },
      suits: {
        colors: ["Light Grey", "Tan", "Light Blue", "Beige", "Khaki"],
        tags: ["summer", "lightweight", "wedding"],
        excludeTags: ["formal", "black-tie"]
      },
      shirts: {
        colors: ["White", "Light Blue", "Pink", "Mint Green"],
        tags: ["classic", "wedding"]
      }
    }
  },
  
  {
    name: "Black Tie Formal",
    slug: "black-tie",
    description: "Elegant pieces for the most formal occasions - galas, award ceremonies, and upscale events",
    heroImage: "/images/collections/black-tie-hero.jpg",
    sortOrder: 2,
    metaTitle: "Black Tie Formal Attire | Elegant & Sophisticated",
    metaDescription: "Complete black tie formal wear collection. Tuxedos, bow ties, and formal accessories for elegant events.",
    rules: {
      ties: {
        colors: ["Black", "White", "Silver Gray", "Navy Blue"],
        tags: ["formal", "luxury", "black-tie"],
        patterns: ["solid", "minimal"]
      },
      suits: {
        names: ["Tuxedo", "Black Suit", "Formal Suit"],
        colors: ["Black", "Midnight Blue"],
        tags: ["formal", "black-tie", "luxury"]
      },
      shirts: {
        colors: ["White", "Ivory"],
        tags: ["formal", "tuxedo"]
      }
    }
  },

  {
    name: "Business Professional",
    slug: "business-professional",
    description: "Sharp, confident looks for boardrooms, client meetings, and professional networking",
    heroImage: "/images/collections/business-hero.jpg",
    sortOrder: 3,
    metaTitle: "Business Professional Attire | Sharp & Confident",
    metaDescription: "Professional business attire for the modern executive. Suits, ties, and shirts that command respect.",
    rules: {
      ties: {
        colorFamilies: ["blues", "reds", "neutrals"],
        tags: ["business", "professional", "classic"],
        excludeTags: ["casual", "novelty"]
      },
      suits: {
        colors: ["Navy Blue", "Charcoal Gray", "Dark Gray", "Black"],
        tags: ["business", "professional", "classic"],
        fits: ["Regular Fit", "Slim Fit"]
      },
      shirts: {
        colors: ["White", "Light Blue", "Light Gray"],
        tags: ["business", "professional"]
      }
    }
  },

  {
    name: "Casual Weekend",
    slug: "casual-weekend",
    description: "Relaxed yet polished looks for brunch, casual dates, and weekend social events",
    heroImage: "/images/collections/casual-hero.jpg",
    sortOrder: 4,
    metaTitle: "Casual Weekend Attire | Relaxed & Stylish",
    metaDescription: "Casual weekend wear that doesn't sacrifice style. Perfect for brunch, dates, and relaxed social gatherings.",
    rules: {
      ties: {
        colorFamilies: ["blues", "greens", "oranges"],
        tags: ["casual", "relaxed", "weekend"],
        patterns: ["striped", "textured", "casual"]
      },
      suits: {
        colors: ["Light Gray", "Tan", "Light Blue"],
        tags: ["casual", "relaxed", "weekend"],
        excludeTags: ["formal", "business"]
      },
      shirts: {
        colors: ["Light Blue", "Pink", "Mint Green", "White"],
        tags: ["casual", "relaxed"]
      }
    }
  },

  {
    name: "Spring Pastels",
    slug: "spring-pastels",
    description: "Fresh, light colors perfect for spring celebrations and Easter gatherings",
    heroImage: "/images/collections/spring-pastels-hero.jpg",
    sortOrder: 5,
    metaTitle: "Spring Pastel Collection | Fresh & Light",
    metaDescription: "Beautiful spring pastel colors for Easter, spring weddings, and seasonal celebrations.",
    rules: {
      ties: {
        colorFamilies: ["blues", "pinks", "yellows", "greens"],
        tags: ["spring", "pastel", "light", "soft"],
        colors: ["Powder Blue", "Blush Pink", "Mint Green", "Lavender", "Lemon Yellow"]
      },
      suits: {
        colors: ["Light Blue", "Light Gray", "Tan", "Beige"],
        tags: ["spring", "light"]
      },
      shirts: {
        colors: ["White", "Light Blue", "Pink", "Mint Green"],
        tags: ["spring", "light"]
      }
    }
  },

  {
    name: "Bold & Vibrant",
    slug: "bold-vibrant",
    description: "Make a statement with rich, saturated colors for confident personalities",
    heroImage: "/images/collections/bold-vibrant-hero.jpg",
    sortOrder: 6,
    metaTitle: "Bold & Vibrant Collection | Make a Statement",
    metaDescription: "Bold, vibrant colors for the confident individual. Rich reds, electric blues, and striking designs.",
    rules: {
      ties: {
        colors: ["Royal Blue", "Crimson Red", "Emerald Green", "Electric Blue", "Fire Engine Red"],
        tags: ["bold", "vibrant", "statement", "bright"],
        excludeTags: ["pastel", "muted"]
      },
      suits: {
        colors: ["Royal Blue", "Deep Green", "Burgundy"],
        tags: ["bold", "statement"]
      },
      shirts: {
        colors: ["White", "Light Blue", "Light Gray"],
        tags: ["classic"] // Keep shirts neutral for bold ties/suits
      }
    }
  },

  {
    name: "Autumn Classics",
    slug: "autumn-classics",
    description: "Rich, warm tones perfect for fall weddings and autumn events",
    heroImage: "/images/collections/autumn-hero.jpg",
    sortOrder: 7,
    metaTitle: "Autumn Classics | Rich Warm Tones",
    metaDescription: "Autumn wedding and event attire in rich, warm colors. Perfect for fall celebrations.",
    rules: {
      ties: {
        colorFamilies: ["reds", "oranges", "yellows", "neutrals"],
        colors: ["Burgundy", "Burnt Orange", "Golden Yellow", "Wine Red", "Rust"],
        tags: ["autumn", "fall", "warm", "rich"]
      },
      suits: {
        colors: ["Brown", "Burgundy", "Dark Gray", "Charcoal Gray"],
        tags: ["autumn", "warm"]
      },
      shirts: {
        colors: ["White", "Cream", "Light Brown"],
        tags: ["warm", "autumn"]
      }
    }
  },

  {
    name: "Monochrome Minimalist",
    slug: "monochrome-minimalist",
    description: "Clean, sophisticated black, white, and gray combinations for modern minimalists",
    heroImage: "/images/collections/monochrome-hero.jpg",
    sortOrder: 8,
    metaTitle: "Monochrome Minimalist | Clean & Modern",
    metaDescription: "Sophisticated monochrome attire in black, white, and gray. Perfect for modern minimalist style.",
    rules: {
      ties: {
        colorFamilies: ["neutrals"],
        colors: ["Black", "White", "Silver Gray", "Charcoal Gray", "Pearl"],
        tags: ["minimalist", "modern", "sophisticated"]
      },
      suits: {
        colors: ["Black", "Charcoal Gray", "Dark Gray", "Light Gray"],
        tags: ["minimalist", "modern"]
      },
      shirts: {
        colors: ["White", "Light Gray", "Silver Gray"],
        tags: ["minimalist", "classic"]
      }
    }
  }
];

export async function seedCollections() {
  try {
    console.log('🌱 Starting collection seeding...');

    // Clear existing collections
    await prisma.productCollection.deleteMany({});
    await prisma.collection.deleteMany({});
    console.log('🗑️ Cleared existing collections');

    let totalCollections = 0;

    for (const collectionData of collections) {
      const collection = await prisma.collection.create({
        data: {
          name: collectionData.name,
          slug: collectionData.slug,
          description: collectionData.description,
          heroImage: collectionData.heroImage,
          sortOrder: collectionData.sortOrder,
          metaTitle: collectionData.metaTitle,
          metaDescription: collectionData.metaDescription,
          rules: collectionData.rules,
          isActive: true
        }
      });

      totalCollections++;
      console.log(`✅ Created collection: ${collection.name}`);
    }

    console.log('\n🎉 Collection Seeding Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Collections created: ${totalCollections}`);
    console.log(`   Ready for product matching via collection rules`);

    return {
      success: true,
      collectionsCreated: totalCollections,
      collections: collections.map(c => ({ name: c.name, slug: c.slug }))
    };

  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow direct execution
if (require.main === module) {
  seedCollections()
    .then(result => {
      console.log('✅ Success:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed:', error);
      process.exit(1);
    });
}

export default seedCollections; 