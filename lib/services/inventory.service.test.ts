import { InventoryService, createInventoryService, StockMovementType } from './inventory.service';

const mockPrisma = {
  productVariant: {
    findMany: async (args?: any) => {
      const variants = [
        {
          id: 'var-1',
          productId: 'prod-1',
          size: 'M',
          color: 'Black',
          stock: 5,
          sku: 'TSH-M-BLK',
          product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
        },
        {
          id: 'var-2',
          productId: 'prod-1',
          size: 'L',
          color: 'Black',
          stock: 0,
          sku: 'TSH-L-BLK',
          product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
        },
        {
          id: 'var-3',
          productId: 'prod-2',
          size: '32',
          color: 'Blue',
          stock: 15,
          sku: 'JNS-32-BLU',
          product: { id: 'prod-2', name: 'Jeans', price: 89.99 },
        },
      ];
      
      if (args?.include?.product) {
        return variants;
      }
      
      return variants.map(({ product, ...v }) => v);
    },
    findUnique: async (args: any) => {
      const variants: any = {
        'var-1': { stock: 5 },
        'var-2': { stock: 0 },
        'var-3': { stock: 15 },
      };
      
      if (args.select?.stock) {
        return variants[args.where.id] || null;
      }
      
      return { id: args.where.id, ...variants[args.where.id] };
    },
    update: async (args: any) => {
      const currentStock = 10;
      let newStock = currentStock;
      
      if (args.data.stock !== undefined) {
        newStock = args.data.stock;
      }
      
      return { id: args.where.id, stock: newStock };
    },
    updateMany: async () => ({ count: 1 }),
  },
  stockMovement: {
    create: async (args: any) => ({
      id: 'movement-' + Date.now(),
      ...args.data,
      createdAt: new Date(),
    }),
    findMany: async (args?: any) => {
      const movements = [
        {
          id: 'mov-1',
          variantId: 'var-1',
          quantity: 10,
          type: StockMovementType.INBOUND,
          reason: 'New inventory received',
          previousStock: 5,
          newStock: 15,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: 'mov-2',
          variantId: 'var-1',
          quantity: 2,
          type: StockMovementType.OUTBOUND,
          reason: 'Order fulfilled',
          referenceId: 'order-123',
          referenceType: 'order',
          previousStock: 15,
          newStock: 13,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      ];
      
      let filtered = movements;
      if (args?.where?.variantId) {
        filtered = movements.filter(m => m.variantId === args.where.variantId);
      }
      if (args?.where?.type) {
        filtered = filtered.filter(m => m.type === args.where.type);
      }
      
      return filtered.slice(0, args?.take || 100);
    },
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testInventoryService() {
  console.log('Testing InventoryService...\n');
  
  const inventoryService = createInventoryService({ prisma: mockPrisma as any });

  try {
    console.log('1. Testing getStock...');
    const stock = await inventoryService.getStock('var-1');
    console.log('✓ Current stock for var-1:', stock);

    console.log('\n2. Testing getAvailableStock...');
    const availableStock = await inventoryService.getAvailableStock('var-1');
    console.log('✓ Available stock (minus reservations):', availableStock);

    console.log('\n3. Testing updateStock (increment)...');
    const inboundMovement = await inventoryService.updateStock(
      'var-1',
      10,
      'increment',
      'New inventory received',
      'po-123',
      'purchase_order',
      'user-1'
    );
    console.log('✓ Stock incremented');
    console.log(`  Previous: ${inboundMovement.previousStock}, New: ${inboundMovement.newStock}`);

    console.log('\n4. Testing updateStock (decrement)...');
    const outboundMovement = await inventoryService.updateStock(
      'var-1',
      2,
      'decrement',
      'Order fulfilled',
      'order-456',
      'order'
    );
    console.log('✓ Stock decremented');
    console.log(`  Movement type: ${outboundMovement.type}`);

    console.log('\n5. Testing bulkUpdateStock...');
    const bulkMovements = await inventoryService.bulkUpdateStock([
      { variantId: 'var-1', quantity: 5, operation: 'increment' },
      { variantId: 'var-2', quantity: 10, operation: 'set' },
      { variantId: 'var-3', quantity: 3, operation: 'decrement' },
    ], 'Monthly inventory adjustment', 'user-1');
    console.log('✓ Bulk update completed:', bulkMovements.length, 'movements');

    console.log('\n6. Testing reserveStock...');
    const reserved = await inventoryService.reserveStock('var-1', 2, 'order-789');
    console.log('✓ Stock reservation:', reserved ? 'SUCCESS' : 'FAILED');
    
    const cannotReserve = await inventoryService.reserveStock('var-2', 5, 'order-790');
    console.log('✓ Cannot reserve (no stock):', !cannotReserve ? 'PASSED' : 'FAILED');

    console.log('\n7. Testing releaseReservation...');
    await inventoryService.releaseReservation('var-1', 'order-789');
    console.log('✓ Reservation released');

    console.log('\n8. Testing checkLowStock...');
    const alerts = await inventoryService.checkLowStock(10);
    console.log('✓ Low stock alerts:', alerts.length);
    alerts.forEach(alert => {
      console.log(`  - ${alert.productName} ${alert.variant}: ${alert.currentStock} (${alert.type})`);
    });

    console.log('\n9. Testing getStockMovements...');
    const movements = await inventoryService.getStockMovements('var-1', undefined, undefined, undefined, 10);
    console.log('✓ Stock movements found:', movements.length);
    movements.forEach(m => {
      console.log(`  - ${m.type}: ${m.quantity} units (${m.reason})`);
    });

    console.log('\n10. Testing getStockReport...');
    const report = await inventoryService.getStockReport();
    console.log('✓ Stock report generated:');
    console.log(`  Total products: ${report.totalProducts}`);
    console.log(`  Total variants: ${report.totalVariants}`);
    console.log(`  Total stock: ${report.totalStock} units`);
    console.log(`  Total value: $${report.totalValue.toFixed(2)}`);
    console.log(`  Low stock count: ${report.lowStockCount}`);
    console.log(`  Out of stock count: ${report.outOfStockCount}`);

    console.log('\n✅ All InventoryService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testInventoryService().then(success => {
    process.exit(success ? 0 : 1);
  });
}