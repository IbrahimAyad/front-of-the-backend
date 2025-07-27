import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Import components from Terminal 2 Sprint 2
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress'
import { ShippingForm } from '../../components/checkout/ShippingForm'
import { ShippingRates } from '../../components/checkout/ShippingRates'
import { PaymentMethod } from '../../components/checkout/PaymentMethod'
import { OrderSummary } from '../../components/checkout/OrderSummary'
import { CheckoutContext } from '../../contexts/CheckoutContext'

/**
 * UI Component Tests for Terminal 2's Checkout Components
 * 
 * Tests Sprint 2 (Checkout) UI components
 * - Checkout flow progression
 * - Form validation
 * - Payment integration
 * - Order summary
 * - Loading and error states
 */

// Mock checkout context
const mockCheckoutContext = {
  currentStep: 'shipping',
  steps: ['shipping', 'payment', 'review'],
  shippingData: {
    name: 'John Doe',
    email: 'john@example.com',
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    country: 'USA'
  },
  paymentData: {
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    nameOnCard: 'John Doe'
  },
  orderData: {
    items: [
      {
        id: '1',
        name: 'Test Product',
        price: 299.99,
        quantity: 2,
        image: 'https://example.com/image.jpg'
      }
    ],
    subtotal: 599.98,
    shipping: 15.00,
    tax: 48.00,
    total: 662.98
  },
  shippingRates: [
    { id: 'standard', name: 'Standard', price: 15.00, days: '5-7' },
    { id: 'express', name: 'Express', price: 25.00, days: '2-3' },
    { id: 'overnight', name: 'Overnight', price: 45.00, days: '1' }
  ],
  selectedShipping: 'standard',
  isLoading: false,
  error: null,
  updateShippingData: vi.fn(),
  updatePaymentData: vi.fn(),
  selectShippingRate: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  submitOrder: vi.fn()
}

// Test wrapper with providers
const TestWrapper = ({ children, checkoutValue = mockCheckoutContext }: any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <CheckoutContext.Provider value={checkoutValue}>
        {children}
      </CheckoutContext.Provider>
    </QueryClientProvider>
  )
}

describe('CheckoutProgress Component', () => {
  it('renders all checkout steps', () => {
    render(
      <TestWrapper>
        <CheckoutProgress />
      </TestWrapper>
    )

    expect(screen.getByText('Shipping')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('highlights current step', () => {
    render(
      <TestWrapper>
        <CheckoutProgress />
      </TestWrapper>
    )

    const shippingStep = screen.getByText('Shipping').closest('.step')
    expect(shippingStep).toHaveClass('active')
  })

  it('shows completed steps', () => {
    render(
      <TestWrapper checkoutValue={{ ...mockCheckoutContext, currentStep: 'review' }}>
        <CheckoutProgress />
      </TestWrapper>
    )

    const shippingStep = screen.getByText('Shipping').closest('.step')
    const paymentStep = screen.getByText('Payment').closest('.step')
    
    expect(shippingStep).toHaveClass('completed')
    expect(paymentStep).toHaveClass('completed')
  })

  it('allows navigation to previous completed steps', async () => {
    const user = userEvent.setup()
    const mockPrevStep = vi.fn()
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        currentStep: 'payment',
        prevStep: mockPrevStep 
      }}>
        <CheckoutProgress />
      </TestWrapper>
    )

    await user.click(screen.getByText('Shipping'))
    expect(mockPrevStep).toHaveBeenCalledWith('shipping')
  })

  it('prevents navigation to future steps', () => {
    render(
      <TestWrapper checkoutValue={{ ...mockCheckoutContext, currentStep: 'shipping' }}>
        <CheckoutProgress />
      </TestWrapper>
    )

    const paymentStep = screen.getByText('Payment').closest('.step')
    expect(paymentStep).toHaveClass('disabled')
    expect(paymentStep).not.toHaveAttribute('role', 'button')
  })
})

