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
          stock: 10,
          sku: 'TSH-M-BLK',
          product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
        },
        {
          id: 'var-2',
          productId: 'prod-1',
          size: 'L',
          color: 'Black',
          stock: 5,
          sku: 'TSH-L-BLK',
          product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
        },
        {
          id: 'var-3',
          productId: 'prod-2',
          size: '32',
          color: 'Blue',
          stock: 0,
          sku: 'JNS-32-BLU',
          product: { id: 'prod-2', name: 'Jeans', price: 89.99 },
        },
      ];
      
      if (args?.where?.productId) {
        return variants.filter(v => v.productId === args.where.productId);
      }
      
      if (args?.include?.product) {
        return variants;
      }
      
      return variants.map(({ product, ...v }) => v);
    },
    findUnique: async (args: any) => {
      const variants: any = {
        'var-1': { stock: 10, productId: 'prod-1' },
        'var-2': { stock: 5, productId: 'prod-1' },
        'var-3': { stock: 0, productId: 'prod-2' },
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
      } else if (args.data.stock?.increment) {
        newStock = currentStock + args.data.stock.increment;
      } else if (args.data.stock?.decrement) {
        newStock = Math.max(0, currentStock - args.data.stock.decrement);
      }
      
      return { id: args.where.id, stock: newStock };
    },
    updateMany: async () => ({ count: 1 }),
  },
  product: {
    findUnique: async () => ({ id: 'prod-1', name: 'T-Shirt' }),
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
          reason: 'New inventory',
          previousStock: 0,
          newStock: 10,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ];
      return movements;
    },
  },
  stockAlert: {
    create: async (args: any) => ({
      id: 'alert-' + Date.now(),
      ...args.data,
      createdAt: new Date(),
    }),
    findMany: async () => [],
    findUnique: async () => null,
    update: async (args: any) => ({
      id: args.where.id,
      ...args.data,
    }),
  },
  stockLocation: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  $transaction: async (fn: any) => {
    return fn(mockPrisma);
  },
};

async function testEnhancedInventoryService() {
  console.log('Testing Enhanced InventoryService...\n');
  
  const inventoryService = createInventoryService({ prisma: mockPrisma as any });

  try {
    console.log('1. Testing getStock with productId only...');
    const productStock = await inventoryService.getStock('prod-1');
    console.log('✓ Total stock for product:', productStock);

    console.log('\n2. Testing getStock with productId and variantId...');
    const variantStock = await inventoryService.getStock('prod-1', 'var-1');
    console.log('✓ Stock for specific variant:', variantStock);

    console.log('\n3. Testing adjustStock...');
    const adjustment = await inventoryService.adjustStock('prod-1', {
      variantId: 'var-1',
      quantity: 5,
      operation: 'increment',
      reason: 'Restocking',
      referenceId: 'po-123',
      referenceType: 'purchase_order',
    });
    console.log('✓ Stock adjusted:', adjustment.type);

    console.log('\n4. Testing reserveStock for cart items...');
    const reservation = await inventoryService.reserveStock([
      { productId: 'prod-1', variantId: 'var-1', quantity: 2 },
      { productId: 'prod-1', variantId: 'var-2', quantity: 3 },
      { productId: 'prod-2', variantId: 'var-3', quantity: 1 }, // Out of stock
    ], 30 * 60 * 1000); // 30 minutes
    console.log('✓ Reservation created:', reservation.reservationId);
    console.log('  Reserved items:');
    reservation.items.forEach(item => {
      console.log(`    - ${item.variantId}: ${item.reserved ? 'Reserved' : 'Failed'} ${item.reason || ''}`);
    });

    console.log('\n5. Testing releaseReservation...');
    await inventoryService.releaseReservation(reservation.reservationId);
    console.log('✓ Reservation released');

    console.log('\n6. Testing confirmStockUsage...');
    const newReservation = await inventoryService.reserveStock([
      { productId: 'prod-1', variantId: 'var-1', quantity: 1 },
    ]);
    await inventoryService.confirmStockUsage(newReservation.reservationId);
    console.log('✓ Stock usage confirmed for order');

    console.log('\n7. Testing getLowStockItems...');
    const lowStock = await inventoryService.getLowStockItems(10);
    console.log('✓ Low stock items:', lowStock.length);
    lowStock.forEach(item => {
      console.log(`  - ${item.productName} ${item.variant}: ${item.currentStock} (${item.type})`);
    });

    console.log('\n8. Testing getStockMovements with filters...');
    const movements = await inventoryService.getStockMovements({
      productId: 'prod-1',
      type: StockMovementType.INBOUND,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });
    console.log('✓ Stock movements found:', movements.length);

    console.log('\n9. Testing getStockByLocation...');
    const locationStock = await inventoryService.getStockByLocation();
    console.log('✓ Stock by location retrieved');

    console.log('\n10. Testing checkStockAlerts...');
    const alerts = await inventoryService.checkStockAlerts();
    console.log('✓ New stock alerts created:', alerts.length);

    console.log('\n11. Testing createStockAlert...');
    const alert = await inventoryService.createStockAlert({
      variantId: 'var-1',
      productId: 'prod-1',
      productName: 'T-Shirt',
      variant: 'M Black',
      currentStock: 5,
      threshold: 10,
      type: 'LOW_STOCK',
    });
    console.log('✓ Stock alert created:', alert.id);

    console.log('\n12. Testing resolveStockAlert...');
    await inventoryService.resolveStockAlert(alert.id!);
    console.log('✓ Stock alert resolved');

    console.log('\n13. Testing bulkAdjustStock...');
    const bulkMovements = await inventoryService.bulkAdjustStock([
      {
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 10,
        operation: 'increment',
        reason: 'Bulk restock',
      },
      {
        productId: 'prod-1',
        variantId: 'var-2',
        quantity: 5,
        operation: 'set',
        reason: 'Inventory correction',
      },
    ]);
    console.log('✓ Bulk adjustments completed:', bulkMovements.length);

    console.log('\n14. Testing syncStockFromSupplier...');
    const syncMovements = await inventoryService.syncStockFromSupplier('supplier-1');
    console.log('✓ Stock synced from supplier:', syncMovements.length, '(simulated)');

    console.log('\n15. Testing cleanup...');
    inventoryService.cleanup();
    console.log('✓ Service cleanup completed');

    console.log('\n✅ All Enhanced InventoryService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testEnhancedInventoryService().then(success => {
    process.exit(success ? 0 : 1);
  });
}