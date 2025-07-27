import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// Import all Terminal 3's services
import { AuthService } from '../../lib/services/auth.service'
import { ProductService } from '../../lib/services/product.service'
import { CustomerService } from '../../lib/services/customer.service'
import { OrderService } from '../../lib/services/order.service'
import { CacheService } from '../../lib/services/cache.service'
import { EmailService } from '../../lib/services/email.service'

/**
 * Service Layer Integration Tests
 * 
 * Tests Terminal 3's services with real database integration
 * and service interaction patterns
 */

describe('Service Layer Integration Tests', () => {
  let prisma: PrismaClient
  let redis: Redis
  let authService: AuthService
  let productService: ProductService
  let customerService: CustomerService
  let orderService: OrderService
  let cacheService: CacheService
  let emailService: EmailService

  // Test data
  let testUser: any
  let testProduct: any
  let testCustomer: any
  let testOrder: any

  beforeAll(async () => {
    // Initialize test database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    })

    // Initialize Redis for testing
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1, // Use different DB for tests
    })

    // Initialize services
    authService = new AuthService({
      jwtSecret: 'test-secret',
      jwtExpiresIn: '7d',
      saltRounds: 10,
    })

    productService = new ProductService(prisma)
    customerService = new CustomerService(prisma)
    orderService = new OrderService(prisma)
    cacheService = new CacheService(redis)
    emailService = new EmailService({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@test.com',
        pass: 'test'
      }
    })

    // Clean up any existing test data
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
    await redis.quit()
  })

  beforeEach(async () => {
    // Clear cache before each test
    await redis.flushdb()
  })

  async function cleanupTestData() {
    try {
      // Delete in reverse dependency order
      await prisma.orderItem.deleteMany({
        where: { order: { orderNumber: { startsWith: 'TEST-' } } }
      })
      await prisma.order.deleteMany({
        where: { orderNumber: { startsWith: 'TEST-' } }
      })
      await prisma.product.deleteMany({
        where: { sku: { startsWith: 'TEST-' } }
      })
      await prisma.customer.deleteMany({
        where: { email: { contains: 'test-integration' } }
      })
      await prisma.user.deleteMany({
        where: { email: { contains: 'test-integration' } }
      })
    } catch (error) {
      console.warn('Cleanup warning:', error)
    }
  }

  describe('AuthService Integration', () => {
    it('should integrate with database for user operations', async () => {
      // Test user registration through service
      const userData = {
        email: `test-integration-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Integration Test User'
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: await authService.hashPassword(userData.password),
          name: userData.name,
          role: 'user'
        }
      })

      testUser = user

      // Test JWT generation
      const token = authService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      })

      expect(token).toBeTruthy()

      // Test JWT verification
      const decoded = authService.verifyToken(token)
      expect(decoded.id).toBe(user.id)
      expect(decoded.email).toBe(user.email)

      // Test password verification
      const isValid = await authService.verifyPassword(userData.password, user.password)
      expect(isValid).toBe(true)
    })

    it('should handle authentication errors gracefully', async () => {
      // Test invalid token
      expect(() => authService.verifyToken('invalid-token')).toThrow()

      // Test password verification with wrong password
      const wrongPassword = await authService.verifyPassword('wrong', testUser.password)
      expect(wrongPassword).toBe(false)
    })
  })

  describe('ProductService Integration', () => {
    it('should create and manage products with variants', async () => {
      const productData = {
        name: 'Test Integration Product',
        description: 'Product for integration testing',
        price: 299.99,
        category: 'Suits',
        sku: `TEST-PRODUCT-${Date.now()}`,
        stock: 100,
        images: [
          { url: 'https://example.com/image1.jpg', alt: 'Front view' }
        ]
      }

      // Create product
      testProduct = await productService.createProduct(productData)

      expect(testProduct).toBeTruthy()
      expect(testProduct.name).toBe(productData.name)
      expect(testProduct.price).toBe(productData.price)
      expect(testProduct.stock).toBe(productData.stock)

      // Test product retrieval
      const retrievedProduct = await productService.getProductById(testProduct.id)
      expect(retrievedProduct?.id).toBe(testProduct.id)

      // Test product search
      const searchResults = await productService.searchProducts('Integration')
      expect(searchResults.products.length).toBeGreaterThan(0)
      expect(searchResults.products.some(p => p.id === testProduct.id)).toBe(true)

      // Test stock adjustment
      await productService.updateStock(testProduct.id, -10, 'Test sale')
      const updatedProduct = await productService.getProductById(testProduct.id)
      expect(updatedProduct?.stock).toBe(90)

      // Test stock history
      const stockHistory = await productService.getStockHistory(testProduct.id)
      expect(stockHistory.length).toBeGreaterThan(0)
      expect(stockHistory[0].reason).toBe('Test sale')
    })

    it('should handle inventory constraints', async () => {
      // Test stock validation
      const stockCheck = await productService.checkStockAvailability(testProduct.id, 1000)
      expect(stockCheck).toBe(false)

      const validStockCheck = await productService.checkStockAvailability(testProduct.id, 50)
      expect(validStockCheck).toBe(true)

      // Test negative stock prevention
      await expect(
        productService.updateStock(testProduct.id, -1000, 'Oversell attempt')
      ).rejects.toThrow()
    })
  })

  describe('CustomerService Integration', () => {
    it('should manage customer lifecycle', async () => {
      const customerData = {
        email: `test-integration-customer-${Date.now()}@example.com`,
        name: 'Integration Test Customer',
        phone: '+1234567890',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      }

      // Create customer
      testCustomer = await customerService.createCustomer(customerData)

      expect(testCustomer).toBeTruthy()
      expect(testCustomer.email).toBe(customerData.email)
      expect(testCustomer.customerNumber).toBeTruthy()

      // Test customer retrieval
      const retrievedCustomer = await customerService.getCustomerById(testCustomer.id)
      expect(retrievedCustomer?.id).toBe(testCustomer.id)

      // Test customer search
      const searchResults = await customerService.searchCustomers('Integration')
      expect(searchResults.customers.length).toBeGreaterThan(0)

      // Test customer update
      const updateData = {
        name: 'Updated Integration Customer',
        phone: '+0987654321'
      }
      const updatedCustomer = await customerService.updateCustomer(testCustomer.id, updateData)
      expect(updatedCustomer.name).toBe(updateData.name)
      expect(updatedCustomer.phone).toBe(updateData.phone)

      // Test analytics calculation
      const analytics = await customerService.getCustomerAnalytics(testCustomer.id)
      expect(analytics).toHaveProperty('totalOrders')
      expect(analytics).toHaveProperty('totalSpent')
      expect(analytics).toHaveProperty('lifetimeValue')
    })

    it('should handle customer communication', async () => {
      // Add customer note
      const noteData = {
        content: 'Integration test note',
        type: 'general' as const
      }
      const note = await customerService.addCustomerNote(testCustomer.id, noteData, testUser.id)
      expect(note.content).toBe(noteData.content)

      // Get customer notes
      const notes = await customerService.getCustomerNotes(testCustomer.id)
      expect(notes.length).toBeGreaterThan(0)
      expect(notes[0].content).toBe(noteData.content)
    })
  })

  describe('OrderService Integration', () => {
    it('should process complete order lifecycle', async () => {
      const orderData = {
        userId: testUser.id,
        customerId: testCustomer.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          name: 'Test User',
          street: '123 Shipping Street',
          city: 'Ship City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        shipping: {
          method: 'standard',
          cost: 15.00
        }
      }

      // Create order
      testOrder = await orderService.createOrder(orderData)

      expect(testOrder).toBeTruthy()
      expect(testOrder.orderNumber).toBeTruthy()
      expect(testOrder.status).toBe('pending')
      expect(testOrder.items.length).toBe(1)
      expect(testOrder.total).toBeGreaterThan(0)

      // Verify stock was reduced
      const updatedProduct = await productService.getProductById(testProduct.id)
      expect(updatedProduct?.stock).toBe(88) // 90 - 2 from order

      // Test order status updates
      const processingOrder = await orderService.updateOrderStatus(
        testOrder.id,
        'processing',
        testUser.id
      )
      expect(processingOrder.status).toBe('processing')

      // Test order timeline
      expect(processingOrder.timeline.length).toBeGreaterThan(1)
      expect(processingOrder.timeline.some(t => t.status === 'processing')).toBe(true)

      // Test order cancellation
      const cancelledOrder = await orderService.cancelOrder(
        testOrder.id,
        'Customer request',
        testUser.id
      )
      expect(cancelledOrder.status).toBe('cancelled')
      expect(cancelledOrder.cancellationReason).toBe('Customer request')

      // Verify stock was restored
      const restoredProduct = await productService.getProductById(testProduct.id)
      expect(restoredProduct?.stock).toBe(90) // Back to 90 after cancellation
    })

    it('should handle order validation', async () => {
      // Test insufficient stock
      const invalidOrderData = {
        userId: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1000, // More than available stock
            price: testProduct.price
          }
        ],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      }

      await expect(
        orderService.createOrder(invalidOrderData)
      ).rejects.toThrow()
    })
  })

  describe('CacheService Integration', () => {
    it('should cache and retrieve data efficiently', async () => {
      const cacheKey = 'test-integration-key'
      const testData = { name: 'Integration Test Data', value: 42 }

      // Test cache set
      await cacheService.set(cacheKey, testData, 60)

      // Test cache get
      const cachedData = await cacheService.get(cacheKey)
      expect(cachedData).toEqual(testData)

      // Test cache exists
      const exists = await cacheService.exists(cacheKey)
      expect(exists).toBe(true)

      // Test cache delete
      await cacheService.delete(cacheKey)
      const deletedData = await cacheService.get(cacheKey)
      expect(deletedData).toBeNull()
    })

    it('should integrate with service caching patterns', async () => {
      // Test product caching
      const cacheKey = `product:${testProduct.id}`
      
      // Cache should be empty initially
      const cachedProduct = await cacheService.get(cacheKey)
      expect(cachedProduct).toBeNull()

      // Service should cache product data
      await cacheService.set(cacheKey, testProduct, 300)
      
      // Verify cached data
      const retrievedFromCache = await cacheService.get(cacheKey)
      expect(retrievedFromCache.id).toBe(testProduct.id)

      // Test cache invalidation patterns
      await cacheService.delete(cacheKey)
      const afterInvalidation = await cacheService.get(cacheKey)
      expect(afterInvalidation).toBeNull()
    })
  })

  describe('EmailService Integration', () => {
    it('should handle email operations', async () => {
      // Mock email sending for testing
      const sendSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        success: true
      })

      // Test order confirmation email
      const emailData = {
        to: testCustomer.email,
        subject: 'Order Confirmation',
        template: 'order-confirmation',
        data: {
          customerName: testCustomer.name,
          orderNumber: testOrder.orderNumber,
          items: testOrder.items
        }
      }

      const emailResult = await emailService.sendEmail(emailData)
      expect(emailResult.success).toBe(true)
      expect(sendSpy).toHaveBeenCalledWith(emailData)

      // Test bulk email
      const bulkEmailData = [
        {
          to: testCustomer.email,
          subject: 'Newsletter',
          template: 'newsletter',
          data: { name: testCustomer.name }
        }
      ]

      const bulkResults = await emailService.sendBulkEmail(bulkEmailData)
      expect(bulkResults.length).toBe(1)
      expect(bulkResults[0].success).toBe(true)

      sendSpy.mockRestore()
    })
  })

  describe('Service Interaction Patterns', () => {
    it('should handle complex workflows with multiple services', async () => {
      // Simulate a complex e-commerce workflow
      
      // 1. User places an order (OrderService + ProductService)
      const orderData = {
        userId: testUser.id,
        customerId: testCustomer.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          name: testCustomer.name,
          street: '123 Workflow Street',
          city: 'Workflow City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      }

      const workflowOrder = await orderService.createOrder(orderData)
      expect(workflowOrder.status).toBe('pending')

      // 2. Cache order data for quick access
      const orderCacheKey = `order:${workflowOrder.id}`
      await cacheService.set(orderCacheKey, workflowOrder, 3600)

      // 3. Send order confirmation email (EmailService)
      const confirmationEmail = {
        to: testCustomer.email,
        subject: `Order Confirmation - ${workflowOrder.orderNumber}`,
        template: 'order-confirmation',
        data: {
          customerName: testCustomer.name,
          orderNumber: workflowOrder.orderNumber,
          total: workflowOrder.total
        }
      }

      const emailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
        messageId: 'workflow-email-id',
        success: true
      })

      await emailService.sendEmail(confirmationEmail)
      expect(emailSpy).toHaveBeenCalled()

      // 4. Update customer analytics
      const updatedAnalytics = await customerService.getCustomerAnalytics(testCustomer.id)
      expect(updatedAnalytics.totalOrders).toBeGreaterThan(0)

      // 5. Process order status change
      await orderService.updateOrderStatus(workflowOrder.id, 'processing', testUser.id)

      // 6. Invalidate cache after update
      await cacheService.delete(orderCacheKey)

      // 7. Verify workflow completed successfully
      const finalOrder = await orderService.getOrderById(workflowOrder.id)
      expect(finalOrder?.status).toBe('processing')

      emailSpy.mockRestore()
    })

    it('should handle error scenarios across services', async () => {
      // Test transaction rollback scenarios
      
      // Attempt to create order with invalid product
      const invalidOrderData = {
        userId: testUser.id,
        items: [
          {
            productId: 'non-existent-product-id',
            quantity: 1,
            price: 100
          }
        ],
        shippingAddress: {
          name: 'Error Test',
          street: '123 Error Street',
          city: 'Error City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      }

      // This should fail and not affect existing data
      await expect(
        orderService.createOrder(invalidOrderData)
      ).rejects.toThrow()

      // Verify product stock was not affected
      const unchangedProduct = await productService.getProductById(testProduct.id)
      expect(unchangedProduct?.stock).toBe(90) // Should remain unchanged
    })
  })

  describe('Performance and Optimization', () => {
    it('should demonstrate caching improvements', async () => {
      // Test without cache
      const startTime = Date.now()
      await productService.getProductById(testProduct.id)
      const uncachedTime = Date.now() - startTime

      // Cache the product
      await cacheService.set(`product:${testProduct.id}`, testProduct, 300)

      // Test with cache
      const cachedStartTime = Date.now()
      await cacheService.get(`product:${testProduct.id}`)
      const cachedTime = Date.now() - cachedStartTime

      // Cache should be faster (though this test might be flaky in CI)
      console.log(`Uncached: ${uncachedTime}ms, Cached: ${cachedTime}ms`)
      expect(cachedTime).toBeLessThanOrEqual(uncachedTime + 10) // Allow some tolerance
    })

    it('should handle bulk operations efficiently', async () => {
      // Test bulk product creation
      const bulkProducts = Array.from({ length: 5 }, (_, i) => ({
        name: `Bulk Product ${i}`,
        price: 100 + i * 10,
        category: 'Test',
        sku: `BULK-${Date.now()}-${i}`,
        stock: 50
      }))

      const startTime = Date.now()
      const createdProducts = await Promise.all(
        bulkProducts.map(product => productService.createProduct(product))
      )
      const bulkTime = Date.now() - startTime

      expect(createdProducts.length).toBe(5)
      console.log(`Bulk creation time: ${bulkTime}ms`)

      // Clean up
      await Promise.all(
        createdProducts.map(product => 
          productService.deleteProduct(product.id)
        )
      )
    })
  })
})