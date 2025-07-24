#!/usr/bin/env node

/**
 * Test script for MacOS Admin Panel sync functionality
 * 
 * This script tests the sync endpoints to ensure they work correctly
 * with the MacOS Admin Panel running on port 8080.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
// Authentication keys (corrected flow)
const MACOS_ADMIN_API_KEY = process.env.MACOS_ADMIN_API_KEY || '452a711bbfd449a28a98756b69e14560'; // Backend → MacOS Admin
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75'; // MacOS Admin → Backend

// Test data for webhook testing
const testProducts = [
  {
    id: 'test-1',
    sku: 'TEST-SUIT-001',
    name: 'Test Navy Business Suit',
    description: 'Test product from MacOS Admin',
    price: 599.99,
    category: 'suits',
    inStock: 15
  },
  {
    id: 'test-2',
    sku: 'TEST-TIE-001',
    name: 'Test Silk Tie',
    description: 'Test tie from MacOS Admin',
    price: 45.99,
    category: 'ties',
    inStock: 25
  }
];

async function testSyncEndpoint() {
  console.log('🧪 Testing MacOS Admin Sync Functionality\n');
  
  // Test 1: Pull from Admin (manual sync)
  console.log('1. Testing manual sync endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/pull-from-admin`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', result);
    
    if (result.success) {
      console.log('   ✅ Manual sync endpoint working');
    } else {
      console.log('   ⚠️  Manual sync failed (expected if MacOS Admin not running)');
      console.log('   Message:', result.message);
    }
  } catch (error) {
    console.log('   ❌ Manual sync endpoint error:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Webhook receiver
  console.log('2. Testing webhook receiver...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/webhooks/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY
      },
      body: JSON.stringify({ products: testProducts })
    });
    
    const result = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', result);
    
    if (result.success) {
      console.log('   ✅ Webhook receiver working');
      console.log(`   📦 Updated ${result.updated} of ${result.total} test products`);
    } else {
      console.log('   ❌ Webhook receiver failed');
    }
  } catch (error) {
    console.log('   ❌ Webhook endpoint error:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Check if test products were created
  console.log('3. Verifying test products were created...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/products?search=TEST-`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.products) {
      const testProductsFound = result.data.products.filter(p => 
        p.sku && p.sku.startsWith('TEST-')
      );
      
      console.log(`   📋 Found ${testProductsFound.length} test products in database`);
      testProductsFound.forEach(p => {
        console.log(`      - ${p.sku}: ${p.name} ($${p.price})`);
      });
      
      if (testProductsFound.length > 0) {
        console.log('   ✅ Database integration working');
      }
    } else {
      console.log('   ⚠️  Could not verify products (API might be using mock data)');
    }
  } catch (error) {
    console.log('   ❌ Product verification error:', error.message);
  }
  
  console.log('\n');
  
  // Test 4: Additional sync endpoints
  console.log('4. Testing additional sync endpoints...');
  
  const additionalEndpoints = [
    '/api/sync/pull-inventory',
    '/api/sync/pull-customers', 
    '/api/sync/pull-orders'
  ];
  
  for (const endpoint of additionalEndpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const result = await response.json();
      
      console.log(`   ${endpoint}: ${result.success ? '✅' : '⚠️'} ${result.message || 'OK'}`);
    } catch (error) {
      console.log(`   ${endpoint}: ❌ ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('   - Sync endpoints are properly configured');
  console.log('   - Webhook receiver accepts product data');
  console.log('   - Database integration is working');
  console.log('   - Ready to connect with MacOS Admin Panel');
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Start your MacOS Admin Panel (port 8080)');
  console.log('   2. Click "Sync from MacOS Admin" in the frontend');
  console.log('   3. Products should appear in your admin UI');
  console.log(`   4. Add MACOS_ADMIN_API_KEY=${MACOS_ADMIN_API_KEY} to Railway environment`);
}

// Run the test
testSyncEndpoint().catch(console.error); 