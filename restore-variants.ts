import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
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
};

// Tie color to suit pairing
const COLOR_PAIRING_RULES = {
  'navy': ['burgundy', 'silver', 'red', 'pink', 'gold'],
  'charcoal': ['burgundy', 'red', 'silver', 'blue', 'purple'],
  'black': ['silver', 'white', 'red', 'gold', 'royal-blue'],
  'grey': ['burgundy', 'navy', 'pink', 'purple', 'green'],
};

async function restoreVariants() {
  console.log('🔧 Restoring product variants with smart features...\n');
  
  try {
    // 1. Create suit variants with 6-drop sizing
    console.log('👔 Creating suit variants with 6-drop sizing...');
    const suits = await prisma.product.findMany({
      where: { category: 'Suits' }
    });
    
    let suitVariantCount = 0;
    for (const suit of suits) {
      // Standard sizes for all suits
      const sizes = ['38R', '40R', '42R', '44R', '46R'];
      const pieces = ['2-Piece', '3-Piece'];
      
      for (const piece of pieces) {
        for (const sizeLabel of sizes) {
          const chest = sizeLabel.slice(0, -1);
          const sizingData = SIZING_CHART[chest as keyof typeof SIZING_CHART];
          
          if (sizingData) {
            await prisma.productVariant.create({
              data: {
                productId: suit.id,
                name: `${suit.name} - ${piece} - ${sizeLabel}`,
                sku: `${suit.sku}-${piece.replace('-', '')}-${sizeLabel}`,
                size: sizeLabel,
                price: suit.price,
                stock: piece === '2-Piece' ? 15 : 10,
                material: JSON.stringify({
                  pieceCount: piece,
                  measurements: {
                    chest,
                    waist: sizingData.waist,
                    drop: sizingData.drop,
                    length: 'R'
                  }
                }),
                isActive: true
              }
            });
            suitVariantCount++;
          }
        }
      }
      
      // Update total stock
      await prisma.product.update({
        where: { id: suit.id },
        data: { 
          totalStock: 125, // 5 sizes * (15 + 10)
          availableStock: 125
        }
      });
    }
    console.log(`✅ Created ${suitVariantCount} suit variants\n`);
    
    // 2. Create tie variants with color pairing
    console.log('🎀 Creating tie variants with smart pairing...');
    const ties = await prisma.product.findMany({
      where: { category: 'Ties' }
    });
    
    // Common tie colors
    const tieColors = [
      { name: 'Navy Blue', slug: 'navy-blue', hex: '#000080', family: 'Blues' },
      { name: 'Burgundy', slug: 'burgundy', hex: '#800020', family: 'Reds' },
      { name: 'Silver', slug: 'silver', hex: '#C0C0C0', family: 'Greys' },
      { name: 'Red', slug: 'red', hex: '#FF0000', family: 'Reds' },
      { name: 'Black', slug: 'black', hex: '#000000', family: 'Blacks' },
      { name: 'Pink', slug: 'pink', hex: '#FFC0CB', family: 'Pinks' },
      { name: 'Gold', slug: 'gold', hex: '#FFD700', family: 'Yellows' },
      { name: 'Royal Blue', slug: 'royal-blue', hex: '#4169E1', family: 'Blues' },
      { name: 'Purple', slug: 'purple', hex: '#800080', family: 'Purples' },
      { name: 'Green', slug: 'green', hex: '#008000', family: 'Greens' },
      { name: 'White', slug: 'white', hex: '#FFFFFF', family: 'Whites' },
      { name: 'Orange', slug: 'orange', hex: '#FFA500', family: 'Oranges' },
      { name: 'Teal', slug: 'teal', hex: '#008080', family: 'Blues' },
      { name: 'Charcoal', slug: 'charcoal', hex: '#36454F', family: 'Greys' },
      { name: 'Light Blue', slug: 'light-blue', hex: '#ADD8E6', family: 'Blues' }
    ];
    
    let tieVariantCount = 0;
    for (const tie of ties) {
      for (const color of tieColors) {
        // Determine which suits this tie pairs with
        const pairsWellWithSuits = [];
        for (const [suitColor, recommendedTies] of Object.entries(COLOR_PAIRING_RULES)) {
          if (recommendedTies.some(tc => color.slug.includes(tc))) {
            pairsWellWithSuits.push(suitColor);
          }
        }
        
        await prisma.productVariant.create({
          data: {
            productId: tie.id,
            name: `${color.name} ${tie.name}`,
            sku: `${tie.sku}-${color.slug.toUpperCase()}`,
            size: 'One Size',
            color: color.name,
            price: tie.price,
            stock: 50,
            material: JSON.stringify({
              color: {
                name: color.name,
                hex: color.hex,
                family: color.family
              },
              pairing: {
                suitColors: pairsWellWithSuits,
                avoidWith: [color.slug.split('-')[0]], // Avoid same color
                contrastLevel: color.family === 'Blacks' || color.family === 'Whites' ? 'high' : 'medium'
              }
            }),
            isActive: true
          }
        });
        tieVariantCount++;
      }
      
      // Update total stock
      await prisma.product.update({
        where: { id: tie.id },
        data: { 
          totalStock: tieColors.length * 50,
          availableStock: tieColors.length * 50
        }
      });
    }
    console.log(`✅ Created ${tieVariantCount} tie variants\n`);
    
    // 3. Create shirt variants with size mapping
    console.log('👔 Creating shirt variants with smart sizing...');
    const shirts = await prisma.product.findMany({
      where: { category: 'Shirts' }
    });
    
    let shirtVariantCount = 0;
    for (const shirt of shirts) {
      const isSlim = shirt.name.includes('Slim');
      
      if (isSlim) {
        // Slim fit sizes
        const slimSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        const sizeMapping = {
          'XS': { suits: ['36R', '36S'], neck: 14, sleeve: 33 },
          'S': { suits: ['38R', '38S'], neck: 14.5, sleeve: 33 },
          'M': { suits: ['40R', '40S'], neck: 15.5, sleeve: 33 },
          'L': { suits: ['40L', '42S'], neck: 16, sleeve: 35 },
          'XL': { suits: ['42R'], neck: 16.5, sleeve: 35 },
          'XXL': { suits: ['44R', '46R'], neck: 17.5, sleeve: 35 }
        };
        
        for (const size of slimSizes) {
          await prisma.productVariant.create({
            data: {
              productId: shirt.id,
              name: `${shirt.name} - Size ${size}`,
              sku: `${shirt.sku}-${size}`,
              size,
              price: shirt.price,
              stock: 50,
              material: JSON.stringify({
                fit: 'slim',
                measurements: sizeMapping[size as keyof typeof sizeMapping],
                suitMapping: sizeMapping[size as keyof typeof sizeMapping].suits
              }),
              isActive: true
            }
          });
          shirtVariantCount++;
        }
      } else {
        // Classic fit - just add a few key sizes
        const classicSizes = [
          { size: '15.5 x 34-35', neck: 15.5, sleeve: '34-35', suits: ['40R'] },
          { size: '16 x 34-35', neck: 16, sleeve: '34-35', suits: ['42R'] },
          { size: '16.5 x 34-35', neck: 16.5, sleeve: '34-35', suits: ['44R'] },
          { size: '17 x 34-35', neck: 17, sleeve: '34-35', suits: ['46R'] }
        ];
        
        for (const sizeData of classicSizes) {
          await prisma.productVariant.create({
            data: {
              productId: shirt.id,
              name: `${shirt.name} - ${sizeData.size}`,
              sku: `${shirt.sku}-${sizeData.neck}-${sizeData.sleeve.replace('-', '')}`,
              size: sizeData.size,
              price: shirt.price,
              stock: 30,
              material: JSON.stringify({
                fit: 'classic',
                measurements: { neck: sizeData.neck, sleeve: sizeData.sleeve },
                suitMapping: sizeData.suits
              }),
              isActive: true
            }
          });
          shirtVariantCount++;
        }
      }
      
      // Update total stock
      const variantCount = await prisma.productVariant.count({
        where: { productId: shirt.id }
      });
      const totalStock = isSlim ? variantCount * 50 : variantCount * 30;
      
      await prisma.product.update({
        where: { id: shirt.id },
        data: { 
          totalStock,
          availableStock: totalStock
        }
      });
    }
    console.log(`✅ Created ${shirtVariantCount} shirt variants\n`);
    
    // Final summary
    const finalStats = {
      totalProducts: await prisma.product.count(),
      totalVariants: await prisma.productVariant.count(),
      customers: await prisma.customer.count()
    };
    
    console.log('✨ Restoration complete!');
    console.log(`📊 Final database state:`);
    console.log(`  - Products: ${finalStats.totalProducts}`);
    console.log(`  - Variants: ${finalStats.totalVariants}`);
    console.log(`  - Customers: ${finalStats.customers}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreVariants();