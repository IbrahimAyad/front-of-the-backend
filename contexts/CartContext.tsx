'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore, CartItem, CartValidation } from '@/lib/stores/cart.store';
import { toast } from 'react-hot-toast';

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  
  addItem: (item: Omit<CartItem, 'stockStatus' | 'maxQuantity'>) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  validateCart: () => Promise<CartValidation>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const previousUserId = useRef<string | null>(null);
  const validationInterval = useRef<NodeJS.Timeout>();
  
  const {
    items,
    isLoading,
    isSyncing,
    error,
    getTotalItems,
    getSubtotal,
    getTax,
    getTotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    syncWithBackend,
    mergeGuestCart
  } = useCartStore();
  
  // Handle user authentication changes
  useEffect(() => {
    const handleAuthChange = async () => {
      if (status === 'loading') return;
      
      const currentUserId = session?.user?.id || null;
      
      // User just logged in
      if (currentUserId && !previousUserId.current && items.length > 0) {
        try {
          await mergeGuestCart(currentUserId);
          toast.success('Your cart has been saved');
        } catch (error) {
          toast.error('Failed to save your cart');
        }
      }
      
      // User logged out
      if (!currentUserId && previousUserId.current) {
        // Cart persists in localStorage for guest users
        toast.info('Your cart has been saved locally');
      }
      
      // Sync cart if user is logged in
      if (currentUserId) {
        await syncWithBackend(currentUserId);
      }
      
      previousUserId.current = currentUserId;
    };
    
    handleAuthChange();
  }, [session?.user?.id, status, items.length, mergeGuestCart, syncWithBackend]);
  
  // Real-time stock validation
  useEffect(() => {
    // Validate cart every 30 seconds
    validationInterval.current = setInterval(async () => {
      if (items.length > 0) {
        try {
          const validation = await validateCart();
          
          if (!validation.isValid) {
            validation.errors.forEach(error => {
              toast.error(error.message, {
                duration: 5000,
                id: `stock-${error.productId}-${error.variantId}`
              });
            });
          }
        } catch (error) {
          console.error('Cart validation failed:', error);
        }
      }
    }, 30000);
    
    return () => {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [items.length, validateCart]);
  
  // Enhanced add item with notifications
  const enhancedAddItem = async (item: Omit<CartItem, 'stockStatus' | 'maxQuantity'>) => {
    try {
      await addItem(item);
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add item');
      throw error;
    }
  };
  
  // Enhanced update quantity with notifications
  const enhancedUpdateQuantity = async (
    productId: string, 
    quantity: number, 
    variantId?: string
  ) => {
    try {
      await updateQuantity(productId, quantity, variantId);
      
      if (quantity === 0) {
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
      throw error;
    }
  };
  
  // Enhanced remove item with notifications
  const enhancedRemoveItem = (productId: string, variantId?: string) => {
    const item = items.find(i => i.productId === productId && i.variantId === variantId);
    removeItem(productId, variantId);
    
    if (item) {
      toast.success(`${item.name} removed from cart`);
    }
  };
  
  const value: CartContextValue = {
    items,
    isLoading,
    isSyncing,
    error,
    totalItems: getTotalItems(),
    subtotal: getSubtotal(),
    tax: getTax(),
    total: getTotal(),
    addItem: enhancedAddItem,
    updateQuantity: enhancedUpdateQuantity,
    removeItem: enhancedRemoveItem,
    clearCart,
    validateCart
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// Helper hook for cart summary
export const useCartSummary = () => {
  const { totalItems, subtotal, tax, total } = useCart();
  
  return {
    totalItems,
    subtotal,
    tax,
    total,
    formattedSubtotal: `$${(subtotal / 100).toFixed(2)}`,
    formattedTax: `$${(tax / 100).toFixed(2)}`,
    formattedTotal: `$${(total / 100).toFixed(2)}`
  };
};