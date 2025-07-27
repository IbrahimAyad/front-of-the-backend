import { CacheService } from './cache.service';
import { OrderService } from './order.service';
import { PaymentStatus } from '../types/order.types';

export interface PaymentServiceDependencies {
  prisma: {
    payment: {
      create: (args: any) => Promise<Payment>;
      findUnique: (args: any) => Promise<Payment | null>;
      findMany: (args?: any) => Promise<Payment[]>;
      update: (args: any) => Promise<Payment>;
    };
    paymentMethod: {
      create: (args: any) => Promise<PaymentMethod>;
      findMany: (args?: any) => Promise<PaymentMethod[]>;
      update: (args: any) => Promise<PaymentMethod>;
      delete: (args: any) => Promise<PaymentMethod>;
    };
    $transaction: (fn: any) => Promise<any>;
  };
  orderService: OrderService;
  cache?: CacheService;
  stripeApiKey?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethodType;
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerResponse?: any;
  failureReason?: string;
  refundedAmount?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  customerId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  isDefault: boolean;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  paypalEmail?: string;
  bankAccountLast4?: string;
  providerPaymentMethodId?: string;
  metadata?: any;
  createdAt: Date;
}

export enum PaymentMethodType {
  CARD = 'CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
}

export interface PaymentIntent {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: PaymentStatus;
  clientSecret?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason: string;
}

export interface PaymentReport {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  paymentsByMethod: Record<PaymentMethodType, number>;
  paymentsByProvider: Record<PaymentProvider, number>;
}

export class PaymentService {
  private readonly prisma: PaymentServiceDependencies['prisma'];
  private readonly orderService: OrderService;
  private readonly cache?: CacheService;
  private readonly stripeApiKey?: string;
  private readonly paypalConfig?: { clientId: string; clientSecret: string };

  constructor(dependencies: PaymentServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.orderService = dependencies.orderService;
    this.cache = dependencies.cache;
    this.stripeApiKey = dependencies.stripeApiKey;
    
    if (dependencies.paypalClientId && dependencies.paypalClientSecret) {
      this.paypalConfig = {
        clientId: dependencies.paypalClientId,
        clientSecret: dependencies.paypalClientSecret,
      };
    }
  }