describe('ShippingForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all shipping form fields', () => {
    render(
      <TestWrapper>
        <ShippingForm />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
  })

  it('pre-fills form with existing data', () => {
    render(
      <TestWrapper>
        <ShippingForm />
      </TestWrapper>
    )

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        shippingData: {} 
      }}>
        <ShippingForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/address is required/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <ShippingForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    await user.clear(emailInput)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
  })

  it('validates zip code format', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <ShippingForm />
      </TestWrapper>
    )

    const zipInput = screen.getByLabelText(/zip code/i)
    await user.clear(zipInput)
    await user.type(zipInput, '123')
    
    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    expect(screen.getByText(/invalid zip code/i)).toBeInTheDocument()
  })

  it('updates shipping data on form change', async () => {
    const user = userEvent.setup()
    const mockUpdateShipping = vi.fn()
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        updateShippingData: mockUpdateShipping 
      }}>
        <ShippingForm />
      </TestWrapper>
    )

    const nameInput = screen.getByLabelText(/full name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')

    expect(mockUpdateShipping).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jane Doe' })
    )
  })

  it('proceeds to next step on valid form submission', async () => {
    const user = userEvent.setup()
    const mockNextStep = vi.fn()
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        nextStep: mockNextStep 
      }}>
        <ShippingForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    expect(mockNextStep).toHaveBeenCalled()
  })

  it('shows loading state during submission', () => {
    render(
      <TestWrapper checkoutValue={{ ...mockCheckoutContext, isLoading: true }}>
        <ShippingForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /continue/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })

  it('handles address validation', async () => {
    const user = userEvent.setup()
    const mockValidateAddress = vi.fn().mockResolvedValue({
      valid: false,
      suggestions: [
        { street: '123 Main Street', city: 'Anytown', state: 'CA' }
      ]
    })
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        validateAddress: mockValidateAddress 
      }}>
        <ShippingForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/address suggestions/i)).toBeInTheDocument()
      expect(screen.getByText('123 Main Street')).toBeInTheDocument()
    })
  })
})

