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

const cartSchema = z.object({
  items: z.array(cartItemSchema),
  userId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      // Return empty cart for unauthenticated users
      return createApiResponse({
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        currency: 'USD'
      });
    }
    
    // Get user's cart from database
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
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
      return createApiResponse({
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        currency: 'USD'
      });
    }
    
    // Transform cart items
    const items = cart.items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      image: item.product.images[0] || '',
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.product.price,
      attributes: item.variant?.attributes || {},
      stockStatus: item.product.stockQuantity > 10 
        ? 'in_stock' 
        : item.product.stockQuantity > 0 
          ? 'low_stock' 
          : 'out_of_stock',
      maxQuantity: Math.min(item.product.stockQuantity, 99)
    }));
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;
    
    return createApiResponse({
      items,
      subtotal,
      tax,
      total,
      currency: 'USD',
      lastUpdated: cart.updatedAt.toISOString()
    });
    
  } catch (error) {
    console.error('Cart fetch error:', error);
    return createApiResponse(
      null, 
      'Failed to fetch cart', 
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const validatedItem = cartItemSchema.parse(body);
    
    // Validate product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: validatedItem.productId },
      include: {
        variants: validatedItem.variantId ? {
          where: { id: validatedItem.variantId }
        } : false
      }
    });
    
    if (!product) {
      return createApiResponse(null, 'Product not found', 404);
    }
    
    const availableStock = validatedItem.variantId && product.variants.length > 0
      ? product.variants[0].stockQuantity
      : product.stockQuantity;
    
    if (availableStock < validatedItem.quantity) {
      return createApiResponse(
        null, 
        `Only ${availableStock} items available`, 
        400
      );
    }
    
    // Guest cart - return success without DB operation
    if (!session?.user?.id) {
      return createApiResponse({
        message: 'Item added to cart',
        stockStatus: availableStock > 10 ? 'in_stock' : 'low_stock',
        maxQuantity: Math.min(availableStock, 99)
      });
    }
    
    // Get or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id }
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: validatedItem.productId,
        variantId: validatedItem.variantId
      }
    });
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + validatedItem.quantity;
      
      if (availableStock < newQuantity) {
        return createApiResponse(
          null,
          `Cannot add more items. Only ${availableStock} available`,
          400
        );
      }
      
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          price: validatedItem.price
        }
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedItem.productId,
          variantId: validatedItem.variantId,
          quantity: validatedItem.quantity,
          price: validatedItem.price
        }
      });
    }
    
    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    });
    
    return createApiResponse({
      message: 'Item added to cart',
      stockStatus: availableStock > 10 ? 'in_stock' : 'low_stock',
      maxQuantity: Math.min(availableStock, 99)
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(null, 'Invalid cart item data', 400);
    }
    
    console.error('Add to cart error:', error);
    return createApiResponse(null, 'Failed to add item to cart', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const validated = cartSchema.parse(body);
    const userId = validated.userId || session?.user?.id;
    
    if (!userId) {
      // Guest cart - just return success
      return createApiResponse({ message: 'Cart updated' });
    }
    
    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }
    
    // Clear existing items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
    
    // Add new items
    if (validated.items.length > 0) {
      await prisma.cartItem.createMany({
        data: validated.items.map(item => ({
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price
        }))
      });
    }
    
    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    });
    
    return createApiResponse({ message: 'Cart synced successfully' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(null, 'Invalid cart data', 400);
    }
    
    console.error('Cart sync error:', error);
    return createApiResponse(null, 'Failed to sync cart', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createApiResponse({ message: 'Cart cleared' });
    }
    
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });
    
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      
      await prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      });
    }
    
    return createApiResponse({ message: 'Cart cleared successfully' });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    return createApiResponse(null, 'Failed to clear cart', 500);
  }
}