'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { items, isLoading } = useCart();

  useEffect(() => {
    // Redirect if cart is empty
    if (!isLoading && items.length === 0) {
      router.push('/products');
    }
  }, [items.length, isLoading, router]);

  if (isLoading || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CheckoutProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-semibold">Secure Checkout</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  <span>SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <CheckoutProgress />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Forms */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {children}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <OrderSummary />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>
                By placing your order, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <img src="/visa.svg" alt="Visa" className="h-8" />
                <img src="/mastercard.svg" alt="Mastercard" className="h-8" />
                <img src="/amex.svg" alt="American Express" className="h-8" />
                <img src="/paypal.svg" alt="PayPal" className="h-8" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CheckoutProvider>
  );
}