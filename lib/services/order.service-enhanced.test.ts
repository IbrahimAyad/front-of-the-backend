import { OrderService, createOrderService } from './order.service';
import { OrderStatus, PaymentStatus } from '../types/order.types';

// Mock services and Prisma
const mockProductService = {
  calculateTotalStock: (product: any) => 30,
} as any;

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
        {
          id: '2',
          customerId: 'cust-2',
          orderNumber: 'ORD-456',
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          subtotal: 89.99,
          tax: 7.20,
          shipping: 5.00,
          total: 102.19,
          shippingAddress: { street: '456 Oak St', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' },
          billingAddress: { street: '456 Oak St', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' },
          shippingMethod: 'Express',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      
      let filtered = orders;
      if (args?.where?.customerId) {
        filtered = filtered.filter(o => o.customerId === args.where.customerId);
      }
      if (args?.where?.status) {
        filtered = filtered.filter(o => o.status === args.where.status);
      }
      
      if (args?.include?.items) {
        return filtered.map(o => ({
          ...o,
          items: [
            {
              id: `item-${o.id}-1`,
              orderId: o.id,
              productId: 'prod-1',
              variantId: 'var-1',
              quantity: 2,
              price: 29.99,
              total: 59.98,
              product: { id: 'prod-1', name: 'T-Shirt', price: 29.99, imageUrl: '/img/tshirt.jpg', category: 'Shirts' },
              variant: { id: 'var-1', size: 'M', color: 'Black' },
            },
          ],
          customer: { id: o.customerId, email: 'customer@example.com', firstName: 'John', lastName: 'Doe' },
        }));
      }
      
      return filtered;
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
              product: { id: 'prod-1', name: 'T-Shirt', price: 29.99, imageUrl: '/img/tshirt.jpg', category: 'Shirts' },
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
    count: async (args?: any) => {
      if (args?.where?.customerId === 'cust-1') return 1;
      if (args?.where?.status) return 1;
      return 2;
    },
  },
  orderItem: {
    createMany: async () => ({ count: 1 }),
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
      product: { id: 'prod-1', name: 'T-Shirt', price: 29.99, category: 'Shirts' },
    }),
    update: async (args: any) => ({
      id: args.where.id,
      stock: args.data.stock?.decrement ? 8 : args.data.stock?.increment ? 12 : 10,
    }),
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testEnhancedOrderService() {
  console.log('Testing Enhanced OrderService...\n');
  
  const orderService = createOrderService({
    prisma: mockPrisma as any,
    productService: mockProductService,
  });

  try {
    console.log('1. Testing createOrder (alias for create)...');
    const newOrder = await orderService.createOrder({
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
    });
    console.log('✓ Order created via createOrder:', newOrder.orderNumber);

    console.log('\n2. Testing getOrder (alias for findById)...');
    const order = await orderService.getOrder('1');
    console.log('✓ Order retrieved via getOrder:', order?.orderNumber);

    console.log('\n3. Testing getOrders (alias for findAll)...');
    const orders = await orderService.getOrders({}, { page: 1, limit: 10 });
    console.log('✓ Orders retrieved via getOrders:', orders.total);

    console.log('\n4. Testing getCustomerOrders...');
    const customerOrders = await orderService.getCustomerOrders('cust-1');
    console.log('✓ Customer orders found:', customerOrders.total);

    console.log('\n5. Testing getOrdersByStatus...');
    const pendingOrders = await orderService.getOrdersByStatus(OrderStatus.PENDING);
    console.log('✓ Pending orders found:', pendingOrders.total);

    console.log('\n6. Testing updateOrderStatus (alias)...');
    const updatedOrder = await orderService.updateOrderStatus('1', OrderStatus.PROCESSING);
    console.log('✓ Order status updated via updateOrderStatus');

    console.log('\n7. Testing addOrderItems...');
    const withNewItems = await orderService.addOrderItems('1', [
      {
        productId: 'prod-2',
        variantId: 'var-2',
        quantity: 1,
        price: 49.99,
      },
    ]);
    console.log('✓ Items added to order');

    console.log('\n8. Testing calculateOrderTotals...');
    const totals = await orderService.calculateOrderTotals('1');
    console.log('✓ Order totals calculated:');
    console.log(`  Subtotal: $${totals.subtotal.toFixed(2)}`);
    console.log(`  Tax: $${totals.tax.toFixed(2)}`);
    console.log(`  Shipping: $${totals.shipping.toFixed(2)}`);
    console.log(`  Total: $${totals.total.toFixed(2)}`);

    console.log('\n9. Testing validateOrderStock...');
    const validation = await orderService.validateOrderStock([
      { productId: 'prod-1', variantId: 'var-1', quantity: 5, price: 29.99 },
      { productId: 'prod-1', variantId: 'var-1', quantity: 100, price: 29.99 },
    ]);
    console.log('✓ Stock validation:', validation.valid ? 'PASSED' : 'FAILED');
    if (validation.errors.length > 0) {
      console.log('  Errors:', validation.errors.join('; '));
    }

    console.log('\n10. Testing getOrderStats...');
    const stats = await orderService.getOrderStats({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    console.log('✓ Order statistics:');
    console.log(`  Total orders: ${stats.totalOrders}`);
    console.log(`  Total revenue: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`  Average order value: $${stats.averageOrderValue.toFixed(2)}`);
    console.log(`  Top products: ${stats.topProducts.length}`);
    if (stats.topProducts.length > 0) {
      console.log(`    - ${stats.topProducts[0].name}: $${stats.topProducts[0].revenue.toFixed(2)}`);
    }

    console.log('\n11. Testing getRevenueByPeriod...');
    const dailyRevenue = await orderService.getRevenueByPeriod('day', {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    console.log('✓ Daily revenue data:');
    dailyRevenue.forEach(day => {
      console.log(`  ${day.period}: $${day.revenue.toFixed(2)} (${day.orderCount} orders)`);
    });

    console.log('\n12. Testing getRevenueByPeriod (monthly)...');
    const monthlyRevenue = await orderService.getRevenueByPeriod('month');
    console.log('✓ Monthly revenue:', monthlyRevenue.length, 'months');

    console.log('\n✅ All Enhanced OrderService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testEnhancedOrderService().then(success => {
    process.exit(success ? 0 : 1);
  });
}