import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Paper,
  Tooltip,
  IconButton,
  Badge,
  Fade,
  Zoom,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Warning as WarningIcon,
  LocalOffer as PriceIcon,
  Inventory as StockIcon,
  Palette as ColorIcon,
  Straighten as SizeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface Variant {
  id: string;
  name: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
}

interface EnhancedVariantSelectorProps {
  variants: Variant[];
  selectedVariantId?: string;
  onVariantSelect: (variant: Variant) => void;
  productName: string;
  productCategory: string;
  showPrices?: boolean;
  showStock?: boolean;
  layout?: 'grid' | 'list' | 'compact';
  colorSwatchSize?: 'small' | 'medium' | 'large';
}

const EnhancedVariantSelector: React.FC<EnhancedVariantSelectorProps> = ({
  variants = [],
  selectedVariantId,
  onVariantSelect,
  productName,
  productCategory,
  showPrices = true,
  showStock = true,
  layout = 'grid',
  colorSwatchSize = 'medium',
}) => {
  const theme = useTheme();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);

  // Group variants by color and size
  const variantGroups = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const colorMap = new Map<string, Variant[]>();
    const sizeMap = new Map<string, Variant[]>();

    variants.forEach((variant) => {
      if (variant.color) {
        colors.add(variant.color);
        const existing = colorMap.get(variant.color) || [];
        colorMap.set(variant.color, [...existing, variant]);
      }
      if (variant.size) {
        sizes.add(variant.size);
        const existing = sizeMap.get(variant.size) || [];
        sizeMap.set(variant.size, [...existing, variant]);
      }
    });

    // Sort sizes intelligently (numeric first, then S/M/L)
    const sortedSizes = Array.from(sizes).sort((a, b) => {
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      return a.localeCompare(b);
    });

    return {
      colors: Array.from(colors),
      sizes: sortedSizes,
      colorMap,
      sizeMap,
    };
  }, [variants]);

  // Get currently selected variant
  const selectedVariant = useMemo(() => {
    return variants.find((v) => v.id === selectedVariantId);
  }, [variants, selectedVariantId]);

  // Update selections when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setSelectedColor(selectedVariant.color || null);
      setSelectedSize(selectedVariant.size || null);
    }
  }, [selectedVariant]);

  // Find variant by color and size
  const findVariant = (color: string | null, size: string | null) => {
    return variants.find((v) => 
      (!color || v.color === color) && 
      (!size || v.size === size)
    );
  };

  // Get color hex codes (you can expand this mapping)
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Navy': '#000080',
      'Navy Blue': '#000080',
      'Black': '#000000',
      'Charcoal': '#36454F',
      'Grey': '#808080',
      'Light Grey': '#D3D3D3',
      'Brown': '#8B4513',
      'Tan': '#D2B48C',
      'White': '#FFFFFF',
      'Ivory': '#FFFFF0',
      'Blue': '#0000FF',
      'Light Blue': '#ADD8E6',
      'Pink': '#FFC0CB',
      'Red': '#FF0000',
      'Burgundy': '#800020',
      'Green': '#008000',
      'Olive': '#808000',
      'Purple': '#800080',
      'Lavender': '#E6E6FA',
    };
    
    return colorMap[colorName] || '#CCCCCC';
  };

  const swatchSizes = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variant = findVariant(color, selectedSize);
    if (variant && variant.isActive && variant.stock > 0) {
      onVariantSelect(variant);
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = findVariant(selectedColor, size);
    if (variant && variant.isActive && variant.stock > 0) {
      onVariantSelect(variant);
    }
  };

  // Check if a combination is available
  const isAvailable = (color: string | null, size: string | null) => {
    const variant = findVariant(color, size);
    return variant && variant.isActive && variant.stock > 0;
  };

  // Get stock level for display
  const getStockLevel = (stock: number) => {
    if (stock === 0) return { level: 'out', color: 'error', label: 'Out of Stock' };
    if (stock <= 3) return { level: 'low', color: 'warning', label: `Only ${stock} left` };
    if (stock <= 10) return { level: 'medium', color: 'info', label: 'Limited Stock' };
    return { level: 'high', color: 'success', label: 'In Stock' };
  };

  return (
    <Box>
      {/* Color Selection */}
      {variantGroups.colors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ColorIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Color: {selectedColor && (
                <Chip 
                  label={selectedColor} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </Box>
          
          <Grid container spacing={1}>
            {variantGroups.colors.map((color) => {
              const isSelected = selectedColor === color;
              const hasStock = variantGroups.colorMap.get(color)?.some(v => v.stock > 0) || false;
              const swatchSize = swatchSizes[colorSwatchSize];
              
              return (
                <Grid item key={color}>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="body2">{color}</Typography>
                        {!hasStock && (
                          <Typography variant="caption" color="error">
                            Out of Stock
                          </Typography>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      onClick={() => hasStock && handleColorSelect(color)}
                      onMouseEnter={() => setHoveredVariant(color)}
                      onMouseLeave={() => setHoveredVariant(null)}
                      sx={{
                        position: 'relative',
                        width: swatchSize,
                        height: swatchSize,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: hasStock ? 'pointer' : 'not-allowed',
                        opacity: hasStock ? 1 : 0.4,
                        transition: 'all 0.2s ease',
                        border: `3px solid ${
                          isSelected 
                            ? theme.palette.primary.main 
                            : hoveredVariant === color 
                            ? theme.palette.grey[400]
                            : 'transparent'
                        }`,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected 
                          ? theme.shadows[4]
                          : hoveredVariant === color 
                          ? theme.shadows[2]
                          : theme.shadows[0],
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: getColorHex(color),
                          border: color.toLowerCase().includes('white') ? '1px solid #e0e0e0' : 'none',
                        }}
                      />
                      {isSelected && (
                        <Zoom in={isSelected}>
                          <CheckIcon
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: color.toLowerCase().includes('white') ? 'black' : 'white',
                              fontSize: swatchSize * 0.4,
                            }}
                          />
                        </Zoom>
                      )}
                      {!hasStock && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              fontSize: swatchSize * 0.2,
                              transform: 'rotate(-45deg)',
                            }}
                          >
                            SOLD OUT
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Size Selection */}
      {variantGroups.sizes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SizeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Size: {selectedSize && (
                <Chip 
                  label={selectedSize} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </Box>
          
          <ToggleButtonGroup
            value={selectedSize}
            exclusive
            onChange={(_, value) => value && handleSizeSelect(value)}
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            {variantGroups.sizes.map((size) => {
              const isAvailableSize = isAvailable(selectedColor, size);
              const variant = findVariant(selectedColor, size);
              const stockInfo = variant ? getStockLevel(variant.stock) : null;
              
              return (
                <ToggleButton
                  key={size}
                  value={size}
                  disabled={!isAvailableSize}
                  sx={{
                    px: 2,
                    py: 1,
                    minWidth: 60,
                    position: 'relative',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {size}
                    </Typography>
                    {showStock && isAvailableSize && stockInfo && stockInfo.level === 'low' && (
                      <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.65rem' }}>
                        {stockInfo.label}
                      </Typography>
                    )}
                  </Box>
                  {!isAvailableSize && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        width: '100%',
                        height: 1,
                        backgroundColor: 'error.main',
                      }}
                    />
                  )}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <Fade in={true}>
          <Card 
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Selected Variant
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedVariant.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SKU: {selectedVariant.sku}
                  </Typography>
                </Box>
                
                {showPrices && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ${selectedVariant.price.toFixed(2)}
                    </Typography>
                    {selectedVariant.compareAtPrice && (
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                      >
                        ${selectedVariant.compareAtPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              {showStock && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<StockIcon />}
                    label={getStockLevel(selectedVariant.stock).label}
                    color={getStockLevel(selectedVariant.stock).color as any}
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* No Selection Alert */}
      {!selectedVariant && variants.length > 0 && (
        <Alert severity="info" icon={<InfoIcon />}>
          Please select {variantGroups.colors.length > 0 && 'a color'} 
          {variantGroups.colors.length > 0 && variantGroups.sizes.length > 0 && ' and '} 
          {variantGroups.sizes.length > 0 && 'a size'} to continue
        </Alert>
      )}
    </Box>
  );
};

export default EnhancedVariantSelector;