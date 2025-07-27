import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().min(1)
});

const validateCartSchema = z.object({
  items: z.array(cartItemSchema)
});

interface ValidationError {
  productId: string;
  variantId?: string;
  message: string;
  suggestedQuantity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = validateCartSchema.parse(body);
    
    const errors: ValidationError[] = [];
    const validatedItems = [];
    
    // Validate each item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variantId ? {
            where: { id: item.variantId }
          } : false
        }
      });
      
      if (!product) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          message: 'Product no longer exists',
          suggestedQuantity: 0
        });
        continue;
      }
      
      if (!product.isActive) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          message: 'Product is no longer available',
          suggestedQuantity: 0
        });
        continue;
      }
      
      const stockQuantity = item.variantId && product.variants.length > 0
        ? product.variants[0].stockQuantity
        : product.stockQuantity;
      
      if (stockQuantity === 0) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          message: 'Product is out of stock',
          suggestedQuantity: 0
        });
        continue;
      }
      
      if (item.quantity > stockQuantity) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          message: `Only ${stockQuantity} items available`,
          suggestedQuantity: stockQuantity
        });
        validatedItems.push({
          ...item,
          quantity: stockQuantity,
          stockStatus: stockQuantity <= 10 ? 'low_stock' : 'in_stock'
        });
      } else {
        validatedItems.push({
          ...item,
          stockStatus: stockQuantity === 0 
            ? 'out_of_stock' 
            : stockQuantity <= 10 
              ? 'low_stock' 
              : 'in_stock'
        });
      }
    }
    
    return createApiResponse({
      isValid: errors.length === 0,
      errors,
      validatedItems,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(null, 'Invalid cart data', 400);
    }
    
    console.error('Cart validation error:', error);
    return createApiResponse(null, 'Failed to validate cart', 500);
  }
}