describe('ShippingRates Component', () => {
  it('renders available shipping options', () => {
    render(
      <TestWrapper>
        <ShippingRates />
      </TestWrapper>
    )

    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Express')).toBeInTheDocument()
    expect(screen.getByText('Overnight')).toBeInTheDocument()
    
    expect(screen.getByText('$15.00')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  it('shows selected shipping rate', () => {
    render(
      <TestWrapper>
        <ShippingRates />
      </TestWrapper>
    )

    const standardOption = screen.getByLabelText(/standard/i)
    expect(standardOption).toBeChecked()
  })

  it('allows changing shipping rate', async () => {
    const user = userEvent.setup()
    const mockSelectShipping = vi.fn()
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        selectShippingRate: mockSelectShipping 
      }}>
        <ShippingRates />
      </TestWrapper>
    )

    await user.click(screen.getByLabelText(/express/i))
    expect(mockSelectShipping).toHaveBeenCalledWith('express')
  })

  it('shows delivery time estimates', () => {
    render(
      <TestWrapper>
        <ShippingRates />
      </TestWrapper>
    )

    expect(screen.getByText('5-7 business days')).toBeInTheDocument()
    expect(screen.getByText('2-3 business days')).toBeInTheDocument()
    expect(screen.getByText('1 business day')).toBeInTheDocument()
  })

  it('handles loading state when fetching rates', () => {
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        shippingRates: [],
        isLoading: true 
      }}>
        <ShippingRates />
      </TestWrapper>
    )

    expect(screen.getByText(/calculating shipping/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('handles error when rates unavailable', () => {
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        shippingRates: [],
        error: 'Unable to calculate shipping rates' 
      }}>
        <ShippingRates />
      </TestWrapper>
    )

    expect(screen.getByText(/unable to calculate shipping/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

describe('PaymentMethod Component', () => {
  it('renders payment form fields', () => {
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expiry month/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expiry year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name on card/i)).toBeInTheDocument()
  })

  it('validates credit card number', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    const cardInput = screen.getByLabelText(/card number/i)
    await user.clear(cardInput)
    await user.type(cardInput, '1234567890123456') // Invalid card

    expect(screen.getByText(/invalid card number/i)).toBeInTheDocument()
  })

  it('formats credit card number input', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    const cardInput = screen.getByLabelText(/card number/i)
    await user.clear(cardInput)
    await user.type(cardInput, '4242424242424242')

    expect(cardInput).toHaveValue('4242 4242 4242 4242')
  })

  it('validates expiry date', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    const monthSelect = screen.getByLabelText(/expiry month/i)
    const yearSelect = screen.getByLabelText(/expiry year/i)
    
    await user.selectOption(monthSelect, '01')
    await user.selectOption(yearSelect, '2020') // Past year

    expect(screen.getByText(/card has expired/i)).toBeInTheDocument()
  })

  it('validates CVV', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    const cvvInput = screen.getByLabelText(/cvv/i)
    await user.clear(cvvInput)
    await user.type(cvvInput, '12') // Too short

    expect(screen.getByText(/invalid cvv/i)).toBeInTheDocument()
  })

  it('shows card type icons', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    const cardInput = screen.getByLabelText(/card number/i)
    
    // Test Visa card
    await user.clear(cardInput)
    await user.type(cardInput, '4242')
    expect(screen.getByTitle('Visa')).toBeInTheDocument()
    
    // Test Mastercard
    await user.clear(cardInput)
    await user.type(cardInput, '5555')
    expect(screen.getByTitle('Mastercard')).toBeInTheDocument()
  })

  it('integrates with Stripe Elements', () => {
    // Mock Stripe Elements
    const mockStripe = {
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          unmount: vi.fn(),
          on: vi.fn()
        }))
      }))
    }
    
    vi.mock('@stripe/stripe-js', () => ({
      loadStripe: vi.fn(() => Promise.resolve(mockStripe))
    }))
    
    render(
      <TestWrapper>
        <PaymentMethod />
      </TestWrapper>
    )

    expect(screen.getByTestId('stripe-card-element')).toBeInTheDocument()
  })

  it('handles payment processing', async () => {
    const user = userEvent.setup()
    const mockProcessPayment = vi.fn().mockResolvedValue({ success: true })
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        processPayment: mockProcessPayment 
      }}>
        <PaymentMethod />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /place order/i })
    await user.click(submitButton)

    expect(mockProcessPayment).toHaveBeenCalled()
  })
})

describe('OrderSummary Component', () => {
  it('displays order items', () => {
    render(
      <TestWrapper>
        <OrderSummary />
      </TestWrapper>
    )

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Qty: 2')).toBeInTheDocument()
    expect(screen.getByText('$299.99')).toBeInTheDocument()
  })

  it('shows order totals breakdown', () => {
    render(
      <TestWrapper>
        <OrderSummary />
      </TestWrapper>
    )

    expect(screen.getByText('Subtotal:')).toBeInTheDocument()
    expect(screen.getByText('$599.98')).toBeInTheDocument()
    
    expect(screen.getByText('Shipping:')).toBeInTheDocument()
    expect(screen.getByText('$15.00')).toBeInTheDocument()
    
    expect(screen.getByText('Tax:')).toBeInTheDocument()
    expect(screen.getByText('$48.00')).toBeInTheDocument()
    
    expect(screen.getByText('Total:')).toBeInTheDocument()
    expect(screen.getByText('$662.98')).toBeInTheDocument()
  })

  it('updates totals when shipping rate changes', () => {
    const { rerender } = render(
      <TestWrapper>
        <OrderSummary />
      </TestWrapper>
    )

    // Change to express shipping
    rerender(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext,
        selectedShipping: 'express',
        orderData: {
          ...mockCheckoutContext.orderData,
          shipping: 25.00,
          total: 672.98
        }
      }}>
        <OrderSummary />
      </TestWrapper>
    )

    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$672.98')).toBeInTheDocument()
  })

  it('shows applied discounts', () => {
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext,
        orderData: {
          ...mockCheckoutContext.orderData,
          discount: { code: 'SAVE10', amount: 59.99 },
          total: 602.99
        }
      }}>
        <OrderSummary />
      </TestWrapper>
    )

    expect(screen.getByText('Discount (SAVE10):')).toBeInTheDocument()
    expect(screen.getByText('-$59.99')).toBeInTheDocument()
    expect(screen.getByText('$602.99')).toBeInTheDocument()
  })

  it('shows estimated delivery date', () => {
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 7)
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext,
        estimatedDelivery: deliveryDate.toISOString()
      }}>
        <OrderSummary />
      </TestWrapper>
    )

    expect(screen.getByText(/estimated delivery/i)).toBeInTheDocument()
    expect(screen.getByText(deliveryDate.toLocaleDateString())).toBeInTheDocument()
  })
})

