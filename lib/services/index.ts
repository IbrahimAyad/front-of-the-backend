import { getSchemaAwareClient } from '../db/schema-aware-client'
import { createCustomerService } from './customer.service'
import { CacheService } from './cache.service'

// Initialize the schema-aware client
const schemaAwareClient = getSchemaAwareClient()

// Initialize cache service (if available)
let cacheService: CacheService | undefined;
try {
  cacheService = new CacheService()
} catch (error) {
  console.warn('Cache service not available:', error)
}

// Initialize services with schema-aware client
export const customerService = createCustomerService({
  prisma: schemaAwareClient,
  cache: cacheService
})

// Export the schema-aware client for direct use if needed
export { schemaAwareClient as prisma }

// Health check for all schemas
export const healthCheck = async () => {
  return await schemaAwareClient.healthCheck()
}

// Service exports
export * from './auth.service';
export * from './product.service';
export * from './cache.service';
export * from './email.service';
export * from './order.service';
export * from './inventory.service';
export * from './customer.service';
export * from './payment.service';
export * from './shipping.service';
export * from './analytics.service';
export * from './notification.service';
export * from './search.service';

// Enhanced services
export * from './customer.service-enhanced';

// Type exports
export * from '../types/order.types';