import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string(),
  setAsDefault: z.boolean().default(false),
});

// GET: Retrieve saved payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createApiResponse(null, 'Unauthorized', 401);
    }

    const savedMethods = await prisma.savedPaymentMethod.findMany({
      where: { 
        userId: session.user.id,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const cards = savedMethods.map(method => ({
      id: method.id,
      stripePaymentMethodId: method.stripePaymentMethodId,
      last4: method.last4,
      brand: method.brand,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      isDefault: method.isDefault,
      createdAt: method.createdAt,
    }));

    return createApiResponse({
      cards,
      count: cards.length,
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return createApiResponse(
      null,
      'Failed to retrieve payment methods',
      500
    );
  }
}

// POST: Save a new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createApiResponse(null, 'Unauthorized', 401);
    }

    const body = await request.json();
    const { paymentMethodId, setAsDefault } = savePaymentMethodSchema.parse(body);

    // Retrieve payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod.card) {
      return createApiResponse(
        null,
        'Only card payment methods are supported',
        400
      );
    }

    // Get customer ID
    const customers = await stripe.customers.list({
      email: session.user.email!,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Check if this card already exists
    const existingCard = await prisma.savedPaymentMethod.findFirst({
      where: {
        userId: session.user.id,
        stripePaymentMethodId: paymentMethodId,
      },
    });

    if (existingCard) {
      return createApiResponse(
        null,
        'Payment method already saved',
        409
      );
    }

    // If setting as default, update existing default
    if (setAsDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Save payment method
    const savedMethod = await prisma.savedPaymentMethod.create({
      data: {
        userId: session.user.id,
        stripePaymentMethodId: paymentMethodId,
        type: 'card',
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month.toString(),
        expiryYear: paymentMethod.card.exp_year.toString(),
        isDefault: setAsDefault,
      },
    });

    return createApiResponse({
      id: savedMethod.id,
      message: 'Payment method saved successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        null,
        'Invalid payment method data',
        400
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return createApiResponse(
        null,
        error.message,
        400
      );
    }

    console.error('Save payment method error:', error);
    return createApiResponse(
      null,
      'Failed to save payment method',
      500
    );
  }
}

// DELETE: Remove a saved payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createApiResponse(null, 'Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return createApiResponse(null, 'Payment method ID required', 400);
    }

    const savedMethod = await prisma.savedPaymentMethod.findFirst({
      where: {
        id: methodId,
        userId: session.user.id,
      },
    });

    if (!savedMethod) {
      return createApiResponse(null, 'Payment method not found', 404);
    }

    // Detach from Stripe customer
    try {
      await stripe.paymentMethods.detach(savedMethod.stripePaymentMethodId);
    } catch (stripeError) {
      console.error('Failed to detach from Stripe:', stripeError);
      // Continue with database deletion even if Stripe fails
    }

    // Mark as inactive in database
    await prisma.savedPaymentMethod.update({
      where: { id: methodId },
      data: { isActive: false },
    });

    return createApiResponse({
      message: 'Payment method removed successfully',
    });

  } catch (error) {
    console.error('Delete payment method error:', error);
    return createApiResponse(
      null,
      'Failed to remove payment method',
      500
    );
  }
}