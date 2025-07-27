# PostgreSQL Connection Resilience Documentation

## Overview

This document describes the PostgreSQL connection resilience implementation for the KCT Menswear backend, designed to handle connection issues, prevent failures, and maintain 99%+ availability.

## Architecture

### 1. Circuit Breaker Pattern
- **Purpose**: Prevent cascading failures by failing fast when database is unavailable
- **Configuration**:
  - Failure threshold: 5 failures within 1 minute
  - Reset timeout: 30 seconds
  - Half-open test limit: 3 requests
- **States**:
  - `CLOSED`: Normal operation
  - `OPEN`: Failing, reject all requests
  - `HALF_OPEN`: Testing recovery

### 2. Retry Logic
- **Exponential backoff** with jitter
- **Retryable errors**:
  - Connection errors (ECONNRESET, ECONNREFUSED)
  - Pool exhaustion (too many connections)
  - Transient failures (deadlocks, timeouts)
- **Configuration**:
  - Max retries: 3-10 depending on error type
  - Initial delay: 500-2000ms
  - Max delay: 30-60 seconds

### 3. Connection Monitoring
- **Real-time metrics**:
  - Pool utilization
  - Active/idle connections
  - Query performance
  - Error rates
- **Alerts**:
  - High utilization (>80%)
  - Connection storms
  - Slow queries (>1s)
  - Health score degradation

### 4. Pool Optimization
- **Environment-specific settings**:
  - Production: Aggressive timeouts, high concurrency
  - Staging: Moderate settings
  - Development: Relaxed for debugging
- **Platform optimizations**:
  - Railway: 18 connections (20 limit - 2 reserved)
  - Heroku: Similar constraints
  - AWS RDS: Higher limits based on instance

## Implementation

### Resilient Client Usage

```typescript
import { getResilientPrismaClient } from './lib/db/resilient-client';

const client = getResilientPrismaClient();

// All operations automatically wrapped with resilience
const users = await client.client.user.findMany();
```

### Configuration

Environment variables:
```bash
# Connection pool
DATABASE_MAX_CONNECTIONS=20
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=30000

# Platform
PLATFORM=railway
NODE_ENV=production
EXPECTED_CONCURRENCY=100
```

### Monitoring Endpoints

1. **Metrics**: `/resilience/metrics`
   - Connection pool stats
   - Circuit breaker state
   - Retry statistics
   - Recent events

2. **Health Check**: `/resilience/health`
   - Overall health status
   - Component health
   - Connection test results

3. **Reports**: `/resilience/report`
   - Detailed text report
   - Historical metrics
   - Problem analysis

4. **Configuration**: `/resilience/pool-config`
   - Current settings
   - Optimal recommendations
   - Platform-specific config

## Error Handling

### Connection Reset (ECONNRESET)
- **Strategy**: Retry with new connection
- **Max retries**: 5
- **Backoff**: 500ms initial, 1.5x factor

### Pool Exhaustion
- **Strategy**: Queue and retry with longer delays
- **Max retries**: 10
- **Backoff**: 2s initial, 2x factor

### Lock Timeout
- **Strategy**: Limited retries with backoff
- **Max retries**: 3
- **Backoff**: 1s initial, 2x factor

### Statement Timeout
- **Strategy**: Fail fast (no retry)
- **Action**: Log and return error

## PostgreSQL Settings

Recommended production settings:
```sql
-- Connection limits
max_connections = 40
superuser_reserved_connections = 3

-- Timeouts
statement_timeout = 30000
lock_timeout = 10000
idle_in_transaction_session_timeout = 30000

-- Performance
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB

-- Logging
log_min_duration_statement = 1000
log_connections = on
log_disconnections = on
log_lock_waits = on
```

## Monitoring Dashboard

### Key Metrics
1. **Connection Pool**
   - Utilization percentage
   - Active vs idle connections
   - Queue depth
   - Wait times

2. **Circuit Breaker**
   - Current state
   - Failure count
   - Success rate
   - State transitions

3. **Query Performance**
   - Average query time
   - Slow query count
   - Query distribution
   - Error rates

4. **Health Score**
   - Overall score (0-100)
   - Component health
   - Recent issues
   - Recommendations

## Troubleshooting

### High Connection Usage
1. Check for connection leaks
2. Review transaction handling
3. Optimize query patterns
4. Scale connection pool

### Connection Storms
1. Implement rate limiting
2. Add request queuing
3. Review client retry logic
4. Check for thundering herd

### Slow Queries
1. Add missing indexes
2. Optimize query structure
3. Review data access patterns
4. Consider caching

### Circuit Breaker Open
1. Check database health
2. Review error logs
3. Test connectivity
4. Wait for auto-recovery

## Best Practices

1. **Always use resilient client** for database operations
2. **Monitor metrics** continuously
3. **Set appropriate timeouts** for your use case
4. **Handle errors gracefully** in application code
5. **Test failure scenarios** regularly
6. **Keep connections warm** with health checks
7. **Implement graceful degradation** for features
8. **Use read replicas** for read-heavy workloads

## Testing

### Manual Tests
```bash
# Test circuit breaker
curl -X POST http://localhost:3001/resilience/test/circuit-breaker \
  -H "Content-Type: application/json" \
  -d '{"simulateFailures": 5}'

# Test retry logic
curl -X POST http://localhost:3001/resilience/test/retry \
  -H "Content-Type: application/json" \
  -d '{"failTimes": 2}'

# Connection test
curl http://localhost:3001/resilience/connection-test
```

### Load Testing
```bash
# Simulate high load
ab -n 1000 -c 50 http://localhost:3001/resilience/health

# Monitor during test
watch -n 1 curl -s http://localhost:3001/resilience/metrics
```

## Success Metrics

Target metrics for production:
- **Connection success rate**: >99%
- **Average query time**: <100ms
- **Circuit breaker uptime**: >99.9%
- **Zero user-facing errors** from connection issues
- **Recovery time**: <30 seconds
- **Health score**: >80

## Future Improvements

1. **Connection pooling** with PgBouncer
2. **Read replica** support
3. **Automatic scaling** based on load
4. **Predictive failure detection**
5. **Advanced query optimization**
6. **Multi-region failover**