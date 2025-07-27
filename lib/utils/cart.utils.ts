import { CartItem } from '@/lib/stores/cart.store';

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  itemCount: number;
  uniqueItemCount: number;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate cart subtotal in cents
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Calculate tax amount in cents
 */
export function calculateTax(subtotal: number, taxRate: number = 0.08): number {
  return Math.round(subtotal * taxRate);
}

/**
 * Calculate shipping cost in cents
 */
export function calculateShipping(items: CartItem[], subtotal: number): number {
  // Free shipping over $100
  if (subtotal >= 10000) return 0;
  
  // Flat rate for now
  return 999; // $9.99
}

/**
 * Get complete cart summary
 */
export function getCartSummary(
  items: CartItem[],
  options: {
    taxRate?: number;
    shippingRate?: number;
    discountAmount?: number;
  } = {}
): CartSummary {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, options.taxRate);
  const shipping = calculateShipping(items, subtotal);
  const discount = options.discountAmount || 0;
  const total = subtotal + tax + shipping - discount;
  
  return {
    subtotal,
    tax,
    shipping,
    discount,
    total,
    currency: 'USD',
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    uniqueItemCount: items.length
  };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(cents / 100);
}

/**
 * Validate cart before checkout
 */
export function validateCartForCheckout(items: CartItem[]): CartValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (items.length === 0) {
    errors.push('Your cart is empty');
    return { isValid: false, errors, warnings };
  }
  
  // Check stock status
  items.forEach(item => {
    if (item.stockStatus === 'out_of_stock') {
      errors.push(`${item.name} is out of stock`);
    } else if (item.stockStatus === 'low_stock') {
      warnings.push(`${item.name} has limited stock available`);
    }
    
    if (item.quantity > item.maxQuantity) {
      errors.push(`${item.name} quantity exceeds maximum allowed (${item.maxQuantity})`);
    }
  });
  
  // Check minimum order value
  const subtotal = calculateSubtotal(items);
  const minOrderValue = 1000; // $10.00
  
  if (subtotal < minOrderValue) {
    errors.push(`Minimum order value is ${formatPrice(minOrderValue)}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Merge guest cart with user cart
 */
export function mergeCartItems(
  guestItems: CartItem[],
  userItems: CartItem[]
): CartItem[] {
  const merged = [...userItems];
  
  guestItems.forEach(guestItem => {
    const existingIndex = merged.findIndex(
      item => item.productId === guestItem.productId && 
              item.variantId === guestItem.variantId
    );
    
    if (existingIndex >= 0) {
      // Merge quantities up to max allowed
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: Math.min(
          merged[existingIndex].quantity + guestItem.quantity,
          merged[existingIndex].maxQuantity
        )
      };
    } else {
      // Add new item
      merged.push(guestItem);
    }
  });
  
  return merged;
}

/**
 * Format cart for checkout processing
 */
export function formatCartForCheckout(items: CartItem[]) {
  return {
    items: items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      attributes: item.attributes
    })),
    metadata: {
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      uniqueItems: items.length,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Check if cart has digital items
 */
export function hasDigitalItems(items: CartItem[]): boolean {
  return items.some(item => item.attributes?.type === 'digital');
}

/**
 * Check if cart requires shipping
 */
export function requiresShipping(items: CartItem[]): boolean {
  return items.some(item => item.attributes?.type !== 'digital');
}

/**
 * Get estimated delivery date
 */
export function getEstimatedDelivery(
  processingDays: number = 1,
  shippingDays: number = 3
): Date {
  const date = new Date();
  let businessDays = processingDays + shippingDays;
  
  while (businessDays > 0) {
    date.setDate(date.getDate() + 1);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      businessDays--;
    }
  }
  
  return date;
}

/**
 * Group items by seller/vendor if applicable
 */
export function groupItemsBySeller(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce((groups, item) => {
    const seller = item.attributes?.sellerId || 'default';
    if (!groups[seller]) {
      groups[seller] = [];
    }
    groups[seller].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);
}