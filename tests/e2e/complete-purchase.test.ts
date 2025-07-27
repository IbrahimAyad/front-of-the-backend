import { test, expect, Page } from '@playwright/test'

/**
 * Complete Purchase Flow E2E Test
 * 
 * This test validates the entire user journey from product browsing 
 * to order confirmation, testing all Terminal integrations:
 * - Terminal 1: API Routes
 * - Terminal 2: Cart & Checkout UI  
 * - Terminal 3: Services (Auth, Product, Customer, Order)
 * - Terminal 4: Auth System
 */

interface TestUser {
  email: string
  password: string
  name: string
  phone: string
}

interface ShippingAddress {
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface PaymentInfo {
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  nameOnCard: string
}

test.describe('Complete Purchase Flow', () => {
  let page: Page
  let testUser: TestUser
  let shippingAddress: ShippingAddress
  let paymentInfo: PaymentInfo

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Test data setup
    const timestamp = Date.now()
    testUser = {
      email: `e2e-${timestamp}@example.com`,
      password: 'SecurePassword123!',
      name: 'E2E Test User',
      phone: '+1234567890'
    }
    
    shippingAddress = {
      name: 'John Doe',
      street: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    }
    
    paymentInfo = {
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      nameOnCard: 'John Doe'
    }

    // Navigate to homepage
    await page.goto('/')
  })

  test('Complete purchase flow - Guest to registered user', async () => {
    // Step 1: Browse products and verify catalog loading
    console.log('🛍️ Step 1: Browsing products...')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 })
    
    // Verify products are displayed
    const productCount = await page.locator('[data-testid="product-card"]').count()
    expect(productCount).toBeGreaterThan(0)
    
    // Test product search
    await page.fill('[data-testid="product-search"]', 'suit')
    await page.click('[data-testid="search-button"]')
    await page.waitForTimeout(1000) // Allow search to process
    
    // Step 2: Select and view product details
    console.log('👔 Step 2: Viewing product details...')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Verify product detail page
    await page.waitForSelector('[data-testid="product-detail"]')
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    
    // Check stock availability
    const stockLevel = await page.locator('[data-testid="stock-level"]').textContent()
    expect(stockLevel).not.toContain('Out of Stock')
    
    // Step 3: Add to cart with size/variant selection
    console.log('🛒 Step 3: Adding to cart...')
    
    // Select size if available
    const sizeSelector = page.locator('[data-testid="size-selector"]')
    if (await sizeSelector.isVisible()) {
      await sizeSelector.selectOption({ index: 1 }) // Select first available size
    }
    
    // Select color if available
    const colorSelector = page.locator('[data-testid="color-selector"]')
    if (await colorSelector.isVisible()) {
      await colorSelector.first().click()
    }
    
    // Set quantity
    await page.fill('[data-testid="quantity-input"]', '2')
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart update
    await page.waitForSelector('[data-testid="cart-notification"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2')
    
    // Step 4: View cart and verify items
    console.log('🛒 Step 4: Reviewing cart...')
    
    await page.click('[data-testid="cart-button"]')
    await page.waitForSelector('[data-testid="cart-drawer"]')
    
    // Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toContainText('2')
    
    // Verify cart totals
    const subtotal = await page.locator('[data-testid="cart-subtotal"]').textContent()
    expect(subtotal).toMatch(/\$\d+\.\d{2}/)
    
