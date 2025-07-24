import { PrismaClient } from '@prisma/client';
import { MacOSAdminClient } from './macosAdminClient';
import logger from '../utils/logger';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();
const macosAdmin = new MacOSAdminClient();

export interface SyncResult {
  success: boolean;
  productsSync: number;
  inventoryUpdated: number;
  errors: string[];
  timestamp: Date;
}

export class ProductSyncService extends EventEmitter {
  private syncInterval: NodeJS.Timer | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private syncHistory: SyncResult[] = [];

  constructor() {
    super();
  }

  /**
   * Start automatic product sync
   */
  startAutoSync(intervalMinutes: number = 5) {
    if (this.syncInterval) {
      logger.info('Product sync already running');
      return;
    }

    logger.info(`Starting product sync every ${intervalMinutes} minutes`);
    
    // Run initial sync
    this.syncProducts();

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncProducts();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Product sync stopped');
    }
  }

  /**
   * Perform manual sync
   */
  async syncProducts(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping');
      return {
        success: false,
        productsSync: 0,
        inventoryUpdated: 0,
        errors: ['Sync already in progress'],
        timestamp: new Date()
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      productsSync: 0,
      inventoryUpdated: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      logger.info('Starting product sync from MacOS Admin');
      
      // Fetch products from MacOS Admin
      const products = await macosAdmin.getProducts();
      logger.info(`Fetched ${products.length} products from MacOS Admin`);

      // Process products in batches
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await this.processBatch(batch, result);
      }

      // Sync inventory levels
      await this.syncInventory(result);

      // Update last sync time
      this.lastSyncTime = new Date();
      result.success = true;

      // Store sync history (keep last 100 syncs)
      this.syncHistory.unshift(result);
      if (this.syncHistory.length > 100) {
        this.syncHistory = this.syncHistory.slice(0, 100);
      }

      // Emit sync complete event
      this.emit('syncComplete', result);

      const duration = Date.now() - startTime;
      logger.info(`Product sync completed in ${duration}ms. Products: ${result.productsSync}, Inventory: ${result.inventoryUpdated}`);

    } catch (error: any) {
      logger.error('Product sync failed:', error);
      result.errors.push(error.message);
      this.emit('syncError', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Process a batch of products
   */
  private async processBatch(products: any[], result: SyncResult) {
    const upsertOperations = products.map(product => {
      // Transform MacOS Admin product to our schema
      const transformedProduct = this.transformProduct(product);
      
      return prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          name: transformedProduct.name,
          description: transformedProduct.description,
          price: transformedProduct.price,
          compareAtPrice: transformedProduct.compareAtPrice,
          cost: transformedProduct.cost,
          category: transformedProduct.category,
          images: transformedProduct.images,
          vendor: transformedProduct.vendor,
          tags: transformedProduct.tags,
          isActive: transformedProduct.isActive,
          stock: transformedProduct.stock,
          lowStockThreshold: transformedProduct.lowStockThreshold,
          metadata: transformedProduct.metadata,
          updatedAt: new Date()
        },
        create: transformedProduct
      });
    });

    try {
      await prisma.$transaction(upsertOperations);
      result.productsSync += products.length;
    } catch (error: any) {
      logger.error('Error processing batch:', error);
      result.errors.push(`Batch processing error: ${error.message}`);
    }
  }

  /**
   * Transform MacOS Admin product to our schema
   */
  private transformProduct(macosProduct: any) {
    return {
      sku: macosProduct.sku,
      name: macosProduct.name,
      description: macosProduct.description || '',
      category: macosProduct.category,
      price: parseFloat(macosProduct.price) || 0,
      compareAtPrice: macosProduct.compareAtPrice ? parseFloat(macosProduct.compareAtPrice) : null,
      cost: parseFloat(macosProduct.cost) || 0,
      vendor: macosProduct.vendor || 'Unknown',
      productType: macosProduct.category,
      tags: macosProduct.tags || [],
      images: macosProduct.images || [],
      isActive: macosProduct.isActive !== false,
      stock: macosProduct.stock || 0,
      lowStockThreshold: macosProduct.lowStockThreshold || 10,
      metadata: {
        macosAdminId: macosProduct.id,
        lastSyncedAt: new Date().toISOString(),
        colors: macosProduct.colors || [],
        sizes: macosProduct.sizes || []
      }
    };
  }

  /**
   * Sync inventory levels
   */
  private async syncInventory(result: SyncResult) {
    try {
      const inventory = await macosAdmin.getInventory();
      
      for (const item of inventory) {
        try {
          await prisma.product.update({
            where: { sku: item.sku },
            data: {
              stock: item.currentStock,
              metadata: {
                path: ['reservedStock'],
                set: item.reservedStock
              }
            }
          });
          result.inventoryUpdated++;
        } catch (error: any) {
          logger.error(`Error updating inventory for ${item.sku}:`, error);
          result.errors.push(`Inventory update failed for ${item.sku}`);
        }
      }
    } catch (error: any) {
      logger.error('Error syncing inventory:', error);
      result.errors.push(`Inventory sync failed: ${error.message}`);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: this.syncInterval !== null,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      syncHistory: this.syncHistory.slice(0, 10), // Last 10 syncs
      nextSyncTime: this.getNextSyncTime()
    };
  }

  /**
   * Get next sync time
   */
  private getNextSyncTime(): Date | null {
    if (!this.syncInterval || !this.lastSyncTime) {
      return null;
    }
    
    // Default to 5 minutes if not set
    const intervalMs = 5 * 60 * 1000;
    return new Date(this.lastSyncTime.getTime() + intervalMs);
  }

  /**
   * Get products with fallback to cache
   */
  async getProductsWithFallback() {
    try {
      // Try to get fresh data from MacOS Admin
      const products = await macosAdmin.getProducts();
      
      // Update cache in background
      this.syncProducts().catch(error => {
        logger.error('Background sync failed:', error);
      });
      
      return products;
    } catch (error) {
      logger.warn('Failed to fetch from MacOS Admin, using cached data:', error);
      
      // Fallback to cached data
      const cachedProducts = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      });
      
      return cachedProducts.map(p => ({
        ...p,
        _cached: true,
        _cachedAt: p.updatedAt
      }));
    }
  }

  /**
   * Handle outfit template sync
   */
  async syncOutfitAvailability() {
    try {
      const outfitService = await import('./outfitService');
      await outfitService.OutfitService.prototype.maintainOutfitAvailability.call({});
      logger.info('Outfit availability sync completed');
    } catch (error) {
      logger.error('Error syncing outfit availability:', error);
    }
  }
}

// Create singleton instance
export const productSyncService = new ProductSyncService();