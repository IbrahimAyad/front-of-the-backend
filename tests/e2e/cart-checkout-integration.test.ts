import { test, expect, Page } from '@playwright/test'

/**
 * Cart-Checkout Integration E2E Test
 * 
 * Tests Terminal 2's Sprint 1 & 2 work:
 * - Cart functionality (Sprint 1)
 * - Checkout process (Sprint 2) 
 * - Guest cart → checkout → account creation
 * - Stock validation throughout
 * - Session persistence
 */

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
}

test.describe('Cart-Checkout Integration', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/')
  })

  test('Guest cart workflow - Add, modify, persist through checkout', async () => {
    console.log('🛒 Testing guest cart workflow...')
    
    // Step 1: Add multiple products to cart as guest
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-grid"]')
    
    // Add first product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    const firstProductName = await firstProduct.locator('[data-testid="product-name"]').textContent()
    await firstProduct.click()
    
    // Select variant if available
    const sizeSelector = page.locator('[data-testid="size-selector"]')
    if (await sizeSelector.isVisible()) {
      await sizeSelector.selectOption({ index: 1 })
    }
    
    await page.fill('[data-testid="quantity-input"]', '2')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2')
    
    // Add second product
    await page.goto('/products')
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1)
    const secondProductName = await secondProduct.locator('[data-testid="product-name"]').textContent()
    await secondProduct.click()
    
    await page.fill('[data-testid="quantity-input"]', '1')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify total cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3')
    
    // Step 2: Open cart and verify contents
    await page.click('[data-testid="cart-button"]')
    await page.waitForSelector('[data-testid="cart-drawer"]')
    
    // Verify cart items
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(2)
    
    // Verify first item
    const firstCartItem = cartItems.first()
    await expect(firstCartItem.locator('[data-testid="item-name"]')).toContainText(firstProductName!)
    await expect(firstCartItem.locator('[data-testid="item-quantity"]')).toHaveValue('2')
    
    // Verify second item
    const secondCartItem = cartItems.nth(1)
    await expect(secondCartItem.locator('[data-testid="item-name"]')).toContainText(secondProductName!)
    await expect(secondCartItem.locator('[data-testid="item-quantity"]')).toHaveValue('1')
    
    // Step 3: Modify cart contents
    console.log('🔄 Modifying cart contents...')
    
    // Update quantity of first item
    await firstCartItem.locator('[data-testid="quantity-plus"]').click()
    await expect(firstCartItem.locator('[data-testid="item-quantity"]')).toHaveValue('3')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('4')
    
    // Remove second item
    await secondCartItem.locator('[data-testid="remove-item"]').click()
    await page.waitForSelector('[data-testid="remove-confirmation"]')
    await page.click('[data-testid="confirm-remove"]')
    
    // Verify item removed
    await expect(cartItems).toHaveCount(1)
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3')
    
    // Step 4: Apply promo code
    console.log('🎫 Testing promo code application...')
    
    const promoInput = page.locator('[data-testid="promo-code-input"]')
    if (await promoInput.isVisible()) {
      await promoInput.fill('TEST10')
      await page.click('[data-testid="apply-promo"]')
      
      // Wait for promo application
      await page.waitForTimeout(1000)
      
      // Check if discount applied
      const discountElement = page.locator('[data-testid="cart-discount"]')
      if (await discountElement.isVisible()) {
        const discountText = await discountElement.textContent()
        expect(discountText).toContain('-')
      }
    }
    
    // Step 5: Test cart persistence across page refresh
    console.log('💾 Testing cart persistence...')
    
    const cartSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent()
    
    // Refresh page
    await page.reload()
    await page.waitForSelector('[data-testid="cart-count"]')
    
    // Verify cart persisted
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3')
    
    // Open cart and verify contents persisted
    await page.click('[data-testid="cart-button"]')
    await page.waitForSelector('[data-testid="cart-drawer"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cart-subtotal"]')).toContainText(cartSubtotal!)
    
    // Step 6: Proceed to checkout
    console.log('➡️ Proceeding to checkout...')
    
    await page.click('[data-testid="checkout-button"]')
    await page.waitForURL('**/checkout/**')
    
    // Verify checkout loaded with cart contents
    await page.waitForSelector('[data-testid="checkout-items-summary"]')
    await expect(page.locator('[data-testid="checkout-item"]')).toHaveCount(1)
    
    // Verify item details in checkout
    const checkoutItem = page.locator('[data-testid="checkout-item"]').first()
    await expect(checkoutItem.locator('[data-testid="item-name"]')).toContainText(firstProductName!)
    await expect(checkoutItem.locator('[data-testid="item-quantity"]')).toContainText('3')
    
    console.log('✅ Guest cart workflow test passed!')
  })

  test('Cart stock validation and error handling', async () => {
    console.log('📦 Testing cart stock validation...')
    
    // Navigate to product with limited stock
    await page.goto('/products')
    const productCard = page.locator('[data-testid="product-card"]').first()
    await productCard.click()
    
    // Get stock level
    const stockText = await page.locator('[data-testid="stock-level"]').textContent()
    const stockMatch = stockText?.match(/(\d+)/)
    const availableStock = stockMatch ? parseInt(stockMatch[1]) : 0
    
    if (availableStock < 2) {
      console.log('⚠️ Skipping stock validation test - insufficient stock')
      return
    }
    
    // Add maximum available stock
    await page.fill('[data-testid="quantity-input"]', availableStock.toString())
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify added to cart
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(availableStock.toString())
    
    // Try to add more (should fail)
    await page.fill('[data-testid="quantity-input"]', '1')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Should show stock error
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible()
    
    // Cart count should not increase
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(availableStock.toString())
    
    // Test cart quantity update validation
    await page.click('[data-testid="cart-button"]')
    await page.waitForSelector('[data-testid="cart-drawer"]')
    
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    
    // Try to increase quantity beyond stock
    await cartItem.locator('[data-testid="quantity-plus"]').click()
    
    // Should show validation error
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible()
    
    // Quantity should not increase
    await expect(cartItem.locator('[data-testid="item-quantity"]')).toHaveValue(availableStock.toString())
    
    console.log('✅ Stock validation test passed!')
  })

  test('Guest to registered user conversion during checkout', async () => {
    console.log('👤 Testing guest to registered user conversion...')
    
    const timestamp = Date.now()
    const testUser = {
      email: `guest-conversion-${timestamp}@example.com`,
      password: 'SecurePassword123!',
      name: 'Guest Conversion Test',
      phone: '+1234567890'
    }
    
    // Add product to cart as guest
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Proceed to checkout
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Verify guest checkout form
    await page.waitForSelector('[data-testid="checkout-form"]')
    await expect(page.locator('[data-testid="guest-checkout-section"]')).toBeVisible()
    
    // Fill shipping information as guest
    await page.fill('[data-testid="shipping-name"]', 'Guest User')
    await page.fill('[data-testid="shipping-email"]', testUser.email)
    await page.fill('[data-testid="shipping-street"]', '123 Guest Street')
    await page.fill('[data-testid="shipping-city"]', 'Guest City')
    await page.selectOption('[data-testid="shipping-state"]', 'CA')
    await page.fill('[data-testid="shipping-zip"]', '90210')
    
    // Choose to create account during checkout
    await page.check('[data-testid="create-account-checkbox"]')
    
    // Account creation form should appear
    await page.waitForSelector('[data-testid="account-creation-form"]')
    
    // Fill account details
    await page.fill('[data-testid="account-password"]', testUser.password)
    await page.fill('[data-testid="account-name"]', testUser.name)
    await page.fill('[data-testid="account-phone"]', testUser.phone)
    
    // Continue to shipping method
    await page.click('[data-testid="continue-to-shipping"]')
    
    // Select shipping method
    await page.waitForSelector('[data-testid="shipping-methods"]')
    await page.click('[data-testid="shipping-option"]')
    await page.click('[data-testid="continue-to-payment"]')
    
    // Fill payment information
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.selectOption('[data-testid="expiry-month"]', '12')
    await page.selectOption('[data-testid="expiry-year"]', '2025')
    await page.fill('[data-testid="cvv"]', '123')
    await page.fill('[data-testid="name-on-card"]', 'Guest User')
    
    await page.click('[data-testid="continue-to-review"]')
    
    // Review and place order
    await page.waitForSelector('[data-testid="order-review"]')
    await page.check('[data-testid="terms-checkbox"]')
    await page.click('[data-testid="place-order-button"]')
    
    // Should redirect to confirmation and be logged in
    await page.waitForURL('**/order-confirmation/**')
    
    // Verify user is now logged in
    await page.waitForSelector('[data-testid="user-menu"]')
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('[data-testid="user-email"]')).toContainText(testUser.email)
    
    // Verify account was created with order history
    await page.click('[data-testid="order-history-link"]')
    await page.waitForSelector('[data-testid="order-history"]')
    await expect(page.locator('[data-testid="order-history-item"]')).toHaveCount(1)
    
    console.log('✅ Guest to registered user conversion test passed!')
  })

  test('Cart abandonment and recovery', async () => {
    console.log('🔄 Testing cart abandonment and recovery...')
    
    // Add items to cart
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Start checkout process
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Fill partial information
    await page.fill('[data-testid="shipping-name"]', 'Abandoned Cart User')
    await page.fill('[data-testid="shipping-email"]', `abandoned-${Date.now()}@example.com`)
    
    // Simulate abandonment - navigate away
    await page.goto('/')
    
    // Cart should still be preserved
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // Return to checkout
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Previously filled information should be preserved
    await expect(page.locator('[data-testid="shipping-name"]')).toHaveValue('Abandoned Cart User')
    
    // Test cart recovery notification
    const recoveryNotification = page.locator('[data-testid="cart-recovery-notification"]')
    if (await recoveryNotification.isVisible()) {
      await expect(recoveryNotification).toContainText('Continue where you left off')
    }
    
    console.log('✅ Cart abandonment and recovery test passed!')
  })

  test('Multiple checkout validation scenarios', async () => {
    console.log('✅ Testing checkout validation scenarios...')
    
    // Add product to cart
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to checkout
    await page.click('[data-testid="cart-button"]')
    await page.click('[data-testid="checkout-button"]')
    
    // Test email validation
    await page.fill('[data-testid="shipping-email"]', 'invalid-email')
    await page.click('[data-testid="continue-to-shipping"]')
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    
    // Fix email
    await page.fill('[data-testid="shipping-email"]', 'valid@example.com')
    
    // Test required field validation
    await page.click('[data-testid="continue-to-shipping"]')
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    
    // Fill required fields
    await page.fill('[data-testid="shipping-name"]', 'Test User')
    await page.fill('[data-testid="shipping-street"]', '123 Test St')
    await page.fill('[data-testid="shipping-city"]', 'Test City')
    await page.selectOption('[data-testid="shipping-state"]', 'CA')
    await page.fill('[data-testid="shipping-zip"]', '90210')
    
    // Test zip code validation
    await page.fill('[data-testid="shipping-zip"]', '123')
    await page.click('[data-testid="continue-to-shipping"]')
    await expect(page.locator('[data-testid="zip-error"]')).toBeVisible()
    
    // Fix zip code
    await page.fill('[data-testid="shipping-zip"]', '90210')
    await page.click('[data-testid="continue-to-shipping"]')
    
    // Should proceed to shipping methods
    await page.waitForSelector('[data-testid="shipping-methods"]')
    
    console.log('✅ Checkout validation scenarios test passed!')
  })

  test('Real-time cart updates and synchronization', async () => {
    console.log('🔄 Testing real-time cart updates...')
    
    // Add product to cart
    await page.goto('/products')
    const productCard = page.locator('[data-testid="product-card"]').first()
    await productCard.click()
    
    await page.fill('[data-testid="quantity-input"]', '2')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart badge updates
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2')
    
    // Open cart drawer
    await page.click('[data-testid="cart-button"]')
    await page.waitForSelector('[data-testid="cart-drawer"]')
    
    // Test real-time quantity updates
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    const initialSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent()
    
    // Increase quantity
    await cartItem.locator('[data-testid="quantity-plus"]').click()
    
    // Verify updates happen immediately
    await expect(cartItem.locator('[data-testid="item-quantity"]')).toHaveValue('3')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('3')
    
    // Verify subtotal recalculates
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('[data-testid="cart-subtotal"]')?.textContent
        return current !== initial
      },
      initialSubtotal
    )
    
    // Test undo functionality if available
    const undoButton = page.locator('[data-testid="undo-change"]')
    if (await undoButton.isVisible({ timeout: 2000 })) {
      await undoButton.click()
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toHaveValue('2')
    }
    
    console.log('✅ Real-time cart updates test passed!')
  })
})