import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  image: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  originalPrice: z.number().optional(),
  attributes: z.record(z.string()).optional()
});

const mergeCartSchema = z.object({
  guestItems: z.array(cartItemSchema),
  userId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { guestItems, userId } = mergeCartSchema.parse(body);
    
    // Verify the user is authenticated and matches the userId
    if (!session?.user?.id || session.user.id !== userId) {
      return createApiResponse(null, 'Unauthorized', 401);
    }
    
    // Get or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
    }
    
    // Process guest items
    const mergedItems = [];
    
    for (const guestItem of guestItems) {
      // Check if product exists and is available
      const product = await prisma.product.findUnique({
        where: { id: guestItem.productId },
        include: {
          variants: guestItem.variantId ? {
            where: { id: guestItem.variantId }
          } : false
        }
      });
      
      if (!product || !product.isActive) {
        continue; // Skip unavailable products
      }
      
      const stockQuantity = guestItem.variantId && product.variants.length > 0
        ? product.variants[0].stockQuantity
        : product.stockQuantity;
      
      if (stockQuantity === 0) {
        continue; // Skip out of stock items
      }
      
      // Check if item already exists in user cart
      const existingItem = cart.items.find(
        item => item.productId === guestItem.productId && 
                item.variantId === guestItem.variantId
      );
      
      if (existingItem) {
        // Merge quantities
        const newQuantity = Math.min(
          existingItem.quantity + guestItem.quantity,
          stockQuantity,
          99 // Max per customer
        );
        
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: newQuantity,
            price: guestItem.price // Update to latest price
          }
        });
        
        mergedItems.push({
          ...guestItem,
          quantity: newQuantity,
          stockStatus: stockQuantity > 10 ? 'in_stock' : 'low_stock',
          maxQuantity: Math.min(stockQuantity, 99)
        });
      } else {
        // Add new item
        const quantity = Math.min(guestItem.quantity, stockQuantity, 99);
        
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity,
            price: guestItem.price
          }
        });
        
        mergedItems.push({
          ...guestItem,
          quantity,
          stockStatus: stockQuantity > 10 ? 'in_stock' : 'low_stock',
          maxQuantity: Math.min(stockQuantity, 99)
        });
      }
    }
    
    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });
    
    // Transform cart items for response
    const items = updatedCart!.items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      image: item.product.images[0] || '',
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.product.price,
      attributes: item.variant?.attributes || {},
      stockStatus: item.product.stockQuantity > 10 
        ? 'in_stock' as const
        : item.product.stockQuantity > 0 
          ? 'low_stock' as const
          : 'out_of_stock' as const,
      maxQuantity: Math.min(item.product.stockQuantity, 99)
    }));
    
    return createApiResponse({
      items,
      mergedCount: mergedItems.length,
      message: 'Cart merged successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(null, 'Invalid merge data', 400);
    }
    
    console.error('Cart merge error:', error);
    return createApiResponse(null, 'Failed to merge cart', 500);
  }
}