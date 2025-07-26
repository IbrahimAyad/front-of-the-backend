import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:jfOgQOEqDHQYsNUrSoGCgJNqMlrwhUkO@junction.proxy.rlwy.net:18247/railway"
});

interface CustomerCSV {
  'Customer ID': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Accepts Email Marketing': string;
  'Default Address Company': string;
  'Default Address Address1': string;
  'Default Address Address2': string;
  'Default Address City': string;
  'Default Address Province Code': string;
  'Default Address Country Code': string;
  'Default Address Zip': string;
  'Default Address Phone': string;
  'Phone': string;
  'Accepts SMS Marketing': string;
  'Total Spent': string;      // ✅ FIXED: Use Shopify original
  'Total Orders': string;     // ✅ FIXED: Use Shopify original
  'Note': string;
  'Tax Exempt': string;
  'Tags': string;
  'total_spent': string;      // Enhanced version (don't use)
  'total_orders': string;     // Enhanced version (don't use)
  'product_names': string;    // ✅ NEW: Product purchase data
  'order_dates': string;
  'paid_dates': string;
  'Address Line 1': string;
  'City': string;
  'State Code': string;
  'Zip Code': string;
  'customer_tier': string;
  'engagement_score': string;
  'jacket_size': string;
  'jacket_size_confidence': string;
  'vest_size': string;
  'vest_size_confidence': string;
  'shirt_size': string;
  'shirt_size_confidence': string;
  'shoe_size': string;
  'shoe_size_confidence': string;
  'pants_size': string;
  'pants_size_confidence': string;
  'size_profile_completeness': string;
  'average_order_value': string;
  'repeat_customer': string;
  'vip_status': string;
  'high_value_first_order': string;
  'primary_occasion': string;
  'first_purchase_date': string;
  'last_purchase_date': string;
  'days_since_last_purchase': string;
}

