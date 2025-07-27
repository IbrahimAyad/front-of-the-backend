import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const promoCodeSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().min(0),
});

interface PromoCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  customerLimit?: number;
  isActive: boolean;
}

// Mock promo codes for demo
const mockPromoCodes: PromoCode[] = [
  {
    id: '1',
    code: 'WELCOME10',
    description: '10% off your first order',
    type: 'percentage',
    value: 10,
    minimumAmount: 2500, // $25
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageLimit: 1000,
    usageCount: 450,
    customerLimit: 1,
    isActive: true,
  },
  {
    id: '2',
    code: 'SAVE20',
    description: '$20 off orders over $100',
    type: 'fixed',
    value: 2000, // $20
    minimumAmount: 10000, // $100
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageCount: 200,
    isActive: true,
  },
  {
    id: '3',
    code: 'FREESHIP',
    description: 'Free standard shipping',
    type: 'free_shipping',
    value: 999, // Standard shipping cost
    minimumAmount: 5000, // $50
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    usageCount: 300,
    isActive: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { code, subtotal } = promoCodeSchema.parse(body);

    // Find promo code (in real app, query from database)
    const promoCode = mockPromoCodes.find(
      p => p.code.toUpperCase() === code.toUpperCase() && p.isActive
    );

    if (!promoCode) {
      return createApiResponse(
        null,
        'Invalid promo code',
        400
      );
    }

    // Validate promo code
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return createApiResponse(
        null,
        'Promo code has expired',
        400
      );
    }

    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return createApiResponse(
        null,
        'Promo code usage limit reached',
        400
      );
    }

    if (promoCode.minimumAmount && subtotal < promoCode.minimumAmount) {
      return createApiResponse(
        null,
        `Minimum order amount of $${(promoCode.minimumAmount / 100).toFixed(2)} required`,
        400
      );
    }

    // Check customer usage limit
    if (session?.user?.id && promoCode.customerLimit) {
      // In real app, check customer's usage count from database
      const customerUsageCount = 0; // Mock value
      
      if (customerUsageCount >= promoCode.customerLimit) {
        return createApiResponse(
          null,
          'You have already used this promo code',
          400
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let appliedToShipping = false;

    switch (promoCode.type) {
      case 'percentage':
        discountAmount = Math.floor(subtotal * (promoCode.value / 100));
        if (promoCode.maximumDiscount) {
          discountAmount = Math.min(discountAmount, promoCode.maximumDiscount);
        }
        break;
        
      case 'fixed':
        discountAmount = promoCode.value;
        break;
        
      case 'free_shipping':
        discountAmount = promoCode.value;
        appliedToShipping = true;
        break;
    }

    // Don't let discount exceed subtotal
    if (!appliedToShipping) {
      discountAmount = Math.min(discountAmount, subtotal);
    }

    return createApiResponse({
      valid: true,
      code: promoCode.code,
      description: promoCode.description,
      type: promoCode.type,
      discountAmount,
      appliedToShipping,
      metadata: {
        promoCodeId: promoCode.id,
        percentageValue: promoCode.type === 'percentage' ? promoCode.value : null,
        fixedValue: promoCode.type === 'fixed' ? promoCode.value : null,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        null,
        'Invalid promo code data',
        400
      );
    }

    console.error('Apply promo error:', error);
    return createApiResponse(
      null,
      'Failed to apply promo code',
      500
    );
  }
}