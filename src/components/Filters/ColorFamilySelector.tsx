import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Collapse,
  IconButton,
  Chip,
  Button,
  Paper,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

export interface ColorFamily {
  name: string;
  displayName: string;
  colors: string[];
  count: number;
  hexSamples: string[]; // Representative hex colors for visual preview
}

export interface ColorFamilySelectorProps {
  colorFamilies: ColorFamily[];
  selectedFamilies: string[];
  onFamilyChange: (selectedFamilies: string[]) => void;
  maxHeight?: number;
  showCounts?: boolean;
  showColorSwatches?: boolean;
  allowMultiSelect?: boolean;
}

const defaultColorFamilies: ColorFamily[] = [
  {
    name: 'blues',
    displayName: 'Blues',
    colors: ['Navy Blue', 'Royal Blue', 'Tiffany Blue', 'Sky Blue', 'Steel Blue'],
    count: 18,
    hexSamples: ['#000080', '#4169E1', '#0ABAB5', '#87CEEB']
  },
  {
    name: 'reds',
    displayName: 'Reds',
    colors: ['Crimson Red', 'Wine Red', 'Cherry Red', 'Burgundy'],
    count: 12,
    hexSamples: ['#DC143C', '#722F37', '#DE3163', '#800020']
  },
  {
    name: 'greens',
    displayName: 'Greens',
    colors: ['Forest Green', 'Emerald Green', 'Sage Green', 'Mint Green'],
    count: 10,
    hexSamples: ['#355E3B', '#50C878', '#9CAF88', '#98FB98']
  },
  {
    name: 'purples',
    displayName: 'Purples',
    colors: ['Royal Purple', 'Lavender', 'Violet', 'Plum'],
    count: 8,
    hexSamples: ['#7851A9', '#E6E6FA', '#8A2BE2', '#8E4585']
  },
  {
    name: 'yellows',
    displayName: 'Yellows & Golds',
    colors: ['Golden Yellow', 'Mustard Yellow', 'Lemon Yellow', 'Champagne'],
    count: 8,
    hexSamples: ['#FFD700', '#FFDB58', '#FFF700', '#F7E7CE']
  },
  {
    name: 'oranges',
    displayName: 'Oranges',
    colors: ['Burnt Orange', 'Tangerine', 'Peach', 'Copper'],
    count: 6,
    hexSamples: ['#CC5500', '#F28500', '#FFCBA4', '#B87333']
  },
  {
    name: 'pinks',
    displayName: 'Pinks',
    colors: ['Blush Pink', 'Rose Pink', 'Dusty Rose', 'Hot Pink'],
    count: 6,
    hexSamples: ['#DE5D83', '#FF66CC', '#DCAE96', '#FF69B4']
  },
  {
    name: 'neutrals',
    displayName: 'Neutrals',
    colors: ['Charcoal Gray', 'Silver Gray', 'Champagne Beige', 'Taupe'],
    count: 8,
    hexSamples: ['#36454F', '#C0C0C0', '#F5F5DC', '#483C32']
  }
];

export const ColorFamilySelector: React.FC<ColorFamilySelectorProps> = ({
  colorFamilies = defaultColorFamilies,
  selectedFamilies,
  onFamilyChange,
  maxHeight = 400,
  showCounts = true,
  showColorSwatches = true,
  allowMultiSelect = true
}) => {
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const toggleFamily = (familyName: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [familyName]: !prev[familyName]
    }));
  };

  const handleFamilySelect = (familyName: string, checked: boolean) => {
    if (!allowMultiSelect) {
      // Single select mode
      onFamilyChange(checked ? [familyName] : []);
      return;
    }

    // Multi-select mode
    if (checked) {
      onFamilyChange([...selectedFamilies, familyName]);
    } else {
      onFamilyChange(selectedFamilies.filter(f => f !== familyName));
    }
  };

  const handleSelectAll = () => {
    if (selectedFamilies.length === colorFamilies.length) {
      // All selected, clear all
      onFamilyChange([]);
    } else {
      // Select all
      onFamilyChange(colorFamilies.map(f => f.name));
    }
  };

  const handleClearAll = () => {
    onFamilyChange([]);
  };

  const totalSelectedCount = useMemo(() => {
    return colorFamilies
      .filter(family => selectedFamilies.includes(family.name))
      .reduce((sum, family) => sum + family.count, 0);
  }, [colorFamilies, selectedFamilies]);

  const allSelected = selectedFamilies.length === colorFamilies.length;
  const someSelected = selectedFamilies.length > 0;

  return (
    <Paper sx={{ p: 2, maxHeight, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Color Families
        </Typography>
        {someSelected && (
          <Chip 
            label={`${selectedFamilies.length} selected (${totalSelectedCount} colors)`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {allowMultiSelect && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            sx={{ flex: 1 }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          {someSelected && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              color="secondary"
              sx={{ flex: 1 }}
            >
              Clear
            </Button>
          )}
        </Box>
      )}

      <FormGroup>
        {colorFamilies.map((family) => {
          const isSelected = selectedFamilies.includes(family.name);
          const isExpanded = expandedFamilies[family.name];

          return (
            <Box key={family.name} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleFamilySelect(family.name, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                        {family.displayName}
                      </Typography>
                      {showCounts && (
                        <Chip
                          label={family.count}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            minWidth: 'auto',
                            height: 20,
                            '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
                          }}
                        />
                      )}
                      {showColorSwatches && (
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                          {family.hexSamples.slice(0, 4).map((hex, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 16,
                                height: 16,
                                backgroundColor: hex,
                                borderRadius: '50%',
                                border: '1px solid #ddd',
                                flexShrink: 0
                              }}
                            />
                          ))}
                          {family.hexSamples.length > 4 && (
                            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                              +{family.hexSamples.length - 4}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  }
                  sx={{ 
                    flexGrow: 1,
                    mr: 0,
                    '& .MuiFormControlLabel-label': { flexGrow: 1 }
                  }}
                />
                
                <IconButton 
                  size="small" 
                  onClick={() => toggleFamily(family.name)}
                  sx={{ ml: 1 }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={isExpanded}>
                <Box sx={{ ml: 4, mt: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Available colors in {family.displayName}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {family.colors.map((color) => (
                      <Chip
                        key={color}
                        label={color}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 24,
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>

              {family !== colorFamilies[colorFamilies.length - 1] && (
                <Divider sx={{ mt: 1 }} />
              )}
            </Box>
          );
        })}
      </FormGroup>

      {selectedFamilies.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {selectedFamilies.map((familyName) => {
              const family = colorFamilies.find(f => f.name === familyName);
              return (
                <Chip
                  key={familyName}
                  label={family?.displayName || familyName}
                  size="small"
                  color="primary"
                  onDelete={() => handleFamilySelect(familyName, false)}
                  deleteIcon={<ClearIcon />}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ColorFamilySelector; 