// ✅ NEW: Function to extract sizes from product names
function extractSizeFromProduct(productName: string): string | null {
  // Common size patterns: 42R, 16.5/34, 34W/32L, 10.5, XL, etc.
  const sizePatterns = [
    /(\d{2}R||\d{2}L||\d{2}S)/,           // Jacket sizes: 42R, 40L, 38S
    /(\d{2,3}W\/\d{2,3}L)/,              // Pants: 34W/32L
    /(\d{1,2}\.\d{1,2}\/\d{2})/,         // Shirts: 16.5/34
    /(\d{1,2}\.\d{1,2})/,                // Shoes: 10.5
    /(XS|S|M|L|XL|XXL|XXXL)/,           // Standard sizes
  ];
  
  for (const pattern of sizePatterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// ✅ NEW: Function to parse product array from CSV
function parseProductNames(productNamesStr: string): string[] {
  try {
    // Remove outer quotes and parse as JSON array
    const cleanStr = productNamesStr.replace(/^"(.*)"$/, '$1').replace(/'/g, '"');
    const products = JSON.parse(cleanStr);
    return Array.isArray(products) ? products.filter(p => p !== 'shipping') : [];
  } catch (error) {
    console.warn('Failed to parse product names:', productNamesStr);
    return [];
  }
}

async function fixCustomerImport() {
  console.log('🚀 Starting corrected customer import...\n');

  const records: CustomerCSV[] = [];

  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream('enhanced_customers_menswear.csv')
      .pipe(csv())
      .on('data', (data: CustomerCSV) => records.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${records.length} customer records`);

  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const customerId = record['Customer ID'];
      const email = record['Email'];
      
      if (!email || !customerId) {
        continue;
      }

      // ✅ FIXED: Use Shopify original data
      const shopifySpent = parseFloat(record['Total Spent']) || 0;
      const shopifyOrders = parseInt(record['Total Orders']) || 0;
      const calculatedAOV = shopifyOrders > 0 ? shopifySpent / shopifyOrders : 0;

      // ✅ NEW: Parse product purchase data
      const productNames = parseProductNames(record['product_names'] || '[]');
      const extractedSizes = productNames.map(extractSizeFromProduct).filter(Boolean);
      const mostCommonSize = extractedSizes.length > 0 ? extractedSizes[0] : null;

      // Check if customer exists
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: email },
            { id: customerId }
          ]
        }
      });

      const customerData = {
        id: customerId,
        name: `${record['First Name']} ${record['Last Name']}`.trim(),
        email: email,
        phone: record['Phone'] || record['Default Address Phone'] || null,
        address: record['Default Address Address1'] || null,
        city: record['Default Address City'] || null,
        state: record['Default Address Province Code'] || null,
        zipCode: record['Default Address Zip'] || null,
        country: record['Default Address Country Code'] || null,
        preferences: record['Note'] || null,
      };

      const profileData = {
        // ✅ FIXED: Use correct Shopify data
        totalSpent: shopifySpent,
        totalOrders: shopifyOrders,  
        averageOrderValue: calculatedAOV,
        
        // Enhanced analytics
        customerTier: record['customer_tier'] || 'Bronze',
        engagementScore: parseFloat(record['engagement_score']) || 50,
        vipStatus: record['vip_status'] === 'yes',
        
        // ✅ NEW: Size data extracted from actual purchases
        extractedSize: mostCommonSize,
        productsPurchased: productNames.slice(0, 10), // Store first 10 products
        totalProductsPurchased: productNames.length,
        
        // Size confidence from CSV
        jacketSize: record['jacket_size'] || null,
        jacketSizeConfidence: parseFloat(record['jacket_size_confidence']) || null,
        shirtSize: record['shirt_size'] || null,
        shirtSizeConfidence: parseFloat(record['shirt_size_confidence']) || null,
        pantsSize: record['pants_size'] || null,
        pantsSizeConfidence: parseFloat(record['pants_size_confidence']) || null,
        sizeProfileCompleteness: parseFloat(record['size_profile_completeness']) || 0,
        
        // Purchase behavior
        repeatCustomer: record['repeat_customer'] === 'yes',
        highValueFirstOrder: record['high_value_first_order'] === 'yes',
        primaryOccasion: record['primary_occasion'] || null,
        
        // Dates
        firstPurchaseDate: record['first_purchase_date'] ? new Date(record['first_purchase_date']) : null,
        lastPurchaseDate: record['last_purchase_date'] ? new Date(record['last_purchase_date']) : null,
        daysSinceLastPurchase: parseInt(record['days_since_last_purchase']) || null,
      };

      if (existingCustomer) {
        // Update existing customer
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: customerData
        });

        await prisma.customerProfile.upsert({
          where: { customerId: existingCustomer.id },
          create: {
            customerId: existingCustomer.id,
            ...profileData
          },
          update: profileData
        });
        updated++;
      } else {
        // Create new customer
        const newCustomer = await prisma.customer.create({
          data: customerData
        });

        await prisma.customerProfile.create({
          data: {
            customerId: newCustomer.id,
            ...profileData
          }
        });
        imported++;
      }

      if ((imported + updated) % 100 === 0) {
        console.log(`✅ Processed ${imported + updated} customers...`);
      }

    } catch (error) {
      console.error(`❌ Error processing customer ${record['Email']}:`, error);
      errors++;
    }
  }

  console.log('\n🎉 Import completed!');
  console.log(`✅ Imported: ${imported} new customers`);
  console.log(`✅ Updated: ${updated} existing customers`);
  console.log(`❌ Errors: ${errors}`);

  // Check final results
  const totalCustomers = await prisma.customer.count();
  const totalProfiles = await prisma.customerProfile.count();
  const customersWithOrders = await prisma.customerProfile.count({
    where: { totalOrders: { gt: 0 } }
  });

  console.log('\n📊 FINAL RESULTS:');
  console.log(`Total customers: ${totalCustomers}`);
  console.log(`Total profiles: ${totalProfiles}`);
  console.log(`Customers with orders: ${customersWithOrders}`);
  console.log(`Average order value > $0: ${await prisma.customerProfile.count({ where: { averageOrderValue: { gt: 0 } } })}`);
}

fixCustomerImport()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 