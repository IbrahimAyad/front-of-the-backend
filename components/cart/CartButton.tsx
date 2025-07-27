'use client';

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
}

export function CartButton({ 
  className, 
  showLabel = false,
  variant = 'ghost' 
}: CartButtonProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <Button
        variant={variant}
        size={showLabel ? 'default' : 'icon'}
        onClick={() => setIsDrawerOpen(true)}
        className={cn('relative', className)}
      >
        <ShoppingCart className="h-5 w-5" />
        {showLabel && <span className="ml-2">Cart</span>}
        
        {totalItems > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
      </Button>

      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}