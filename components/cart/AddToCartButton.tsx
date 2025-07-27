'use client';

import React, { useState } from 'react';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  attributes?: Record<string, string>;
  quantity?: number;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  onSuccess?: () => void;
}

export function AddToCartButton({
  productId,
  variantId,
  name,
  image,
  price,
  originalPrice,
  attributes,
  quantity = 1,
  className,
  size = 'default',
  variant = 'default',
  disabled = false,
  onSuccess
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    if (isAdding || disabled) return;

    setIsAdding(true);
    try {
      await addItem({
        productId,
        variantId,
        name,
        image,
        price,
        originalPrice,
        attributes,
        quantity
      });

      // Show success state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Call success callback
      onSuccess?.();
    } catch (error) {
      // Error is handled by the cart context with toast notifications
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={disabled || isAdding || showSuccess}
      className={cn(
        'transition-all',
        showSuccess && 'bg-green-600 hover:bg-green-600',
        className
      )}
    >
      {isAdding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : showSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}