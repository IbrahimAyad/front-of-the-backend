'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';

// Validation Schemas
export const shippingAddressSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone number is required'),
  saveAddress: z.boolean().optional(),
});

export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'paypal', 'apple_pay', 'google_pay']),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  saveCard: z.boolean().optional(),
});

// Types
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
}

interface CheckoutState {
  currentStep: 'shipping' | 'payment' | 'review' | 'confirm';
  shippingAddress: ShippingAddress | null;
  shippingRate: ShippingRate | null;
  paymentMethod: PaymentMethod | null;
  isGuest: boolean;
  orderId: string | null;
}

interface CheckoutContextValue extends CheckoutState {
  setShippingAddress: (address: ShippingAddress) => void;
  setShippingRate: (rate: ShippingRate) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrderId: (id: string) => void;
  navigateToStep: (step: CheckoutState['currentStep']) => void;
  canProceedToNext: () => boolean;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

const CHECKOUT_STORAGE_KEY = 'checkout-state';

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [state, setState] = useState<CheckoutState>(() => {
    // Load persisted state from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse checkout state:', error);
        }
      }
    }
    
    return {
      currentStep: 'shipping',
      shippingAddress: null,
      shippingRate: null,
      paymentMethod: null,
      isGuest: !session?.user,
      orderId: null,
    };
  });

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setShippingAddress = useCallback((address: ShippingAddress) => {
    setState(prev => ({ ...prev, shippingAddress: address }));
  }, []);

  const setShippingRate = useCallback((rate: ShippingRate) => {
    setState(prev => ({ ...prev, shippingRate: rate }));
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ ...prev, paymentMethod: method }));
  }, []);

  const setOrderId = useCallback((id: string) => {
    setState(prev => ({ ...prev, orderId: id }));
  }, []);

  const navigateToStep = useCallback((step: CheckoutState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
    
    const stepRoutes = {
      shipping: '/checkout/shipping',
      payment: '/checkout/payment',
      review: '/checkout/review',
      confirm: '/checkout/confirm',
    };
    
    router.push(stepRoutes[step]);
  }, [router]);

  const canProceedToNext = useCallback(() => {
    switch (state.currentStep) {
      case 'shipping':
        return !!(state.shippingAddress && state.shippingRate);
      case 'payment':
        return !!state.paymentMethod;
      case 'review':
        return !!(state.shippingAddress && state.shippingRate && state.paymentMethod);
      case 'confirm':
        return !!state.orderId;
      default:
        return false;
    }
  }, [state]);

  const resetCheckout = useCallback(() => {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    setState({
      currentStep: 'shipping',
      shippingAddress: null,
      shippingRate: null,
      paymentMethod: null,
      isGuest: !session?.user,
      orderId: null,
    });
  }, [session]);

  const value: CheckoutContextValue = {
    ...state,
    setShippingAddress,
    setShippingRate,
    setPaymentMethod,
    setOrderId,
    navigateToStep,
    canProceedToNext,
    resetCheckout,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}