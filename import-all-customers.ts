import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

async function importAllCustomers() {
  console.log('🌱 Importing all customers from enhanced CSV...\n');
  
  try {
    // Read CSV file
    const csvFilePath = '/Users/ibrahim/Desktop/enhanced_customers_menswear.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Total customers in CSV: ${records.length}`);
    
    // Get current count
    const existingCustomers = await prisma.customer.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existingCustomers.map(c => c.email));
    console.log(`📊 Currently in database: ${existingEmails.size}\n`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 50;
    
    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} (${i + 1}-${i + batch.length} of ${records.length})...`);
      
      const promises = batch.map(async (record) => {
        try {
          // Skip if email is invalid or already exists
          if (!record.Email || existingEmails.has(record.Email)) {
            return { status: 'skipped' };
          }
          
          // Create customer
          const customer = await prisma.customer.create({
            data: {
              email: record.Email,
              name: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim() || record.Email.split('@')[0],
              firstName: record['First Name'] || null,
              lastName: record['Last Name'] || null,
              phone: record.Phone || record['Default Address Phone'] || null,
              address: record['Default Address Address1'] || null,
              city: record['Default Address City'] || null,
              state: record['Default Address Province Code'] || null,
              zipCode: record['Default Address Zip'] || null,
              country: record['Default Address Country Code'] || 'US',
              notes: record.Note || null,
            }
          });
          
          // Create customer profile with enhanced data
          if (record.customer_tier || record.jacket_size || record.primary_occasion) {
            await prisma.customerProfile.create({
              data: {
                customerId: customer.id,
                customerTier: record.customer_tier || 'Silver',
                engagementScore: parseInt(record.engagement_score) || 0,
                vipStatus: record.vip_status === 'yes',
                
                // Size profile
                jacketSize: record.jacket_size || null,
                jacketSizeConfidence: parseFloat(record.jacket_size_confidence) || null,
                vestSize: record.vest_size || null,
                vestSizeConfidence: parseFloat(record.vest_size_confidence) || null,
                shirtSize: record.shirt_size || null,
                shirtSizeConfidence: parseFloat(record.shirt_size_confidence) || null,
                shoeSize: record.shoe_size || null,
                shoeSizeConfidence: parseFloat(record.shoe_size_confidence) || null,
                pantsSize: record.pants_size || null,
                pantsSizeConfidence: parseFloat(record.pants_size_confidence) || null,
                sizeProfileCompleteness: parseFloat(record.size_profile_completeness) || 0,
                
                // Purchase analytics
                totalSpent: parseFloat(record.total_spent) || 0,
                totalOrders: parseInt(record.total_orders) || 0,
                averageOrderValue: parseFloat(record.average_order_value) || 0,
                repeatCustomer: record.repeat_customer === 'yes',
                highValueFirstOrder: record.high_value_first_order === 'yes',
                
                // Occasions
                primaryOccasion: record.primary_occasion || null,
                
                // Dates
                firstPurchaseDate: record.first_purchase_date ? new Date(record.first_purchase_date) : null,
                lastPurchaseDate: record.last_purchase_date ? new Date(record.last_purchase_date) : null,
                daysSinceLastPurchase: parseInt(record.days_since_last_purchase) || null,
              }
            });
          }
          
          existingEmails.add(record.Email);
          return { status: 'imported', name: customer.name };
          
        } catch (error) {
          console.error(`❌ Error with ${record.Email}:`, error);
          return { status: 'error' };
        }
      });
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result.status === 'imported') {
          imported++;
          console.log(`✅ Imported: ${result.name}`);
        } else if (result.status === 'skipped') {
          skipped++;
        } else if (result.status === 'error') {
          errors++;
        }
      });
      
      console.log(`📊 Batch complete: ${imported} imported, ${skipped} skipped, ${errors} errors\n`);
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final count
    const finalCount = await prisma.customer.count();
    const profileCount = await prisma.customerProfile.count();
    
    console.log('\n✨ Import complete!');
    console.log(`📊 Final customer count: ${finalCount}`);
    console.log(`📊 Customer profiles: ${profileCount}`);
    console.log(`📊 This session: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllCustomers();