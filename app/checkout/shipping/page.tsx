'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCartSummary } from '@/contexts/CartContext';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { ShippingRates } from '@/components/checkout/ShippingRates';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ShippingAddress, ShippingRate } from '@/contexts/CheckoutContext';

// Mock saved addresses for demo
const mockSavedAddresses = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: '',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1 (555) 123-4567',
    isDefault: true,
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    address1: '456 Business Ave',
    address2: 'Suite 200',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'US',
    phone: '+1 (555) 987-6543',
    isDefault: false,
  },
];

export default function ShippingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { subtotal } = useCartSummary();
  const { 
    shippingAddress, 
    shippingRate,
    setShippingAddress, 
    setShippingRate,
    navigateToStep 
  } = useCheckout();

  const [showRates, setShowRates] = useState(!!shippingAddress);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  const handleAddressComplete = async (address: ShippingAddress) => {
    setIsValidatingAddress(true);
    try {
      // Save address to context
      setShippingAddress(address);
      
      // If user wants to save address and is logged in
      if (address.saveAddress && session?.user) {
        // TODO: Save address to user profile via API
        console.log('Saving address to user profile...');
      }

      // Show shipping rates
      setShowRates(true);
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleRateSelect = (rate: ShippingRate) => {
    setShippingRate(rate);
  };

  const handleContinue = () => {
    if (shippingAddress && shippingRate) {
      navigateToStep('payment');
    }
  };

  const handleBack = () => {
    if (showRates) {
      setShowRates(false);
    } else {
      router.push('/cart');
    }
  };

  // Use mock saved addresses for demo, replace with actual API call
  const savedAddresses = session?.user ? mockSavedAddresses : [];

  return (
    <div className="p-6">
      {!showRates ? (
        <>
          <ShippingForm
            onComplete={handleAddressComplete}
            savedAddresses={savedAddresses}
            initialData={shippingAddress || undefined}
          />
          
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isValidatingAddress}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Address Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium mb-1">Shipping to:</h3>
                <p className="text-sm text-gray-600">
                  {shippingAddress?.firstName} {shippingAddress?.lastName}<br />
                  {shippingAddress?.address1}<br />
                  {shippingAddress?.address2 && <>{shippingAddress.address2}<br /></>}
                  {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRates(false)}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Shipping Rates */}
          <ShippingRates
            onSelect={handleRateSelect}
            selectedRateId={shippingRate?.id}
            subtotal={subtotal}
          />

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button
              onClick={handleContinue}
              disabled={!shippingRate}
            >
              Continue to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}