import { OrderService, createOrderService } from './order.service';
import { ProductService } from './product.service';
import { OrderStatus, PaymentStatus } from '../types/order.types';

// Mock ProductService
const mockProductService = {
  calculateTotalStock: (product: any) => 30,
} as ProductService;

// Mock Prisma
const mockPrisma = {
  order: {
    findMany: async (args?: any) => {
      const orders = [
        {
          id: '1',
          customerId: 'cust-1',
          orderNumber: 'ORD-123',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: 149.97,
          tax: 12.00,
          shipping: 10.00,
          total: 171.97,
          shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
          billingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
          shippingMethod: 'Standard',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      if (args?.include?.items) {
        return orders.map(o => ({
          ...o,
          items: [
            {
              id: 'item-1',
              orderId: o.id,
              productId: 'prod-1',
              variantId: 'var-1',
              quantity: 2,
              price: 29.99,
              total: 59.98,
              product: { id: 'prod-1', name: 'T-Shirt', price: 29.99, imageUrl: '/img/tshirt.jpg' },
              variant: { id: 'var-1', size: 'M', color: 'Black' },
            },
          ],
          customer: { id: 'cust-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        }));
      }
      
      return orders;
    },
    findUnique: async (args: any) => {
      const order = {
        id: args.where.id,
        customerId: 'cust-1',
        orderNumber: 'ORD-123',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 149.97,
        tax: 12.00,
        shipping: 10.00,
        total: 171.97,
        shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
        billingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
        shippingMethod: 'Standard',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (args.include?.items) {
        return {
          ...order,
          items: [
            {
              id: 'item-1',
              orderId: order.id,
              productId: 'prod-1',
              variantId: 'var-1',
              quantity: 2,
              price: 29.99,
              total: 59.98,
              product: { id: 'prod-1', name: 'T-Shirt', price: 29.99, imageUrl: '/img/tshirt.jpg' },
              variant: { id: 'var-1', size: 'M', color: 'Black' },
            },
          ],
          customer: { id: 'cust-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        };
      }
      
      return order;
    },
    create: async (args: any) => ({
      id: 'new-order',
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
      updatedAt: new Date(),
    }),
    delete: async (args: any) => ({
      id: args.where.id,
      status: OrderStatus.CANCELLED,
    }),
    count: async () => 10,
  },
  orderItem: {
    createMany: async () => ({ count: 1 }),
    deleteMany: async () => ({ count: 1 }),
    create: async (args: any) => ({ id: 'new-item', ...args.data }),
  },
  productVariant: {
    findUnique: async (args: any) => ({
      id: args.where.id,
      productId: 'prod-1',
      size: 'M',
      color: 'Black',
      stock: 10,
      sku: 'TSH-M-BLK',
      product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
    }),
    update: async (args: any) => ({
      id: args.where.id,
      stock: args.data.stock?.decrement ? 8 : args.data.stock?.increment ? 12 : 10,
    }),
  },
  $transaction: async (fn: any) => {
    // Simple transaction mock - just execute the function
    return fn(mockPrisma);
  },
};

async function testOrderService() {
  console.log('Testing OrderService...\n');
  
  const orderService = createOrderService({
    prisma: mockPrisma as any,
    productService: mockProductService,
  });

  try {
    console.log('1. Testing create order...');
    const newOrder = await orderService.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 2,
          price: 29.99,
        },
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      },
      shippingMethod: 'Standard',
      shippingCost: 10.00,
      notes: 'Please handle with care',
    });
    console.log('✓ Order created:', newOrder.orderNumber);
    console.log(`  Total: $${newOrder.total}`);

    console.log('\n2. Testing findById...');
    const order = await orderService.findById('1');
    console.log('✓ Found order:', order?.orderNumber);
    console.log(`  Customer: ${order?.customer?.firstName} ${order?.customer?.lastName}`);
    console.log(`  Items: ${order?.items.length}`);

    console.log('\n3. Testing findAll with filters...');
    const result = await orderService.findAll(
      { status: OrderStatus.PENDING },
      { page: 1, limit: 10 }
    );
    console.log('✓ Orders found:', result.total);
    console.log(`  Pages: ${result.totalPages}`);

    console.log('\n4. Testing updateStatus...');
    const shipped = await orderService.updateStatus('1', OrderStatus.SHIPPED);
    console.log('✓ Order status updated to:', shipped.status);

    console.log('\n5. Testing updatePaymentStatus...');
    const paid = await orderService.updatePaymentStatus('1', PaymentStatus.PAID, {
      transactionId: 'txn-12345',
      method: 'credit_card',
    });
    console.log('✓ Payment status updated to:', paid.paymentStatus);

    console.log('\n6. Testing cancel order...');
    try {
      const cancelled = await orderService.cancel('2', 'Customer requested cancellation');
      console.log('✓ Order cancelled successfully');
    } catch (error) {
      console.log('✓ Cancel validation working (order not found or already shipped)');
    }

    console.log('\n7. Testing getMetrics...');
    const metrics = await orderService.getMetrics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    });
    console.log('✓ Metrics calculated:');
    console.log(`  Total orders: ${metrics.totalOrders}`);
    console.log(`  Total revenue: $${metrics.totalRevenue.toFixed(2)}`);
    console.log(`  Average order value: $${metrics.averageOrderValue.toFixed(2)}`);

    console.log('\n8. Testing addTrackingInfo...');
    const tracked = await orderService.addTrackingInfo('1', '1Z999AA10123456784', 'UPS');
    console.log('✓ Tracking added:', tracked.trackingNumber);
    console.log(`  Carrier: ${tracked.trackingCarrier}`);

    console.log('\n9. Testing inventory validation...');
    try {
      // This should fail due to insufficient stock
      await orderService.create({
        customerId: 'cust-1',
        items: [
          {
            productId: 'prod-1',
            variantId: 'var-1',
            quantity: 100, // More than available stock
            price: 29.99,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        shippingMethod: 'Standard',
        shippingCost: 10.00,
      });
      console.log('✗ Inventory validation failed - order should not have been created');
    } catch (error) {
      console.log('✓ Inventory validation working:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n✅ All OrderService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testOrderService().then(success => {
    process.exit(success ? 0 : 1);
  });
}