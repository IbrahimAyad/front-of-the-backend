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

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { paymentIntentId, orderId } = confirmPaymentSchema.parse(body);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return createApiResponse(
        null,
        `Payment not completed. Status: ${paymentIntent.status}`,
        400
      );
    }

    // Update order with payment information
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return createApiResponse(null, 'Order not found', 404);
      }

      // Update order status and payment info
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentIntentId: paymentIntent.id,
          paymentMethod: paymentIntent.payment_method_types[0],
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // Save payment method for future use if requested
      if (session?.user?.id && paymentIntent.setup_future_usage === 'on_session') {
        try {
          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method as string
          );

          if (paymentMethod.card) {
            // Check if this card is already saved
            const existingCard = await prisma.savedPaymentMethod.findFirst({
              where: {
                userId: session.user.id,
                stripePaymentMethodId: paymentMethod.id,
              },
            });

            if (!existingCard) {
              await prisma.savedPaymentMethod.create({
                data: {
                  userId: session.user.id,
                  stripePaymentMethodId: paymentMethod.id,
                  type: 'card',
                  last4: paymentMethod.card.last4,
                  brand: paymentMethod.card.brand,
                  expiryMonth: paymentMethod.card.exp_month.toString(),
                  expiryYear: paymentMethod.card.exp_year.toString(),
                  isDefault: false, // User can set default later
                },
              });
            }
          }
        } catch (error) {
          console.error('Failed to save payment method:', error);
          // Don't fail the request if saving payment method fails
        }
      }

      // Clear user's cart
      if (session?.user?.id) {
        const cart = await prisma.cart.findUnique({
          where: { userId: session.user.id },
        });

        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      }

      // TODO: Send order confirmation email
      // TODO: Update inventory
      // TODO: Create shipment record

      return createApiResponse({
        paymentStatus: 'succeeded',
        orderId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    }

    // If no orderId provided, just confirm the payment status
    return createApiResponse({
      paymentStatus: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        null,
        'Invalid payment confirmation data',
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

    console.error('Confirm payment error:', error);
    return createApiResponse(
      null,
      'Failed to confirm payment',
      500
    );
  }
}