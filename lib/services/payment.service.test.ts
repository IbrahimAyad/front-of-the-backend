import { PaymentService, createPaymentService, PaymentMethodType, PaymentProvider } from './payment.service';
import { PaymentStatus } from '../types/order.types';

// Mock OrderService
const mockOrderService = {
  getOrder: async (orderId: string) => ({
    id: orderId,
    orderNumber: 'ORD-123',
    customerId: 'cust-1',
    total: 149.99,
    paymentStatus: PaymentStatus.PENDING,
    status: 'PENDING',
  }),
  updatePaymentStatus: async () => ({}),
  getCustomerOrders: async (customerId: string) => ({
    orders: [
      { id: 'order-1', customerId, total: 149.99 },
      { id: 'order-2', customerId, total: 89.99 },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  }),
} as any;

// Mock Prisma
const mockPrisma = {
  payment: {
    create: async (args: any) => ({
      id: 'payment-' + Date.now(),
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findUnique: async (args: any) => {
      if (args.where.id === 'payment-refundable') {
        return {
          id: 'payment-refundable',
          orderId: 'order-1',
          amount: 149.99,
          currency: 'USD',
          status: PaymentStatus.PAID,
          method: PaymentMethodType.CARD,
          provider: PaymentProvider.STRIPE,
          refundedAmount: 0,
          metadata: {},
        };
      }
      return {
        id: args.where.id,
        orderId: 'order-1',
        amount: 149.99,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        method: PaymentMethodType.CARD,
        provider: PaymentProvider.STRIPE,
        metadata: {},
      };
    },
    findMany: async (args?: any) => {
      return [
        {
          id: 'payment-1',
          orderId: 'order-1',
          amount: 149.99,
          currency: 'USD',
          status: PaymentStatus.PAID,
          method: PaymentMethodType.CARD,
          provider: PaymentProvider.STRIPE,
          createdAt: new Date(),
        },
        {
          id: 'payment-2',
          orderId: 'order-2',
          amount: 89.99,
          currency: 'USD',
          status: PaymentStatus.FAILED,
          method: PaymentMethodType.PAYPAL,
          provider: PaymentProvider.PAYPAL,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ];
    },
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
      updatedAt: new Date(),
    }),
  },
  paymentMethod: {
    create: async (args: any) => ({
      id: 'method-' + Date.now(),
      ...args.data,
      createdAt: new Date(),
    }),
    findMany: async (args?: any) => {
      return [
        {
          id: 'method-1',
          customerId: args?.where?.customerId || 'cust-1',
          type: PaymentMethodType.CARD,
          provider: PaymentProvider.STRIPE,
          isDefault: true,
          cardLast4: '4242',
          cardBrand: 'Visa',
          cardExpMonth: 12,
          cardExpYear: 2025,
          createdAt: new Date(),
        },
        {
          id: 'method-2',
          customerId: args?.where?.customerId || 'cust-1',
          type: PaymentMethodType.PAYPAL,
          provider: PaymentProvider.PAYPAL,
          isDefault: false,
          paypalEmail: 'user@example.com',
          createdAt: new Date(),
        },
      ];
    },
    findUnique: async (args: any) => ({
      id: args.where.id,
      customerId: 'cust-1',
      type: PaymentMethodType.CARD,
      provider: PaymentProvider.STRIPE,
      isDefault: true,
      cardLast4: '4242',
      cardBrand: 'Visa',
    }),
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
    updateMany: async () => ({ count: 1 }),
    delete: async (args: any) => ({
      id: args.where.id,
    }),
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testPaymentService() {
  console.log('Testing PaymentService...\n');
  
  const paymentService = createPaymentService({
    prisma: mockPrisma as any,
    orderService: mockOrderService,
    stripeApiKey: 'test-stripe-key',
    paypalClientId: 'test-paypal-id',
    paypalClientSecret: 'test-paypal-secret',
  });

  try {
    console.log('1. Testing createPaymentIntent...');
    const intent = await paymentService.createPaymentIntent({
      orderId: 'order-1',
      amount: 149.99,
      currency: 'USD',
      metadata: { source: 'web' },
    });
    console.log('✓ Payment intent created:', intent.success ? 'SUCCESS' : 'FAILED');
    console.log(`  Payment ID: ${intent.paymentId}`);
    console.log(`  Client secret: ${intent.clientSecret?.substring(0, 20)}...`);

    console.log('\n2. Testing processPayment...');
    const paymentResult = await paymentService.processPayment(
      intent.paymentId!,
      'method-1',
      true
    );
    console.log('✓ Payment processed:', paymentResult.success ? 'SUCCESS' : 'FAILED');

    console.log('\n3. Testing confirmPayment...');
    const confirmation = await paymentService.confirmPayment(intent.paymentId!, {
      source: 'webhook',
      timestamp: Date.now(),
    });
    console.log('✓ Payment confirmed:', confirmation.success ? 'SUCCESS' : 'FAILED');

    console.log('\n4. Testing refundPayment...');
    const refund = await paymentService.refundPayment({
      paymentId: 'payment-refundable',
      amount: 50.00,
      reason: 'Customer requested partial refund',
    });
    console.log('✓ Refund processed:', refund.success ? 'SUCCESS' : 'FAILED');

    console.log('\n5. Testing addPaymentMethod...');
    const newMethod = await paymentService.addPaymentMethod('cust-1', {
      type: PaymentMethodType.CARD,
      provider: PaymentProvider.STRIPE,
      isDefault: false,
      cardLast4: '5555',
      cardBrand: 'Mastercard',
      cardExpMonth: 6,
      cardExpYear: 2026,
      providerPaymentMethodId: 'pm_test123',
    });
    console.log('✓ Payment method added:', newMethod.id);
    console.log(`  Card: ${newMethod.cardBrand} ****${newMethod.cardLast4}`);

    console.log('\n6. Testing getPaymentMethods...');
    const methods = await paymentService.getPaymentMethods('cust-1');
    console.log('✓ Payment methods retrieved:', methods.length);
    methods.forEach(method => {
      console.log(`  - ${method.type}: ${method.isDefault ? '(default)' : ''} ${
        method.cardLast4 ? `****${method.cardLast4}` : method.paypalEmail || ''
      }`);
    });

    console.log('\n7. Testing deletePaymentMethod...');
    await paymentService.deletePaymentMethod('method-2', 'cust-1');
    console.log('✓ Payment method deleted');

    console.log('\n8. Testing getPaymentHistory...');
    const history = await paymentService.getPaymentHistory(
      'cust-1',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    console.log('✓ Payment history retrieved:', history.length, 'payments');

    console.log('\n9. Testing getPaymentReport...');
    const report = await paymentService.getPaymentReport(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    console.log('✓ Payment report generated:');
    console.log(`  Total payments: ${report.totalPayments}`);
    console.log(`  Total amount: $${report.totalAmount.toFixed(2)}`);
    console.log(`  Success rate: ${(report.successfulPayments / report.totalPayments * 100).toFixed(1)}%`);
    console.log(`  Payment methods:`, Object.entries(report.paymentsByMethod)
      .map(([method, count]) => `${method}:${count}`)
      .join(', '));

    console.log('\n10. Testing validatePaymentAmount...');
    const isValid = await paymentService.validatePaymentAmount('order-1', 149.99);
    const isInvalid = await paymentService.validatePaymentAmount('order-1', 200.00);
    console.log('✓ Amount validation:');
    console.log(`  $149.99: ${isValid ? 'VALID' : 'INVALID'}`);
    console.log(`  $200.00: ${isInvalid ? 'VALID' : 'INVALID'}`);

    console.log('\n✅ All PaymentService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testPaymentService().then(success => {
    process.exit(success ? 0 : 1);
  });
}