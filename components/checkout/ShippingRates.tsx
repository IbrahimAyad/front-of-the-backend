'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Package, Plane, Clock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatPrice, getEstimatedDelivery } from '@/lib/utils/cart.utils';
import { ShippingRate } from '@/contexts/CheckoutContext';
import { cn } from '@/lib/utils';

interface ShippingRatesProps {
  onSelect: (rate: ShippingRate) => void;
  selectedRateId?: string;
  subtotal: number;
}

const defaultRates: ShippingRate[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    price: 999, // $9.99
    estimatedDays: 7,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered in 2-3 business days',
    price: 1999, // $19.99
    estimatedDays: 3,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Delivered next business day',
    price: 3999, // $39.99
    estimatedDays: 1,
  },
];

export function ShippingRates({ onSelect, selectedRateId, subtotal }: ShippingRatesProps) {
  const [rates, setRates] = useState<ShippingRate[]>(defaultRates);
  const [isLoading, setIsLoading] = useState(false);

  // Apply free shipping for orders over $100
  const adjustedRates = rates.map(rate => ({
    ...rate,
    price: subtotal >= 10000 && rate.id === 'standard' ? 0 : rate.price,
  }));

  useEffect(() => {
    // Auto-select standard shipping if nothing selected
    if (!selectedRateId && adjustedRates.length > 0) {
      onSelect(adjustedRates[0]);
    }
  }, [selectedRateId, adjustedRates, onSelect]);

  const getIcon = (rateId: string) => {
    switch (rateId) {
      case 'standard':
        return <Truck className="h-5 w-5" />;
      case 'express':
        return <Package className="h-5 w-5" />;
      case 'overnight':
        return <Plane className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Shipping Method</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <RadioGroup
          value={selectedRateId}
          onValueChange={(value) => {
            const rate = adjustedRates.find(r => r.id === value);
            if (rate) onSelect(rate);
          }}
        >
          {adjustedRates.map((rate) => {
            const deliveryDate = getEstimatedDelivery(0, rate.estimatedDays);
            const isFree = rate.price === 0;

            return (
              <Card key={rate.id} className={cn(
                'relative overflow-hidden transition-all',
                selectedRateId === rate.id && 'ring-2 ring-primary'
              )}>
                <label
                  htmlFor={rate.id}
                  className="flex items-start gap-4 p-4 cursor-pointer"
                >
                  <RadioGroupItem value={rate.id} id={rate.id} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getIcon(rate.id)}
                      <span className="font-medium">{rate.name}</span>
                      {isFree && (
                        <Badge variant="success" className="ml-2">
                          FREE
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {rate.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        Est. delivery: {deliveryDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      isFree && 'text-green-600'
                    )}>
                      {isFree ? 'FREE' : formatPrice(rate.price)}
                    </p>
                    {rate.id === 'standard' && subtotal < 10000 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Free over $100
                      </p>
                    )}
                  </div>
                </label>

                {rate.id === 'overnight' && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded-bl-lg">
                    Fastest
                  </div>
                )}
              </Card>
            );
          })}
        </RadioGroup>
      )}

      {subtotal < 10000 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Add {formatPrice(10000 - subtotal)} more to your order for free standard shipping!
          </p>
        </div>
      )}
    </div>
  );
}