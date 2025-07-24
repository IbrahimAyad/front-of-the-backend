import { FastifyPluginAsync } from 'fastify';
import { productSyncService } from '../services/productSyncService';
import logger from '../utils/logger';

const syncSchedulerPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Start product sync on server start
  fastify.addHook('onReady', async () => {
    const syncInterval = parseInt(process.env.PRODUCT_SYNC_INTERVAL || '5');
    const enableAutoSync = process.env.ENABLE_AUTO_SYNC !== 'false';
    
    if (enableAutoSync) {
      logger.info(`Starting product sync scheduler (interval: ${syncInterval} minutes)`);
      productSyncService.startAutoSync(syncInterval);
      
      // Also sync outfit availability every 30 minutes
      setInterval(() => {
        productSyncService.syncOutfitAvailability().catch(error => {
          logger.error('Outfit availability sync failed:', error);
        });
      }, 30 * 60 * 1000);
    } else {
      logger.info('Auto sync is disabled. Enable with ENABLE_AUTO_SYNC=true');
    }
  });

  // Stop sync on server close
  fastify.addHook('onClose', async () => {
    logger.info('Stopping product sync scheduler');
    productSyncService.stopAutoSync();
  });

  // Add sync status endpoint
  fastify.get('/api/sync/status', async (request, reply) => {
    const status = productSyncService.getSyncStatus();
    return reply.send({
      success: true,
      data: status
    });
  });

  // Manual sync endpoint
  fastify.post('/api/sync/manual', async (request, reply) => {
    try {
      const result = await productSyncService.syncProducts();
      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Manual sync failed:', error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Listen to sync events
  productSyncService.on('syncComplete', (result) => {
    logger.info('Sync completed:', {
      products: result.productsSync,
      inventory: result.inventoryUpdated,
      errors: result.errors.length
    });
  });

  productSyncService.on('syncError', (error) => {
    logger.error('Sync error:', error);
  });
};

export default syncSchedulerPlugin;