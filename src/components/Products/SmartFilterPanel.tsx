import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Slider,
  FormControl,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Stack,
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Palette,
  Style,
  Event,
  AttachMoney,
  LocalOffer,
} from '@mui/icons-material';
import type { ProductFilter } from '../../types';

interface SmartFilterPanelProps {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
  productCounts?: {
    occasions: Record<string, number>;
    styleAttributes: Record<string, number>;
    colorFamilies: Record<string, number>;
    priceTiers: Record<string, number>;
    fabricTypes: Record<string, number>;
  };
  totalProducts: number;
}

// Filter options based on your product structure
const filterOptions = {
  occasions: [
    { value: 'wedding', label: 'Wedding', icon: '💍', description: 'Perfect for weddings' },
    { value: 'business', label: 'Business', icon: '💼', description: 'Professional attire' },
    { value: 'prom', label: 'Prom', icon: '🎓', description: 'Prom and graduation' },
    { value: 'cocktail', label: 'Cocktail', icon: '🍸', description: 'Cocktail parties' },
    { value: 'formal', label: 'Formal', icon: '🎩', description: 'Black-tie events' },
    { value: 'casual', label: 'Casual', icon: '👔', description: 'Everyday wear' },
  ],
  styleAttributes: [
    { value: 'classic', label: 'Classic', description: 'Timeless traditional style' },
    { value: 'modern', label: 'Modern', description: 'Contemporary cuts' },
    { value: 'slim', label: 'Slim Fit', description: 'Tailored fit' },
    { value: 'regular', label: 'Regular Fit', description: 'Traditional fit' },
    { value: 'vintage', label: 'Vintage', description: 'Retro-inspired' },
    { value: 'luxury', label: 'Luxury', description: 'Premium materials' },
  ],
  colorFamilies: [
    { value: 'blacks', label: 'Blacks', color: '#000000' },
    { value: 'navys', label: 'Navy Blues', color: '#1e3a8a' },
    { value: 'greys', label: 'Greys', color: '#6b7280' },
    { value: 'browns', label: 'Browns', color: '#92400e' },
    { value: 'burgundy', label: 'Burgundy', color: '#8B1538' },
    { value: 'greens', label: 'Greens', color: '#059669' },
    { value: 'neutrals', label: 'Neutrals', color: '#d6d3d1' },
  ],
  priceTiers: [
    { value: 'budget', label: 'Budget', range: 'Under $200', min: 0, max: 199 },
    { value: 'premium', label: 'Premium', range: '$200 - $400', min: 200, max: 400 },
    { value: 'luxury', label: 'Luxury', range: '$400+', min: 400, max: 1000 },
  ],
  fabricTypes: [
    { value: 'wool', label: 'Wool', description: 'Classic and durable' },
    { value: 'cotton', label: 'Cotton', description: 'Breathable and comfortable' },
    { value: 'silk', label: 'Silk', description: 'Luxurious feel' },
    { value: 'polyester', label: 'Polyester', description: 'Easy care' },
    { value: 'blend', label: 'Blend', description: 'Best of both worlds' },
  ],
};

