import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CustomerCSV {
  'Customer ID': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'Default Address Address1': string;
  'Default Address City': string;
  'Default Address Province Code': string;
  'Default Address Country Code': string;
  'Default Address Zip': string;
  'Total Spent': string;
  'Total Orders': string;
  'Note': string;
  'Tags': string;
  'customer_tier': string;
  'engagement_score': string;
  'jacket_size': string;
  'vest_size': string;
  'shirt_size': string;
  'shoe_size': string;
  'pants_size': string;
  'average_order_value': string;
  'repeat_customer': string;
  'vip_status': string;
  'primary_occasion': string;
  'first_purchase_date': string;
  'last_purchase_date': string;
}

async function seedCustomers() {
  console.log('🌱 Starting customer import...');
  
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '../enhanced_customers_menswear.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const records: CustomerCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log(`📊 Found ${records.length} customers to import`);
    
    let imported = 0;
    let skipped = 0;
    let prospects = 0;
    let errors = 0;
    
    // Get current count to understand where we are
    const startCount = await prisma.customer.count();
    console.log(`📊 Starting with ${startCount} customers already in database`);
    
    // Process in batches for better performance
    const batchSize = 50; // Reduced batch size for stability
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${i}-${Math.min(i + batchSize, records.length)} of ${records.length})...`);
      
      for (const record of batch) {
      try {
        // Check if customer already exists
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: record.Email },
        });
        
        if (existingCustomer) {
          console.log(`⏭️  Skipping existing customer: ${record.Email}`);
          skipped++;
          continue;
        }
        
        // Create customer
        const customer = await prisma.customer.create({
          data: {
            firstName: record['First Name'] || '',
            lastName: record['Last Name'] || '',
            name: `${record['First Name']} ${record['Last Name']}`.trim(),
            email: record.Email,
            phone: record.Phone || record['Default Address Phone'] || null,
            address: record['Default Address Address1'] || null,
            city: record['Default Address City'] || null,
            state: record['Default Address Province Code'] || null,
            zipCode: record['Default Address Zip']?.replace(/'/g, '') || null,
            country: record['Default Address Country Code'] || null,
            notes: record.Note || null,
            // Add custom fields as JSON in notes if needed
            // You might want to extend your schema to include these fields:
            // - customerTier
            // - engagementScore
            // - sizes (jacket, vest, shirt, etc.)
            // - vipStatus
            // - primaryOccasion
          },
        });
        
        console.log(`✅ Imported: ${customer.name} (${customer.email})`);
        imported++;
        
        // Optional: Create measurements if size data exists
        if (record.jacket_size || record.pants_size || record.shirt_size) {
          await prisma.measurement.create({
            data: {
              customerId: customer.id,
              dateRecorded: new Date(),
              notes: `Imported sizes - Jacket: ${record.jacket_size || 'N/A'}, Pants: ${record.pants_size || 'N/A'}, Shirt: ${record.shirt_size || 'N/A'}`,
              // Map sizes to measurements if possible
              // This would need more sophisticated parsing
            },
          });
        }
        
      } catch (error) {
        console.error(`❌ Error importing ${record.Email}:`, error);
        errors++;
      }
    }
    
    // Progress checkpoint
    console.log(`\n📊 Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    }
    
    console.log(`
✨ Import completed!`);
    console.log(`   - Imported: ${imported} customers`);
    console.log(`   - Skipped: ${skipped} existing customers`);
    console.log(`   - Total in database: ${await prisma.customer.count()}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
seedCustomers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });