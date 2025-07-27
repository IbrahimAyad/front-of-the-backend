'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentPage() {
  const router = useRouter();
  const { 
    shippingAddress, 
    shippingRate, 
    navigateToStep,
    canProceedToNext 
  } = useCheckout();

  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if previous steps not completed
  React.useEffect(() => {
    if (!shippingAddress || !shippingRate) {
      navigateToStep('shipping');
    }
  }, [shippingAddress, shippingRate, navigateToStep]);

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsProcessing(true);
      
      // Store payment intent for the review step
      sessionStorage.setItem('paymentIntentId', paymentIntent.id);
      
      // Navigate to review step
      navigateToStep('review');
      
    } catch (error) {
      setError('Failed to process payment success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    navigateToStep('shipping');
  };

  if (!shippingAddress || !shippingRate) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Shipping Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Shipping to:</h3>
          <p className="text-sm text-gray-600">
            {shippingAddress.firstName} {shippingAddress.lastName}<br />
            {shippingAddress.address1}<br />
            {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Shipping Method:</strong> {shippingRate.name} - ${(shippingRate.price / 100).toFixed(2)}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Form */}
        <PaymentForm
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipping
          </Button>

          <div className="text-sm text-gray-500">
            Payment will be processed on the next step
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Secure Payment:</strong> Your payment information is encrypted and secure. 
            We use Stripe to process payments and never store your card details on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}