# MacOS Admin Panel Integration - Future Reference

## Overview
This document preserves the MacOS Admin Panel integration work for future implementation. The integration was fully designed and partially implemented but postponed to focus on core features.

## Integration Architecture

### What Was Built

1. **MacOS Admin Client** (`src/services/macosAdminClient.ts`)
   - Full API client for MacOS Admin endpoints
   - Support for inventory checks, holds, and product sync
   - Handles authentication with API keys

2. **Product Sync Service** (`src/services/productSyncService.ts`)
   - Automatic 5-minute sync intervals
   - Fallback to cached data
   - Event-driven sync status tracking

3. **Outfit Service Integration** (`src/services/outfitService.ts`)
   - Standing holds for guaranteed availability
   - Allocation from standing holds
   - Hold tracking and expiration

4. **API Endpoints**
   - `/api/sync/*` - Sync endpoints
   - `/api/webhooks/products` - Webhook receiver
   - Integration with outfit system

## Environment Variables Needed

```env
# MacOS Admin Integration
MACOS_ADMIN_URL="http://localhost:8080"
MACOS_ADMIN_API_KEY="34bae7d25bc74fd286bab1ce3355bac1"
BACKEND_API_KEY="0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75"

# Product Sync Configuration
ENABLE_AUTO_SYNC=true
PRODUCT_SYNC_INTERVAL=5  # minutes
```

## Key Integration Points

### 1. Authentication Flow
- **Backend → MacOS Admin**: Uses `MACOS_ADMIN_API_KEY`
- **MacOS Admin → Backend**: Uses `BACKEND_API_KEY`

### 2. Hold System
- **Temporary Holds**: 30-minute duration for checkout
- **Standing Holds**: Permanent holds for outfit templates
- **Hold Types**: temporary, standing, reservation

### 3. Data Sync Strategy
- **Products**: Cache locally, sync every 5 minutes
- **Inventory**: Always check real-time
- **Holds**: Track references locally

## MacOS Admin Endpoints

```typescript
// Available endpoints from MacOS Admin
GET  /api/products                    // Product catalog
GET  /api/inventory                   // Inventory levels
POST /api/inventory/check-availability // Batch availability check
POST /api/inventory/hold              // Create hold
GET  /api/inventory/hold/:id          // Check hold status
DELETE /api/inventory/hold/:id        // Release hold
POST /api/inventory/hold/allocate     // Allocate from standing hold
GET  /api/inventory/holds/standing    // List standing holds
```

## Implementation Checklist

When ready to integrate:

1. [ ] Uncomment MacOS integration code
2. [ ] Add environment variables
3. [ ] Run initial product sync
4. [ ] Test hold creation and expiration
5. [ ] Set up webhook endpoints
6. [ ] Configure standing holds for outfits
7. [ ] Test failover scenarios

## Benefits of Integration

1. **Multi-Channel Inventory**: Sync between physical store and online
2. **Guaranteed Availability**: Standing holds for popular outfits
3. **Real-Time Updates**: WebSocket support for instant changes
4. **Centralized Truth**: Single source for inventory data

## Migration Strategy

```typescript
// Add these fields to Product model when ready
model Product {
  // ... existing fields
  syncWithMacOS    Boolean @default(false)
  macosAdminId     String?
  lastSyncedAt     DateTime?
  macosMetadata    Json?
}

// Add to Outfit model
model OutfitTemplate {
  // ... existing fields
  standingHoldId   String?
  holdSyncEnabled  Boolean @default(false)
}
```

## Files to Uncomment

1. `src/services/macosAdminClient.ts` - Full client implementation
2. `src/services/productSyncService.ts` - Sync logic (partial)
3. `src/plugins/syncScheduler.ts` - Auto-sync scheduler
4. `src/services/outfitService.ts` - Standing hold methods
5. `src/routes/sync.ts` - Sync endpoints

## Testing the Integration

```bash
# 1. Test connection
curl http://localhost:8080/api/products \
  -H "X-API-Key: 34bae7d25bc74fd286bab1ce3355bac1"

# 2. Test hold creation
curl -X POST http://localhost:8080/api/inventory/hold \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 34bae7d25bc74fd286bab1ce3355bac1" \
  -d '{"items":[{"sku":"SUIT-001","quantity":1}],"duration":1800}'

# 3. Check sync status
curl http://localhost:8000/api/sync/status
```

## Architecture Decisions

1. **Why Separate Systems**: MacOS Admin owns inventory truth, we own business logic
2. **Why Standing Holds**: Guarantee outfit availability without constant checks
3. **Why 5-Minute Sync**: Balance between freshness and API load
4. **Why Local Hold Tracking**: Survive MacOS Admin restarts

## Future Enhancements

1. **WebSocket Integration**: Real-time inventory updates
2. **Webhook Processing**: Push updates from MacOS Admin
3. **Conflict Resolution**: Handle concurrent modifications
4. **Analytics Integration**: Track hold conversion rates

---

**Note**: This integration was designed in collaboration with the MacOS Admin team on January 23, 2025. All endpoints and authentication flows were tested and confirmed working.