# Multi-Schema Database Architecture Implementation Plan

## Current State
- Single PostgreSQL database with all tables in one schema
- 37 products, 544 variants, 3,369 customers
- Railway deployment with connection pooling issues
- Successfully migrated from Fastify to Next.js

## Target Architecture: Multi-Schema Separation

### 1. Schema Organization

```sql
-- Core Schemas
public          -- Default schema for shared/system tables
tenant_shared   -- Shared product catalog, suppliers
tenant_kct      -- KCT Menswear specific data
analytics       -- Reporting and analytics tables
cache           -- Materialized views for performance
audit           -- Audit logs and change tracking
```

### 2. Implementation Phases

#### Phase 1: Schema Separation (Week 1)
**Priority: HIGH**
```typescript
// 1. Create new schemas
CREATE SCHEMA IF NOT EXISTS tenant_shared;
CREATE SCHEMA IF NOT EXISTS tenant_kct;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS cache;
CREATE SCHEMA IF NOT EXISTS audit;

// 2. Grant permissions
GRANT ALL ON SCHEMA tenant_shared TO kct_app;
GRANT ALL ON SCHEMA tenant_kct TO kct_app;
GRANT SELECT ON SCHEMA analytics TO kct_readonly;
```

**Tables to Move:**
- `tenant_shared`: products, product_variants, suppliers, collections
- `tenant_kct`: customers, orders, appointments, measurements
- `analytics`: customer_insights, product_recommendations
- `audit`: (new) audit_log, change_history

#### Phase 2: Read/Write Splitting (Week 2)
**Priority: HIGH**
```typescript
// Database connections configuration
export const dbConfig = {
  writer: {
    connectionString: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 }
  },
  reader: {
    connectionString: process.env.DATABASE_READONLY_URL,
    pool: { min: 5, max: 20 }
  }
}

// Prisma client factory
export function createPrismaClient(readonly = false) {
  return new PrismaClient({
    datasources: {
      db: {
        url: readonly ? dbConfig.reader.connectionString : dbConfig.writer.connectionString
      }
    }
  })
}
```

#### Phase 3: Connection Pooling Optimization (Week 2)
**Priority: HIGH**
```typescript
// lib/db/connection-pool.ts
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

export class DatabasePool {
  private writePool: Pool
  private readPool: Pool
  private prismaWrite: PrismaClient
  private prismaRead: PrismaClient

  constructor() {
    // PgBouncer configuration for Railway
    this.writePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      application_name: 'kct_nextjs_writer'
    })

    this.readPool = new Pool({
      connectionString: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL,
      max: 50,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 2000,
      application_name: 'kct_nextjs_reader'
    })
  }

  async healthCheck() {
    const writeCheck = await this.writePool.query('SELECT 1')
    const readCheck = await this.readPool.query('SELECT 1')
    return { write: !!writeCheck, read: !!readCheck }
  }
}
```

#### Phase 4: Migration Strategy (Week 3)
**Priority: MEDIUM**

1. **Create Migration Scripts**
```typescript
// migrations/001_create_schemas.sql
CREATE SCHEMA IF NOT EXISTS tenant_shared;
CREATE SCHEMA IF NOT EXISTS tenant_kct;
CREATE SCHEMA IF NOT EXISTS analytics;

// migrations/002_move_tables.sql
ALTER TABLE products SET SCHEMA tenant_shared;
ALTER TABLE product_variants SET SCHEMA tenant_shared;
ALTER TABLE customers SET SCHEMA tenant_kct;
ALTER TABLE orders SET SCHEMA tenant_kct;
```

2. **Update Prisma Schema**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "tenant_shared", "tenant_kct", "analytics", "cache", "audit"]
}

model Product {
  id   String @id @default(cuid())
  // ... fields
  @@schema("tenant_shared")
}

model Customer {
  id   String @id @default(cuid())
  // ... fields
  @@schema("tenant_kct")
}
```

#### Phase 5: Monitoring & Alerting (Week 3)
**Priority: MEDIUM**

```typescript
// lib/db/monitoring.ts
export class DatabaseMonitor {
  async checkConnectionHealth() {
    const metrics = {
      activeConnections: 0,
      idleConnections: 0,
      waitingQueries: 0,
      slowQueries: [],
      schemaStats: {}
    }

    // Monitor each schema
    const schemas = ['public', 'tenant_shared', 'tenant_kct']
    for (const schema of schemas) {
      const stats = await this.getSchemaStats(schema)
      metrics.schemaStats[schema] = stats
    }

    return metrics
  }

