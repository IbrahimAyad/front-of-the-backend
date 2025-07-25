import { FastifyPluginAsync } from 'fastify';

const restoreRoutes: FastifyPluginAsync = async (fastify) => {
  // Restore full product catalog - PUBLIC ROUTE for admin use
  fastify.post('/catalog', async (request, reply) => {
    try {
      console.log('🔄 Starting full catalog restoration...');

      // Clear existing products to avoid duplicates
      console.log('🧹 Clearing existing products...');
      await fastify.prisma.productVariant.deleteMany();
      await fastify.prisma.productImage.deleteMany();
      await fastify.prisma.product.deleteMany();

      console.log('✅ Database cleared, adding smart products...');

      let totalProducts = 0;
      let totalVariants = 0;

      // 1. RESTORE SMART DRESS SHIRTS WITH VARIANTS
      console.log('👔 Creating smart dress shirts...');
      const dressShirtConfigs = [
        { color: 'White', colorHex: '#FFFFFF', colorFamily: 'Whites' },
        { color: 'Light Blue', colorHex: '#ADD8E6', colorFamily: 'Blues' },
        { color: 'Pink', colorHex: '#FFC0CB', colorFamily: 'Pinks' },
        { color: 'Navy', colorHex: '#000080', colorFamily: 'Blues' },
        { color: 'Black', colorHex: '#000000', colorFamily: 'Blacks' },
        { color: 'Gray', colorHex: '#808080', colorFamily: 'Greys' },
        { color: 'Cream', colorHex: '#F5F5DC', colorFamily: 'Whites' },
      ];

      const shirtFits = ['Slim Fit', 'Classic Fit'];
      const shirtSizes = ['15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5'];

      for (const config of dressShirtConfigs) {
        for (const fit of shirtFits) {
          const smartAttributes = {
            formality_level: 4,
            conservative_rating: 4,
            color_temperature: config.colorFamily.includes('Blue') ? 'cool' : 'neutral',
            event_suitability: ['business', 'wedding', 'formal'],
            age_appropriateness: fit === 'Slim Fit' ? ['young', 'middle'] : ['middle', 'mature'],
            style_personality: fit === 'Slim Fit' ? ['modern', 'contemporary'] : ['classic', 'traditional']
          };

          const product = await fastify.prisma.product.create({
            data: {
              name: `${config.color} Dress Shirt - ${fit}`,
              description: `Premium Oxford dress shirt in ${config.color.toLowerCase()}. ${fit} with button-down collar.`,
              longDescription: `Crafted from 100% Cotton Oxford fabric for comfort and durability. Features button-down collar, adjustable cuffs, and single chest pocket. ${fit} design for the perfect silhouette.`,
              category: "Shirts",
              subcategory: `Dress Shirts - ${fit.replace(' ', '')}`,
              price: fit === 'Slim Fit' ? 59.99 : 69.99,
              compareAtPrice: fit === 'Slim Fit' ? 79.99 : 89.99,
              sku: `KCT-DS-${fit.replace(' ', '').toUpperCase()}-${config.color.replace(' ', '').toUpperCase()}`,
              slug: `dress-shirt-${fit.toLowerCase().replace(' ', '-')}-${config.color.toLowerCase().replace(' ', '-')}`,
              
              // Smart Product Attributes
              smartAttributes,
              fabricMarketing: "Premium Cotton Oxford",
              fabricCare: "Machine wash cold, tumble dry low",
              fabricBenefits: [
                "wrinkle-resistant",
                "breathable",
                "comfortable all-day wear",
                "easy care"
              ],
              
              // Color Intelligence
              colorFamily: config.colorFamily,
              hexPrimary: config.colorHex,
              
              // Event & Occasion
              primaryOccasion: "business",
              occasionTags: ["business", "wedding", "formal"],
              trendingFor: fit === 'Slim Fit' ? ["young-professionals"] : ["classic-style"],
              
              // Outfit Building Helpers
              outfitRole: "foundation",
              pairsWellWith: ["suits", "ties", "blazers"],
              styleNotes: `Perfect foundation piece for ${fit.toLowerCase()} styling`,
              
              // Local SEO
              localKeywords: ["dress shirt", "cotton oxford", fit.toLowerCase()],
              
              // Inventory Management
              trackStock: true,
              totalStock: shirtSizes.length * 20, // 20 per size
              availableStock: shirtSizes.length * 20,
              reservedStock: 0,
              minimumStock: 5,
              reorderPoint: 10,
              reorderQuantity: 50,
              
              // Status & Visibility
              status: "ACTIVE",
              isPublished: true,
              isFeatured: config.color === 'White' && fit === 'Slim Fit',
              
              // SEO & Marketing
              metaTitle: `${config.color} ${fit} Dress Shirt | Cotton Oxford | KCT`,
              metaDescription: `Premium ${config.color.toLowerCase()} dress shirt in ${fit.toLowerCase()}. 100% cotton Oxford, button-down collar. Perfect for business and formal wear.`,
              tags: ["dress-shirt", fit.toLowerCase().replace(' ', '-'), config.color.toLowerCase(), "cotton", "oxford"],
              
              occasions: ["business", "wedding", "formal"],
              styleAttributes: [fit.toLowerCase().replace(' ', '-'), "modern", "oxford", "button-down"],
            }
          });

          totalProducts++;

          // Create variants for each size
          for (const size of shirtSizes) {
            await fastify.prisma.productVariant.create({
              data: {
                productId: product.id,
                name: `${product.name} - Size ${size}`,
                sku: `${product.sku}-${size}`,
                size: size,
                color: config.color,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: 20,
                isActive: true,
                position: shirtSizes.indexOf(size),
              }
            });
            totalVariants++;
          }
        }
      }

      // 2. RESTORE SMART TIES WITH VARIANTS
      console.log('🎀 Creating smart ties...');
      const tieTypes = [
        {
          name: "Regular Ties",
          width: "3.25\"",
          description: "Classic 3.25\" width neckties perfect for business and formal events",
          subcategory: "Regular Ties",
          price: 19.99,
          stylePersonality: ['classic', 'traditional']
        },
        {
          name: "Skinny Ties", 
          width: "2.25\"",
          description: "Modern 2.25\" skinny ties for contemporary style",
          subcategory: "Skinny Ties",
          price: 19.99,
          stylePersonality: ['modern', 'contemporary']
        },
        {
          name: "Ties 2.75\"",
          width: "2.75\"", 
          description: "Perfect middle ground - 2.75\" width ties",
          subcategory: "Ties 2.75\"",
          price: 19.99,
          stylePersonality: ['versatile', 'modern']
        },
        {
          name: "Bow Ties",
          width: "adjustable",
          description: "Pre-tied and self-tie bow ties for formal occasions", 
          subcategory: "Bow Ties",
          price: 24.99,
          stylePersonality: ['formal', 'distinctive']
        }
      ];

      const tieColors = [
        { name: 'Navy', hex: '#000080', family: 'Blues' },
        { name: 'Black', hex: '#000000', family: 'Blacks' },
        { name: 'Red', hex: '#FF0000', family: 'Reds' },
        { name: 'Green', hex: '#008000', family: 'Greens' },
        { name: 'Purple', hex: '#800080', family: 'Purples' },
        { name: 'Gold', hex: '#FFD700', family: 'Yellows' },
        { name: 'Silver', hex: '#C0C0C0', family: 'Greys' },
        { name: 'Burgundy', hex: '#800020', family: 'Reds' }
      ];

      for (const tieType of tieTypes) {
        const smartAttributes = {
          formality_level: tieType.subcategory === 'Bow Ties' ? 5 : 4,
          conservative_rating: 4,
          color_temperature: 'neutral',
          event_suitability: ['business', 'wedding', 'formal'],
          age_appropriateness: tieType.stylePersonality.includes('modern') ? ['young', 'middle'] : ['middle', 'mature'],
          style_personality: tieType.stylePersonality
        };

        const product = await fastify.prisma.product.create({
          data: {
            name: tieType.name,
            description: tieType.description,
            longDescription: `Premium ${tieType.name.toLowerCase()} available in multiple colors. ${tieType.width} width for the perfect proportion. Wrinkle-resistant fabric for lasting style.`,
            category: "Ties",
            subcategory: tieType.subcategory,
            price: tieType.price,
            compareAtPrice: tieType.price + 10,
            sku: `KCT-${tieType.name.replace(/[^A-Z]/g, '')}`,
            slug: tieType.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            
            // Smart Product Attributes
            smartAttributes,
            fabricMarketing: "Premium Silk Blend",
            fabricCare: "Dry clean recommended", 
            fabricBenefits: [
              "wrinkle-resistant",
              "color-fast",
              "premium feel",
              "long-lasting"
            ],
            
            // Color Intelligence (neutral base, variants will have specific colors)
            colorFamily: "Multi",
            
            // Event & Occasion
            primaryOccasion: "business",
            occasionTags: ["business", "wedding", "formal", "prom"],
            trendingFor: tieType.stylePersonality.includes('modern') ? ["young-professionals"] : ["classic-style"],
            
            // Outfit Building Helpers
            outfitRole: "accent",
            pairsWellWith: ["suits", "dress-shirts", "blazers"],
            styleNotes: `Essential ${tieType.width} tie for completing your formal look`,
            
            // Local SEO
            localKeywords: ["ties", "neckties", tieType.width],
            
            // Inventory Management
            trackStock: true,
            totalStock: tieColors.length * 50,
            availableStock: tieColors.length * 50,
            reservedStock: 0,
            minimumStock: 5,
            reorderPoint: 10,
            reorderQuantity: 100,
            
            // Status & Visibility
            status: "ACTIVE",
            isPublished: true,
            isFeatured: tieType.subcategory === 'Regular Ties',
            
            // SEO & Marketing
            metaTitle: `${tieType.name} | ${tieType.width} Width Neckties | Premium Quality`,
            metaDescription: `Shop premium ${tieType.name.toLowerCase()} in 8+ colors. Perfect for business, weddings, and formal events.`,
            tags: ["ties", tieType.name.toLowerCase().replace(' ', '-'), "silk"],
            
            occasions: ["business", "wedding", "formal"],
            styleAttributes: [tieType.width, "wrinkle-resistant", "premium"],
          }
        });

        totalProducts++;

        // Create color variants
        for (const color of tieColors) {
          await fastify.prisma.productVariant.create({
            data: {
              productId: product.id,
              name: `${product.name} - ${color.name}`,
              sku: `${product.sku}-${color.name.toUpperCase()}`,
              color: color.name,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              stock: 50,
              isActive: true,
              position: tieColors.indexOf(color),
            }
          });
          totalVariants++;
        }
      }

      // 3. RESTORE SMART SUITS WITH VARIANTS (Most Complex)
      console.log('🤵 Creating smart suits...');
      const suitConfigs = [
        {
          name: "Wine on Wine Slim Tuxedo",
          description: "Premium prom suit in wine",
          longDescription: "Wine colored formal tuxedo. Burgundy prom tux with unique deep red color. Perfect for prom 2025 and formal events.",
          subcategory: "prom",
          basePrice: 299.99,
          comparePrice: 399.99,
          color: "Wine",
          colorHex: "#722F37",
          colorFamily: "Reds",
          isTuxedo: true,
          isProm: true
        },
        {
          name: "Wine on Wine Tuxedo With Vest", 
          description: "Premium prom suit in wine with vest",
          longDescription: "Burgundy wine prom tuxedo with vest. Deep red formal tux for prom 2025. Complete 3-piece set. Sophisticated prom style.",
          subcategory: "prom",
          basePrice: 399.99,
          comparePrice: 499.99,
          color: "Wine",
          colorHex: "#722F37", 
          colorFamily: "Reds",
          isTuxedo: true,
          isProm: true,
          hasVest: true
        },
        {
          name: "Navy Business Suit",
          description: "Professional navy business suit with modern slim fit",
          longDescription: "Premium navy business suit crafted for the modern professional. Features contemporary styling with classic appeal.",
          subcategory: "Business", 
          basePrice: 399.99,
          comparePrice: 599.99,
          color: "Navy",
          colorHex: "#000080",
          colorFamily: "Blues",
          isTuxedo: false,
          isProm: false
        },
        {
          name: "Charcoal Business Suit",
          description: "Classic charcoal business suit with regular fit", 
          longDescription: "Timeless charcoal business suit with classic proportions. Perfect for meetings, interviews, and professional occasions.",
          subcategory: "Business",
          basePrice: 379.99,
          comparePrice: 549.99,
          color: "Charcoal",
          colorHex: "#36454F",
          colorFamily: "Greys",
          isTuxedo: false,
          isProm: false
        },
        {
          name: "Black Formal Tuxedo",
          description: "Classic black formal tuxedo for special occasions",
          longDescription: "Premium black formal tuxedo for the most elegant occasions. Features satin lapels and traditional styling.",
          subcategory: "Formal",
          basePrice: 499.99,
          comparePrice: 799.99,
          color: "Black", 
          colorHex: "#000000",
          colorFamily: "Blacks",
          isTuxedo: true,
          isProm: false
        }
      ];

      const suitSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
      const lengthTypes = ['S', 'R', 'L']; // Short, Regular, Long
      const fitTypes = ['Slim Fit', 'Regular Fit'];

      for (const suitConfig of suitConfigs) {
        for (const fit of fitTypes) {
          const smartAttributes = {
            formality_level: suitConfig.isTuxedo ? 5 : 4,
            conservative_rating: 4,
            color_temperature: suitConfig.colorFamily.includes('Blue') ? 'cool' : 'neutral',
            event_suitability: suitConfig.isProm ? ['prom', 'formal'] : ['business', 'wedding', 'formal'],
            age_appropriateness: suitConfig.isProm ? ['young'] : fit === 'Slim Fit' ? ['young', 'middle'] : ['middle', 'mature'],
            style_personality: fit === 'Slim Fit' ? ['modern', 'contemporary'] : ['classic', 'traditional']
          };

          const product = await fastify.prisma.product.create({
            data: {
              name: `${suitConfig.name} - ${fit}`,
              description: `${suitConfig.description} - ${fit}`,
              longDescription: `${suitConfig.longDescription} Available in ${fit.toLowerCase()} for the perfect silhouette.`,
              category: "Suits",
              subcategory: suitConfig.subcategory,
              price: suitConfig.basePrice,
              compareAtPrice: suitConfig.comparePrice,
              sku: `KCT-${suitConfig.name.replace(/[^A-Z]/g, '')}-${fit.replace(' ', '').toUpperCase()}`,
              slug: `${suitConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${fit.toLowerCase().replace(' ', '-')}`,
              
              // Smart Product Attributes
              smartAttributes,
              fabricMarketing: suitConfig.isTuxedo ? "Premium Tuxedo Fabric" : "Performance Business Fabric",
              fabricCare: "Professional dry clean recommended",
              fabricBenefits: [
                "wrinkle-resistant", 
                "breathable",
                "comfortable stretch",
                "shape-retention"
              ],
              
              // Color Intelligence
              colorFamily: suitConfig.colorFamily,
              hexPrimary: suitConfig.colorHex,
              
              // Event & Occasion
              primaryOccasion: suitConfig.subcategory.toLowerCase(),
              occasionTags: suitConfig.isProm ? ["prom", "formal"] : ["business", "wedding", "formal"],
              trendingFor: suitConfig.isProm ? ["prom2025"] : [],
              
              // Outfit Building Helpers
              outfitRole: "base",
              pairsWellWith: ["dress-shirts", "ties", "pocket-squares"],
              styleNotes: `Perfect for ${suitConfig.subcategory.toLowerCase()} occasions with ${fit.toLowerCase()} styling`,
              
              // Local SEO
              localKeywords: suitConfig.isProm ? ["prom suits", "formal wear"] : ["business suits", "wedding attire"],
              
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
              isFeatured: suitConfig.isProm,
              
              // SEO & Marketing
              metaTitle: `${suitConfig.name} ${fit} | ${suitConfig.color} Suit | KCT`,
              metaDescription: suitConfig.longDescription.substring(0, 155),
              tags: [
                suitConfig.subcategory.toLowerCase(),
                suitConfig.color.toLowerCase(),
                fit.toLowerCase().replace(' ', '-'),
                suitConfig.isTuxedo ? "tuxedo" : "suit"
              ],
              
              occasions: suitConfig.isProm ? ["prom", "formal"] : ["business", "wedding", "formal"],
              styleAttributes: [fit.toLowerCase().replace(' ', '-'), "professional", suitConfig.isTuxedo ? "formal" : "business"],
            }
          });

          totalProducts++;

          // Create variants for sizes and lengths
          let stockTotal = 0;
          const pieceConfigs = suitConfig.hasVest ? ['2-Piece', '3-Piece'] : ['2-Piece'];
          
          for (const pieces of pieceConfigs) {
            for (const size of suitSizes) {
              for (const length of lengthTypes) {
                const sizeLabel = `${size}${length}`;
                const variantPrice = pieces === '3-Piece' ? suitConfig.basePrice + 100 : suitConfig.basePrice;
                const stock = 5; // 5 of each size/length combination
                
                await fastify.prisma.productVariant.create({
                  data: {
                    productId: product.id,
                    name: `${product.name} - ${pieces} - ${sizeLabel}`,
                    sku: `${product.sku}-${pieces.replace('-', '')}-${sizeLabel}`,
                    size: sizeLabel,
                    color: suitConfig.color,
                    material: pieces, // Store piece count in material field
                    price: variantPrice,
                    compareAtPrice: variantPrice + 100,
                    stock: stock,
                    isActive: true,
                    position: suitSizes.indexOf(size) * lengthTypes.length + lengthTypes.indexOf(length),
                  }
                });
                totalVariants++;
                stockTotal += stock;
              }
            }
          }

          // Update product stock totals
          await fastify.prisma.product.update({
            where: { id: product.id },
            data: { 
              totalStock: stockTotal,
              availableStock: stockTotal 
            }
          });
        }
      }

      // Add additional business suits programmatically
      const additionalSuitColors = [
        { name: 'Dark Gray', hex: '#A9A9A9', family: 'Greys' },
        { name: 'Light Gray', hex: '#D3D3D3', family: 'Greys' }, 
        { name: 'Brown', hex: '#964B00', family: 'Browns' }
      ];

      for (const color of additionalSuitColors) {
        for (const fit of fitTypes) {
          const smartAttributes = {
            formality_level: 4,
            conservative_rating: 4,
            color_temperature: 'neutral',
            event_suitability: ['business', 'wedding', 'formal'],
            age_appropriateness: fit === 'Slim Fit' ? ['young', 'middle'] : ['middle', 'mature'],
            style_personality: fit === 'Slim Fit' ? ['modern', 'contemporary'] : ['classic', 'traditional']
          };

          const product = await fastify.prisma.product.create({
            data: {
              name: `${color.name} Business Suit - ${fit}`,
              description: `Premium ${color.name.toLowerCase()} business suit with ${fit.toLowerCase()}`,
              longDescription: `Professional ${color.name.toLowerCase()} business suit crafted for versatility and style. Perfect for business meetings, interviews, and formal occasions.`,
              category: "Suits",
              subcategory: "Business",
              price: 349.99,
              compareAtPrice: 499.99,
              sku: `KCT-SUIT-${color.name.replace(' ', '').toUpperCase()}-${fit.replace(' ', '').toUpperCase()}`,
              slug: `${color.name.toLowerCase().replace(' ', '-')}-business-suit-${fit.toLowerCase().replace(' ', '-')}`,
              
              smartAttributes,
              fabricMarketing: "Performance Business Fabric",
              fabricCare: "Professional dry clean recommended",
              fabricBenefits: ["wrinkle-resistant", "breathable", "comfortable stretch", "shape-retention"],
              
              colorFamily: color.family,
              hexPrimary: color.hex,
              
              primaryOccasion: "business", 
              occasionTags: ["business", "wedding", "formal"],
              trendingFor: [],
              
              outfitRole: "base",
              pairsWellWith: ["dress-shirts", "ties", "pocket-squares"],
              styleNotes: `Versatile ${color.name.toLowerCase()} suit perfect for professional settings`,
              
              localKeywords: ["business suits", "professional wear"],
              
              trackStock: true,
              totalStock: 0,
              availableStock: 0,
              minimumStock: 5,
              reorderPoint: 10,
              reorderQuantity: 25,
              
              status: "ACTIVE",
              isPublished: true,
              isFeatured: false,
              
              metaTitle: `${color.name} Business Suit ${fit} | Professional Attire | KCT`,
              metaDescription: `Premium ${color.name.toLowerCase()} business suit in ${fit.toLowerCase()}. Perfect for meetings, interviews, and professional occasions.`,
              tags: ["business", color.name.toLowerCase(), fit.toLowerCase().replace(' ', '-')],
              
              occasions: ["business", "wedding", "formal"],
              styleAttributes: [fit.toLowerCase().replace(' ', '-'), "professional", "versatile"],
            }
          });

          totalProducts++;

          // Create variants 
          let stockTotal = 0;
          for (const size of suitSizes) {
            for (const length of lengthTypes) {
              const sizeLabel = `${size}${length}`;
              const stock = 3;
              
              await fastify.prisma.productVariant.create({
                data: {
                  productId: product.id,
                  name: `${product.name} - 2-Piece - ${sizeLabel}`,
                  sku: `${product.sku}-2PC-${sizeLabel}`,
                  size: sizeLabel,
                  color: color.name,
                  material: '2-Piece',
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  stock: stock,
                  isActive: true,
                  position: suitSizes.indexOf(size) * lengthTypes.length + lengthTypes.indexOf(length),
                }
              });
              totalVariants++;
              stockTotal += stock;
            }
          }

          await fastify.prisma.product.update({
            where: { id: product.id },
            data: { 
              totalStock: stockTotal,
              availableStock: stockTotal 
            }
          });
        }
      }

      console.log('✅ SMART RESTORATION COMPLETE!');
      console.log(`📊 Products created: ${totalProducts}`);
      console.log(`📦 Variants created: ${totalVariants}`);

      return reply.send({
        success: true,
        message: 'Smart catalog with variants restored successfully!',
        data: {
          totalProducts,
          totalVariants,
          categories: {
            shirts: dressShirtConfigs.length * shirtFits.length,
            ties: tieTypes.length,
            suits: suitConfigs.length * fitTypes.length + additionalSuitColors.length * fitTypes.length,
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error restoring smart catalog:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to restore smart catalog',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW: Add 76-color tie system endpoint
  fastify.post('/76-tie-colors', async (request, reply) => {
    try {
      console.log('🎨 Starting 76-color tie system API call...');
      
      // Import and execute the 76-color script
      const add76TieColors = await import('../../prisma/add-76-tie-colors');
      const result = await add76TieColors.default();
      
      return reply.send({
        success: true,
        message: '76-color tie system implemented successfully!',
        data: result
      });
      
    } catch (error) {
      fastify.log.error('Error implementing 76-color tie system:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to implement 76-color tie system',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

};

export default restoreRoutes; 