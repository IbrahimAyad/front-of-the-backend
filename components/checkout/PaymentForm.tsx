'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { useSession } from 'next-auth/react';
import { CreditCard, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault?: boolean;
}

function PaymentFormContent({ onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const { shippingAddress, shippingRate } = useCheckout();
  const { total } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'new' | string>('new');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string>('');

  // Load saved payment methods
  useEffect(() => {
    if (session?.user) {
      loadSavedCards();
    }
  }, [session]);

  // Create payment intent
  useEffect(() => {
    if (shippingAddress && shippingRate && total > 0) {
      createPaymentIntent();
    }
  }, [shippingAddress, shippingRate, total]);

  const loadSavedCards = async () => {
    try {
      const response = await fetch('/api/payment/methods');
      const data = await response.json();
      
      if (data.success) {
        setSavedCards(data.data.cards || []);
        // Auto-select default card
        const defaultCard = data.data.cards?.find((card: SavedCard) => card.isDefault);
        if (defaultCard) {
          setPaymentMethod(defaultCard.id);
        }
      }
    } catch (error) {
      console.error('Failed to load saved cards:', error);
    }
  };

  const createPaymentIntent = async () => {
    try {
      const shippingCost = shippingRate?.price || 0;
      const finalAmount = total + shippingCost;

      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'usd',
          shipping: {
            name: `${shippingAddress?.firstName} ${shippingAddress?.lastName}`,
            address: {
              line1: shippingAddress?.address1,
              line2: shippingAddress?.address2,
              city: shippingAddress?.city,
              state: shippingAddress?.state,
              postal_code: shippingAddress?.postalCode,
              country: shippingAddress?.country,
            },
          },
          metadata: {
            shippingRateId: shippingRate?.id,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setClientSecret(data.data.clientSecret);
      } else {
        setError(data.error || 'Failed to create payment intent');
      }
    } catch (error) {
      setError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let result;

      if (paymentMethod === 'new') {
        // Process new card payment
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${shippingAddress?.firstName} ${shippingAddress?.lastName}`,
              email: shippingAddress?.email || session?.user?.email,
              address: {
                line1: shippingAddress?.address1,
                line2: shippingAddress?.address2,
                city: shippingAddress?.city,
                state: shippingAddress?.state,
                postal_code: shippingAddress?.postalCode,
                country: shippingAddress?.country,
              },
            },
          },
          setup_future_usage: saveCard && session?.user ? 'on_session' : undefined,
        });
      } else {
        // Process with saved payment method
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethod,
        });
      }

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent) {
        // Payment successful
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

        {/* Saved Cards */}
        {savedCards.length > 0 && (
          <div className="mb-6">
            <Label className="text-base font-medium mb-3 block">Select Payment Method</Label>
            <div className="space-y-3">
              {savedCards.map((card) => (
                <Card key={card.id} className={cn(
                  'p-4 cursor-pointer transition-all',
                  paymentMethod === card.id && 'ring-2 ring-primary'
                )}>
                  <label
                    htmlFor={`card-${card.id}`}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      id={`card-${card.id}`}
                      name="paymentMethod"
                      value={card.id}
                      checked={paymentMethod === card.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {card.brand.toUpperCase()} •••• {card.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>
                    {card.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </label>
                </Card>
              ))}
              
              <Card className={cn(
                'p-4 cursor-pointer transition-all',
                paymentMethod === 'new' && 'ring-2 ring-primary'
              )}>
                <label
                  htmlFor="new-card"
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    id="new-card"
                    name="paymentMethod"
                    value="new"
                    checked={paymentMethod === 'new'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Use a new card</span>
                </label>
              </Card>
            </div>
          </div>
        )}

        {/* New Card Form */}
        {paymentMethod === 'new' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-element">Card Information</Label>
              <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
                <CardElement
                  id="card-element"
                  options={cardElementOptions}
                />
              </div>
            </div>

            {/* Save Card Option */}
            {session?.user && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveCard"
                  checked={saveCard}
                  onCheckedChange={setSaveCard}
                />
                <Label
                  htmlFor="saveCard"
                  className="text-sm font-normal cursor-pointer"
                >
                  Save this card for future purchases
                </Label>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Security Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Secure Payment</span>
          </div>
        </div>
      </div>
    </form>
  );
}

export function PaymentForm({ onSuccess, onError }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}