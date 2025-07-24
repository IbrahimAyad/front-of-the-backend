# Tie Database Integration Plan

## Integration Strategy

### 1. **Smart Products Architecture Extension**
Since we've already established smart products for suits, ties should follow the same pattern:

```typescript
// Tie Smart Attributes
{
  // Style Intelligence
  width_category: "regular" | "skinny" | "medium" | "bow",
  width_inches: 3.25 | 2.25 | 2.75 | null,
  length_inches: 58 | null,
  style_formality: 1-5,
  
  // Event Matching
  event_suitability: ["wedding", "prom", "business"],
  color_temperature: "warm" | "cool" | "neutral",
  
  // Pairing Intelligence
  suit_colors: ["navy", "charcoal", "black"],
  shirt_colors: ["white", "light-blue", "pink"],
  pattern_compatibility: ["solid", "subtle-pattern", "bold"]
}
```

### 2. **Database Schema Updates**

#### A. Extend Existing Tables
```sql
-- No new tables needed! Use existing structure
-- Products table already has all fields needed
-- Just need to add ties as new category

-- Add to ColorPalette if missing tie colors
-- Add tie-specific event profiles
-- Use OutfitComponent for tie pairing
```

#### B. Product Categorization
```typescript
// Product categories
category: "Suits" | "Ties" | "Shirts" | "Accessories"
subcategory: "Regular Ties" | "Skinny Ties" | "Bow Ties" | "Pocket Squares"
```

### 3. **Migration Approach**

#### Phase 1: Color Synchronization
- Import 61 tie colors into ColorPalette table
- Map tie color families to existing system
- Ensure hex codes are preserved

#### Phase 2: Product Import
- Import 4 tie products as smart products
- Set appropriate smart attributes
- Configure outfit role as "accent"

#### Phase 3: Variant Import
- Import 244 variants with color references
- Maintain stock levels (50 per variant)
- Preserve SKU format

#### Phase 4: Bundle System
- Create OutfitTemplate for tie bundles
- Configure "Buy 4 Get 1" pricing rules
- Link to event profiles

### 4. **Outfit Builder Integration**

```typescript
// Tie Pairing Rules
{
  "navy-suit": {
    recommended: ["burgundy-tie", "silver-tie", "navy-tie"],
    avoid: ["brown-tie", "green-tie"]
  },
  "charcoal-suit": {
    recommended: ["red-tie", "blue-tie", "silver-tie"],
    avoid: ["charcoal-tie"]
  }
}
```

### 5. **Implementation Benefits**

1. **Unified Inventory**: Single source of truth for all products
2. **Smart Pairing**: AI can suggest tie-suit combinations
3. **Bundle Optimization**: Create complete outfit bundles
4. **Event Targeting**: Match ties to suits by occasion
5. **Cross-Selling**: Automatic recommendations

### 6. **Key Decisions Needed**

1. **Pricing Strategy**: 
   - Keep tie bundles separate?
   - Or integrate into outfit bundles?

2. **Color Mapping**:
   - Map all 61 colors or select core colors?
   - How to handle near-duplicate colors?

3. **Inventory Sync**:
   - Real-time sync between databases?
   - Or one-time migration?

### 7. **Recommended Implementation Order**

1. **Update ColorPalette** with tie colors
2. **Import tie products** as smart products
3. **Create tie variants** with proper sizing
4. **Configure bundles** in OutfitTemplate
5. **Set up pairing rules** in smartAttributes
6. **Test outfit builder** with ties included

### 8. **Data Preservation**

Keep these unique tie features:
- Width specifications (2.25", 2.75", 3.25")
- Event-specific color recommendations
- Bundle configurations (Buy 4 Get 1)
- AR suitability scores (for future use)
- Care instructions

### 9. **Potential Challenges**

1. **Color Duplication**: 61 colors might overlap with suit colors
2. **SKU Conflicts**: Need to ensure unique SKUs
3. **Bundle Complexity**: Mixing product types in bundles
4. **Pricing Rules**: Dynamic pricing for bundles

### 10. **Next Steps**

1. Create migration script for ties
2. Test with small batch first
3. Validate outfit pairing logic
4. Update admin UI for tie management
5. Configure bundle pricing engine