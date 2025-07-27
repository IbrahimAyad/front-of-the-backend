# Performance Optimization & Redis Caching

## Overview

This implementation provides comprehensive performance optimization for the KCT Menswear e-commerce platform, including Redis caching, query optimization, and performance monitoring.

## Key Features

### 1. Redis Caching Layer

#### Cache Services
- **CacheService** (`src/services/cache/cacheService.ts`): Core caching functionality with TTL management
- **CachedProductService** (`src/services/product/cachedProductService.ts`): Product catalog caching
- **CachedPricingService** (`src/services/pricing/cachedPricingService.ts`): Pricing rules and bundle calculations

#### Cache TTLs
- Product Catalog: 5 minutes
- Bundle Calculations: 1 hour  
- Pricing Rules: 10 minutes
- Popular Searches: 30 minutes
- User Sessions: 15 minutes

#### Cache Keys Pattern
```typescript
products:${id}              // Individual product
products:category:${cat}    // Products by category
products:search:${query}    // Search results
bundles:calc:${ids}         // Bundle calculations
pricing:rules:active        // Active pricing rules
```

### 2. Cache Invalidation

Automatic cache invalidation on:
- Product updates → Invalidates product and category caches
- Pricing rule changes → Invalidates pricing and bundle caches
- Order creation → Invalidates inventory-related caches
- Collection updates → Invalidates product listing caches

### 3. Performance Monitoring

#### Real-time Metrics
- Request duration tracking (p50, p95, p99)
- Cache hit/miss rates
- Slow query detection (>1s)
- Database query counting

#### Endpoints
- `GET /performance/stats` - Detailed performance statistics
- `GET /performance/realtime` - Real-time metrics (last 5 mins)
- `GET /cache/stats` - Cache hit rates by pattern

### 4. Database Optimization

#### Indexes Added
- Product searches: `idx_products_category_status`, `idx_products_name_search`
- Performance: `idx_products_price`, `idx_products_created_at`
- Relations: `idx_product_variants_product_id`, `idx_product_images_product_id`
- Orders: `idx_orders_customer_status`, `idx_orders_created_at`

#### Materialized Views
- `mv_product_catalog` - Pre-aggregated product data with ratings
- `mv_customer_summary` - Customer lifetime value and segments
- `mv_daily_sales` - Daily sales aggregations
- `mv_product_bundles` - Frequently bought together
- `mv_inventory_status` - Real-time inventory tracking

### 5. Cache Warming Strategy

On startup, pre-warms:
- Products by major categories (suits, shirts, accessories)
- Featured products
- Active pricing rules
- Popular search terms

## API Usage

### Cached Product Endpoints

```bash
# Get cached product
GET /api/cached/products/:id

# Get products by category (cached)
GET /api/cached/products/category/:category?limit=20&offset=0

# Search products (cached for simple searches)
GET /api/cached/products/search?search=suit&limit=10

# Get featured products (cached)
GET /api/cached/products/featured

# Calculate bundle price (cached)
POST /api/cached/products/bundle/calculate
{
  "products": [
    { "id": "123", "quantity": 1 },
    { "id": "456", "quantity": 2 }
  ]
}
```

### Cache Management

```bash
# Get cache statistics
GET /cache/stats

# Invalidate cache (Admin only)
POST /cache/invalidate
{
  "type": "products",  // products, pricing, or all
  "id": "optional-product-id"
}

# Reset cache statistics
POST /cache/stats/reset
```

### Performance Monitoring

```bash
# Get performance stats
GET /performance/stats?since=2024-01-01

# Get real-time metrics
GET /performance/realtime

# Clear performance metrics (Admin only)
POST /performance/clear
```

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Cache Settings
CACHE_WARMUP=true  # Enable cache warming on startup

# Performance Settings
SLOW_QUERY_THRESHOLD=1000  # ms
```

### Performance Targets

- **Cache Hit Rate**: 90%+ for product catalog
- **Response Time**: <100ms for cached queries
- **Complex Calculations**: <500ms for bundle pricing
- **Database Queries**: <50ms p95

## Implementation Details

### Request Flow

1. Request arrives → Performance timer starts
2. Check Redis cache → Return if hit
3. Query database → Use connection pool
4. Store in cache → Set appropriate TTL
5. Return response → Log performance metrics

### Cache Invalidation Flow

1. Mutation request detected
2. Post-request hook triggered
3. Identify affected cache keys
4. Delete specific patterns
5. Log invalidation events

### Monitoring Dashboard

Real-time monitoring provides:
- Average response times
- Requests per minute
- Cache hit rates
- Slow query alerts
- Health status indicators

## Best Practices

1. **Cache Keys**: Use consistent, hierarchical key patterns
2. **TTL Selection**: Balance freshness vs performance
3. **Invalidation**: Invalidate specific keys, not entire cache
4. **Monitoring**: Watch cache hit rates and adjust TTLs
5. **Warming**: Pre-warm critical data on deployment

## Troubleshooting

### Low Cache Hit Rate
- Check if TTLs are too short
- Verify cache warming is enabled
- Look for excessive invalidations

### Slow Queries
- Check database indexes
- Verify materialized views are refreshed
- Monitor connection pool usage

### High Memory Usage
- Review cache key patterns
- Implement cache size limits
- Monitor Redis memory stats