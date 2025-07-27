import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createApiResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return createApiResponse(null, 'Missing Stripe signature', 400);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return createApiResponse(null, 'Invalid signature', 400);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'invoice.payment_succeeded':
        // Handle subscription payments if you add subscriptions later
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellations
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createApiResponse({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return createApiResponse(null, 'Webhook processing failed', 500);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (order) {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // TODO: Send confirmation email
      // TODO: Update inventory
      // TODO: Create fulfillment record
      
      console.log(`Order ${order.id} confirmed after payment success`);
    } else {
      console.warn(`No order found for payment intent ${paymentIntent.id}`);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (order) {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAYMENT_FAILED',
          paymentStatus: 'FAILED',
        },
      });

      // TODO: Send payment failed email
      // TODO: Release reserved inventory
      
      console.log(`Order ${order.id} marked as payment failed`);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (order) {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'CANCELLED',
        },
      });

      // TODO: Release reserved inventory
      
      console.log(`Order ${order.id} cancelled`);
    }

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log('Payment method attached:', paymentMethod.id);

    // This is handled in the confirm payment endpoint, but we can log here
    console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);

  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}