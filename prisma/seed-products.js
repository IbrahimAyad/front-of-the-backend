const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

// Sample Suppliers
const suppliers = [
  {
    name: 'Premium Textile Mills',
    contactName: 'Michael Chen',
    email: 'orders@ptmills.com',
    phone: '+1-555-0123',
    address: '123 Fashion District',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10018',
    website: 'https://ptmills.com',
    taxId: 'TAX123456',
    terms: 'Net 30',
    leadTime: 14,
    minimumOrder: 500,
    rating: 4.8,
    onTimeDelivery: 95,
    qualityRating: 4.9,
    isActive: true,
    isPreferred: true,
  },
  {
    name: 'Italian Fabric Co.',
    contactName: 'Giuseppe Romano',
    email: 'giuseppe@italianfabric.it',
    phone: '+39-055-123456',
    address: 'Via della Moda 45',
    city: 'Florence',
    state: 'Tuscany',
    country: 'Italy',
    zipCode: '50123',
    website: 'https://italianfabric.it',
    taxId: 'IT123456789',
    terms: 'Net 45',
    leadTime: 21,
    minimumOrder: 1000,
    rating: 4.9,
    onTimeDelivery: 92,
    qualityRating: 5.0,
    isActive: true,
    isPreferred: true,
  },
  {
    name: 'Classic Accessories Ltd',
    contactName: 'James Wilson',
    email: 'james@classicaccessories.com',
    phone: '+44-20-7123456',
    address: '456 Savile Row',
    city: 'London',
    state: 'England',
    country: 'UK',
    zipCode: 'W1S 3PR',
    website: 'https://classicaccessories.com',
    taxId: 'GB123456789',
    terms: 'Net 30',
    leadTime: 10,
    minimumOrder: 250,
    rating: 4.7,
    onTimeDelivery: 98,
    qualityRating: 4.8,
    isActive: true,
    isPreferred: false,
  },
];

