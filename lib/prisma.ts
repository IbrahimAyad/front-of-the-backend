import { getSchemaAwareClient } from './db/schema-aware-client'

// Export the schema-aware client as the default prisma instance
export const prisma = getSchemaAwareClient()

// For backwards compatibility, also export the client
export const db = prisma

// Export the individual schema clients for direct access if needed
export const sharedClient = prisma.getClient(false) // Write client for shared schema
export const tenantClient = prisma.getClient(false) // Write client for tenant schema  
export const analyticsClient = prisma.getClient(true) // Read client for analytics (read-only)

// Health check utility
export const checkDatabaseHealth = async () => {
  return await prisma.healthCheck()
}