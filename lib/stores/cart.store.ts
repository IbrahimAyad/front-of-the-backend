import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { createApiResponse } from '@/lib/utils/api-response';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  attributes?: Record<string, string>;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  maxQuantity: number;
}

export interface CartValidation {
  isValid: boolean;
  errors: Array<{
    productId: string;
    variantId?: string;
    message: string;
    suggestedQuantity?: number;
  }>;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isSyncing: boolean;
  lastValidated: Date | null;
  lastSynced: Date | null;
  error: string | null;
  
  // Computed values
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'stockStatus' | 'maxQuantity'>) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  validateCart: () => Promise<CartValidation>;
  clearCart: () => void;
  syncWithBackend: (userId?: string) => Promise<void>;
  mergeGuestCart: (userId: string) => Promise<void>;
  
  // Internal actions
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isLoading: false,
        isSyncing: false,
        lastValidated: null,
        lastSynced: null,
        error: null,
        
        getTotalItems: () => {
          const { items } = get();
          return items.reduce((total, item) => total + item.quantity, 0);
        },
        
        getSubtotal: () => {
          const { items } = get();
          return items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        
        getTax: (taxRate = 0.08) => {
          const subtotal = get().getSubtotal();
          return Math.round(subtotal * taxRate * 100) / 100;
        },
        
        getTotal: (taxRate = 0.08) => {
          const subtotal = get().getSubtotal();
          const tax = get().getTax(taxRate);
          return subtotal + tax;
        },
        
        addItem: async (newItem) => {
          set({ isLoading: true, error: null });
          
          try {
            // Check if item already exists
            const { items } = get();
            const existingIndex = items.findIndex(
              item => item.productId === newItem.productId && 
                     item.variantId === newItem.variantId
            );
            
            if (existingIndex >= 0) {
              // Update quantity instead
              const existingItem = items[existingIndex];
              await get().updateQuantity(
                newItem.productId, 
                existingItem.quantity + newItem.quantity,
                newItem.variantId
              );
              return;
            }
            
            // Validate stock before adding
            const response = await fetch('/api/cart/validate-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: newItem.productId,
                variantId: newItem.variantId,
                quantity: newItem.quantity
              })
            });
            
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || 'Failed to validate item');
            }
            
            const validatedItem: CartItem = {
              ...newItem,
              stockStatus: data.data.stockStatus,
              maxQuantity: data.data.maxQuantity,
              quantity: Math.min(newItem.quantity, data.data.maxQuantity)
            };
            
            set(state => ({
              items: [...state.items, validatedItem],
              lastValidated: new Date()
            }));
            
            // Sync with backend if user is logged in
            await get().syncWithBackend();
            
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add item' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        updateQuantity: async (productId, quantity, variantId) => {
          if (quantity <= 0) {
            get().removeItem(productId, variantId);
            return;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            // Validate new quantity
            const response = await fetch('/api/cart/validate-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId, variantId, quantity })
            });
            
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || 'Failed to validate quantity');
            }
            
            const validatedQuantity = Math.min(quantity, data.data.maxQuantity);
            
            set(state => ({
              items: state.items.map(item => 
                item.productId === productId && item.variantId === variantId
                  ? { 
                      ...item, 
                      quantity: validatedQuantity,
                      stockStatus: data.data.stockStatus,
                      maxQuantity: data.data.maxQuantity
                    }
                  : item
              ),
              lastValidated: new Date()
            }));
            
            await get().syncWithBackend();
            
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update quantity' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        removeItem: (productId, variantId) => {
          set(state => ({
            items: state.items.filter(
              item => !(item.productId === productId && item.variantId === variantId)
            )
          }));
          
          // Sync with backend
          get().syncWithBackend();
        },
        
        validateCart: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { items } = get();
            const response = await fetch('/api/cart/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items })
            });
            
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || 'Failed to validate cart');
            }
            
            const validation: CartValidation = data.data;
            
            // Update items with validated data
            if (validation.errors.length > 0) {
              set(state => ({
                items: state.items.map(item => {
                  const error = validation.errors.find(
                    e => e.productId === item.productId && e.variantId === item.variantId
                  );
                  
                  if (error && error.suggestedQuantity !== undefined) {
                    return { ...item, quantity: error.suggestedQuantity };
                  }
                  
                  return item;
                }),
                lastValidated: new Date()
              }));
            } else {
              set({ lastValidated: new Date() });
            }
            
            return validation;
            
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to validate cart' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        clearCart: () => {
          set({ 
            items: [], 
            lastValidated: null,
            error: null 
          });
          
          // Sync with backend
          get().syncWithBackend();
        },
        
        syncWithBackend: async (userId?: string) => {
          const { items, isSyncing } = get();
          
          // Prevent concurrent syncs
          if (isSyncing || items.length === 0) return;
          
          set({ isSyncing: true });
          
          try {
            const response = await fetch('/api/cart', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items, userId })
            });
            
            const data = await response.json();
            
            if (data.success) {
              set({ lastSynced: new Date() });
            }
            
          } catch (error) {
            console.error('Cart sync failed:', error);
          } finally {
            set({ isSyncing: false });
          }
        },
        
        mergeGuestCart: async (userId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const { items } = get();
            const response = await fetch('/api/cart/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                guestItems: items,
                userId 
              })
            });
            
            const data = await response.json();
            
            if (!data.success) {
              throw new Error(data.error || 'Failed to merge cart');
            }
            
            // Update with merged cart
            set({ 
              items: data.data.items,
              lastSynced: new Date(),
              lastValidated: new Date()
            });
            
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to merge cart' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        setLoading: (loading) => set({ isLoading: loading }),
        setSyncing: (syncing) => set({ isSyncing: syncing }),
        setError: (error) => set({ error })
      }),
      {
        name: 'shopping-cart',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          items: state.items,
          lastValidated: state.lastValidated,
          lastSynced: state.lastSynced
        })
      }
    ),
    {
      name: 'cart-store'
    }
  )
);