describe('Checkout Integration', () => {
  it('completes full checkout flow', async () => {
    const user = userEvent.setup()
    const mockSubmitOrder = vi.fn().mockResolvedValue({ 
      success: true, 
      orderNumber: 'ORD-12345' 
    })
    
    const { rerender } = render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        submitOrder: mockSubmitOrder 
      }}>
        <ShippingForm />
      </TestWrapper>
    )

    // Step 1: Complete shipping form
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2: Select shipping method
    rerender(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        currentStep: 'shipping-method',
        submitOrder: mockSubmitOrder 
      }}>
        <ShippingRates />
      </TestWrapper>
    )

    await user.click(screen.getByLabelText(/express/i))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Complete payment
    rerender(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        currentStep: 'payment',
        submitOrder: mockSubmitOrder 
      }}>
        <PaymentMethod />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(mockSubmitOrder).toHaveBeenCalled()
  })

  it('handles checkout errors gracefully', async () => {
    const user = userEvent.setup()
    const mockSubmitOrder = vi.fn().mockRejectedValue(new Error('Payment failed'))
    
    render(
      <TestWrapper checkoutValue={{ 
        ...mockCheckoutContext, 
        currentStep: 'payment',
        submitOrder: mockSubmitOrder 
      }}>
        <PaymentMethod />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  it('persists form data across steps', () => {
    const checkoutData = {
      ...mockCheckoutContext,
      shippingData: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        street: '456 Oak St'
      }
    }
    
    const { rerender } = render(
      <TestWrapper checkoutValue={checkoutData}>
        <ShippingForm />
      </TestWrapper>
    )

    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()

    // Navigate to payment and back
    rerender(
      <TestWrapper checkoutValue={{ ...checkoutData, currentStep: 'payment' }}>
        <PaymentMethod />
      </TestWrapper>
    )

    rerender(
      <TestWrapper checkoutValue={{ ...checkoutData, currentStep: 'shipping' }}>
        <ShippingForm />
      </TestWrapper>
    )

    // Data should still be there
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
  })
})

describe('Mobile Checkout Experience', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
  })

  it('stacks form fields vertically on mobile', () => {
    render(
      <TestWrapper>
        <ShippingForm />
      </TestWrapper>
    )

    const form = screen.getByRole('form')
    expect(form).toHaveClass('flex-col') // Mobile stacking
  })

  it('uses larger touch targets on mobile', () => {
    render(
      <TestWrapper>
        <ShippingRates />
      </TestWrapper>
    )

    const radioButtons = screen.getAllByRole('radio')
    radioButtons.forEach(button => {
      expect(button.parentElement).toHaveStyle('min-height: 44px')
    })
  })

  it('shows mobile-optimized progress indicator', () => {
    render(
      <TestWrapper>
        <CheckoutProgress />
      </TestWrapper>
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('mobile-progress')
  })
})