const SmartFilterPanel: React.FC<SmartFilterPanelProps> = ({
  filters,
  onFiltersChange,
  productCounts = {
    occasions: {},
    styleAttributes: {},
    colorFamilies: {},
    priceTiers: {},
    fabricTypes: {},
  },
  totalProducts,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.priceRange?.min || 0,
    filters.priceRange?.max || 1000,
  ]);

  const handleFilterChange = (key: keyof ProductFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleArrayFilterToggle = (key: keyof ProductFilter, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number[];
    setPriceRange(value);
    handleFilterChange('priceRange', { min: value[0], max: value[1] });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: filters.category, // Keep category
      subcategory: filters.subcategory, // Keep subcategory
    });
    setPriceRange([0, 1000]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.occasions?.length) count += filters.occasions.length;
    if (filters.styleAttributes?.length) count += filters.styleAttributes.length;
    if (filters.colorFamily) count += 1;
    if (filters.priceTier) count += 1;
    if (filters.fabricType) count += 1;
    if (filters.priceRange) count += 1;
    if (filters.inStock) count += 1;
    if (filters.featured) count += 1;
    if (filters.newProduct) count += 1;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Smart Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Badge badgeContent={activeFilterCount} color="primary" sx={{ ml: 1 }} />
            )}
          </Box>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              onClick={clearAllFilters}
              startIcon={<Clear />}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {totalProducts} products found
        </Typography>

        {/* Quick Badges */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalOffer sx={{ mr: 1, fontSize: 16 }} />
            Quick Filters
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip
              label="In Stock"
              size="small"
              variant={filters.inStock ? 'filled' : 'outlined'}
              color={filters.inStock ? 'primary' : 'default'}
              onClick={() => handleFilterChange('inStock', !filters.inStock)}
            />
            <Chip
              label="Featured"
              size="small"
              variant={filters.featured ? 'filled' : 'outlined'}
              color={filters.featured ? 'primary' : 'default'}
              onClick={() => handleFilterChange('featured', !filters.featured)}
            />
            <Chip
              label="New"
              size="small"
              variant={filters.newProduct ? 'filled' : 'outlined'}
              color={filters.newProduct ? 'primary' : 'default'}
              onClick={() => handleFilterChange('newProduct', !filters.newProduct)}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Occasions Filter */}
        <Accordion defaultExpanded disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Event sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Occasions
              </Typography>
              {filters.occasions?.length && (
                <Badge badgeContent={filters.occasions.length} color="primary" sx={{ ml: 1 }} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filterOptions.occasions.map((occasion) => {
                const count = productCounts.occasions[occasion.value] || 0;
                const isSelected = filters.occasions?.includes(occasion.value) || false;
                
                return (
                  <FormControlLabel
                    key={occasion.value}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleArrayFilterToggle('occasions', occasion.value)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ mr: 1 }}>{occasion.icon}</Typography>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {occasion.label}
                        </Typography>
                        {count > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({count})
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Style Attributes Filter */}
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Style sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Style & Fit
              </Typography>
              {filters.styleAttributes?.length && (
                <Badge badgeContent={filters.styleAttributes.length} color="primary" sx={{ ml: 1 }} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterOptions.styleAttributes.map((style) => {
                const count = productCounts.styleAttributes[style.value] || 0;
                const isSelected = filters.styleAttributes?.includes(style.value) || false;
                
                return (
                  <Chip
                    key={style.value}
                    label={`${style.label} ${count > 0 ? `(${count})` : ''}`}
                    size="small"
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => handleArrayFilterToggle('styleAttributes', style.value)}
                    disabled={count === 0}
                  />
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Color Family Filter */}
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Palette sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Colors
              </Typography>
              {filters.colorFamily && (
                <Badge badgeContent={1} color="primary" sx={{ ml: 1 }} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterOptions.colorFamilies.map((color) => {
                const count = productCounts.colorFamilies[color.value] || 0;
                const isSelected = filters.colorFamily === color.value;
                
                return (
                  <Chip
                    key={color.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: color.color,
                            border: '1px solid',
                            borderColor: 'divider',
                            mr: 1,
                          }}
                        />
                        {color.label} {count > 0 && `(${count})`}
                      </Box>
                    }
                    size="small"
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => handleFilterChange('colorFamily', isSelected ? undefined : color.value)}
                    disabled={count === 0}
                  />
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Price Range Filter */}
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Price Range
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ px: 2 }}>
              <Slider
                value={priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value}`}
                min={0}
                max={1000}
                step={25}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 200, label: '$200' },
                  { value: 400, label: '$400' },
                  { value: 1000, label: '$1000+' },
                ]}
                sx={{ mt: 2, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                ${priceRange[0]} - ${priceRange[1] === 1000 ? '1000+' : priceRange[1]}
              </Typography>
            </Box>
            
            {/* Price Tier Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {filterOptions.priceTiers.map((tier) => {
                const count = productCounts.priceTiers[tier.value] || 0;
                const isSelected = filters.priceTier === tier.value;
                
                return (
                  <Chip
                    key={tier.value}
                    label={`${tier.label} ${count > 0 ? `(${count})` : ''}`}
                    size="small"
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => {
                      handleFilterChange('priceTier', isSelected ? undefined : tier.value);
                      if (!isSelected) {
                        setPriceRange([tier.min, tier.max]);
                        handleFilterChange('priceRange', { min: tier.min, max: tier.max });
                      }
                    }}
                    disabled={count === 0}
                  />
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Fabric Filter */}
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1" fontWeight="medium">
              Fabric Type
            </Typography>
            {filters.fabricType && (
              <Badge badgeContent={1} color="primary" sx={{ ml: 1 }} />
            )}
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterOptions.fabricTypes.map((fabric) => {
                const count = productCounts.fabricTypes[fabric.value] || 0;
                const isSelected = filters.fabricType === fabric.value;
                
                return (
                  <Chip
                    key={fabric.value}
                    label={`${fabric.label} ${count > 0 ? `(${count})` : ''}`}
                    size="small"
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => handleFilterChange('fabricType', isSelected ? undefined : fabric.value)}
                    disabled={count === 0}
                  />
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SmartFilterPanel; 