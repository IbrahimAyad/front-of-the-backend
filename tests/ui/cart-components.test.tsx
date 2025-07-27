import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Import components from Terminal 2 Sprint 1 & 2
import { AddToCartButton } from '../../components/cart/AddToCartButton'
import { CartButton } from '../../components/cart/CartButton'
import { CartDrawer } from '../../components/cart/CartDrawer'
import { CartContext } from '../../contexts/CartContext'

/**
 * UI Component Tests for Terminal 2's Cart & Checkout Components
 * 
 * Tests Sprint 1 (Cart) and Sprint 2 (Checkout) UI components
 * - Cart functionality
 * - Loading states
 * - Error states
 * - Mobile responsiveness
 * - User interactions
 */

// Mock cart context
const mockCartContext = {
  items: [
    {
      id: '1',
      productId: 'product-1',
      name: 'Test Product',
      price: 299.99,
      quantity: 2,
      size: 'L',
      color: 'Navy',
      image: 'https://example.com/image.jpg'
    }
  ],
  totalItems: 2,
  totalPrice: 599.98,
  isLoading: false,
  error: null,
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  isOpen: false,
  openCart: vi.fn(),
  closeCart: vi.fn()
}

// Test wrapper with providers
const TestWrapper = ({ children, cartValue = mockCartContext }: any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <CartContext.Provider value={cartValue}>
        {children}
      </CartContext.Provider>
    </QueryClientProvider>
  )
}

describe('AddToCartButton Component', () => {
  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    price: 299.99,
    stock: 50,
    variants: [
      { size: 'M', color: 'Navy', stock: 25 },
      { size: 'L', color: 'Navy', stock: 25 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add to cart button with product data', () => {
    render(
      <TestWrapper>
        <AddToCartButton 
          product={mockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
    expect(screen.getByText('Add to Cart')).toBeInTheDocument()
  })

  it('handles add to cart action', async () => {
    const user = userEvent.setup()
    const mockAddItem = vi.fn()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, addItem: mockAddItem }}>
        <AddToCartButton 
          product={mockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={2}
        />
      </TestWrapper>
    )

    const addButton = screen.getByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    expect(mockAddItem).toHaveBeenCalledWith({
      productId: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
      quantity: 2,
      size: 'L',
      color: 'Navy'
    })
  })

  it('shows loading state during add to cart', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isLoading: true }}>
        <AddToCartButton 
          product={mockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/adding/i)).toBeInTheDocument()
  })

  it('shows out of stock state', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    
    render(
      <TestWrapper>
        <AddToCartButton 
          product={outOfStockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })

  it('validates quantity against available stock', async () => {
    const user = userEvent.setup()
    const limitedStockProduct = { ...mockProduct, stock: 5 }
    
    render(
      <TestWrapper>
        <AddToCartButton 
          product={limitedStockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={10} // More than available
        />
      </TestWrapper>
    )

    const addButton = screen.getByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument()
  })

  it('shows success feedback after adding to cart', async () => {
    const user = userEvent.setup()
    const mockAddItem = vi.fn().mockResolvedValue({ success: true })
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, addItem: mockAddItem }}>
        <AddToCartButton 
          product={mockProduct}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    const addButton = screen.getByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
    })
  })
})

describe('CartButton Component', () => {
  it('renders cart button with item count', () => {
    render(
      <TestWrapper>
        <CartButton />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // totalItems from mock
  })

  it('opens cart drawer when clicked', async () => {
    const user = userEvent.setup()
    const mockOpenCart = vi.fn()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, openCart: mockOpenCart }}>
        <CartButton />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /cart/i }))
    expect(mockOpenCart).toHaveBeenCalled()
  })

  it('shows empty state when no items', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, items: [], totalItems: 0 }}>
        <CartButton />
      </TestWrapper>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('0')).toBeInTheDocument()
  })

  it('updates count reactively', () => {
    const { rerender } = render(
      <TestWrapper cartValue={{ ...mockCartContext, totalItems: 3 }}>
        <CartButton />
      </TestWrapper>
    )

    expect(screen.getByText('3')).toBeInTheDocument()

    rerender(
      <TestWrapper cartValue={{ ...mockCartContext, totalItems: 5 }}>
        <CartButton />
      </TestWrapper>
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows cart animation when items added', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isLoading: false }}>
        <CartButton />
      </TestWrapper>
    )

    const cartButton = screen.getByRole('button')
    expect(cartButton).toHaveClass('animate-pulse') // Assuming animation class
  })
})

