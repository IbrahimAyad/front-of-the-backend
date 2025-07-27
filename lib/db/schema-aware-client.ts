import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

export interface SchemaConfig {
  shared: string[]    // Tables in tenant_shared schema
  tenant: string[]    // Tables in tenant_kct schema
  analytics: string[] // Tables in analytics schema
}

export const schemaConfig: SchemaConfig = {
  shared: [
    'product', 'productVariant', 'productImage', 'productReview',
    'supplier', 'purchaseOrder', 'purchaseOrderItem', 'inventoryLog',
    'stockAlert', 'collection', 'productCollection', 'colorPalette', 'eventProfile'
  ],
  tenant: [
    'customer', 'order', 'orderItem', 'appointment', 'lead', 'measurement',
    'customerProfile', 'purchaseHistory', 'savedOutfit', 'outfitTemplate', 'outfitComponent'
  ],
  analytics: [
    'customerPurchaseHistory', 'customerSizeAnalysis', 'customerInsights',
    'productRecommendations', 'customerSegment'
  ]
}

export class SchemaAwareClient {
  private writeClient: PrismaClient
  private readClient: PrismaClient
  private directPool: Pool
  
  // Expose all Prisma models through delegation
  get user() { return this.writeClient.user }
  get customer() { return this.writeClient.customer }
  get product() { return this.writeClient.product }
  get productVariant() { return this.writeClient.productVariant }
  get productImage() { return this.writeClient.productImage }
  get productReview() { return this.writeClient.productReview }
  get supplier() { return this.writeClient.supplier }
  get purchaseOrder() { return this.writeClient.purchaseOrder }
  get purchaseOrderItem() { return this.writeClient.purchaseOrderItem }
  get inventoryLog() { return this.writeClient.inventoryLog }
  get stockAlert() { return this.writeClient.stockAlert }
  get collection() { return this.writeClient.collection }
  get productCollection() { return this.writeClient.productCollection }
  get colorPalette() { return this.writeClient.colorPalette }
  get eventProfile() { return this.writeClient.eventProfile }
  get order() { return this.writeClient.order }
  get orderItem() { return this.writeClient.orderItem }
  get appointment() { return this.writeClient.appointment }
  get lead() { return this.writeClient.lead }
  get measurement() { return this.writeClient.measurement }
  get customerProfile() { return this.writeClient.customerProfile }
  get purchaseHistory() { return this.writeClient.purchaseHistory }
  get savedOutfit() { return this.writeClient.savedOutfit }
  get outfitTemplate() { return this.writeClient.outfitTemplate }
  get outfitComponent() { return this.writeClient.outfitComponent }
  get customerPurchaseHistory() { return this.writeClient.customerPurchaseHistory }
  get customerSizeAnalysis() { return this.writeClient.customerSizeAnalysis }
  get customerInsights() { return this.writeClient.customerInsights }
  get productRecommendations() { return this.writeClient.productRecommendations }
  get customerSegment() { return this.writeClient.customerSegment }
  get aiAction() { return this.writeClient.aiAction }
  
  // Transaction support
  get $transaction() { return this.writeClient.$transaction.bind(this.writeClient) }
  get $queryRaw() { return this.writeClient.$queryRaw.bind(this.writeClient) }
  get $executeRaw() { return this.writeClient.$executeRaw.bind(this.writeClient) }
  get $disconnect() { 
    return async () => {
      await Promise.all([
        this.writeClient.$disconnect(),
        this.readClient.$disconnect(),
        this.directPool.end()
      ])
    }
  }
  
