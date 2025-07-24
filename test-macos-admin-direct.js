#!/usr/bin/env node

/**
 * Direct test of MacOS Admin Panel
 * This script tests your MacOS Admin Panel directly without needing the backend
 */

// Authentication keys (corrected flow)
const MACOS_ADMIN_API_KEY = '452a711bbfd449a28a98756b69e14560'; // Backend → MacOS Admin
const BACKEND_API_KEY = '0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75'; // MacOS Admin → Backend

async function testMacOSAdmin() {
  console.log('🧪 Testing MacOS Admin Panel Direct Connection\n');
  
  // Test different possible configurations
  const testConfigs = [
    { host: 'localhost', port: 8080 },
    { host: '127.0.0.1', port: 8080 },
    { host: '0.0.0.0', port: 8080 },
    { host: 'localhost', port: 8081 },
    { host: 'localhost', port: 3000 },
  ];
  
  for (const config of testConfigs) {
    console.log(`Testing ${config.host}:${config.port}...`);
    
    try {
      // Test products endpoint
      const productsUrl = `http://${config.host}:${config.port}/api/products`;
      console.log(`  📦 Trying: ${productsUrl}`);
      
      const response = await fetch(productsUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': MACOS_ADMIN_API_KEY,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const products = await response.json();
        console.log(`  ✅ SUCCESS! Found ${Array.isArray(products) ? products.length : 'unknown'} products`);
        console.log(`  📋 Products data:`, JSON.stringify(products, null, 2));
        
        // Test other endpoints if products work
        await testOtherEndpoints(config.host, config.port);
        return; // Success, no need to test other configs
      } else {
        console.log(`  ❌ HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`  ⏱️  Timeout - no response within 5 seconds`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`  🚫 Connection refused - nothing running on this port`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('❌ Could not connect to MacOS Admin Panel on any tested configuration');
  console.log('\n🔍 Troubleshooting:');
  console.log('1. Make sure your MacOS Admin Panel is actually running');
  console.log('2. Check what port it\'s really using in the admin panel UI');
  console.log('3. Try accessing it in a web browser: http://localhost:8080/api/products');
  console.log('4. Check if there are any firewall or network restrictions');
}

async function testOtherEndpoints(host, port) {
  const endpoints = [
    '/api/customers',
    '/api/orders', 
    '/api/inventory',
    '/api/collections',
    '/api/dashboard'
  ];
  
  console.log(`  🔗 Testing other endpoints on ${host}:${port}:`);
  
  for (const endpoint of endpoints) {
    try {
      const url = `http://${host}:${port}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': MACOS_ADMIN_API_KEY,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     ✅ ${endpoint}: ${Array.isArray(data) ? data.length + ' items' : 'OK'}`);
      } else {
        console.log(`     ❌ ${endpoint}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`     ❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Alternative: Test if we can simulate the webhook
async function testWebhookSimulation() {
  console.log('\n🔗 Testing Webhook Simulation');
  console.log('Since we can\'t connect to MacOS Admin, let\'s simulate the webhook data:');
  
  const sampleProducts = [
    {
      id: 'mac-admin-1',
      sku: 'SUIT-MAC-001',
      name: 'MacOS Admin Navy Suit',
      description: 'Professional navy suit from MacOS Admin Panel',
      price: 699.99,
      category: 'suits',
      inStock: 12
    },
    {
      id: 'mac-admin-2', 
      sku: 'TIE-MAC-001',
      name: 'MacOS Admin Silk Tie',
      description: 'Premium silk tie from MacOS Admin Panel',
      price: 55.99,
      category: 'ties',
      inStock: 25
    }
  ];
  
  console.log('📦 Sample products that would come from MacOS Admin:');
  console.log(JSON.stringify(sampleProducts, null, 2));
  
  console.log('\n💡 You can test the webhook by running:');
  console.log('curl -X POST http://localhost:8000/api/webhooks/products \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -H "X-API-Key: ${BACKEND_API_KEY}" \\`);
  console.log('  -d \'{"products": ' + JSON.stringify(sampleProducts) + '}\'');
}

// Run the tests
testMacOSAdmin()
  .then(() => testWebhookSimulation())
  .catch(console.error); 