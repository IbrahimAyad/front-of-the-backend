import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const validateItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity } = validateItemSchema.parse(body);
    
    // Get product with variant if specified
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: variantId ? {
          where: { id: variantId }
        } : false
      }
    });
    
    if (!product) {
      return createApiResponse(null, 'Product not found', 404);
    }
    
    // Check if product is active
    if (!product.isActive) {
      return createApiResponse(null, 'Product is no longer available', 400);
    }
    
    // Determine stock quantity
    const stockQuantity = variantId && product.variants.length > 0
      ? product.variants[0].stockQuantity
      : product.stockQuantity;
    
    // Determine stock status
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    if (stockQuantity === 0) {
      stockStatus = 'out_of_stock';
    } else if (stockQuantity <= 10) {
      stockStatus = 'low_stock';
    } else {
      stockStatus = 'in_stock';
    }
    
    // Check if requested quantity is available
    if (quantity > stockQuantity) {
      return createApiResponse({
        isValid: false,
        stockStatus,
        maxQuantity: stockQuantity,
        message: `Only ${stockQuantity} items available`
      });
    }
    
    // Check max quantity per customer (business rule)
    const maxPerCustomer = 99;
    const maxQuantity = Math.min(stockQuantity, maxPerCustomer);
    
    if (quantity > maxQuantity) {
      return createApiResponse({
        isValid: false,
        stockStatus,
        maxQuantity,
        message: `Maximum ${maxQuantity} items allowed per customer`
      });
    }
    
    return createApiResponse({
      isValid: true,
      stockStatus,
      maxQuantity,
      availableQuantity: stockQuantity
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(null, 'Invalid validation data', 400);
    }
    
    console.error('Item validation error:', error);
    return createApiResponse(null, 'Failed to validate item', 500);
  }
}