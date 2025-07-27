import { CustomerService, createCustomerService } from './customer.service';

const mockPrisma = {
  customer: {
    findMany: async (args?: any) => {
      const customers = [
        {
          id: 'cust-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          loyaltyPoints: 150,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'cust-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          loyaltyPoints: 500,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      
      if (args?.include?.addresses) {
        return customers.map(c => ({
          ...c,
          addresses: [{
            id: `addr-${c.id}`,
            customerId: c.id,
            type: 'shipping',
            isDefault: true,
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          }],
        }));
      }
      
      return customers;
    },
    findUnique: async (args: any) => {
      const customer = {
        id: args.where.id || 'cust-1',
        email: args.where.email || 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        loyaltyPoints: 150,
        measurements: {
          chest: 40,
          waist: 32,
          inseam: 32,
          preferredFit: 'regular',
          updatedAt: new Date(),
        },
        preferences: {
          favoriteColors: ['black', 'navy'],
          preferredCategories: ['shirts', 'pants'],
          marketingConsent: true,
        },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };
      
      if (args.include?.addresses) {
        return {
          ...customer,
          addresses: [{
            id: 'addr-1',
            customerId: customer.id,
            type: 'shipping',
            isDefault: true,
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          }],
        };
      }
      
      return customer;
    },
    create: async (args: any) => ({
      id: 'cust-new',
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
    }),
    count: async () => 2,
  },
  address: {
    findMany: async () => [],
    create: async (args: any) => ({
      id: 'addr-new',
      ...args.data,
    }),
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
    updateMany: async () => ({ count: 1 }),
    delete: async (args: any) => ({
      id: args.where.id,
      customerId: 'cust-1',
    }),
  },
  order: {
    findMany: async (args?: any) => {
      if (args?.where?.customerId) {
        return [
          {
            id: 'order-1',
            customerId: args.where.customerId,
            total: 149.97,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            items: [
              {
                product: { category: 'Shirts' },
              },
              {
                product: { category: 'Pants' },
              },
            ],
          },
          {
            id: 'order-2',
            customerId: args.where.customerId,
            total: 89.99,
            createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            items: [
              {
                product: { category: 'Shirts' },
              },
            ],
          },
        ];
      }
      return [];
    },
    aggregate: async (args?: any) => ({
      _sum: { total: 239.96 },
      _count: 2,
      _max: { createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    }),
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testCustomerService() {
  console.log('Testing CustomerService...\n');
  
  const customerService = createCustomerService({ prisma: mockPrisma as any });

  try {
    console.log('1. Testing findById...');
    const customer = await customerService.findById('cust-1');
    console.log('✓ Found customer:', customer?.firstName, customer?.lastName);
    console.log(`  Total spent: $${customer?.totalSpent?.toFixed(2)}`);
    console.log(`  Order count: ${customer?.orderCount}`);

    console.log('\n2. Testing findByEmail...');
    const customerByEmail = await customerService.findByEmail('john@example.com');
    console.log('✓ Found customer by email:', customerByEmail?.email);

    console.log('\n3. Testing findAll with filters...');
    const result = await customerService.findAll(
      { search: 'john', minSpent: 100 },
      { page: 1, limit: 10 }
    );
    console.log('✓ Customers found:', result.total);
    console.log(`  First customer: ${result.customers[0]?.firstName}`);

    console.log('\n4. Testing create customer...');
    const newCustomer = await customerService.create({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Customer',
      phone: '+1987654321',
      address: {
        type: 'shipping',
        isDefault: true,
        street: '456 Oak St',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
      },
    });
    console.log('✓ Customer created:', newCustomer.email);

    console.log('\n5. Testing updateMeasurements...');
    const updatedMeasurements = await customerService.updateMeasurements('cust-1', {
      chest: 42,
      waist: 34,
      inseam: 32,
      preferredFit: 'slim',
      updatedAt: new Date(),
    });
    console.log('✓ Measurements updated');

    console.log('\n6. Testing updatePreferences...');
    const updatedPreferences = await customerService.updatePreferences('cust-1', {
      favoriteColors: ['black', 'navy', 'gray'],
      communicationPreferences: {
        email: true,
        sms: false,
        push: true,
      },
    });
    console.log('✓ Preferences updated');

    console.log('\n7. Testing addAddress...');
    const newAddress = await customerService.addAddress('cust-1', {
      type: 'billing',
      isDefault: false,
      street: '789 Billing Ave',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'USA',
    });
    console.log('✓ Address added:', newAddress.street);

    console.log('\n8. Testing getPurchaseHistory...');
    const history = await customerService.getPurchaseHistory('cust-1', 5);
    console.log('✓ Purchase history:', history.length, 'orders');
    history.forEach(order => {
      console.log(`  - Order ${order.id}: $${order.total}`);
    });

    console.log('\n9. Testing getAnalytics...');
    const analytics = await customerService.getAnalytics('cust-1');
    console.log('✓ Customer analytics:');
    console.log(`  Lifetime value: $${analytics.lifetimeValue.toFixed(2)}`);
    console.log(`  Average order: $${analytics.averageOrderValue.toFixed(2)}`);
    console.log(`  Order frequency: ${analytics.orderFrequency.toFixed(2)} orders/month`);
    console.log(`  Last order: ${analytics.lastOrderDaysAgo} days ago`);
    console.log(`  Churn risk: ${analytics.churnRisk}`);
    console.log(`  Favorite categories:`, analytics.favoriteCategories.map(c => c.category).join(', '));

    console.log('\n10. Testing getSegments...');
    const segments = await customerService.getSegments();
    console.log('✓ Customer segments:');
    segments.forEach(segment => {
      console.log(`  - ${segment.name}: ${segment.customerCount} customers`);
    });

    console.log('\n11. Testing addLoyaltyPoints...');
    const withPoints = await customerService.addLoyaltyPoints('cust-1', 50, 'Purchase reward');
    console.log('✓ Loyalty points added:', withPoints.loyaltyPoints);

    console.log('\n✅ All CustomerService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testCustomerService().then(success => {
    process.exit(success ? 0 : 1);
  });
}