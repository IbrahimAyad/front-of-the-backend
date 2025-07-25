import React, { useState, useMemo } from 'react';
import {
  Box,
  Chip,
  TextField,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

export interface ColorInfo {
  name: string;
  hex: string;
  tags: string[];
  family?: string;
}

export interface ColorSwatchPickerProps {
  selectedColor?: string;
  onColorSelect: (color: ColorInfo) => void;
  availableColors: ColorInfo[];
  colorHexMap: Record<string, string>;
  size?: 'small' | 'medium' | 'large';
  showSearch?: boolean;
  showFamilyGroups?: boolean;
  maxHeight?: number;
}

const colorFamilyOrder = [
  'blues', 'reds', 'greens', 'purples', 
  'yellows', 'oranges', 'pinks', 'neutrals'
];

const familyDisplayNames: Record<string, string> = {
  blues: 'Blues',
  reds: 'Reds',
  greens: 'Greens',
  purples: 'Purples',
  yellows: 'Yellows & Golds',
  oranges: 'Oranges',
  pinks: 'Pinks',
  neutrals: 'Neutrals'
};

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  selectedColor,
  onColorSelect,
  availableColors,
  colorHexMap,
  size = 'medium',
  showSearch = true,
  showFamilyGroups = true,
  maxHeight = 400
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({
    blues: true, // Expand blues by default
  });

  // Group colors by family
  const colorsByFamily = useMemo(() => {
    const grouped: Record<string, ColorInfo[]> = {};
    
    availableColors.forEach(color => {
      const family = color.tags.find(tag => tag.endsWith('-family'))?.replace('-family', '') || 'other';
      if (!grouped[family]) {
        grouped[family] = [];
      }
      grouped[family].push({
        ...color,
        hex: colorHexMap[color.name] || color.hex
      });
    });

    // Sort by color family order
    const sorted: Record<string, ColorInfo[]> = {};
    colorFamilyOrder.forEach(family => {
      if (grouped[family]) {
        sorted[family] = grouped[family];
      }
    });

    // Add any remaining families
    Object.keys(grouped).forEach(family => {
      if (!sorted[family]) {
        sorted[family] = grouped[family];
      }
    });

    return sorted;
  }, [availableColors, colorHexMap]);

  // Filter colors based on search
  const filteredColors = useMemo(() => {
    if (!searchTerm) return colorsByFamily;

    const filtered: Record<string, ColorInfo[]> = {};
    Object.entries(colorsByFamily).forEach(([family, colors]) => {
      const matchingColors = colors.filter(color =>
        color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (matchingColors.length > 0) {
        filtered[family] = matchingColors;
      }
    });

    return filtered;
  }, [colorsByFamily, searchTerm]);

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [family]: !prev[family]
    }));
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getSwatchSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 56;
      default: return 40;
    }
  };

  const getGridColumns = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 6;
      default: return 8;
    }
  };

  const swatchSize = getSwatchSize();
  const gridColumns = getGridColumns();

  return (
    <Box sx={{ width: '100%' }}>
      {showSearch && (
        <TextField
          fullWidth
          size="small"
          placeholder="Search colors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      )}

      <Box 
        sx={{ 
          maxHeight, 
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 2
        }}
      >
        {showFamilyGroups ? (
          // Grouped by color families
          Object.entries(filteredColors).map(([family, colors]) => (
            <Box key={family} sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  mb: 1
                }}
                onClick={() => toggleFamily(family)}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {familyDisplayNames[family] || family} ({colors.length})
                </Typography>
                <IconButton size="small">
                  {expandedFamilies[family] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedFamilies[family]}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, 
                  gap: 1 
                }}>
                  {colors.map((color) => (
                    <Tooltip key={color.name} title={color.name} arrow>
                      <Paper
                        elevation={selectedColor === color.name ? 3 : 1}
                        sx={{
                          width: swatchSize,
                          height: swatchSize,
                          backgroundColor: color.hex,
                          cursor: 'pointer',
                          border: selectedColor === color.name ? 3 : 1,
                          borderColor: selectedColor === color.name ? 'primary.main' : 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            elevation: 4,
                          }
                        }}
                        onClick={() => onColorSelect(color)}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Collapse>
            </Box>
          ))
        ) : (
          // Flat grid of all colors
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, 
            gap: 1 
          }}>
            {Object.values(filteredColors).flat().map((color) => (
              <Tooltip 
                key={color.name}
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {color.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {color.hex}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {color.tags.slice(0, 3).map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} 
                        />
                      ))}
                    </Box>
                  </Box>
                } 
                arrow
              >
                <Paper
                  elevation={selectedColor === color.name ? 3 : 1}
                  sx={{
                    width: swatchSize,
                    height: swatchSize,
                    backgroundColor: color.hex,
                    cursor: 'pointer',
                    border: selectedColor === color.name ? 3 : 1,
                    borderColor: selectedColor === color.name ? 'primary.main' : 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      elevation: 4,
                    }
                  }}
                  onClick={() => onColorSelect(color)}
                />
              </Tooltip>
            ))}
          </Box>
        )}

        {Object.keys(filteredColors).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No colors found matching "{searchTerm}"
            </Typography>
          </Box>
        )}
      </Box>

      {selectedColor && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selected Color:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Paper
              sx={{
                width: 24,
                height: 24,
                backgroundColor: colorHexMap[selectedColor],
                border: 1,
                borderColor: 'divider'
              }}
            />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {selectedColor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {colorHexMap[selectedColor]}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ColorSwatchPicker; 