  async getSchemaStats(schema: string) {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = $1
    `
    return await this.db.$queryRaw(query, schema)
  }
}
```

## Implementation Steps

### Step 1: Database Preparation
```bash
# 1. Create backup
pg_dump $DATABASE_URL > backup_before_schema_migration.sql

# 2. Create read replica on Railway
railway postgres:create-replica

# 3. Test connection to replica
psql $DATABASE_READONLY_URL -c "SELECT 1"
```

### Step 2: Schema Migration
```typescript
// scripts/migrate-to-multi-schema.ts
async function migrateToMultiSchema() {
  // 1. Create schemas
  await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS tenant_shared`
  await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS tenant_kct`
  
  // 2. Move tables with transaction
  await prisma.$transaction(async (tx) => {
    // Product tables to tenant_shared
    await tx.$executeRaw`ALTER TABLE products SET SCHEMA tenant_shared`
    await tx.$executeRaw`ALTER TABLE product_variants SET SCHEMA tenant_shared`
    
    // Customer tables to tenant_kct
    await tx.$executeRaw`ALTER TABLE customers SET SCHEMA tenant_kct`
    await tx.$executeRaw`ALTER TABLE orders SET SCHEMA tenant_kct`
  })
  
  // 3. Update search paths
  await prisma.$executeRaw`ALTER DATABASE kct_production SET search_path TO public, tenant_shared, tenant_kct`
}
```

### Step 3: Update Application Code
```typescript
// lib/db/schema-aware-client.ts
export class SchemaAwareClient {
  private clients: Map<string, PrismaClient> = new Map()
  
  getClient(schema: string): PrismaClient {
    if (!this.clients.has(schema)) {
      this.clients.set(schema, new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
            schema: schema
          }
        }
      }))
    }
    return this.clients.get(schema)!
  }
  
  // Usage
  async getProducts() {
    const client = this.getClient('tenant_shared')
    return await client.product.findMany()
  }
  
  async getCustomers() {
    const client = this.getClient('tenant_kct')
    return await client.customer.findMany()
  }
}
```

### Step 4: Connection Pool Configuration
```typescript
// lib/db/pgbouncer-config.ts
export const pgBouncerConfig = {
  // Transaction pooling for write operations
  writer: {
    pool_mode: 'transaction',
    max_client_conn: 100,
    default_pool_size: 25,
    reserve_pool_size: 5,
    reserve_pool_timeout: 5,
    server_lifetime: 3600,
    server_idle_timeout: 600
  },
  // Session pooling for read operations
  reader: {
    pool_mode: 'session',
    max_client_conn: 200,
    default_pool_size: 50,
    reserve_pool_size: 10,
    server_lifetime: 7200,
    server_idle_timeout: 900
  }
}
```

## Benefits of Multi-Schema Architecture

1. **Performance Isolation**: Product catalog queries don't impact customer transactions
2. **Security**: Role-based access per schema
3. **Scalability**: Easy to shard by schema
4. **Maintenance**: Vacuum/analyze per schema
5. **Multi-tenancy Ready**: Add new tenants as new schemas

## Rollback Plan

```sql
-- If migration fails, move tables back
BEGIN;
ALTER TABLE tenant_shared.products SET SCHEMA public;
ALTER TABLE tenant_shared.product_variants SET SCHEMA public;
ALTER TABLE tenant_kct.customers SET SCHEMA public;
ALTER TABLE tenant_kct.orders SET SCHEMA public;
COMMIT;
```

## Success Metrics

- [ ] All tables successfully migrated to appropriate schemas
- [ ] Read/write splitting operational
- [ ] Connection pool errors reduced by 80%
- [ ] Query performance improved by 30%
- [ ] Zero downtime during migration

## Next Steps After Implementation

1. Implement caching layer with Redis for frequent queries
2. Add database sharding for horizontal scaling
3. Implement event sourcing for audit trail
4. Add real-time replication for analytics