// Sample Products with comprehensive details
const products = [
  // SUITS
  {
    name: 'Classic Navy Business Suit',
    description: 'Timeless navy suit perfect for business meetings and formal occasions',
    longDescription: 'Crafted from premium 120s wool, this classic navy suit features a modern slim fit with natural shoulder construction. The jacket includes functional button holes, pick-stitched lapels, and half-canvas construction for superior drape and comfort.',
    category: 'suits',
    subcategory: 'business',
    price: new Decimal(599.99),
    compareAtPrice: new Decimal(799.99),
    costPrice: new Decimal(299.99),
    sku: 'SUIT-NAV-001',
    barcode: '1234567890123',
    slug: 'classic-navy-business-suit',
    brand: 'KCT Signature',
    fabric: '120s Wool',
    pattern: 'Solid',
    season: 'Year-round',
    occasions: ['Business', 'Formal', 'Wedding'],
    styleAttributes: ['Classic', 'Slim Fit', 'Two Button'],
    care: 'Dry clean only',
    trackStock: true,
    totalStock: 50,
    availableStock: 45,
    reservedStock: 5,
    minimumStock: 10,
    reorderPoint: 15,
    reorderQuantity: 25,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    isOnSale: true,
    metaTitle: 'Classic Navy Business Suit - KCT Menswear',
    metaDescription: 'Premium navy business suit in 120s wool. Perfect fit guaranteed. Shop now for wedding and business attire.',
    tags: ['navy', 'business', 'wool', 'classic', 'wedding'],
    weight: 2.5,
    dimensions: '24x18x4 inches',
    supplierSku: 'PTM-NAVY-120s',
    leadTime: 14,
  },
  {
    name: 'Charcoal Gray Wedding Tuxedo',
    description: 'Elegant charcoal tuxedo for weddings and black-tie events',
    longDescription: 'This sophisticated charcoal gray tuxedo is expertly tailored from premium Italian wool. Features peak lapels with satin trim, covered buttons, and a sleek single-button closure.',
    category: 'suits',
    subcategory: 'tuxedo',
    price: new Decimal(899.99),
    compareAtPrice: new Decimal(1199.99),
    costPrice: new Decimal(450.00),
    sku: 'TUX-CHAR-001',
    barcode: '1234567890124',
    slug: 'charcoal-gray-wedding-tuxedo',
    brand: 'KCT Formal',
    fabric: 'Italian Wool',
    pattern: 'Solid',
    season: 'Year-round',
    occasions: ['Wedding', 'Black-tie', 'Gala'],
    styleAttributes: ['Formal', 'Peak Lapel', 'Single Button'],
    care: 'Professional dry clean only',
    trackStock: true,
    totalStock: 30,
    availableStock: 28,
    reservedStock: 2,
    minimumStock: 8,
    reorderPoint: 12,
    reorderQuantity: 20,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    isOnSale: false,
    metaTitle: 'Charcoal Gray Wedding Tuxedo - KCT Formal',
    metaDescription: 'Premium Italian wool tuxedo perfect for weddings and black-tie events. Expert tailoring included.',
    tags: ['tuxedo', 'wedding', 'formal', 'charcoal', 'italian wool'],
    weight: 2.8,
    dimensions: '26x20x4 inches',
    supplierSku: 'IFC-CHAR-TUX',
    leadTime: 21,
  },
  {
    name: 'White Dress Shirt - Classic Fit',
    description: 'Crisp white dress shirt with classic fit and French cuffs',
    longDescription: 'Essential white dress shirt crafted from premium Egyptian cotton. Features a classic fit with French cuffs, mother-of-pearl buttons, and reinforced collar.',
    category: 'shirts',
    subcategory: 'dress',
    price: new Decimal(89.99),
    compareAtPrice: new Decimal(129.99),
    costPrice: new Decimal(35.00),
    sku: 'SHIRT-WHT-001',
    barcode: '1234567890126',
    slug: 'white-dress-shirt-classic-fit',
    brand: 'KCT Essentials',
    fabric: 'Egyptian Cotton',
    pattern: 'Solid',
    season: 'Year-round',
    occasions: ['Business', 'Formal', 'Wedding'],
    styleAttributes: ['Classic Fit', 'French Cuff', 'Spread Collar'],
    care: 'Machine wash cold, hang dry',
    trackStock: true,
    totalStock: 100,
    availableStock: 85,
    reservedStock: 15,
    minimumStock: 25,
    reorderPoint: 35,
    reorderQuantity: 50,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    isOnSale: false,
    metaTitle: 'White Dress Shirt Classic Fit - Egyptian Cotton',
    metaDescription: 'Premium white dress shirt in Egyptian cotton. French cuffs and classic fit. Perfect for business and formal wear.',
    tags: ['white', 'dress shirt', 'cotton', 'classic', 'french cuff'],
    weight: 0.3,
    dimensions: '12x8x2 inches',
    supplierSku: 'PTM-WHT-COTTON',
    leadTime: 7,
  },
  {
    name: 'Burgundy Silk Tie',
    description: 'Classic burgundy silk tie with subtle texture',
    longDescription: 'Sophisticated burgundy silk tie crafted from premium Italian silk. Features a classic 3.5-inch width with subtle texture weave.',
    category: 'ties',
    subcategory: 'silk',
    price: new Decimal(45.99),
    compareAtPrice: new Decimal(65.99),
    costPrice: new Decimal(18.00),
    sku: 'TIE-BURG-001',
    barcode: '1234567890128',
    slug: 'burgundy-silk-tie',
    brand: 'KCT Accessories',
    fabric: 'Italian Silk',
    pattern: 'Textured Solid',
    season: 'Year-round',
    occasions: ['Business', 'Wedding', 'Formal'],
    styleAttributes: ['Classic Width', 'Silk', 'Textured'],
    care: 'Dry clean only',
    trackStock: true,
    totalStock: 60,
    availableStock: 55,
    reservedStock: 5,
    minimumStock: 15,
    reorderPoint: 20,
    reorderQuantity: 30,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: true,
    isOnSale: false,
    metaTitle: 'Burgundy Silk Tie - Italian Silk Neckwear',
    metaDescription: 'Premium burgundy silk tie in Italian silk. Classic width with subtle texture. Perfect for business and formal wear.',
    tags: ['burgundy', 'silk', 'tie', 'italian', 'classic'],
    weight: 0.1,
    dimensions: '6x4x1 inches',
    supplierSku: 'CAL-BURG-SILK',
    leadTime: 10,
  },
  {
    name: 'Charcoal Wool Vest',
    description: 'Classic charcoal vest to complete your three-piece suit',
    longDescription: 'Complete your formal look with this classic charcoal wool vest. Designed to match our charcoal suits, featuring a six-button front closure.',
    category: 'vests',
    subcategory: 'suit',
    price: new Decimal(149.99),
    compareAtPrice: new Decimal(199.99),
    costPrice: new Decimal(75.00),
    sku: 'VEST-CHAR-001',
    barcode: '1234567890130',
    slug: 'charcoal-wool-vest',
    brand: 'KCT Formal',
    fabric: 'Wool',
    pattern: 'Solid',
    season: 'Fall/Winter',
    occasions: ['Wedding', 'Formal', 'Business'],
    styleAttributes: ['Six Button', 'Adjustable Back', 'Welted Pockets'],
    care: 'Dry clean only',
    trackStock: true,
    totalStock: 35,
    availableStock: 30,
    reservedStock: 5,
    minimumStock: 10,
    reorderPoint: 15,
    reorderQuantity: 20,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    isOnSale: false,
    metaTitle: 'Charcoal Wool Vest - Three Piece Suit Essential',
    metaDescription: 'Premium charcoal wool vest to complete your three-piece suit. Perfect for weddings and formal events.',
    tags: ['vest', 'charcoal', 'wool', 'three-piece', 'formal'],
    weight: 0.5,
    dimensions: '14x12x2 inches',
    supplierSku: 'IFC-CHAR-VEST',
    leadTime: 21,
  },
  {
    name: 'Leather Dress Belt - Black',
    description: 'Premium black leather belt with silver buckle',
    longDescription: 'Essential black leather dress belt crafted from genuine Italian leather. Features a sleek silver buckle and classic design.',
    category: 'accessories',
    subcategory: 'belts',
    price: new Decimal(69.99),
    compareAtPrice: new Decimal(89.99),
    costPrice: new Decimal(28.00),
    sku: 'BELT-BLK-001',
    barcode: '1234567890131',
    slug: 'leather-dress-belt-black',
    brand: 'KCT Leather Goods',
    fabric: 'Italian Leather',
    pattern: 'Solid',
    season: 'Year-round',
    occasions: ['Business', 'Formal', 'Everyday'],
    styleAttributes: ['Genuine Leather', 'Silver Buckle', 'Classic'],
    care: 'Wipe clean with damp cloth',
    trackStock: true,
    totalStock: 90,
    availableStock: 85,
    reservedStock: 5,
    minimumStock: 25,
    reorderPoint: 35,
    reorderQuantity: 50,
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    isOnSale: true,
    metaTitle: 'Black Leather Dress Belt - Italian Leather',
    metaDescription: 'Premium black Italian leather dress belt with silver buckle. Perfect for business and formal wear.',
    tags: ['belt', 'leather', 'black', 'dress', 'italian'],
    weight: 0.4,
    dimensions: '8x6x2 inches',
    supplierSku: 'CAL-BLK-LEATHER',
    leadTime: 10,
  },
];

async function seedProducts() {
  console.log('🌱 Starting product data seeding...');

  try {
    // Create suppliers first
    console.log('📦 Creating suppliers...');
    const createdSuppliers = [];
    for (const supplier of suppliers) {
      const created = await prisma.supplier.create({
        data: supplier,
      });
      createdSuppliers.push(created);
      console.log(`✅ Created supplier: ${supplier.name}`);
    }

    // Create products
    console.log('👔 Creating products...');
    const createdProducts = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const supplier = createdSuppliers[i % createdSuppliers.length];

      const created = await prisma.product.create({
        data: {
          ...product,
          supplierId: supplier.id,
        },
      });
      createdProducts.push(created);
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create some product variants
    console.log('📏 Creating product variants...');
    const suitProduct = createdProducts.find(p => p.sku === 'SUIT-NAV-001');
    if (suitProduct) {
      const sizes = ['38R', '40R', '42R', '44R', '46R'];
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        await prisma.productVariant.create({
          data: {
            productId: suitProduct.id,
            name: `${suitProduct.name} - ${size}`,
            sku: `${suitProduct.sku}-${size}`,
            size: size,
            color: 'Navy',
            stock: 8 + i * 2,
            reservedStock: 0,
            minimumStock: 3,
            reorderPoint: 5,
            isActive: true,
            position: i + 1,
          },
        });
        console.log(`✅ Created variant: ${suitProduct.name} - ${size}`);
      }
    }

    // Create stock alerts for low stock items
    console.log('⚠️ Creating stock alerts...');
    const lowStockProducts = createdProducts.filter(p => p.availableStock <= p.reorderPoint);
    for (const product of lowStockProducts) {
      await prisma.stockAlert.create({
        data: {
          productId: product.id,
          type: 'LOW_STOCK',
          message: `${product.name} is running low (${product.availableStock} remaining)`,
          isRead: false,
          isResolved: false,
          priority: product.availableStock <= 5 ? 'CRITICAL' : 'MEDIUM',
        },
      });
      console.log(`⚠️ Created alert for: ${product.name}`);
    }

    // Create inventory logs
    console.log('📊 Creating inventory logs...');
    for (const product of createdProducts.slice(0, 3)) {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: 25,
          previousStock: Math.max(0, product.totalStock - 25),
          newStock: product.totalStock,
          reason: 'Initial stock purchase',
          reference: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      });
      console.log(`📊 Created inventory log for: ${product.name}`);
    }

    console.log('🎉 Product seeding completed successfully!');
    console.log(`📈 Created ${createdSuppliers.length} suppliers`);
    console.log(`👔 Created ${createdProducts.length} products`);
    console.log(`⚠️ Created ${lowStockProducts.length} stock alerts`);

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedProducts; 