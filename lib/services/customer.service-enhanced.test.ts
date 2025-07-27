import { createEnhancedCustomerService } from './customer.service-enhanced';

// Mock Prisma with address management
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
          addresses: [
            {
              id: 'addr-1',
              customerId: 'cust-1',
              type: 'shipping',
              isDefault: true,
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'USA',
            },
          ],
        },
      ];
      
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
        addresses: [
          {
            id: 'addr-1',
            customerId: 'cust-1',
            type: 'shipping',
            isDefault: true,
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
        ],
      };
      
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
    count: async () => 2,
  },
  address: {
    findMany: async () => [],
    findUnique: async (args: any) => ({
      id: args.where.id,
      customerId: 'cust-1',
      type: 'shipping',
      isDefault: true,
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    }),
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
    findMany: async () => [],
    aggregate: async () => ({
      _sum: { total: 500 },
      _count: 5,
      _max: { createdAt: new Date() },
    }),
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testEnhancedCustomerService() {
  console.log('Testing Enhanced CustomerService...\n');
  
  const customerService = createEnhancedCustomerService({ prisma: mockPrisma as any });

  try {
    console.log('1. Testing createCustomer (alias)...');
    const newCustomer = await customerService.createCustomer({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Customer',
      phone: '+1987654321',
      address: {
        type: 'shipping',
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
        isDefault: true,
      },
    });
    console.log('✓ Customer created:', newCustomer.email);

    console.log('\n2. Testing getCustomer (alias)...');
    const customer = await customerService.getCustomer('cust-1');
    console.log('✓ Customer retrieved:', customer?.firstName, customer?.lastName);

    console.log('\n3. Testing updateCustomer (alias)...');
    const updated = await customerService.updateCustomer('cust-1', {
      phone: '+1555555555',
      firstName: 'John Updated',
    });
    console.log('✓ Customer updated');

    console.log('\n4. Testing getCustomers (alias)...');
    const customers = await customerService.getCustomers(
      { search: 'john' },
      { page: 1, limit: 10 }
    );
    console.log('✓ Customers retrieved:', customers.total);

    console.log('\n5. Testing getAddresses...');
    const addresses = await customerService.getAddresses('cust-1');
    console.log('✓ Addresses retrieved:', addresses.length);
    addresses.forEach(addr => {
      console.log(`  - ${addr.type}: ${addr.street}, ${addr.city} ${addr.state} ${addr.isDefault ? '(default)' : ''}`);
    });

    console.log('\n6. Testing validateAddress...');
    const validAddress = await customerService.validateAddress({
      type: 'shipping',
      street: '789 Park Ave',
      city: 'Chicago',
      state: 'il', // lowercase, should be standardized
      postalCode: '60601',
      country: 'usa', // lowercase, should be standardized
    });
    console.log('✓ Address validation:', validAddress.valid ? 'VALID' : 'INVALID');
    if (validAddress.standardized) {
      console.log(`  Standardized state: ${validAddress.standardized.state}`);
      console.log(`  Standardized country: ${validAddress.standardized.country}`);
    }

    console.log('\n7. Testing invalid address validation...');
    const invalidAddress = await customerService.validateAddress({
      type: 'shipping',
      street: '123', // Too short
      city: 'A', // Too short
      state: 'INVALID', // Not 2 letters
      postalCode: 'INVALID',
      country: 'USA',
    });
    console.log('✓ Invalid address detected:', !invalidAddress.valid ? 'PASSED' : 'FAILED');
    if (invalidAddress.errors) {
      console.log('  Errors:', invalidAddress.errors.join('; '));
    }

    console.log('\n8. Testing setDefaultAddress...');
    const defaultAddr = await customerService.setDefaultAddress('cust-1', 'addr-1');
    console.log('✓ Default address set');

    console.log('\n9. Testing createGuestCustomer...');
    const guest = await customerService.createGuestCustomer('guest@example.com', {
      phone: '+1666666666',
      shippingAddress: {
        name: 'Guest User',
        street: '999 Guest Lane',
        city: 'Guest City',
        state: 'GS',
        postalCode: '99999',
        country: 'USA',
      },
    });
    console.log('✓ Guest customer created:', guest.email);
    console.log(`  Name: ${guest.firstName} ${guest.lastName}`);

    console.log('\n10. Testing convertGuestToCustomer...');
    const converted = await customerService.convertGuestToCustomer('cust-new', {
      password: 'securePassword123',
      firstName: 'Converted',
      lastName: 'Customer',
      marketingConsent: true,
    });
    console.log('✓ Guest converted to customer');

    console.log('\n11. Testing saveMeasurements...');
    const withMeasurements = await customerService.saveMeasurements('cust-1', {
      chest: 42,
      waist: 34,
      inseam: 32,
      neck: 16,
      preferredFit: 'slim',
      notes: 'Prefers tailored fit',
    });
    console.log('✓ Measurements saved');

    console.log('\n12. Testing getMeasurements...');
    const measurements = await customerService.getMeasurements('cust-1');
    console.log('✓ Measurements retrieved:', measurements ? 'Found' : 'Not found');
    if (measurements) {
      console.log(`  Chest: ${measurements.chest}", Waist: ${measurements.waist}", Fit: ${measurements.preferredFit}`);
    }

    console.log('\n13. Testing getMarketingConsent...');
    const consent = await customerService.getMarketingConsent('cust-1');
    console.log('✓ Marketing consent:', consent ? 'GRANTED' : 'NOT GRANTED');

    console.log('\n14. Testing updateMarketingConsent...');
    const consentUpdate = await customerService.updateMarketingConsent('cust-1', {
      marketingConsent: false,
      dataProcessingConsent: true,
      timestamp: new Date(),
      ipAddress: '192.168.1.1',
    });
    console.log('✓ Marketing consent updated');

    console.log('\n15. Testing customer analytics methods...');
    const analytics = await customerService.getCustomerAnalytics('cust-1');
    console.log('✓ Analytics retrieved:');
    console.log(`  Lifetime value: $${analytics.lifetimeValue}`);
    console.log(`  Churn risk: ${analytics.churnRisk}`);

    const purchaseHistory = await customerService.getCustomerPurchaseHistory('cust-1', 5);
    console.log(`✓ Purchase history: ${purchaseHistory.length} orders`);

    const segments = await customerService.getCustomerSegments();
    console.log(`✓ Customer segments: ${segments.length} segments`);

    const ltv = await customerService.calculateLifetimeValue('cust-1');
    console.log(`✓ Lifetime value calculated: $${ltv}`);

    console.log('\n✅ All Enhanced CustomerService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testEnhancedCustomerService().then(success => {
    process.exit(success ? 0 : 1);
  });
}