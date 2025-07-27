'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart, useCartSummary } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/cart.utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, isLoading, updateQuantity, removeItem, clearCart } = useCart();
  const { totalItems, formattedSubtotal, formattedTax, formattedTotal } = useCartSummary();

  const handleQuantityChange = async (
    productId: string, 
    currentQuantity: number, 
    change: number,
    variantId?: string
  ) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    await updateQuantity(productId, newQuantity, variantId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Shopping Cart</h2>
                  {totalItems > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Button onClick={onClose} asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={`${item.productId}-${item.variantId}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="relative h-20 w-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md"
                          />
                          {item.stockStatus === 'low_stock' && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 text-xs"
                            >
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {item.name}
                          </h3>
                          
                          {/* Attributes */}
                          {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key} className="text-xs text-gray-500">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold text-sm">
                              {formatPrice(item.price)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(
                                  item.productId, 
                                  item.quantity, 
                                  -1,
                                  item.variantId
                                )}
                                disabled={isLoading || item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-10 text-center text-sm">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(
                                  item.productId, 
                                  item.quantity, 
                                  1,
                                  item.variantId
                                )}
                                disabled={
                                  isLoading || 
                                  item.quantity >= item.maxQuantity ||
                                  item.stockStatus === 'out_of_stock'
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.productId, item.variantId)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Stock Warning */}
                          {item.quantity >= item.maxQuantity && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Maximum quantity reached
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formattedSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formattedTax}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{formattedTotal}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      asChild
                      disabled={isLoading}
                    >
                      <Link href="/checkout" onClick={onClose}>
                        Proceed to Checkout
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        clearCart();
                        onClose();
                      }}
                      disabled={isLoading}
                    >
                      Clear Cart
                    </Button>
                  </div>

                  {/* Shipping Notice */}
                  <p className="text-xs text-center text-gray-500">
                    Free shipping on orders over $100
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}