  async createPaymentIntent(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      const order = await this.orderService.getOrder(intent.orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        return { success: false, error: 'Order already paid' };
      }

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          orderId: intent.orderId,
          amount: intent.amount,
          currency: intent.currency,
          status: PaymentStatus.PENDING,
          method: PaymentMethodType.CARD, // Default, will be updated
          provider: PaymentProvider.STRIPE, // Default
          metadata: intent.metadata,
        },
      });

      // In a real implementation, this would create a Stripe payment intent
      const clientSecret = `pi_${payment.id}_secret_${Date.now()}`;

      return {
        success: true,
        paymentId: payment.id,
        status: PaymentStatus.PENDING,
        clientSecret,
        requiresAction: false,
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async processPayment(
    paymentId: string,
    paymentMethodId: string,
    saveMethod: boolean = false
  ): Promise<PaymentResult> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { success: false, error: 'Payment already processed' };
      }

      // Get payment method details
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      // Process payment based on provider
      let result: PaymentResult;
      switch (paymentMethod.provider) {
        case PaymentProvider.STRIPE:
          result = await this.processStripePayment(payment, paymentMethod);
          break;
        case PaymentProvider.PAYPAL:
          result = await this.processPayPalPayment(payment, paymentMethod);
          break;
        default:
          result = { success: false, error: 'Unsupported payment provider' };
      }

      if (result.success) {
        // Update payment record
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.PAID,
            method: paymentMethod.type,
            provider: paymentMethod.provider,
            providerTransactionId: result.paymentId,
          },
        });

        // Update order payment status
        await this.orderService.updatePaymentStatus(payment.orderId, PaymentStatus.PAID, {
          paymentId,
          transactionId: result.paymentId,
          method: paymentMethod.type,
        });

        if (this.cache) {
          await this.cache.invalidate(`payment:${paymentId}`);
          await this.cache.invalidate(`order:${payment.orderId}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async confirmPayment(paymentId: string, confirmationData?: any): Promise<PaymentResult> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      // In a real implementation, this would confirm with the payment provider
      // For now, we'll simulate success
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          providerResponse: confirmationData,
        },
      });

      await this.orderService.updatePaymentStatus(payment.orderId, PaymentStatus.PAID, {
        paymentId,
        confirmed: true,
      });

      return {
        success: true,
        paymentId,
        status: PaymentStatus.PAID,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: request.paymentId },
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== PaymentStatus.PAID) {
        return { success: false, error: 'Payment not eligible for refund' };
      }

      const refundAmount = request.amount || payment.amount;
      const totalRefunded = (payment.refundedAmount || 0) + refundAmount;

      if (totalRefunded > payment.amount) {
        return { success: false, error: 'Refund amount exceeds payment amount' };
      }

      // Process refund with provider
      // In real implementation, this would call Stripe/PayPal API
      const refundId = `refund_${Date.now()}`;

      await this.prisma.payment.update({
        where: { id: request.paymentId },
        data: {
          status: totalRefunded === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
          refundedAmount: totalRefunded,
          metadata: {
            ...payment.metadata,
            refunds: [
              ...(payment.metadata?.refunds || []),
              {
                id: refundId,
                amount: refundAmount,
                reason: request.reason,
                date: new Date(),
              },
            ],
          },
        },
      });

      if (totalRefunded === payment.amount) {
        await this.orderService.updatePaymentStatus(payment.orderId, PaymentStatus.REFUNDED);
      }

      return {
        success: true,
        paymentId: refundId,
        status: PaymentStatus.REFUNDED,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  async addPaymentMethod(
    customerId: string,
    method: Omit<PaymentMethod, 'id' | 'createdAt'>
  ): Promise<PaymentMethod> {
    // If setting as default, unset other defaults
    if (method.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { customerId, type: method.type },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        ...method,
        customerId,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}:payment-methods`);
    }

    return paymentMethod;
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const cacheKey = `customer:${customerId}:payment-methods`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const methods = await this.prisma.paymentMethod.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(methods), 300);
    }

    return methods;
  }

  async deletePaymentMethod(methodId: string, customerId: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id: methodId },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}:payment-methods`);
    }
  }

  async getPaymentHistory(
    customerId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<Payment[]> {
    const where: any = {
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    if (customerId) {
      // Get customer orders first
      const orders = await this.orderService.getCustomerOrders(customerId);
      where.orderId = { in: orders.orders.map(o => o.id) };
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPaymentReport(startDate?: Date, endDate?: Date): Promise<PaymentReport> {
    const payments = await this.prisma.payment.findMany({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
    });

    const report: PaymentReport = {
      totalPayments: payments.length,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedAmount: 0,
      paymentsByMethod: {} as Record<PaymentMethodType, number>,
      paymentsByProvider: {} as Record<PaymentProvider, number>,
    };

    payments.forEach(payment => {
      report.totalAmount += payment.amount;
      
      if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.REFUNDED) {
        report.successfulPayments++;
      } else if (payment.status === PaymentStatus.FAILED) {
        report.failedPayments++;
      }
      
      report.refundedAmount += payment.refundedAmount || 0;
      
      report.paymentsByMethod[payment.method] = (report.paymentsByMethod[payment.method] || 0) + 1;
      report.paymentsByProvider[payment.provider] = (report.paymentsByProvider[payment.provider] || 0) + 1;
    });

    return report;
  }

  private async processStripePayment(payment: Payment, method: PaymentMethod): Promise<PaymentResult> {
    // Simulate Stripe payment processing
    // In real implementation, this would use Stripe SDK
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        paymentId: `pi_${Date.now()}`,
        status: PaymentStatus.PAID,
      };
    } else {
      return {
        success: false,
        error: 'Card declined',
      };
    }
  }

  private async processPayPalPayment(payment: Payment, method: PaymentMethod): Promise<PaymentResult> {
    // Simulate PayPal payment processing
    // In real implementation, this would use PayPal SDK
    return {
      success: true,
      paymentId: `PAYPAL-${Date.now()}`,
      status: PaymentStatus.PAID,
      requiresAction: true,
      actionUrl: `https://paypal.com/checkout/${payment.id}`,
    };
  }

  async validatePaymentAmount(orderId: string, amount: number): Promise<boolean> {
    const order = await this.orderService.getOrder(orderId);
    if (!order) return false;
    
    // Allow for small differences due to currency conversion
    const tolerance = 0.01;
    return Math.abs(order.total - amount) <= tolerance;
  }
}

export function createPaymentService(dependencies: PaymentServiceDependencies): PaymentService {
  return new PaymentService(dependencies);
}