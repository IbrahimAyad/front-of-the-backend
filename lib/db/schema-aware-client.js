"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaAwareClient = exports.schemaConfig = void 0;
exports.getSchemaAwareClient = getSchemaAwareClient;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
exports.schemaConfig = {
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
};
class SchemaAwareClient {
    constructor() {
        // Initialize write client
        this.writeClient = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        // Initialize read client (uses read replica if available)
        this.readClient = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL
                }
            }
        });
        // Direct pool for complex queries
        this.directPool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });
    }
    // Get appropriate client based on operation
    getClient(readonly = false) {
        return readonly ? this.readClient : this.writeClient;
    }
    // Schema-aware query wrapper
    async query(sql, params = [], schema) {
        const client = await this.directPool.connect();
        try {
            if (schema) {
                await client.query(`SET search_path TO ${schema}, public`);
            }
            const result = await client.query(sql, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    // Products (tenant_shared schema)
    get products() {
        return {
            findMany: async (args) => {
                return this.readClient.product.findMany(args);
            },
            findUnique: async (args) => {
                return this.readClient.product.findUnique(args);
            },
            create: async (args) => {
                return this.writeClient.product.create(args);
            },
            update: async (args) => {
                return this.writeClient.product.update(args);
            },
            delete: async (args) => {
                return this.writeClient.product.delete(args);
            }
        };
    }
    // Customers (tenant_kct schema)
    get customers() {
        return {
            findMany: async (args) => {
                return this.readClient.customer.findMany(args);
            },
            findUnique: async (args) => {
                return this.readClient.customer.findUnique(args);
            },
            create: async (args) => {
                return this.writeClient.customer.create(args);
            },
            update: async (args) => {
                return this.writeClient.customer.update(args);
            },
            delete: async (args) => {
                return this.writeClient.customer.delete(args);
            }
        };
    }
    // Orders (tenant_kct schema)
    get orders() {
        return {
            findMany: async (args) => {
                return this.readClient.order.findMany(args);
            },
            findUnique: async (args) => {
                return this.readClient.order.findUnique(args);
            },
            create: async (args) => {
                return this.writeClient.order.create(args);
            },
            update: async (args) => {
                return this.writeClient.order.update(args);
            },
            delete: async (args) => {
                return this.writeClient.order.delete(args);
            }
        };
    }
    // Analytics queries (analytics schema)
    async getCustomerInsights(customerId) {
        return this.query(`
      SELECT * FROM analytics.customer_insights 
      WHERE customer_id = $1
    `, [customerId], 'analytics');
    }
    async getProductRecommendations(customerId) {
        return this.query(`
      SELECT * FROM analytics.product_recommendations 
      WHERE customer_id = $1 AND is_active = true
      ORDER BY priority DESC
      LIMIT 10
    `, [customerId], 'analytics');
    }
    // Health check for all schemas
    async healthCheck() {
        const schemas = ['public', 'tenant_shared', 'tenant_kct', 'analytics'];
        const results = {};
        for (const schema of schemas) {
            try {
                await this.query(`SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`, [schema]);
                results[schema] = true;
            }
            catch (error) {
                results[schema] = false;
            }
        }
        return results;
    }
    // Disconnect all clients
    async disconnect() {
        await Promise.all([
            this.writeClient.$disconnect(),
            this.readClient.$disconnect(),
            this.directPool.end()
        ]);
    }
}
exports.SchemaAwareClient = SchemaAwareClient;
// Singleton instance
let schemaAwareClient = null;
function getSchemaAwareClient() {
    if (!schemaAwareClient) {
        schemaAwareClient = new SchemaAwareClient();
    }
    return schemaAwareClient;
}
//# sourceMappingURL=schema-aware-client.js.map