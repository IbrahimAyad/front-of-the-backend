'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, Download, Mail, Package, ArrowRight, Copy, Check } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { formatPrice } from '@/lib/utils/cart.utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery: string;
  trackingNumber?: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const { orderId, resetCheckout } = useCheckout();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  useEffect(() => {
    if (!orderId) {
      // No order ID, redirect to home
      router.push('/');
      return;
    }

    loadOrderDetails();
  }, [orderId, router]);

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.data);
      } else {
        setError(data.error || 'Failed to load order details');
      }
    } catch (error) {
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOrderId = async () => {
    if (orderDetails) {
      await navigator.clipboard.writeText(orderDetails.orderNumber);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleContinueShopping = () => {
    resetCheckout();
    router.push('/products');
  };

  const handleViewOrder = () => {
    router.push(`/account/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Order not found'}
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/')}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-lg text-gray-600">
          Thank you for your order. We've received your payment and will start processing your order soon.
        </p>
      </div>

      {/* Order Number */}
      <Card className="p-6 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Order Number</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold">
              {orderDetails.orderNumber}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyOrderId}
              className="h-8 w-8"
            >
              {copiedOrderId ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Keep this number for your records
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="flex gap-4">
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

          {/* Shipping Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Shipping Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600">
                  <p>{orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}</p>
                  <p>{orderDetails.shippingAddress.address1}</p>
                  {orderDetails.shippingAddress.address2 && (
                    <p>{orderDetails.shippingAddress.address2}</p>
                  )}
                  <p>
                    {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postalCode}
                  </p>
                  <p>{orderDetails.shippingAddress.country}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Delivery Estimate</h4>
                <p className="text-sm text-gray-600">
                  {new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                
                {orderDetails.trackingNumber && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-1">Tracking Number</h4>
                    <p className="text-sm font-mono text-primary">
                      {orderDetails.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Total */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Total</h3>
            <div className="text-2xl font-bold">
              {formatPrice(orderDetails.total)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Payment confirmed
            </p>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleViewOrder}
              >
                <Package className="mr-2 h-4 w-4" />
                View Order Details
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          </Card>

          {/* What's Next */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium">Email Confirmation</p>
                  <p className="text-gray-600">You'll receive an email confirmation shortly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 mt-0.5 text-orange-600" />
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-gray-600">We'll prepare your items for shipment</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Tracking Updates</p>
                  <p className="text-gray-600">Get updates when your order ships</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Continue Shopping */}
      <div className="mt-8 text-center">
        <Button 
          onClick={handleContinueShopping}
          size="lg"
          className="px-8"
        >
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Support Notice */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Need help with your order? Contact our support team at{' '}
          <a 
            href="mailto:support@example.com" 
            className="text-primary hover:underline"
          >
            support@example.com
          </a>{' '}
          or call{' '}
          <a 
            href="tel:+1-555-123-4567" 
            className="text-primary hover:underline"
          >
            (555) 123-4567
          </a>
        </p>
      </div>
    </div>
  );
}