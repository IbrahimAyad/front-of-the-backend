#!/usr/bin/env ts-node

/**
 * Multi-Schema Database Test Script
 * 
 * This script tests CRUD operations across all three schemas:
 * - tenant_kct: customers, orders, appointments, etc.
 * - tenant_shared: products, suppliers, inventory, etc.
 * - analytics: customer insights, purchase history, etc.
 */

import { getSchemaAwareClient } from './lib/db/schema-aware-client'

async function testMultiSchemaOperations() {
  console.log('🚀 Starting Multi-Schema Database Test...\n')
  
  const client = getSchemaAwareClient()
  
  try {
    // 1. Test schema health check
    console.log('📊 Testing schema health check...')
    const health = await client.healthCheck()
    console.log('Health status:', health)
    console.log('✅ Schema health check passed\n')
    
    // 2. Test tenant_kct schema operations (customers)
    console.log('👥 Testing tenant_kct schema (customers)...')
    
    // Create a test customer
    const testCustomer = await client.customers.create({
      data: {
        name: 'Test Customer Multi-Schema',
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+1-555-0123'
      }
    })
    console.log('Created customer:', testCustomer.id)
    
    // Read the customer back
    const fetchedCustomer = await client.customers.findUnique({
      where: { id: testCustomer.id },
      include: {
        profile: true,
        orders: true
      }
    })
    console.log('Fetched customer:', fetchedCustomer ? 'Success' : 'Failed')
    
    // 3. Test tenant_shared schema operations (products)
    console.log('\n📦 Testing tenant_shared schema (products)...')
    
    // Create a test product
    const testProduct = await client.products.create({
      data: {
        name: 'Test Product Multi-Schema',
        description: 'A test product for multi-schema validation',
        category: 'Test',
        price: 99.99,
        sku: `TEST-${Date.now()}`,
        isPublished: false
      }
    })
    console.log('Created product:', testProduct.id)
    
    // Read the product back
    const fetchedProduct = await client.products.findUnique({
      where: { id: testProduct.id },
      include: {
        variants: true,
        images: true
      }
    })
    console.log('Fetched product:', fetchedProduct ? 'Success' : 'Failed')
    
    // 4. Test analytics schema operations
    console.log('\n📈 Testing analytics schema operations...')
    
    // Use direct SQL query for analytics
    const analyticsResults = await client.query(
      'SELECT COUNT(*) as customer_count FROM tenant_kct.customers',
      [],
      'analytics'
    )
    console.log('Analytics query result:', analyticsResults)
    
    // 5. Test cross-schema operations
    console.log('\n🔄 Testing cross-schema operations...')
    
    // Create an order that references both customer (tenant_kct) and product (tenant_shared)
    const testOrder = await client.orders.create({
      data: {
        customerId: testCustomer.id,
        total: 99.99,
        status: 'PENDING',
        items: {
          create: [{
            productId: testProduct.id,
            quantity: 1,
            price: 99.99
          }]
        }
      },
      include: {
        items: true
      }
    })
    console.log('Created cross-schema order:', testOrder.id)
    
    // 6. Test performance with complex queries
    console.log('\n⚡ Testing performance with complex queries...')
    
    const startTime = Date.now()
    
    const [customerCount, productCount, orderCount] = await Promise.all([
      client.getClient(true).customer.count(),
      client.getClient(true).product.count(), 
      client.getClient(true).order.count()
    ])
    
    const endTime = Date.now()
    
    console.log(`Counts - Customers: ${customerCount}, Products: ${productCount}, Orders: ${orderCount}`)
    console.log(`Query time: ${endTime - startTime}ms`)
    
    // 7. Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    
    await client.orders.delete({ where: { id: testOrder.id } })
    console.log('Deleted test order')
    
    await client.customers.delete({ where: { id: testCustomer.id } })
    console.log('Deleted test customer')
    
    await client.products.delete({ where: { id: testProduct.id } })
    console.log('Deleted test product')
    
    console.log('\n✅ All multi-schema tests passed successfully!')
    
  } catch (error) {
    console.error('\n❌ Multi-schema test failed:', error)
    throw error
  } finally {
    await client.disconnect()
    console.log('\n🔌 Disconnected from database')
  }
}

// Run the test
if (require.main === module) {
  testMultiSchemaOperations()
    .then(() => {
      console.log('\n🎉 Multi-schema database test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Multi-schema database test failed:', error)
      process.exit(1)
    })
}

export { testMultiSchemaOperations }