  constructor() {
    // Initialize write client
    this.writeClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    
    // Initialize read client (uses read replica if available)
    this.readClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL
        }
      }
    })
    
    // Direct pool for complex queries
    this.directPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    })
  }
  
  // Get appropriate client based on operation
  getClient(readonly: boolean = false): PrismaClient {
    return readonly ? this.readClient : this.writeClient
  }
  
  // Schema-aware query wrapper
  async query<T>(sql: string, params: any[] = [], schema?: string): Promise<T[]> {
    const client = await this.directPool.connect()
    try {
      if (schema) {
        await client.query(`SET search_path TO ${schema}, public`)
      }
      const result = await client.query(sql, params)
      return result.rows as T[]
    } finally {
      client.release()
    }
  }
  
  // Read-optimized methods for common queries
  get products() {
    return {
      findMany: async (args?: any) => {
        return this.readClient.product.findMany(args)
      },
      findUnique: async (args: any) => {
        return this.readClient.product.findUnique(args)
      },
      findFirst: async (args: any) => {
        return this.readClient.product.findFirst(args)
      },
      count: async (args?: any) => {
        return this.readClient.product.count(args)
      },
      create: async (args: any) => {
        return this.writeClient.product.create(args)
      },
      update: async (args: any) => {
        return this.writeClient.product.update(args)
      },
      updateMany: async (args: any) => {
        return this.writeClient.product.updateMany(args)
      },
      delete: async (args: any) => {
        return this.writeClient.product.delete(args)
      },
      deleteMany: async (args?: any) => {
        return this.writeClient.product.deleteMany(args)
      },
      upsert: async (args: any) => {
        return this.writeClient.product.upsert(args)
      }
    }
  }
  
  // Customers (tenant_kct schema)
  get customers() {
    return {
      findMany: async (args?: any) => {
        return this.readClient.customer.findMany(args)
      },
      findUnique: async (args: any) => {
        return this.readClient.customer.findUnique(args)
      },
      findFirst: async (args: any) => {
        return this.readClient.customer.findFirst(args)
      },
      count: async (args?: any) => {
        return this.readClient.customer.count(args)
      },
      create: async (args: any) => {
        return this.writeClient.customer.create(args)
      },
      update: async (args: any) => {
        return this.writeClient.customer.update(args)
      },
      updateMany: async (args: any) => {
        return this.writeClient.customer.updateMany(args)
      },
      delete: async (args: any) => {
        return this.writeClient.customer.delete(args)
      },
      deleteMany: async (args?: any) => {
        return this.writeClient.customer.deleteMany(args)
      },
      upsert: async (args: any) => {
        return this.writeClient.customer.upsert(args)
      }
    }
  }
  
  // Orders (tenant_kct schema)
  get orders() {
    return {
      findMany: async (args?: any) => {
        return this.readClient.order.findMany(args)
      },
      findUnique: async (args: any) => {
        return this.readClient.order.findUnique(args)
      },
      findFirst: async (args: any) => {
        return this.readClient.order.findFirst(args)
      },
      count: async (args?: any) => {
        return this.readClient.order.count(args)
      },
      create: async (args: any) => {
        return this.writeClient.order.create(args)
      },
      update: async (args: any) => {
        return this.writeClient.order.update(args)
      },
      updateMany: async (args: any) => {
        return this.writeClient.order.updateMany(args)
      },
      delete: async (args: any) => {
        return this.writeClient.order.delete(args)
      },
      deleteMany: async (args?: any) => {
        return this.writeClient.order.deleteMany(args)
      },
      upsert: async (args: any) => {
        return this.writeClient.order.upsert(args)
      }
    }
  }
  
  // Analytics queries (analytics schema)
  async getCustomerInsights(customerId: string) {
    return this.query(`
      SELECT * FROM analytics.customer_insights 
      WHERE customer_id = $1
    `, [customerId], 'analytics')
  }
  
  async getProductRecommendations(customerId: string) {
    return this.query(`
      SELECT * FROM analytics.product_recommendations 
      WHERE customer_id = $1 AND is_active = true
      ORDER BY priority DESC
      LIMIT 10
    `, [customerId], 'analytics')
  }
  
  // Health check for all schemas
  async healthCheck() {
    const schemas = ['public', 'tenant_shared', 'tenant_kct', 'analytics']
    const results: Record<string, boolean> = {}
    
    for (const schema of schemas) {
      try {
        await this.query(`SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`, [schema])
        results[schema] = true
      } catch (error) {
        results[schema] = false
      }
    }
    
    return results
  }
  
  // Disconnect all clients
  async disconnect() {
    await Promise.all([
      this.writeClient.$disconnect(),
      this.readClient.$disconnect(),
      this.directPool.end()
    ])
  }
}

// Singleton instance
let schemaAwareClient: SchemaAwareClient | null = null

export function getSchemaAwareClient(): SchemaAwareClient {
  if (!schemaAwareClient) {
    schemaAwareClient = new SchemaAwareClient()
  }
  return schemaAwareClient
}