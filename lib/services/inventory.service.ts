import { CacheService } from './cache.service';

export interface InventoryServiceDependencies {
  prisma: {
    productVariant: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      updateMany: (args: any) => Promise<{ count: number }>;
    };
    product: {
      findUnique: (args: any) => Promise<any>;
    };
    stockMovement: {
      create: (args: any) => Promise<any>;
      findMany: (args?: any) => Promise<any[]>;
    };
    stockAlert: {
      create: (args: any) => Promise<any>;
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
    stockLocation: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any>;
    };
    $transaction: (fn: any) => Promise<any>;
  };
  cache?: CacheService;
}

export interface StockReservation {
  variantId: string;
  quantity: number;
  orderId?: string;
  expiresAt: Date;
}

export interface StockMovement {
  id: string;
  variantId: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  previousStock: number;
  newStock: number;
  createdAt: Date;
  createdBy?: string;
}

export enum StockMovementType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED'
}

export interface StockAlert {
  id?: string;
  variantId: string;
  productId: string;
  productName: string;
  variant: string;
  currentStock: number;
  threshold: number;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  resolved?: boolean;
  resolvedAt?: Date;
  createdAt?: Date;
}

export interface StockAdjustment {
  variantId?: string;
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
  reason: string;
  referenceId?: string;
  referenceType?: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface StockMovementFilters {
  variantId?: string;
  productId?: string;
  type?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
}

export interface BulkStockAdjustment extends StockAdjustment {
  productId: string;
  variantId: string;
}

export interface StockReservationResult {
  reservationId: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    reserved: boolean;
    reason?: string;
  }>;
  expiresAt: Date;
}

export interface BulkStockUpdate {
  variantId: string;
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
}

export class InventoryService {
  private readonly prisma: InventoryServiceDependencies['prisma'];
  private readonly cache?: CacheService;
  private reservations: Map<string, StockReservation[]> = new Map();
  private cartReservations: Map<string, StockReservationResult> = new Map();
  private readonly defaultLowStockThreshold = 10;
  private readonly reservationTTL = 15 * 60 * 1000; // 15 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor(dependencies: InventoryServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.cache = dependencies.cache;
    
