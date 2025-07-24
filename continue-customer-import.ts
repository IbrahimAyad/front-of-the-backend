import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"
    }
  }
});

async function continueCustomerImport() {
  console.log('🌱 Continuing customer import...\n');
  
  try {
    // Read CSV file
    const csvFilePath = path.join(process.cwd(), '../enhanced_customers_menswear.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Total customers in CSV: ${records.length}`);
    
    // Get current count
    const currentCount = await prisma.customer.count();
    console.log(`📊 Currently in database: ${currentCount}`);
    console.log(`📊 Remaining to import: ${records.length - currentCount}\n`);
    
    // Process remaining customers
    let imported = 0;
    let skipped = 0;
    const batchSize = 100;
    
    // Start from where we left off
    const startIndex = Math.max(currentCount - 100, 1200); // Start a bit before to catch any missed
    
    for (let i = startIndex; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} (${i}-${i + batch.length} of ${records.length})...`);
      
      for (const record of batch) {
        try {
          // Check if customer exists
          const exists = await prisma.customer.findUnique({
            where: { email: record.email }
          });
          
          if (!exists) {
            await prisma.customer.create({
              data: {
                email: record.email,
                name: record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                firstName: record.first_name || record.name?.split(' ')[0] || '',
                lastName: record.last_name || record.name?.split(' ').slice(1).join(' ') || '',
                phone: record.phone || null,
                address: record.address || null,
                city: record.city || null,
                state: record.state || null,
                zipCode: record.zip || null,
                country: record.country || 'USA',
                notes: record.notes || null,
              }
            });
            
            console.log(`✅ Imported: ${record.name || record.email}`);
            imported++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.log(`⚠️  Error with ${record.email}:`, error);
        }
      }
      
      console.log(`📊 Progress: ${imported} imported, ${skipped} skipped\n`);
    }
    
    // Final count
    const finalCount = await prisma.customer.count();
    console.log('\n✨ Import complete!');
    console.log(`📊 Final customer count: ${finalCount}`);
    console.log(`📊 This session: ${imported} imported, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

continueCustomerImport();