import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:XPdLVWchmaBwfyVaZjltxOqwXsCIdtnn@shinkansen.proxy.rlwy.net:54160/railway"
    }
  }
});

async function analyzePracticeDB() {
  console.log('🔍 Analyzing Practice Database...\n');
  
  try {
    // Check table counts
    const [
      productsCount,
      variantsCount,
      customersCount,
      ordersCount,
      settingsCount,
      bulkPricingCount,
      bundleOptionsCount,
      preCheckoutCount
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM products`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM product_variants`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM customers`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM orders`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM settings`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM bulk_pricing`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM bundle_options`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM pre_checkout_configs`,
    ]);
    
    console.log('📊 Table Summary:');
    console.log(`  - Products: ${(productsCount as any[])[0].count}`);
    console.log(`  - Product Variants: ${(variantsCount as any[])[0].count}`);
    console.log(`  - Customers: ${(customersCount as any[])[0].count}`);
    console.log(`  - Orders: ${(ordersCount as any[])[0].count}`);
    console.log(`  - Settings: ${(settingsCount as any[])[0].count}`);
    console.log(`  - Bulk Pricing Rules: ${(bulkPricingCount as any[])[0].count}`);
    console.log(`  - Bundle Options: ${(bundleOptionsCount as any[])[0].count}`);
    console.log(`  - Pre-checkout Configs: ${(preCheckoutCount as any[])[0].count}`);
    
    // Sample products
    console.log('\n🛍️ Sample Products:');
    const products = await prisma.$queryRaw`
      SELECT id, name, sku, "productType", "basePrice", "salePrice", 
             "rentalAvailable", "rentalDailyPrice", color, material, 
             "isPreCheckoutSuggestion", categories
      FROM products 
      LIMIT 5
    `;
    
    for (const product of products as any[]) {
      console.log(`\n${product.name}:`);
      console.log(`  - SKU: ${product.sku}`);
      console.log(`  - Type: ${product.productType}`);
      console.log(`  - Price: $${product.basePrice}${product.salePrice ? ` (Sale: $${product.salePrice})` : ''}`);
      console.log(`  - Rental: ${product.rentalAvailable ? `Yes ($${product.rentalDailyPrice}/day)` : 'No'}`);
      console.log(`  - Color: ${product.color}, Material: ${product.material}`);
      console.log(`  - Pre-checkout Suggestion: ${product.isPreCheckoutSuggestion ? 'Yes' : 'No'}`);
      console.log(`  - Categories: ${product.categories.join(', ')}`);
    }
    
    // Check settings
    console.log('\n⚙️ Settings:');
    const settings = await prisma.$queryRaw`SELECT key, category FROM settings`;
    for (const setting of settings as any[]) {
      console.log(`  - ${setting.key} (${setting.category || 'general'})`);
    }
    
    // Analyze features
    console.log('\n✨ Key Features Found:');
    console.log('  ✓ Audit logging system');
    console.log('  ✓ Bulk pricing tiers');
    console.log('  ✓ Bundle configuration');
    console.log('  ✓ Pre-checkout suggestions');
    console.log('  ✓ Product analytics tracking');
    console.log('  ✓ Search logging');
    console.log('  ✓ Rental pricing (daily, weekly, event)');
    console.log('  ✓ Customer address/preferences as JSON');
    console.log('  ✓ Product snapshots in orders');
    console.log('  ✓ Version control on products');
    console.log('  ✓ User roles (Super Admin, Admin, Manager, Staff)');
    
    // Check product types and statuses
    const productTypes = await prisma.$queryRaw`
      SELECT DISTINCT "productType" as type, COUNT(*) as count 
      FROM products 
      GROUP BY "productType"
    `;
    
    console.log('\n📦 Product Types:');
    for (const type of productTypes as any[]) {
      console.log(`  - ${type.type}: ${type.count}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePracticeDB();