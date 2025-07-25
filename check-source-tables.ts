import { PrismaClient } from '@prisma/client';

const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:ruDjsYWPNrDECndgeOZsukLIXGqucmbR@shinkansen.proxy.rlwy.net:31547/railway'
    }
  }
});

async function checkSourceTables() {
  try {
    console.log('🔍 Checking tables in source database...\n');

    // Query to get all tables
    const tables = await sourcePrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log('📋 Available tables:');
    console.log(tables);

    // Check if there's a products-like table
    const productTables = await sourcePrisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%product%' OR table_name LIKE '%suit%' OR table_name LIKE '%item%')
      ORDER BY table_name, ordinal_position;
    `;

    console.log('\n📦 Product-related tables and columns:');
    console.log(productTables);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sourcePrisma.$disconnect();
  }
}

checkSourceTables();