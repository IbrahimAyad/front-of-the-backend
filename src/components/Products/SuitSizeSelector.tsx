import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Chip,
  Button,
  Card,
  CardContent,
  Paper,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export interface SuitVariant {
  id: string;
  size: string;
  color: string;
  material?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  name: string;
  sku: string;
}

export interface SuitSizeSelectorProps {
  variants: SuitVariant[];
  selectedSize?: string;
  selectedLength?: string;
  selectedPieces?: '2-piece' | '3-piece';
  onSizeChange: (size: string, length: string, pieces: '2-piece' | '3-piece') => void;
  onVariantChange?: (variant: SuitVariant | null) => void;
  basePrice: number;
  hasVestOption?: boolean;
  showSizeGuide?: boolean;
}

// Suit sizing constants
const JACKET_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
const LENGTHS = [
  { 
    value: 'S', 
    label: 'Short', 
    description: '5\'4" - 5\'7"',
    availableSizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50'] // Up to 50S
  },
  { 
    value: 'R', 
    label: 'Regular', 
    description: '5\'8" - 6\'1"',
    availableSizes: JACKET_SIZES // All sizes 34R-54R
  },
  { 
    value: 'L', 
    label: 'Long', 
    description: '6\'2" and above',
    availableSizes: ['38', '40', '42', '44', '46', '48', '50', '52', '54'] // 38L-54L
  }
];

export const SuitSizeSelector: React.FC<SuitSizeSelectorProps> = ({
  variants,
  selectedSize,
  selectedLength,
  selectedPieces = '2-piece',
  onSizeChange,
  onVariantChange,
  basePrice,
  hasVestOption = true,
  showSizeGuide = true
}) => {
  const [internalSize, setInternalSize] = useState(selectedSize || '');
  const [internalLength, setInternalLength] = useState(selectedLength || '');
  const [internalPieces, setInternalPieces] = useState(selectedPieces);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Parse size information from variants
  const sizeAvailability = useMemo(() => {
    const availability: Record<string, Record<string, { stock: number; variant?: SuitVariant }>> = {};
    
    variants.forEach(variant => {
      if (!variant.size || !variant.isActive) return;
      
      // Parse size like "42R", "38S", "46L"
      const match = variant.size.match(/^(\d+)([SRL])$/);
      if (!match) return;
      
      const [, size, length] = match;
      
      if (!availability[size]) availability[size] = {};
      availability[size][length] = {
        stock: variant.stock,
        variant
      };
    });
    
    return availability;
  }, [variants]);

  // Check if a size + length combination is available
  const isAvailable = (size: string, length: string): boolean => {
    return !!(sizeAvailability[size]?.[length]?.stock > 0);
  };

  // Check if any length is available for a given size
  const hasAnyLengthInStock = (size: string): boolean => {
    return LENGTHS.some(length => 
      length.availableSizes.includes(size) && isAvailable(size, length.value)
    );
  };

  // Get stock for a specific size + length
  const getStock = (size: string, length: string): number => {
    return sizeAvailability[size]?.[length]?.stock || 0;
  };

  // Get the selected variant
  const selectedVariant = useMemo(() => {
    if (!internalSize || !internalLength) return null;
    return sizeAvailability[internalSize]?.[internalLength]?.variant || null;
  }, [internalSize, internalLength, sizeAvailability]);

  // Calculate final price based on pieces
  const finalPrice = useMemo(() => {
    const vestUpcharge = internalPieces === '3-piece' ? 100 : 0;
    return basePrice + vestUpcharge;
  }, [basePrice, internalPieces]);

  const handleSizeChange = (size: string) => {
    setInternalSize(size);
    
    // Auto-select first available length for this size
    const availableLength = LENGTHS.find(length => 
      length.availableSizes.includes(size) && isAvailable(size, length.value)
    );
    
    if (availableLength) {
      setInternalLength(availableLength.value);
      onSizeChange(size, availableLength.value, internalPieces);
      
      const variant = sizeAvailability[size]?.[availableLength.value]?.variant;
      onVariantChange?.(variant || null);
    }
  };

  const handleLengthChange = (length: string) => {
    if (!internalSize) return;
    
    setInternalLength(length);
    onSizeChange(internalSize, length, internalPieces);
    
    const variant = sizeAvailability[internalSize]?.[length]?.variant;
    onVariantChange?.(variant || null);
  };

  const handlePiecesChange = (pieces: '2-piece' | '3-piece') => {
    setInternalPieces(pieces);
    if (internalSize && internalLength) {
      onSizeChange(internalSize, internalLength, pieces);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Piece Type Selection */}
      {hasVestOption && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Suit Type
            </Typography>
            <ToggleButtonGroup
              value={internalPieces}
              exclusive
              onChange={(_, value) => value && handlePiecesChange(value)}
              fullWidth
            >
              <ToggleButton value="2-piece">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    2-Piece
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Jacket + Pants
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    ${basePrice}
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="3-piece">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    3-Piece
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Jacket + Pants + Vest
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    ${basePrice + 100}
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>
      )}

      {/* Size Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Select Jacket Size
            </Typography>
            {showSizeGuide && (
              <Button
                size="small"
                startIcon={<HelpIcon />}
                onClick={() => setShowSizeChart(!showSizeChart)}
              >
                Size Guide
              </Button>
            )}
          </Box>

          {showSizeChart && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>How to Measure:</strong>
              </Typography>
              <Typography variant="caption">
                Chest: Measure around the fullest part of your chest, under your arms.<br/>
                34" = 34, 36" = 36, etc.
              </Typography>
            </Alert>
          )}

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
            gap: 1 
          }}>
            {JACKET_SIZES.map(size => {
              const hasStock = hasAnyLengthInStock(size);
              const isSelected = internalSize === size;

              return (
                <Tooltip 
                  key={size}
                  title={hasStock ? `Size ${size} available` : `Size ${size} out of stock`}
                  arrow
                >
                  <ToggleButton
                    value={size}
                    selected={isSelected}
                    disabled={!hasStock}
                    onClick={() => handleSizeChange(size)}
                    sx={{
                      minWidth: 60,
                      height: 48,
                      position: 'relative',
                      '&.Mui-disabled': {
                        opacity: 0.4
                      }
                    }}
                  >
                    {size}
                    {isSelected && (
                      <CheckCircleIcon 
                        sx={{ 
                          position: 'absolute', 
                          top: 2, 
                          right: 2, 
                          fontSize: 16,
                          color: 'primary.main' 
                        }} 
                      />
                    )}
                  </ToggleButton>
                </Tooltip>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Length Selection - Only show when size is selected */}
      {internalSize && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Length
            </Typography>
            
            <RadioGroup 
              value={internalLength} 
              onChange={(e) => handleLengthChange(e.target.value)}
            >
              {LENGTHS.map(length => {
                const isLengthAvailable = length.availableSizes.includes(internalSize) && 
                                        isAvailable(internalSize, length.value);
                const stock = getStock(internalSize, length.value);

                return (
                  <FormControlLabel
                    key={length.value}
                    value={length.value}
                    disabled={!isLengthAvailable}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {length.label} ({length.description})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Size: {internalSize}{length.value}
                          </Typography>
                        </Box>
                        {isLengthAvailable ? (
                          <Chip 
                            label={`${stock} in stock`} 
                            size="small" 
                            color={stock > 5 ? 'success' : stock > 2 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            label="Out of Stock" 
                            size="small" 
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    sx={{ 
                      width: '100%',
                      py: 1,
                      border: 1,
                      borderColor: internalLength === length.value ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  />
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Size Summary */}
      {internalSize && internalLength && (
        <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                Selected: {internalSize}{internalLength} {internalPieces}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedVariant?.name}
              </Typography>
              {selectedVariant && (
                <Typography variant="caption" color="text.secondary">
                  SKU: {selectedVariant.sku}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                ${finalPrice}
              </Typography>
              {internalPieces === '3-piece' && (
                <Typography variant="caption" color="text.secondary">
                  +$100 for vest
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Size Not Available Helper */}
      {internalSize && !LENGTHS.some(l => l.availableSizes.includes(internalSize) && isAvailable(internalSize, l.value)) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Size {internalSize} is currently out of stock in all lengths.
          </Typography>
          <Button size="small" sx={{ mt: 1 }}>
            Get notified when back in stock
          </Button>
        </Alert>
      )}
    </Box>
  );
};

export default SuitSizeSelector; 