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
  'Default Address Phone': string;
  'Total Spent': string;
  'Total Orders': string;
  'Note': string;
  'Tags': string;
  customer_tier: string;
  engagement_score: string;
  jacket_size: string;
  jacket_size_confidence: string;
  vest_size: string;
  vest_size_confidence: string;
  shirt_size: string;
  shirt_size_confidence: string;
  shoe_size: string;
  shoe_size_confidence: string;
  pants_size: string;
  pants_size_confidence: string;
  size_profile_completeness: string;
  total_spent: string;
  total_orders: string;
  average_order_value: string;
  repeat_customer: string;
  vip_status: string;
  high_value_first_order: string;
  primary_occasion: string;
  first_purchase_date: string;
  last_purchase_date: string;
  days_since_last_purchase: string;
}

async function clearAndImportCustomers() {
  console.log('🧹 Starting customer database reset and enhanced import...\n');
  
  try {
    // Step 1: Clear existing data
    console.log('🗑️  Step 1: Clearing existing customers...');
    
    // Delete related data first (foreign key constraints)
    await prisma.customerProfile.deleteMany({});
    console.log('   ✅ Cleared customer profiles');
    
    await prisma.customerSegment.deleteMany({});
    console.log('   ✅ Cleared customer segments');
    
    await prisma.purchaseHistory.deleteMany({});
    console.log('   ✅ Cleared purchase history');
    
    // Clear customer relationships
    await prisma.order.deleteMany({});
    console.log('   ✅ Cleared orders');
    
    await prisma.lead.deleteMany({});
    console.log('   ✅ Cleared leads');
    
    await prisma.appointment.deleteMany({});
    console.log('   ✅ Cleared appointments');
    
    await prisma.measurement.deleteMany({});
    console.log('   ✅ Cleared measurements');
    
    // Finally clear customers
    const deletedCustomers = await prisma.customer.deleteMany({});
    console.log(`   ✅ Cleared ${deletedCustomers.count} customers\n`);
    
    // Step 2: Import enhanced customers
    console.log('📥 Step 2: Importing enhanced customers from CSV...');
    
    // Read CSV file
    const csvFilePath = './enhanced_customers_menswear.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV
    const records: CustomerCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Found ${records.length} customers to import\n`);
    
    let imported = 0;
    let profiles = 0;
    let errors = 0;
    const batchSize = 25; // Smaller batches for complex operations
    
    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${i + 1}-${i + batch.length} of ${records.length})...`);
      
      for (const record of batch) {
        try {
          // Validate email
          if (!record.Email || !record.Email.includes('@')) {
            errors++;
            continue;
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
              zipCode: record['Default Address Zip']?.replace(/'/g, '') || null,
              country: record['Default Address Country Code'] || 'US',
              notes: record.Note || null,
            }
          });
          
          imported++;
          
          // Create enhanced customer profile
          const profileData = {
            customerId: customer.id,
            customerTier: record.customer_tier || 'Silver',
            engagementScore: parseInt(record.engagement_score) || 0,
            vipStatus: record.vip_status === 'yes',
            
            // Size profile with confidence ratings
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
            totalSpent: parseFloat(record.total_spent?.replace(/[$,]/g, '') || record['Total Spent']?.replace(/[$,]/g, '') || '0'),
            totalOrders: parseInt(record.total_orders || record['Total Orders'] || '0'),
            averageOrderValue: parseFloat(record.average_order_value?.replace(/[$,]/g, '') || '0'),
            repeatCustomer: record.repeat_customer === 'yes',
            highValueFirstOrder: record.high_value_first_order === 'yes',
            
            // Preferences and occasions
            primaryOccasion: record.primary_occasion || null,
            marketingTags: record.Tags ? record.Tags.split(',').map(t => t.trim()) : [],
            
            // Dates
            firstPurchaseDate: record.first_purchase_date ? new Date(record.first_purchase_date) : null,
            lastPurchaseDate: record.last_purchase_date ? new Date(record.last_purchase_date) : null,
            daysSinceLastPurchase: parseInt(record.days_since_last_purchase) || null,
          };
          
          await prisma.customerProfile.create({ data: profileData });
          profiles++;
          
        } catch (error) {
          console.error(`❌ Error importing ${record.Email}:`, error);
          errors++;
        }
      }
      
      // Progress update
      console.log(`   📊 Batch complete: ${imported} customers, ${profiles} profiles, ${errors} errors\n`);
    }
    
    // Step 3: Create customer segments
    console.log('📊 Step 3: Creating customer segments...');
    
    const segments = [
      {
        name: 'Platinum Customers',
        description: 'Highest tier customers with premium status',
        criteria: { customerTier: 'Platinum' },
      },
      {
        name: 'Gold Customers',
        description: 'High-value repeat customers',
        criteria: { customerTier: 'Gold' },
      },
      {
        name: 'High Value Customers',
        description: 'Customers who have spent over $500',
        criteria: { totalSpent: { gte: 500 } },
      },
      {
        name: 'Wedding Customers',
        description: 'Customers shopping for wedding occasions',
        criteria: { primaryOccasion: 'wedding' },
      },
      {
        name: 'Prom Customers',
        description: 'Customers shopping for prom occasions',
        criteria: { primaryOccasion: 'prom' },
      },
      {
        name: 'VIP Customers',
        description: 'VIP customers with special privileges',
        criteria: { vipStatus: true },
      },
      {
        name: 'Complete Size Profile',
        description: 'Customers with complete sizing information',
        criteria: { sizeProfileCompleteness: { gte: 0.8 } },
      },
    ];
    
    for (const segment of segments) {
      try {
        const customerCount = await prisma.customerProfile.count({
          where: segment.criteria,
        });
        
        const stats = await prisma.customerProfile.aggregate({
          where: segment.criteria,
          _avg: { averageOrderValue: true },
          _sum: { totalSpent: true },
        });
        
        await prisma.customerSegment.create({
          data: {
            name: segment.name,
            description: segment.description,
            criteria: segment.criteria,
            customerCount,
            avgOrderValue: stats._avg.averageOrderValue || 0,
            totalRevenue: stats._sum.totalSpent || 0,
          }
        });
        
        console.log(`   ✅ Created segment: ${segment.name} (${customerCount} customers)`);
      } catch (error) {
        console.error(`❌ Error creating segment ${segment.name}:`, error);
      }
    }
    
    // Final summary
    const finalCounts = await Promise.all([
      prisma.customer.count(),
      prisma.customerProfile.count(),
      prisma.customerSegment.count(),
    ]);
    
    console.log(`
🎉 Enhanced customer import completed successfully!
📊 Final Statistics:
   - Customers imported: ${imported}
   - Customer profiles created: ${profiles}
   - Customer segments: ${finalCounts[2]}
   - Errors: ${errors}
   
✨ Your customer database now has rich analytics and intelligence!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
clearAndImportCustomers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 