    // Clean up expired reservations every minute
    this.cleanupInterval = setInterval(() => this.cleanupExpiredReservations(), 60000);
  }

  async getStock(productId: string, variantId?: string): Promise<number> {
    if (!variantId) {
      // Get total stock for all variants of a product
      const variants = await this.prisma.productVariant.findMany({
        where: { productId },
        select: { stock: true },
      });
      return variants.reduce((sum, v) => sum + v.stock, 0);
    }

    return this.getStockByVariant(variantId);
  }

  private async getStockByVariant(variantId: string): Promise<number> {
    const cacheKey = `stock:${variantId}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return parseInt(cached);
      }
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    const stock = variant?.stock || 0;
    
    if (this.cache) {
      await this.cache.set(cacheKey, stock.toString(), 300);
    }

    return stock;
  }

  async getAvailableStock(variantId: string): Promise<number> {
    const currentStock = await this.getStock(variantId);
    const reservedQuantity = this.getReservedQuantity(variantId);
    return Math.max(0, currentStock - reservedQuantity);
  }

  async updateStock(
    variantId: string,
    quantity: number,
    operation: 'set' | 'increment' | 'decrement',
    reason: string,
    referenceId?: string,
    referenceType?: string,
    userId?: string
  ): Promise<StockMovement> {
    return this.prisma.$transaction(async (tx: any) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      });

      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      const previousStock = variant.stock;
      let newStock: number;

      switch (operation) {
        case 'set':
          newStock = quantity;
          break;
        case 'increment':
          newStock = previousStock + quantity;
          break;
        case 'decrement':
          newStock = Math.max(0, previousStock - quantity);
          break;
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });

      const movementType = 
        operation === 'increment' ? StockMovementType.INBOUND :
        operation === 'decrement' ? StockMovementType.OUTBOUND :
        StockMovementType.ADJUSTMENT;

      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          quantity: Math.abs(newStock - previousStock),
          type: movementType,
          reason,
          referenceId,
          referenceType,
          previousStock,
          newStock,
          createdBy: userId,
        },
      });

      if (this.cache) {
        await this.cache.invalidate(`stock:${variantId}`);
        await this.cache.invalidate('products:*');
      }

      return movement;
    });
  }

  async bulkUpdateStock(updates: BulkStockUpdate[], reason: string, userId?: string): Promise<StockMovement[]> {
    return this.prisma.$transaction(async (tx: any) => {
      const movements: StockMovement[] = [];

      for (const update of updates) {
        const variant = await tx.productVariant.findUnique({
          where: { id: update.variantId },
          select: { stock: true },
        });

        if (!variant) continue;

        const previousStock = variant.stock;
        let newStock: number;

        switch (update.operation) {
          case 'set':
            newStock = update.quantity;
            break;
          case 'increment':
            newStock = previousStock + update.quantity;
            break;
          case 'decrement':
            newStock = Math.max(0, previousStock - update.quantity);
            break;
        }

        await tx.productVariant.update({
          where: { id: update.variantId },
          data: { stock: newStock },
        });

        const movementType = 
          update.operation === 'increment' ? StockMovementType.INBOUND :
          update.operation === 'decrement' ? StockMovementType.OUTBOUND :
          StockMovementType.ADJUSTMENT;

        const movement = await tx.stockMovement.create({
          data: {
            variantId: update.variantId,
            quantity: Math.abs(newStock - previousStock),
            type: movementType,
            reason,
            previousStock,
            newStock,
            createdBy: userId,
          },
        });

        movements.push(movement);
      }

      if (this.cache) {
        await this.cache.invalidate('stock:*');
        await this.cache.invalidate('products:*');
      }

      return movements;
    });
  }

  async adjustStock(productId: string, adjustment: StockAdjustment): Promise<StockMovement> {
    const { variantId, quantity, operation, reason, referenceId, referenceType } = adjustment;
    
    if (!variantId) {
      throw new Error('VariantId is required for stock adjustment');
    }
    
    return this.updateStock(variantId, quantity, operation, reason, referenceId, referenceType);
  }

  async reserveStock(items: CartItem[], duration?: number): Promise<StockReservationResult> {
    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const ttl = duration || this.reservationTTL;
    const expiresAt = new Date(Date.now() + ttl);
    const result: StockReservationResult = {
      reservationId,
      items: [],
      expiresAt,
    };

    for (const item of items) {
      const availableStock = await this.getAvailableStock(item.variantId);
      const reserved = availableStock >= item.quantity;
      
      if (reserved) {
        const reservation: StockReservation = {
          variantId: item.variantId,
          quantity: item.quantity,
          orderId: reservationId,
          expiresAt,
        };

        const variantReservations = this.reservations.get(item.variantId) || [];
        variantReservations.push(reservation);
        this.reservations.set(item.variantId, variantReservations);
      }

      result.items.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        reserved,
        reason: reserved ? undefined : `Insufficient stock. Available: ${availableStock}`,
      });
    }

    this.cartReservations.set(reservationId, result);
    return result;
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const cartReservation = this.cartReservations.get(reservationId);
    if (!cartReservation) return;

    for (const item of cartReservation.items) {
      if (item.reserved) {
        await this.releaseStockReservation(item.variantId, reservationId);
      }
    }

    this.cartReservations.delete(reservationId);
  }

  async confirmStockUsage(orderId: string): Promise<void> {
    const cartReservation = this.cartReservations.get(orderId);
    if (!cartReservation) return;

    for (const item of cartReservation.items) {
      if (item.reserved) {
        await this.updateStock(
          item.variantId,
          item.quantity,
          'decrement',
          'Order confirmed',
          orderId,
          'order'
        );
        await this.releaseStockReservation(item.variantId, orderId);
      }
    }

    this.cartReservations.delete(orderId);
  }

  private async reserveStockSingle(variantId: string, quantity: number, orderId?: string): Promise<boolean> {
    const availableStock = await this.getAvailableStock(variantId);
    
    if (availableStock < quantity) {
      return false;
    }

    const reservation: StockReservation = {
      variantId,
      quantity,
      orderId,
      expiresAt: new Date(Date.now() + this.reservationTTL),
    };

    const variantReservations = this.reservations.get(variantId) || [];
    variantReservations.push(reservation);
    this.reservations.set(variantId, variantReservations);

    await this.createStockMovement(
      variantId,
      quantity,
      StockMovementType.RESERVED,
      'Stock reserved for order',
      orderId,
      'order'
    );

    return true;
  }

  private async releaseStockReservation(variantId: string, orderId: string): Promise<void> {
    const variantReservations = this.reservations.get(variantId) || [];
    const reservationIndex = variantReservations.findIndex(r => r.orderId === orderId);
    
    if (reservationIndex !== -1) {
      const reservation = variantReservations[reservationIndex];
      variantReservations.splice(reservationIndex, 1);
      
      if (variantReservations.length === 0) {
        this.reservations.delete(variantId);
      } else {
        this.reservations.set(variantId, variantReservations);
      }

      await this.createStockMovement(
        variantId,
        reservation.quantity,
        StockMovementType.RELEASED,
        'Stock reservation released',
        orderId,
        'order'
      );
    }
  }

  async getLowStockItems(threshold?: number): Promise<StockAlert[]> {
    return this.checkLowStock(threshold);
  }

  async checkLowStock(threshold?: number): Promise<StockAlert[]> {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const alerts: StockAlert[] = [];
    const lowStockThreshold = threshold || this.defaultLowStockThreshold;

    for (const variant of variants) {
      const alert: StockAlert = {
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        variant: `${variant.size} ${variant.color}`,
        currentStock: variant.stock,
        threshold: lowStockThreshold,
        type: variant.stock === 0 ? 'OUT_OF_STOCK' : 
              variant.stock <= lowStockThreshold ? 'LOW_STOCK' : 
              variant.stock > lowStockThreshold * 10 ? 'OVERSTOCK' : 
              'LOW_STOCK',
      };

      if (alert.type === 'LOW_STOCK' || alert.type === 'OUT_OF_STOCK') {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async getStockMovements(filters: StockMovementFilters, limit: number = 100): Promise<StockMovement[]> {
    const { variantId, productId, type, startDate, endDate, locationId } = filters;
    
    let where: any = {
      ...(variantId && { variantId }),
      ...(type && { type }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
      ...(locationId && { locationId }),
    };

    if (productId && !variantId) {
      const variants = await this.prisma.productVariant.findMany({
        where: { productId },
        select: { id: true },
      });
      where.variantId = { in: variants.map(v => v.id) };
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements;
  }

  async getStockByLocation(locationId?: string): Promise<any[]> {
    const where = locationId ? { locationId } : {};
    
    return this.prisma.productVariant.findMany({
      where,
      include: {
        product: true,
        location: true,
      },
    });
  }

  async checkStockAlerts(): Promise<StockAlert[]> {
    const lowStockItems = await this.checkLowStock();
    const existingAlerts = await this.prisma.stockAlert.findMany({
      where: { resolved: false },
    });

    const newAlerts: StockAlert[] = [];
    
    for (const item of lowStockItems) {
      const existingAlert = existingAlerts.find(
        a => a.variantId === item.variantId && a.type === item.type
      );
      
      if (!existingAlert) {
        const alert = await this.prisma.stockAlert.create({
          data: {
            variantId: item.variantId,
            productId: item.productId,
            productName: item.productName,
            variant: item.variant,
            currentStock: item.currentStock,
            threshold: item.threshold,
            type: item.type,
            resolved: false,
          },
        });
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  async createStockAlert(alert: Omit<StockAlert, 'id' | 'createdAt'>): Promise<StockAlert> {
    return this.prisma.stockAlert.create({
      data: {
        ...alert,
        resolved: false,
      },
    });
  }

  async resolveStockAlert(alertId: string): Promise<void> {
    await this.prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async bulkAdjustStock(adjustments: BulkStockAdjustment[]): Promise<StockMovement[]> {
    const updates = adjustments.map(adj => ({
      variantId: adj.variantId,
      quantity: adj.quantity,
      operation: adj.operation,
    }));
    
    return this.bulkUpdateStock(
      updates,
      adjustments[0]?.reason || 'Bulk stock adjustment',
      adjustments[0]?.referenceId
    );
  }

  async syncStockFromSupplier(supplierId: string): Promise<StockMovement[]> {
    // This would typically integrate with a supplier API
    // For now, we'll simulate it
    const supplierStock = await this.fetchSupplierStock(supplierId);
    const movements: StockMovement[] = [];

    for (const item of supplierStock) {
      const movement = await this.updateStock(
        item.variantId,
        item.quantity,
        'set',
        `Stock sync from supplier ${supplierId}`,
        supplierId,
        'supplier'
      );
      movements.push(movement);
    }

    return movements;
  }

  private async fetchSupplierStock(supplierId: string): Promise<Array<{ variantId: string; quantity: number }>> {
    // Simulate supplier API call
    // In real implementation, this would call an external API
    return [];
  }

  private async getStockMovementsLegacy(
    variantId?: string,
    type?: StockMovementType,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<StockMovement[]> {
    const where: any = {
      ...(variantId && { variantId }),
      ...(type && { type }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements;
  }

  async getStockReport(): Promise<{
    totalProducts: number;
    totalVariants: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            price: true,
          },
        },
      },
    });

    const productIds = new Set(variants.map(v => v.productId));
    let totalStock = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const variant of variants) {
      totalStock += variant.stock;
      totalValue += variant.stock * variant.product.price;
      
      if (variant.stock === 0) {
        outOfStockCount++;
      } else if (variant.stock <= this.defaultLowStockThreshold) {
        lowStockCount++;
      }
    }

    return {
      totalProducts: productIds.size,
      totalVariants: variants.length,
      totalStock,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }

  private getReservedQuantity(variantId: string): number {
    const variantReservations = this.reservations.get(variantId) || [];
    const now = new Date();
    
    return variantReservations
      .filter(r => r.expiresAt > now)
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private cleanupExpiredReservations(): void {
    const now = new Date();
    
    for (const [variantId, reservations] of this.reservations.entries()) {
      const activeReservations = reservations.filter(r => r.expiresAt > now);
      
      if (activeReservations.length === 0) {
        this.reservations.delete(variantId);
      } else if (activeReservations.length < reservations.length) {
        this.reservations.set(variantId, activeReservations);
      }
    }
  }

  private async createStockMovement(
    variantId: string,
    quantity: number,
    type: StockMovementType,
    reason: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<void> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (variant) {
      await this.prisma.stockMovement.create({
        data: {
          variantId,
          quantity,
          type,
          reason,
          referenceId,
          referenceType,
          previousStock: variant.stock,
          newStock: variant.stock,
        },
      });
    }
  }
}

export function createInventoryService(dependencies: InventoryServiceDependencies): InventoryService {
  return new InventoryService(dependencies);
}