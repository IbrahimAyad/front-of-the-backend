'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, Edit, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart, useCartSummary } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/cart.utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function ReviewPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { 
    shippingAddress, 
    shippingRate, 
    navigateToStep,
    setOrderId 
  } = useCheckout();
  
  const { items, clearCart } = useCart();
  const { subtotal, tax, total } = useCartSummary();
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  useEffect(() => {
    // Get payment intent from previous step
    const intentId = sessionStorage.getItem('paymentIntentId');
    if (intentId) {
      setPaymentIntentId(intentId);
    } else {
      // No payment intent, redirect back to payment
      navigateToStep('payment');
    }
  }, [navigateToStep]);

  // Redirect if previous steps not completed
  useEffect(() => {
    if (!shippingAddress || !shippingRate) {
      navigateToStep('shipping');
    }
  }, [shippingAddress, shippingRate, navigateToStep]);

  const shippingCost = shippingRate?.price || 0;
  const finalTotal = total + shippingCost;

  const handlePlaceOrder = async () => {
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsPlacingOrder(true);
    setError('');

    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress,
          shippingRate,
          paymentIntentId,
          subtotal,
          tax,
          shippingCost,
          total: finalTotal,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const orderId = orderData.data.orderId;

      // Confirm payment with the order ID
      const paymentResponse = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          orderId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Payment confirmation failed');
      }

      // Clear cart and navigate to confirmation
      await clearCart();
      setOrderId(orderId);
      
      // Clear payment intent from session
      sessionStorage.removeItem('paymentIntentId');
      
      navigateToStep('confirm');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleBack = () => {
    navigateToStep('payment');
  };

  if (!shippingAddress || !shippingRate || !paymentIntentId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Review Your Order</h2>
          <p className="text-gray-600">
            Please review your order details before placing your order.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Order Items</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/cart')}
                  className="text-primary"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {item.quantity}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <p className="text-sm text-gray-500">
                          {Object.entries(item.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Shipping Address</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToStep('shipping')}
                  className="text-primary"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="text-sm">
                <p className="font-medium">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                {shippingAddress.company && (
                  <p>{shippingAddress.company}</p>
                )}
                <p>{shippingAddress.address1}</p>
                {shippingAddress.address2 && (
                  <p>{shippingAddress.address2}</p>
                )}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
                <p className="mt-2">{shippingAddress.phone}</p>
              </div>
            </Card>

            {/* Shipping Method */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Shipping Method</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToStep('shipping')}
                  className="text-primary"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{shippingRate.name}</p>
                  <p className="text-sm text-gray-600">{shippingRate.description}</p>
                </div>
                <p className="font-medium">
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payment Method</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToStep('payment')}
                  className="text-primary"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Payment method confirmed</span>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm cursor-pointer leading-5"
                  >
                    I accept the{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={!acceptedTerms || isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isPlacingOrder}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}