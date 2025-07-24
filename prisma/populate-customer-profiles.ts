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

async function populateCustomerProfiles() {
  console.log('🌱 Starting customer profile population...');
  
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '../enhanced_customers_menswear.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const records: CustomerCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log(`📊 Found ${records.length} customers to process`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Get existing customers map for faster lookup
    const customers = await prisma.customer.findMany({
      select: { id: true, email: true },
    });
    const customerMap = new Map(customers.map(c => [c.email, c.id]));
    
    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}...`);
      
      for (const record of batch) {
        try {
          const customerId = customerMap.get(record.Email);
          
          if (!customerId) {
            console.log(`⚠️  No customer found for email: ${record.Email}`);
            skipped++;
            continue;
          }
          
          // Check if profile already exists
          const existingProfile = await prisma.customerProfile.findUnique({
            where: { customerId },
          });
          
          // Parse data
          const profileData = {
            customerTier: record.customer_tier || 'Silver',
            engagementScore: parseInt(record.engagement_score) || 0,
            vipStatus: record.vip_status === 'TRUE',
            
            // Size profile
            jacketSize: record.jacket_size || null,
            vestSize: record.vest_size || null,
            shirtSize: record.shirt_size || null,
            shoeSize: record.shoe_size || null,
            pantsSize: record.pants_size || null,
            
            // Calculate size profile completeness
            sizeProfileCompleteness: [
              record.jacket_size,
              record.vest_size,
              record.shirt_size,
              record.shoe_size,
              record.pants_size
            ].filter(Boolean).length / 5,
            
            // Purchase analytics
            totalSpent: parseFloat(record['Total Spent']?.replace(/[$,]/g, '') || '0'),
            totalOrders: parseInt(record['Total Orders'] || '0'),
            averageOrderValue: parseFloat(record.average_order_value?.replace(/[$,]/g, '') || '0'),
            repeatCustomer: record.repeat_customer === 'TRUE',
            
            // Preferences
            primaryOccasion: record.primary_occasion || null,
            marketingTags: record.Tags ? record.Tags.split(',').map(t => t.trim()) : [],
            
            // Dates
            firstPurchaseDate: record.first_purchase_date ? new Date(record.first_purchase_date) : null,
            lastPurchaseDate: record.last_purchase_date ? new Date(record.last_purchase_date) : null,
          };
          
          // Calculate days since last purchase if applicable
          if (profileData.lastPurchaseDate) {
            const daysSince = Math.floor(
              (new Date().getTime() - profileData.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            Object.assign(profileData, { daysSinceLastPurchase: daysSince });
          }
          
          if (existingProfile) {
            // Update existing profile
            await prisma.customerProfile.update({
              where: { id: existingProfile.id },
              data: profileData,
            });
            console.log(`📝 Updated profile for: ${record.Email}`);
            updated++;
          } else {
            // Create new profile
            await prisma.customerProfile.create({
              data: {
                customerId,
                ...profileData,
              },
            });
            console.log(`✅ Created profile for: ${record.Email}`);
            created++;
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${record.Email}:`, error);
          errors++;
        }
      }
      
      // Progress checkpoint
      console.log(`\n📊 Progress: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    }
    
    // Create customer segments based on the data
    console.log('\n📊 Creating customer segments...');
    
    const segments = [
      {
        name: 'High Value Customers',
        description: 'Customers who have spent over $5,000',
        criteria: { totalSpent: { gte: 5000 } },
      },
      {
        name: 'Frequent Buyers',
        description: 'Customers with 5+ orders',
        criteria: { totalOrders: { gte: 5 } },
      },
      {
        name: 'Wedding Customers',
        description: 'Customers shopping for wedding occasions',
        criteria: { primaryOccasion: 'wedding' },
      },
      {
        name: 'Platinum Tier',
        description: 'Top tier customers',
        criteria: { customerTier: 'Platinum' },
      },
      {
        name: 'VIP Status',
        description: 'VIP customers with special privileges',
        criteria: { vipStatus: true },
      },
      {
        name: 'Size Profile Complete',
        description: 'Customers with complete size information',
        criteria: { sizeProfileCompleteness: 1 },
      },
    ];
    
    for (const segment of segments) {
      try {
        // Count customers matching criteria
        const customerCount = await prisma.customerProfile.count({
          where: segment.criteria,
        });
        
        // Calculate average order value and total revenue
        const stats = await prisma.customerProfile.aggregate({
          where: segment.criteria,
          _avg: { averageOrderValue: true },
          _sum: { totalSpent: true },
        });
        
        await prisma.customerSegment.upsert({
          where: { name: segment.name },
          update: {
            description: segment.description,
            criteria: segment.criteria,
            customerCount,
            avgOrderValue: stats._avg.averageOrderValue || 0,
            totalRevenue: stats._sum.totalSpent || 0,
          },
          create: {
            name: segment.name,
            description: segment.description,
            criteria: segment.criteria,
            customerCount,
            avgOrderValue: stats._avg.averageOrderValue || 0,
            totalRevenue: stats._sum.totalSpent || 0,
          },
        });
        
        console.log(`✅ Created/Updated segment: ${segment.name} (${customerCount} customers)`);
      } catch (error) {
        console.error(`❌ Error creating segment ${segment.name}:`, error);
      }
    }
    
    console.log(`
✨ Profile population completed!`);
    console.log(`   - Created: ${created} profiles`);
    console.log(`   - Updated: ${updated} profiles`);
    console.log(`   - Skipped: ${skipped} records`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total profiles: ${await prisma.customerProfile.count()}`);
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population
populateCustomerProfiles()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });