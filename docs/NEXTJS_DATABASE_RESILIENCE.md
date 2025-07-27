# Next.js Database Resilience

This guide explains how to use the PostgreSQL resilience system in Next.js applications.

## Overview

The resilience system has been adapted for Next.js and serverless environments with:
- **Singleton pattern** for connection reuse
- **Serverless-optimized** circuit breaker
- **Edge-compatible** monitoring
- **Simplified API** for common operations

## Quick Start

### Basic Usage

```typescript
import { withDatabase, dbQueries } from '@/lib/db/nextjs';

// API Route Example
export default async function handler(req, res) {
  try {
    // Method 1: Using wrapper function
    const users = await withDatabase(async (db) => {
      return db.user.findMany({
        where: { isActive: true },
        take: 10
      });
    });

    // Method 2: Using query helpers
    const user = await dbQueries.findUnique('user', { id: req.query.id });

    res.json({ users, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Server Components

```typescript
import { dbQueries } from '@/lib/db/nextjs';

export default async function UsersPage() {
  const users = await dbQueries.findMany('user', {
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Transactions

```typescript
import { withTransaction } from '@/lib/db/nextjs';

export async function createOrder(orderData: any) {
  return withTransaction(async (tx) => {
    // All operations use the same transaction
    const order = await tx.order.create({
      data: orderData
    });

    await tx.inventory.updateMany({
      where: { productId: orderData.productId },
      data: { quantity: { decrement: orderData.quantity } }
    });

    return order;
  });
}
```

## Features

### 1. Automatic Resilience

All database operations automatically include:
- **Circuit breaker** protection
- **Retry logic** with exponential backoff
- **Connection monitoring**
- **Error tracking**

### 2. Serverless Optimizations

- Lower connection limits (5 vs 20)
- Faster timeouts (10s vs 30s)
- No prepared statements
- PgBouncer compatibility

### 3. Edge Runtime Support

The circuit breaker can use Vercel KV for state persistence across edge function invocations:

```typescript
// Automatically uses KV in production
const metrics = await resilientDb.getMetrics();
```

### 4. Built-in Monitoring

```typescript
// Health check endpoint
// GET /api/db/health
{
  "status": "healthy",
  "database": {
    "connected": true,
    "latency": 23
  },
  "resilience": {
    "circuitBreaker": {
      "state": "CLOSED",
      "failures": 0
    }
  }
}

// Metrics endpoint  
// GET /api/db/metrics
{
  "circuitBreaker": { ... },
  "retry": { ... },
  "connection": {
    "healthScore": 95,
    "totalQueries": 1234,
    "averageQueryTime": 45
  },
  "performance": {
    "slowQueries": [...],
    "recentQueries": [...]
  }
}
```

## Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/db

# Optional (with defaults)
DATABASE_MAX_CONNECTIONS=5        # Lower for serverless
DATABASE_CONNECTION_TIMEOUT=10000 # 10 seconds
DATABASE_STATEMENT_TIMEOUT=10000  # 10 seconds
DATABASE_IDLE_TIMEOUT=10000       # 10 seconds
```

### Custom Configuration

```typescript
import { getResilientPrismaClient } from '@/lib/db/nextjs';

const customDb = getResilientPrismaClient({
  maxConnections: 10,
  enableCircuitBreaker: true,
  enableRetry: true,
  enableMonitoring: false, // Disable in development
  slowQueryThreshold: 1000
});
```

## Best Practices

### 1. Use Wrapper Functions

Always use the provided wrappers for automatic error handling:

```typescript
// ✅ Good
const users = await withDatabase(async (db) => {
  return db.user.findMany();
});

// ❌ Avoid direct access
const users = await resilientDb.client.user.findMany();
```

### 2. Handle Errors Gracefully

```typescript
export default async function handler(req, res) {
  try {
    const data = await withDatabase(async (db) => {
      return db.user.findUnique({ where: { id: req.query.id } });
    });
    
    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(data);
  } catch (error) {
    // Circuit breaker will handle retries
    // Just return error to client
    res.status(503).json({ 
      error: 'Service temporarily unavailable' 
    });
  }
}
```

### 3. Optimize for Serverless

```typescript
// Use select to reduce data transfer
const users = await dbQueries.findMany('user', {
  select: {
    id: true,
    name: true,
    email: true
  },
  take: 10
});

// Avoid N+1 queries with includes
const posts = await dbQueries.findMany('post', {
  include: {
    author: true,
    comments: {
      take: 5
    }
  }
});
```

### 4. Monitor Performance

```typescript
import { withDatabase } from '@/lib/db/nextjs';

export async function getSlowQueryReport() {
  const metrics = resilientDb.getMetrics();
  
  if (metrics.connection) {
    // @ts-ignore
    const slowQueries = resilientDb.connectionMonitor?.getSlowQueries(10);
    
    return slowQueries?.map(q => ({
      query: q.query,
      duration: q.duration,
      timestamp: q.timestamp
    }));
  }
  
  return [];
}
```

## Troubleshooting

### Circuit Breaker Open

```typescript
// Check circuit breaker state
const metrics = resilientDb.getMetrics();
if (metrics.circuitBreaker.state === 'OPEN') {
  console.log('Circuit breaker is open, will retry in:', 
    metrics.circuitBreaker.resetTimeout);
}
```

### Connection Issues

```typescript
// Manual health check
const health = await checkDatabaseHealth();
console.log('Database health:', health);

// Reset circuit breaker if needed
await resilientDb.circuitBreaker.reset();
```

### Slow Queries

Enable slow query logging:

```typescript
// In development, check console for warnings
// [ResilientClient] Slow query: duration=1234ms
```

## Migration from Standard Prisma

```typescript
// Before
import { prisma } from '@/lib/prisma';
const users = await prisma.user.findMany();

// After
import { withDatabase } from '@/lib/db/nextjs';
const users = await withDatabase(db => db.user.findMany());
```

## Performance Tips

1. **Connection Pooling**: Use PgBouncer for better connection management
2. **Caching**: Add Redis/Vercel KV for frequently accessed data
3. **Indexes**: Ensure proper database indexes for common queries
4. **Pagination**: Always use `take` and `skip` for large datasets
5. **Select Fields**: Only select needed fields to reduce payload

## Example: Complete API Route

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { withDatabase, dbQueries } from '@/lib/db/nextjs';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add request ID for tracing
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  
  try {
    switch (req.method) {
      case 'GET':
        const users = await dbQueries.findMany('user', {
          select: { id: true, name: true, email: true },
          orderBy: { createdAt: 'desc' },
          take: 20
        });
        return res.json({ users, requestId });

      case 'POST':
        const data = createUserSchema.parse(req.body);
        
        const user = await withDatabase(async (db) => {
          // Check if email exists
          const existing = await db.user.findUnique({
            where: { email: data.email }
          });
          
          if (existing) {
            throw new Error('Email already exists');
          }
          
          return db.user.create({ data });
        });
        
        return res.status(201).json({ user, requestId });

      default:
        return res.status(405).json({ 
          error: 'Method not allowed',
          requestId 
        });
    }
  } catch (error) {
    console.error(`[API] Request ${requestId} failed:`, error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors,
        requestId 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      requestId 
    });
  }
}
```