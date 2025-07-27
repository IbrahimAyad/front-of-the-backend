import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createApiResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const createIntentSchema = z.object({
  amount: z.number().min(50), // Minimum $0.50
  currency: z.string().default('usd'),
  shipping: z.object({
    name: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postal_code: z.string(),
      country: z.string(),
    }),
  }),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { amount, currency, shipping, metadata } = createIntentSchema.parse(body);

    // Create customer in Stripe if user is logged in
    let customerId: string | undefined;
    
    if (session?.user?.id) {
      // Check if customer already exists
      const customers = await stripe.customers.list({
        email: session.user.email!,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: session.user.email!,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id,
          },
        });
        customerId = customer.id;
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      shipping,
      metadata: {
        userId: session?.user?.id || 'guest',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      setup_future_usage: session?.user ? 'on_session' : undefined,
    });

    return createApiResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        null,
        'Invalid payment data',
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

    console.error('Create payment intent error:', error);
    return createApiResponse(
      null,
      'Failed to create payment intent',
      500
    );
  }
}