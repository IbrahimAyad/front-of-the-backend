# Dress Shirts Integration Plan

## Product Structure for Smart Integration

### 1. **Smart Attributes for Dress Shirts**
```typescript
{
  // Shirt specifications
  shirtType: "dress-shirt",
  collarType: "button-down",
  fabric: "100% Cotton Oxford",
  weave: "oxford",
  
  // Fit intelligence
  fitType: "regular" | "slim",
  fitFormality: 4, // Dress shirts are formal
  
  // Pairing rules
  suitCompatibility: {
    bestWith: ["all-suits"], // White, light blue work with everything
    goodWith: ["navy", "charcoal", "grey"],
    avoidWith: [] // Color-specific rules
  },
  
  // Tie pairing
  tieCompatibility: {
    solidTies: ["recommended"],
    patternedTies: ["depends-on-color"]
  }
}
```

### 2. **Color Pairing Matrix**

| Shirt Color | Best Suit Colors | Best Tie Colors |
|------------|------------------|-----------------|
| White | All | All colors |
| Light Blue | Navy, Charcoal, Grey | Burgundy, Navy, Red |
| Pink | Navy, Charcoal | Navy, Grey, Burgundy |
| Navy | Light Grey, Tan | Burgundy, Gold, Silver |
| Black | Black, Charcoal | Silver, White, Red |
| Lavender | Navy, Charcoal | Navy, Purple, Grey |
| Mint | Navy, Light Grey | Navy, Brown, Burgundy |

### 3. **Database Migration Strategy**

#### Phase 1: Create Shirt Products
```sql
-- 20 products (10 colors × 2 fits)
-- SKU format: KCT-DS-{FIT}-{COLOR}
-- Example: KCT-DS-SLIM-WHITE
```

#### Phase 2: Create Variants
```sql
-- 80 variants (20 products × 4 sizes)
-- Sizes: S, M, L, XL
-- Stock levels from microservice
```

#### Phase 3: Smart Pairing Rules
```javascript
// Shirt-specific pairing
{
  "white-shirt": {
    universal: true,
    pairsWithAllSuits: true,
    pairsWithAllTies: true,
    formalityBoost: 1 // Makes any outfit more formal
  },
  "pink-shirt": {
    pairsWithSuits: ["navy", "charcoal"],
    avoidWithSuits: ["brown", "tan"],
    casualFriendly: true
  }
}
```

### 4. **Outfit Bundle Opportunities**

#### "Complete Professional"
- 1 Suit (Navy/Charcoal)
- 3 Dress Shirts (White, Light Blue, Pink)
- 3 Coordinating Ties
- Bundle Price: $399 (Save $120)

#### "Interview Ready"
- 1 Conservative Suit
- 2 Classic Shirts (White, Light Blue)
- 2 Professional Ties
- Bundle Price: $299

#### "Wedding Party Package"
- Matching Shirts for Groomsmen
- Bulk discount on 5+ shirts
- Color coordination service

### 5. **Integration Benefits**

1. **Complete Outfits**: Suit + Shirt + Tie combinations
2. **Size Intelligence**: Track common size combinations
3. **Color Harmony**: Automatic pairing suggestions
4. **Inventory Sync**: Real-time stock from microservice
5. **Bundle Automation**: System creates logical bundles

### 6. **API Integration Points**

```javascript
// Sync from microservice
GET https://kct-dress-shirts.herokuapp.com/api/dress-shirts

// Transform to smart products
shirts.map(shirt => ({
  ...shirt,
  category: 'Shirts',
  subcategory: 'Dress Shirts',
  smartAttributes: generateSmartAttributes(shirt),
  pairsWellWith: calculatePairings(shirt.color)
}))
```

### 7. **Special Considerations**

#### Sizing Relationships
- Track which shirt size typically pairs with which suit size
- Example: 42R suit often pairs with L shirt

#### Seasonal Adjustments
- Light colors (Pink, Lavender, Mint) for Spring/Summer
- Darker colors (Navy, Charcoal) for Fall/Winter

#### Event Tagging
- White: Universal (all events)
- Pink/Lavender: Weddings, Social events
- Light Blue: Business, Professional
- Black: Formal events, Galas

### 8. **Future Enhancements**

1. **Monogramming**: Add personalization options
2. **Fabric Variants**: Add non-iron, stretch options
3. **Collar Styles**: Spread, cutaway options
4. **Cuff Options**: French cuffs for formal events