describe('CartDrawer Component', () => {
  it('renders cart items when open', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$299.99')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument() // quantity input
  })

  it('closes when close button clicked', async () => {
    const user = userEvent.setup()
    const mockCloseCart = vi.fn()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true, closeCart: mockCloseCart }}>
        <CartDrawer />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(mockCloseCart).toHaveBeenCalled()
  })

  it('updates item quantity', async () => {
    const user = userEvent.setup()
    const mockUpdateQuantity = vi.fn()
    
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true, 
        updateQuantity: mockUpdateQuantity 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    const quantityInput = screen.getByDisplayValue('2')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    
    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3)
    })
  })

  it('removes item from cart', async () => {
    const user = userEvent.setup()
    const mockRemoveItem = vi.fn()
    
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true, 
        removeItem: mockRemoveItem 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
  })

  it('shows cart totals correctly', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByText('$599.98')).toBeInTheDocument() // total price
    expect(screen.getByText('2 items')).toBeInTheDocument()
  })

  it('shows empty cart state', () => {
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true, 
        items: [], 
        totalItems: 0,
        totalPrice: 0 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument()
  })

  it('navigates to checkout', async () => {
    const user = userEvent.setup()
    const mockNavigate = vi.fn()
    
    // Mock useRouter/useNavigate
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockNavigate })
    }))
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /checkout/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })

  it('handles loading state', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true, isLoading: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/updating cart/i)).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true, 
        error: 'Failed to update cart' 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByText(/failed to update cart/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('applies promo code', async () => {
    const user = userEvent.setup()
    const mockApplyPromo = vi.fn()
    
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true,
        applyPromo: mockApplyPromo 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    const promoInput = screen.getByPlaceholderText(/promo code/i)
    await user.type(promoInput, 'SAVE10')
    await user.click(screen.getByRole('button', { name: /apply/i }))

    expect(mockApplyPromo).toHaveBeenCalledWith('SAVE10')
  })

  it('shows discount when applied', () => {
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true,
        discount: { code: 'SAVE10', amount: 59.99 }
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByText('SAVE10')).toBeInTheDocument()
    expect(screen.getByText('-$59.99')).toBeInTheDocument()
  })
})

describe('Cart Persistence', () => {
  it('persists cart data in localStorage', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
    
    render(
      <TestWrapper>
        <AddToCartButton 
          product={mockCartContext.items[0]}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    expect(mockSetItem).toHaveBeenCalledWith(
      'cart',
      expect.stringContaining('product-1')
    )
  })

  it('restores cart data from localStorage', () => {
    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem')
    mockGetItem.mockReturnValue(JSON.stringify(mockCartContext.items))
    
    render(
      <TestWrapper>
        <CartDrawer />
      </TestWrapper>
    )

    expect(mockGetItem).toHaveBeenCalledWith('cart')
  })
})

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
  })

  it('renders mobile-optimized cart button', () => {
    render(
      <TestWrapper>
        <CartButton />
      </TestWrapper>
    )

    const cartButton = screen.getByRole('button')
    expect(cartButton).toHaveClass('md:hidden') // Mobile-specific class
  })

  it('shows full-screen cart drawer on mobile', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    const drawer = screen.getByRole('dialog')
    expect(drawer).toHaveClass('w-full', 'h-full') // Full-screen on mobile
  })

  it('handles touch gestures for quantity updates', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    const plusButton = screen.getByRole('button', { name: /increase quantity/i })
    const minusButton = screen.getByRole('button', { name: /decrease quantity/i })

    expect(plusButton).toBeInTheDocument()
    expect(minusButton).toBeInTheDocument()
    
    // Test touch targets are large enough (at least 44px)
    expect(plusButton).toHaveStyle('min-height: 44px')
    expect(minusButton).toHaveStyle('min-height: 44px')
  })
})

describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Shopping cart')
    expect(screen.getByRole('button', { name: /close/i })).toHaveAttribute('aria-label', 'Close cart')
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    // Tab through interactive elements
    await user.tab()
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
    
    await user.tab()
    expect(screen.getByDisplayValue('2')).toHaveFocus() // quantity input
  })

  it('announces cart updates to screen readers', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <AddToCartButton 
          product={mockCartContext.items[0]}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
        <div role="status" aria-live="polite" id="cart-announcements" />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /add to cart/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/added to cart/i)
    })
  })

  it('has proper heading hierarchy', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/shopping cart/i)
  })
})

describe('Error Handling', () => {
  it('handles network errors gracefully', async () => {
    const user = userEvent.setup()
    const mockAddItem = vi.fn().mockRejectedValue(new Error('Network error'))
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, addItem: mockAddItem }}>
        <AddToCartButton 
          product={mockCartContext.items[0]}
          selectedVariant={{ size: 'L', color: 'Navy' }}
          quantity={1}
        />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /add to cart/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/failed to add to cart/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('validates quantity inputs', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: true }}>
        <CartDrawer />
      </TestWrapper>
    )

    const quantityInput = screen.getByDisplayValue('2')
    
    // Test invalid quantity
    await user.clear(quantityInput)
    await user.type(quantityInput, '0')
    
    expect(screen.getByText(/quantity must be at least 1/i)).toBeInTheDocument()
    
    // Test excessive quantity
    await user.clear(quantityInput)
    await user.type(quantityInput, '999')
    
    expect(screen.getByText(/exceeds available stock/i)).toBeInTheDocument()
  })
})

describe('Performance', () => {
  it('debounces quantity updates', async () => {
    const user = userEvent.setup()
    const mockUpdateQuantity = vi.fn()
    
    render(
      <TestWrapper cartValue={{ 
        ...mockCartContext, 
        isOpen: true, 
        updateQuantity: mockUpdateQuantity 
      }}>
        <CartDrawer />
      </TestWrapper>
    )

    const quantityInput = screen.getByDisplayValue('2')
    
    // Rapid quantity changes
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    await user.type(quantityInput, '4')
    await user.type(quantityInput, '5')
    
    // Should debounce and only call once with final value
    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledTimes(1)
      expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 5)
    }, { timeout: 1000 })
  })

  it('lazy loads cart drawer content', () => {
    render(
      <TestWrapper cartValue={{ ...mockCartContext, isOpen: false }}>
        <CartDrawer />
      </TestWrapper>
    )

    // Cart content should not be rendered when closed
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument()
  })
})