    // Add another product to test multiple items
    await page.click('[data-testid="continue-shopping"]')
    await page.goto('/products')
    
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1)
    await secondProduct.click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify updated cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3')
    
    // Step 5: Proceed to checkout
    console.log('💳 Step 5: Proceeding to checkout...')
    
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Should redirect to checkout page
    await page.waitForURL('**/checkout/**')
    await page.waitForSelector('[data-testid="checkout-form"]')
    
    // Step 6: Enter shipping information
    console.log('📦 Step 6: Entering shipping information...')
    
    // Fill shipping form
    await page.fill('[data-testid="shipping-name"]', shippingAddress.name)
    await page.fill('[data-testid="shipping-street"]', shippingAddress.street)
    await page.fill('[data-testid="shipping-city"]', shippingAddress.city)
    await page.selectOption('[data-testid="shipping-state"]', shippingAddress.state)
    await page.fill('[data-testid="shipping-zip"]', shippingAddress.zipCode)
    await page.selectOption('[data-testid="shipping-country"]', shippingAddress.country)
    
    // Continue to shipping method
    await page.click('[data-testid="continue-to-shipping"]')
    
    // Step 7: Select shipping method
    console.log('🚚 Step 7: Selecting shipping method...')
    
    await page.waitForSelector('[data-testid="shipping-methods"]')
    
    // Verify shipping options loaded
    const shippingOptions = page.locator('[data-testid="shipping-option"]')
    expect(await shippingOptions.count()).toBeGreaterThan(0)
    
    // Select standard shipping
    await page.click('[data-testid="shipping-option"]:has-text("Standard")')
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment"]')
    
    // Step 8: Enter payment information
    console.log('💳 Step 8: Entering payment information...')
    
    await page.waitForSelector('[data-testid="payment-form"]')
    
    // Fill payment form
    await page.fill('[data-testid="card-number"]', paymentInfo.cardNumber)
    await page.selectOption('[data-testid="expiry-month"]', paymentInfo.expiryMonth)
    await page.selectOption('[data-testid="expiry-year"]', paymentInfo.expiryYear)
    await page.fill('[data-testid="cvv"]', paymentInfo.cvv)
    await page.fill('[data-testid="name-on-card"]', paymentInfo.nameOnCard)
    
    // Continue to review
    await page.click('[data-testid="continue-to-review"]')
    
    // Step 9: Review order and create account
    console.log('👤 Step 9: Creating account and reviewing order...')
    
    await page.waitForSelector('[data-testid="order-review"]')
    
    // Create account during checkout
    await page.check('[data-testid="create-account-checkbox"]')
    await page.fill('[data-testid="account-email"]', testUser.email)
    await page.fill('[data-testid="account-password"]', testUser.password)
    await page.fill('[data-testid="account-name"]', testUser.name)
    await page.fill('[data-testid="account-phone"]', testUser.phone)
    
    // Verify order summary
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-shipping-address"]')).toContainText(shippingAddress.street)
    await expect(page.locator('[data-testid="order-shipping-method"]')).toContainText('Standard')
    
    // Verify totals calculation
    const orderSubtotal = await page.locator('[data-testid="order-subtotal"]').textContent()
    const shippingCost = await page.locator('[data-testid="shipping-cost"]').textContent()
    const taxAmount = await page.locator('[data-testid="tax-amount"]').textContent()
    const orderTotal = await page.locator('[data-testid="order-total"]').textContent()
    
    expect(orderSubtotal).toMatch(/\$\d+\.\d{2}/)
    expect(shippingCost).toMatch(/\$\d+\.\d{2}/)
    expect(taxAmount).toMatch(/\$\d+\.\d{2}/)
    expect(orderTotal).toMatch(/\$\d+\.\d{2}/)
    
    // Step 10: Confirm purchase
    console.log('✅ Step 10: Confirming purchase...')
    
    // Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]')
    
    // Place order
    await page.click('[data-testid="place-order-button"]')
    
    // Step 11: Verify order confirmation
    console.log('🎉 Step 11: Verifying order confirmation...')
    
    // Wait for confirmation page
    await page.waitForURL('**/order-confirmation/**')
    await page.waitForSelector('[data-testid="order-confirmation"]')
    
    // Verify confirmation details
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Thank you')
    
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^[A-Z0-9-]+$/)
    
    // Verify email confirmation message
    await expect(page.locator('[data-testid="email-confirmation"]')).toContainText(testUser.email)
    
    // Step 12: Test account creation and login
    console.log('🔐 Step 12: Verifying account creation...')
    
    // Should be automatically logged in
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="user-email"]')).toContainText(testUser.email)
    
    // Navigate to order history
    await page.click('[data-testid="order-history-link"]')
    await page.waitForSelector('[data-testid="order-history"]')
    
    // Verify order appears in history
    await expect(page.locator('[data-testid="order-history-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="order-history-item"]')).toContainText(orderNumber!)
    
    // Step 13: Test order details view
    console.log('📋 Step 13: Checking order details...')
    
    await page.click('[data-testid="view-order-details"]')
    await page.waitForSelector('[data-testid="order-details"]')
    
    // Verify order details
    await expect(page.locator('[data-testid="order-status"]')).toContainText('pending')
    await expect(page.locator('[data-testid="order-items-detail"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-shipping-detail"]')).toContainText(shippingAddress.street)
    
    console.log('✅ Complete purchase flow test passed!')
  })

  test('Complete purchase flow - Stock validation', async () => {
    console.log('📦 Testing stock validation during purchase...')
    
    // Navigate to a product
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const productCard = page.locator('[data-testid="product-card"]').first()
    await productCard.click()
    
    // Get initial stock level
    const stockText = await page.locator('[data-testid="stock-level"]').textContent()
    const stockMatch = stockText?.match(/(\d+)/)
    const initialStock = stockMatch ? parseInt(stockMatch[1]) : 0
    
    if (initialStock < 1) {
      console.log('⚠️ Skipping stock test - product out of stock')
      return
    }
    
    // Try to add more than available stock
    const excessiveQuantity = initialStock + 10
    await page.fill('[data-testid="quantity-input"]', excessiveQuantity.toString())
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Should show stock validation error
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="stock-error"]')).toContainText('insufficient stock')
    
    // Try with valid quantity
    await page.fill('[data-testid="quantity-input"]', '1')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Should succeed
    await page.waitForSelector('[data-testid="cart-notification"]')
    
    console.log('✅ Stock validation test passed!')
  })

  test('Complete purchase flow - Payment error handling', async () => {
    console.log('💳 Testing payment error handling...')
    
    // Add product to cart
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to checkout
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Fill shipping info quickly
    await page.fill('[data-testid="shipping-name"]', 'Test User')
    await page.fill('[data-testid="shipping-street"]', '123 Test St')
    await page.fill('[data-testid="shipping-city"]', 'Test City')
    await page.selectOption('[data-testid="shipping-state"]', 'CA')
    await page.fill('[data-testid="shipping-zip"]', '90210')
    await page.click('[data-testid="continue-to-shipping"]')
    
    // Select shipping method
    await page.click('[data-testid="shipping-option"]')
    await page.click('[data-testid="continue-to-payment"]')
    
    // Use a card that will be declined
    await page.fill('[data-testid="card-number"]', '4000000000000002') // Stripe declined card
    await page.selectOption('[data-testid="expiry-month"]', '12')
    await page.selectOption('[data-testid="expiry-year"]', '2025')
    await page.fill('[data-testid="cvv"]', '123')
    await page.fill('[data-testid="name-on-card"]', 'Test User')
    
    await page.click('[data-testid="continue-to-review"]')
    
    // Accept terms and place order
    await page.check('[data-testid="terms-checkbox"]')
    await page.click('[data-testid="place-order-button"]')
    
    // Should show payment error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('declined')
    
    // Should stay on checkout page
    await expect(page).toHaveURL(/.*checkout.*/)
    
    console.log('✅ Payment error handling test passed!')
  })

  test('Complete purchase flow - Session persistence', async () => {
    console.log('🔄 Testing session persistence...')
    
    // Add items to cart
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart has items
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Refresh page
    await page.reload()
    
    // Cart should persist
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Start checkout process
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Fill partial shipping info
    await page.fill('[data-testid="shipping-name"]', 'Test User')
    await page.fill('[data-testid="shipping-street"]', '123 Test St')
    
    // Refresh page during checkout
    await page.reload()
    
    // Form data should persist
    await expect(page.locator('[data-testid="shipping-name"]')).toHaveValue('Test User')
    await expect(page.locator('[data-testid="shipping-street"]')).toHaveValue('123 Test St')
    
    console.log('✅ Session persistence test passed!')
  })
})