# Product Sync & Hold Management Architecture

## Overview
This document outlines the synchronization strategy between MacOS Admin Panel and front-of-backend.

## Data Types & Sync Strategy

### 1. Products (Cache Locally)
- **Sync Frequency**: Every 5-10 minutes
- **Storage**: PostgreSQL/MongoDB
- **Usage**: Display, search, outfit building

```typescript
// Sync products periodically
setInterval(async () => {
  await productSyncService.syncFromMacOSAdmin();
}, 5 * 60 * 1000); // 5 minutes
```

### 2. Inventory (Real-time Only)
- **Never cache inventory levels**
- **Always check before operations**
- **Critical for accurate availability**

```typescript
// Always check real-time
const availability = await macosAdmin.checkAvailability(items);
```

### 3. Holds (Hybrid Approach)
- **Create in MacOS Admin**: Source of truth
- **Track locally**: References and metadata
- **Validate periodically**: Ensure consistency

## Implementation Classes

### ProductSyncService
```typescript
class ProductSyncService {
  private apiKey = '34bae7d25bc74fd286bab1ce3355bac1';
  
  async syncFromMacOSAdmin() {
    const products = await fetch('http://localhost:8080/api/products', {
      headers: { 'X-API-Key': this.apiKey }
    }).then(r => r.json());
    
    // Save to database
    await this.saveToDatabase(products);
    
    // Update last sync time
    await this.updateSyncMetadata();
    
    return products;
  }
  
  async saveToDatabase(products: Product[]) {
    const operations = products.map(product => ({
      updateOne: {
        filter: { sku: product.sku },
        update: { $set: product },
        upsert: true
      }
    }));
    
    await db.products.bulkWrite(operations);
  }
}
```

### HoldManager
```typescript
class HoldManager {
  private localHolds = new Map<string, LocalHold>();
  private macosClient: MacOSAdminClient;
  
  async createOutfitHold(outfit: Outfit, sessionId: string) {
    // 1. Validate availability first
    const availability = await this.macosClient.checkAvailability(outfit.items);
    
    if (!this.allItemsAvailable(availability)) {
      throw new InsufficientInventoryError(availability);
    }
    
    // 2. Create hold in MacOS Admin
    const hold = await this.macosClient.createHold({
      items: outfit.items,
      sessionId,
      customerId: outfit.customerId,
      duration: 1800 // 30 minutes
    });
    
    // 3. Store reference locally
    this.localHolds.set(hold.holdId, {
      ...hold,
      outfitId: outfit.id,
      createdAt: new Date(),
      expiresAt: new Date(hold.expiresAt * 1000)
    });
    
    // 4. Schedule expiration handling
    this.scheduleExpiration(hold.holdId);
    
    return hold;
  }
  
  private scheduleExpiration(holdId: string) {
    setTimeout(() => {
      this.localHolds.delete(holdId);
      // Notify UI to refresh availability
      this.emit('hold:expired', holdId);
    }, 29 * 60 * 1000); // 29 minutes (1 min buffer)
  }
}
```

## Sync Schedule

| Data Type | Sync Method | Frequency | Storage |
|-----------|-------------|-----------|---------|
| Products | Pull | 5 mins | Database |
| Categories | Pull | 10 mins | Database |
| Inventory | Real-time | On-demand | None |
| Holds | Push/Pull | Real-time | Memory + Refs |
| Orders | Push | On creation | Database |

## Error Handling

### MacOS Admin Unavailable
```typescript
class FallbackStrategy {
  async getProducts() {
    // 1. Try MacOS Admin
    try {
      return await macosAdmin.getProducts();
    } catch (error) {
      // 2. Fall back to cached data
      console.warn('Using cached products, MacOS Admin unavailable');
      return await db.products.find().sort({ updatedAt: -1 });
    }
  }
  
  async checkAvailability(items) {
    // No fallback for inventory - must be real-time
    throw new ServiceUnavailableError('Inventory check requires MacOS Admin');
  }
}
```

## Best Practices

1. **Always validate inventory before checkout**
2. **Never trust cached inventory levels**
3. **Implement retry logic for transient failures**
4. **Log all hold operations for debugging**
5. **Monitor sync health with metrics**

## Future Enhancements

1. **Webhook Support**: Real-time product updates
2. **Hold Persistence**: Survive MacOS Admin restarts
3. **Distributed Caching**: Redis for shared state
4. **Event Sourcing**: Complete hold history