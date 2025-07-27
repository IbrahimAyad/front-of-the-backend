'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Tag, Truck, Shield } from 'lucide-react';
import { useCart, useCartSummary } from '@/contexts/CartContext';
import { formatPrice, getEstimatedDelivery } from '@/lib/utils/cart.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  className?: string;
  showPromoCode?: boolean;
  showItems?: boolean;
}

export function OrderSummary({ 
  className, 
  showPromoCode = true,
  showItems = true 
}: OrderSummaryProps) {
  const { items } = useCart();
  const { totalItems, subtotal, tax, total } = useCartSummary();
  const [isExpanded, setIsExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discount, setDiscount] = useState(0);

  const estimatedDelivery = getEstimatedDelivery();
  const shipping = subtotal >= 10000 ? 0 : 999; // Free shipping over $100

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);
    try {
      // TODO: Call API to validate promo code
      // const response = await fetch('/api/checkout/apply-promo', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: promoCode })
      // });
      
      // Simulated discount for now
      setDiscount(Math.floor(subtotal * 0.1)); // 10% discount
      setPromoCode('');
    } catch (error) {
      console.error('Failed to apply promo code:', error);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

        {/* Items Toggle */}
        {showItems && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>{totalItems} items</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Expanded Items List */}
        {showItems && isExpanded && (
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3 text-sm"
              >
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                  {item.quantity > 1 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {item.quantity}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  {item.attributes && Object.keys(item.attributes).length > 0 && (
                    <p className="text-gray-500 text-xs">
                      {Object.entries(item.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  {item.quantity > 1 && (
                    <p className="text-gray-500 text-xs">
                      {formatPrice(item.price)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promo Code */}
        {showPromoCode && (
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || isApplyingPromo}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? (
                <span className="text-green-600">FREE</span>
              ) : (
                formatPrice(shipping)
              )}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          
          <div className="flex justify-between text-base font-semibold border-t pt-2">
            <span>Total</span>
            <span>{formatPrice(total + shipping - discount)}</span>
          </div>
        </div>

        {/* Delivery Estimate */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-gray-600" />
            <span className="text-gray-600">Estimated delivery:</span>
            <span className="font-medium">
              {estimatedDelivery.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Secure checkout powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}