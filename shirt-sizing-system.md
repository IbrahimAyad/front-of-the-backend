# Dress Shirt Sizing System

## Slim Fit Sizing (Current GitHub Service)

| Size | Neck | Sleeve | Typical Suit Size |
|------|------|--------|-------------------|
| XS   | 14"  | 33"    | 36R               |
| S    | 14.5"| 33"    | 38R               |
| M    | 15.5"| 33"    | 40R               |
| L    | 16"  | 35"    | 40L, 42S          |
| XL   | 16.5"| 35"    | 42R               |
| XXL  | 17.5"| 35"    | 44R-46R           |

## Classic Fit Sizing (Full Range)

### Neck Size 14
- 14 x 32-33
- 14 x 34-35

### Neck Size 14.5
- 14.5 x 32-33
- 14.5 x 34-35
- 14.5 x 36-37

### Neck Size 15
- 15 x 32-33
- 15 x 34-35
- 15 x 36-37

### Neck Size 15.5
- 15.5 x 32-33
- 15.5 x 34-35
- 15.5 x 36-37

### Neck Size 16
- 16 x 32-33
- 16 x 34-35
- 16 x 36-37

### Neck Size 16.5
- 16.5 x 32-33
- 16.5 x 34-35
- 16.5 x 36-37

### Neck Size 17
- 17 x 32-33
- 17 x 34-35
- 17 x 36-37

### Neck Size 17.5
- 17.5 x 32-33
- 17.5 x 34-35
- 17.5 x 36-37

### Neck Size 18
- 18 x 32-33
- 18 x 34-35
- 18 x 36-37

### Neck Size 18.5
- 18.5 x 32-33
- 18.5 x 34-35
- 18.5 x 36-37

### Neck Size 19
- 19 x 32-33
- 19 x 34-35
- 19 x 36-37

### Neck Size 19.5
- 19.5 x 32-33
- 19.5 x 34-35
- 19.5 x 36-37

### Neck Size 20
- 20 x 32-33
- 20 x 34-35
- 20 x 36-37

### Neck Size 20.5
- 20.5 x 32-33
- 20.5 x 34-35
- 20.5 x 36-37

### Neck Size 21
- 21 x 32-33
- 21 x 34-35
- 21 x 36-37

### Neck Size 21.5
- 21.5 x 32-33
- 21.5 x 34-35
- 21.5 x 36-37

### Neck Size 22
- 22 x 32-33
- 22 x 34-35
- 22 x 36-37

## Suit to Shirt Size Mapping

### Accurate Mapping (Slim Fit)
| Suit Size | Shirt Size (Slim) | Neck x Sleeve |
|-----------|-------------------|---------------|
| 36R, 36S  | XS               | 14 x 33       |
| 38R, 38S  | S                | 14.5 x 33     |
| 40R, 40S  | M                | 15.5 x 33     |
| 40L, 42S  | L                | 16 x 35       |
| 42R       | XL               | 16.5 x 35     |
| 44R, 46R  | XXL              | 17.5 x 35     |

### Classic Fit Mapping
| Suit Size | Recommended Shirt Size |
|-----------|------------------------|
| 36S       | 14.5 x 32-33          |
| 36R       | 14.5 x 34-35          |
| 36L       | 14.5 x 36-37          |
| 38S       | 15 x 32-33            |
| 38R       | 15 x 34-35            |
| 38L       | 15 x 36-37            |
| 40S       | 15.5 x 32-33          |
| 40R       | 15.5 x 34-35          |
| 40L       | 15.5 x 36-37          |
| 42S       | 16 x 32-33            |
| 42R       | 16 x 34-35            |
| 42L       | 16 x 36-37            |
| 44S       | 16.5 x 32-33          |
| 44R       | 16.5 x 34-35          |
| 44L       | 16.5 x 36-37          |
| 46S       | 17 x 32-33            |
| 46R       | 17 x 34-35            |
| 46L       | 17 x 36-37            |
| 48R       | 17.5 x 34-35          |
| 50R       | 18 x 34-35            |
| 52R       | 18.5 x 34-35          |
| 54R       | 19 x 34-35            |
| 56R       | 19.5 x 34-35          |
| 58R       | 20 x 34-35            |
| 60R       | 20.5 x 34-35          |

## Implementation Notes

1. **Slim vs Classic**: 
   - Slim fit runs smaller (42R → XL)
   - Classic fit is traditional sizing (42R → 16 x 34-35)

2. **Sleeve Length by Suit Length**:
   - Short (S): 32-33" sleeve
   - Regular (R): 34-35" sleeve
   - Long (L): 36-37" sleeve

3. **Smart Recommendations**:
   - System should know customer's suit size
   - Automatically suggest correct shirt size
   - Account for fit preference (slim vs classic)