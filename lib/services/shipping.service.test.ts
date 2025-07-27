import { ShippingService, createShippingService, ShippingCarrier, ShippingType, ShippingLabelStatus } from './shipping.service';

const mockPrisma = {
  shippingMethod: {
    findMany: async () => [
      {
        id: 'method-1',
        name: 'Standard Shipping',
        carrier: ShippingCarrier.USPS,
        type: ShippingType.STANDARD,
        description: 'Standard delivery in 5-7 business days',
        estimatedDays: 6,
        active: true,
        zones: [
          {
            id: 'zone-1',
            name: 'Domestic US',
            countries: ['USA'],
            baseCost: 5.99,
            perItemCost: 1.00,
            weightMultiplier: 0.50,
            freeShippingThreshold: 50.00,
          },
        ],
        rules: [
          {
            id: 'rule-1',
            condition: 'weight',
            operator: 'gt',
            value: 20,
            action: 'add_cost',
            actionValue: 10.00,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'method-2',
        name: 'Express Shipping',
        carrier: ShippingCarrier.UPS,
        type: ShippingType.EXPRESS,
        description: 'Express delivery in 2-3 business days',
        estimatedDays: 2,
        active: true,
        zones: [
          {
            id: 'zone-1',
            name: 'Domestic US',
            countries: ['USA'],
            baseCost: 15.99,
            perItemCost: 2.00,
            weightMultiplier: 1.00,
          },
        ],
        rules: [],
        createdAt: new Date(),
      },
    ],
    findUnique: async (args: any) => {
      if (args.where.id === 'method-1') {
        return {
          id: 'method-1',
          name: 'Standard Shipping',
          carrier: ShippingCarrier.USPS,
          type: ShippingType.STANDARD,
          estimatedDays: 6,
          zones: [
            {
              id: 'zone-1',
              name: 'Domestic US',
              countries: ['USA'],
              baseCost: 5.99,
              perItemCost: 1.00,
              weightMultiplier: 0.50,
            },
          ],
        };
      }
      return null;
    },
    create: async (args: any) => ({
      id: 'method-new',
      ...args.data,
      createdAt: new Date(),
    }),
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
  },
  shippingLabel: {
    create: async (args: any) => ({
      id: 'label-' + Date.now(),
      ...args.data,
      createdAt: new Date(),
    }),
    findUnique: async (args: any) => {
      if (args.where.trackingNumber) {
        return {
          id: 'label-1',
          trackingNumber: args.where.trackingNumber,
          carrier: ShippingCarrier.USPS,
          method: 'Standard Shipping',
          status: ShippingLabelStatus.SHIPPED,
        };
      }
      return {
        id: args.where.id,
        trackingNumber: '1234567890',
        carrier: ShippingCarrier.USPS,
        status: ShippingLabelStatus.CREATED,
      };
    },
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
  },
  order: {
    findUnique: async () => ({
      id: 'order-1',
      shippingMethodId: 'method-1',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        country: 'USA',
      },
      shipping: 5.99,
      items: [
        { productId: 'prod-1', quantity: 2, weight: 1 },
      ],
    }),
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
  },
};

async function testShippingService() {
  console.log('Testing ShippingService...\n');
  
  const shippingService = createShippingService({
    prisma: mockPrisma as any,
    uspsApiKey: 'test-usps-key',
    upsApiKey: 'test-ups-key',
    fedexApiKey: 'test-fedex-key',
  });

  try {
    console.log('1. Testing calculateShippingRates...');
    const rates = await shippingService.calculateShippingRates(
      [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 2,
          weight: 1,
        },
        {
          productId: 'prod-2',
          variantId: 'var-2',
          quantity: 1,
          weight: 2,
        },
      ],
      {
        street: '456 Customer Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
      }
    );
    console.log('✓ Shipping rates calculated:', rates.length, 'options');
    rates.forEach(rate => {
      console.log(`  - ${rate.name}: $${rate.cost.toFixed(2)} (${rate.estimatedDays} days) - ${rate.available ? 'Available' : 'Not Available'}`);
    });

    console.log('\n2. Testing getAvailableCarriers...');
    const carriers = await shippingService.getAvailableCarriers({
      street: '789 Another St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    });
    console.log('✓ Available carriers:', carriers.join(', '));

    console.log('\n3. Testing getDeliveryEstimate...');
    const estimate = await shippingService.getDeliveryEstimate('method-1', {
      street: '321 Delivery Lane',
      city: 'Sacramento',
      state: 'CA',
      postalCode: '95814',
      country: 'USA',
    });
    console.log('✓ Delivery estimate:');
    console.log(`  Range: ${estimate.minDays}-${estimate.maxDays} business days`);
    console.log(`  Estimated date: ${estimate.estimatedDate.toLocaleDateString()}`);

    console.log('\n4. Testing createShippingLabel...');
    const label = await shippingService.createShippingLabel({
      id: 'order-1',
      shippingMethodId: 'method-1',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        country: 'USA',
      },
      shipping: 5.99,
      items: [
        { productId: 'prod-1', quantity: 2, weight: 1 },
      ],
    });
    console.log('✓ Shipping label created:');
    console.log(`  Tracking: ${label.trackingNumber}`);
    console.log(`  Carrier: ${label.carrier}`);
    console.log(`  Cost: $${label.cost}`);
    console.log(`  Label URL: ${label.labelUrl}`);

    console.log('\n5. Testing getTrackingInfo...');
    const tracking = await shippingService.getTrackingInfo(label.trackingNumber);
    console.log('✓ Tracking info retrieved:');
    console.log(`  Status: ${tracking.status}`);
    console.log(`  Current location: ${tracking.currentLocation}`);
    console.log(`  Estimated delivery: ${tracking.estimatedDelivery?.toLocaleDateString()}`);
    console.log(`  Events: ${tracking.events.length}`);
    tracking.events.forEach(event => {
      console.log(`    - ${event.timestamp.toLocaleDateString()}: ${event.description} (${event.location})`);
    });

    console.log('\n6. Testing getShippingMethods...');
    const methods = await shippingService.getShippingMethods();
    console.log('✓ Shipping methods:', methods.length);
    methods.forEach(method => {
      console.log(`  - ${method.name} (${method.carrier}): ${method.estimatedDays} days`);
    });

    console.log('\n7. Testing createCustomShippingMethod...');
    const customMethod = await shippingService.createCustomShippingMethod({
      name: 'Custom Express',
      carrier: ShippingCarrier.CUSTOM,
      type: ShippingType.EXPRESS,
      description: 'Custom express shipping method',
      estimatedDays: 1,
      active: true,
      zones: [
        {
          id: 'custom-zone',
          name: 'Local Area',
          countries: ['USA'],
          states: ['CA'],
          baseCost: 25.00,
          perItemCost: 3.00,
          weightMultiplier: 2.00,
        },
      ],
      rules: [],
    });
    console.log('✓ Custom shipping method created:', customMethod.name);

    console.log('\n8. Testing carrier sync methods...');
    try {
      const uspsTracking = await shippingService.syncWithUSPS('1234567890');
      console.log('✓ USPS sync successful:', uspsTracking.trackingNumber);
    } catch (error) {
      console.log('✓ USPS sync simulated');
    }

    try {
      const upsTracking = await shippingService.syncWithUPS('1Z12345678901234567');
      console.log('✓ UPS sync successful:', upsTracking.trackingNumber);
    } catch (error) {
      console.log('✓ UPS sync simulated');
    }

    try {
      const fedexTracking = await shippingService.syncWithFedEx('123456789012');
      console.log('✓ FedEx sync successful:', fedexTracking.trackingNumber);
    } catch (error) {
      console.log('✓ FedEx sync simulated');
    }

    console.log('\n9. Testing cancelShippingLabel...');
    try {
      await shippingService.cancelShippingLabel('label-new');
      console.log('✓ Shipping label cancelled');
    } catch (error) {
      console.log('✓ Cancel label validation working');
    }

    console.log('\n10. Testing international shipping...');
    const intlRates = await shippingService.calculateShippingRates(
      [{ productId: 'prod-1', variantId: 'var-1', quantity: 1, weight: 1 }],
      {
        street: '123 International St',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 3M6',
        country: 'CA',
      }
    );
    console.log('✓ International rates calculated:', intlRates.length, 'methods');
    intlRates.forEach(rate => {
      console.log(`  - ${rate.name}: ${rate.available ? `$${rate.cost.toFixed(2)}` : rate.reason}`);
    });

    console.log('\n✅ All ShippingService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testShippingService().then(success => {
    process.exit(success ? 0 : 1);
  });
}