import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  price?: number;
  isActive: boolean;
}

interface VariantDisplayGridProps {
  variants: ProductVariant[];
  productCategory: string;
  onVariantUpdate: (updatedVariant: ProductVariant, index: number) => void;
  colorHexMap?: Record<string, string>; // For tie color visualization
}

const VariantDisplayGrid: React.FC<VariantDisplayGridProps> = ({
  variants,
  productCategory,
  onVariantUpdate,
  colorHexMap = {}
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const handleEditStart = (variant: ProductVariant, index: number) => {
    setEditingIndex(index);
    setEditingVariant({ ...variant });
  };

  const handleEditSave = () => {
    if (editingVariant && editingIndex !== null) {
      onVariantUpdate(editingVariant, editingIndex);
      setEditingIndex(null);
      setEditingVariant(null);
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingVariant(null);
  };

  // Organize variants by category
  const organizedVariants = useMemo(() => {
    const category = productCategory.toLowerCase();
    
    if (category.includes('tie')) {
      // Group by color for ties
      const colorGroups: Record<string, ProductVariant[]> = {};
      variants.forEach(variant => {
        const color = variant.color || 'No Color';
        if (!colorGroups[color]) colorGroups[color] = [];
        colorGroups[color].push(variant);
      });
      return { type: 'ties', data: colorGroups };
    }
    
    if (category.includes('suit')) {
      // Group by size for suits (34R, 36S, etc.)
      const sizeGroups: Record<string, ProductVariant[]> = {};
      variants.forEach(variant => {
        const size = variant.size || 'No Size';
        if (!sizeGroups[size]) sizeGroups[size] = [];
        sizeGroups[size].push(variant);
      });
      return { type: 'suits', data: sizeGroups };
    }
    
    if (category.includes('shirt')) {
      // Group by size for shirts (15", 15.5", etc.)
      const sizeGroups: Record<string, ProductVariant[]> = {};
      variants.forEach(variant => {
        const size = variant.size || 'No Size';
        if (!sizeGroups[size]) sizeGroups[size] = [];
        sizeGroups[size].push(variant);
      });
      return { type: 'shirts', data: sizeGroups };
    }
    
    // Default: simple list
    return { type: 'default', data: variants };
  }, [variants, productCategory]);

  // Render ties as color grid
  const renderTiesGrid = (colorGroups: Record<string, ProductVariant[]>) => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon />
        Color Variants ({Object.keys(colorGroups).length} colors, {variants.length} total)
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: 2 
      }}>
        {Object.entries(colorGroups).map(([color, colorVariants]) => {
          const totalStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);
          const hexColor = colorHexMap[color] || '#cccccc';
          
          return (
            <Card key={color} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: hexColor,
                      borderRadius: '50%',
                      border: '2px solid #ddd',
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {color}
                  </Typography>
                  <Chip 
                    label={`${totalStock} in stock`} 
                    size="small"
                    color={totalStock > 10 ? 'success' : totalStock > 0 ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </Box>
                
                {colorVariants.map((variant, index) => {
                  const variantIndex = variants.findIndex(v => v === variant);
                  const isEditing = editingIndex === variantIndex;
                  
                  return (
                    <Box key={variantIndex} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      py: 0.5,
                      borderBottom: index < colorVariants.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      {isEditing ? (
                        <>
                          <TextField
                            size="small"
                            value={editingVariant?.stock || 0}
                            onChange={(e) => setEditingVariant(prev => prev ? 
                              { ...prev, stock: parseInt(e.target.value) || 0 } : null
                            )}
                            type="number"
                            sx={{ width: 80 }}
                          />
                          <IconButton size="small" onClick={handleEditSave}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleEditCancel}>
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            Stock: {variant.stock}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {variant.sku}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditStart(variant, variantIndex)}
                          >
                            <EditIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );

  // Render suits as size matrix
  const renderSuitsMatrix = (sizeGroups: Record<string, ProductVariant[]>) => {
    const sizes = Object.keys(sizeGroups).sort((a, b) => {
      // Sort by number then by length (R, S, L)
      const aMatch = a.match(/(\d+)([RSL]?)/);
      const bMatch = b.match(/(\d+)([RSL]?)/);
      if (!aMatch || !bMatch) return a.localeCompare(b);
      
      const [, aNum, aLength] = aMatch;
      const [, bNum, bLength] = bMatch;
      
      const numDiff = parseInt(aNum) - parseInt(bNum);
      if (numDiff !== 0) return numDiff;
      
      const lengthOrder = { 'S': 1, 'R': 2, 'L': 3, '': 2 };
      return (lengthOrder[aLength as keyof typeof lengthOrder] || 2) - 
             (lengthOrder[bLength as keyof typeof lengthOrder] || 2);
    });

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          Size Matrix ({sizes.length} sizes, {variants.length} total variants)
        </Typography>
        
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Size</strong></TableCell>
                <TableCell><strong>Stock</strong></TableCell>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Price</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sizes.map(size => 
                sizeGroups[size].map((variant, index) => {
                  const variantIndex = variants.findIndex(v => v === variant);
                  const isEditing = editingIndex === variantIndex;
                  
                  return (
                    <TableRow key={`${size}-${index}`}>
                      <TableCell>
                        <Chip 
                          label={size} 
                          size="small"
                          color={size.includes('S') ? 'info' : size.includes('L') ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingVariant?.stock || 0}
                            onChange={(e) => setEditingVariant(prev => prev ? 
                              { ...prev, stock: parseInt(e.target.value) || 0 } : null
                            )}
                            type="number"
                            sx={{ width: 80 }}
                          />
                        ) : (
                          <Chip 
                            label={variant.stock}
                            size="small"
                            color={variant.stock > 5 ? 'success' : variant.stock > 0 ? 'warning' : 'error'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{variant.sku}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          ${variant.price || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={handleEditSave}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton size="small" onClick={handleEditCancel}>
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditStart(variant, variantIndex)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Render shirts as size table
  const renderShirtsTable = (sizeGroups: Record<string, ProductVariant[]>) => {
    const sizes = Object.keys(sizeGroups).sort((a, b) => {
      const aNum = parseFloat(a.replace('"', ''));
      const bNum = parseFloat(b.replace('"', ''));
      return aNum - bNum;
    });

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          Shirt Sizes ({sizes.length} sizes, {variants.length} total)
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 2 
        }}>
          {sizes.map(size => {
            const sizeVariants = sizeGroups[size];
            const totalStock = sizeVariants.reduce((sum, v) => sum + v.stock, 0);
            
            return (
              <Card key={size} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Size {size}
                    </Typography>
                    <Chip 
                      label={`${totalStock} in stock`}
                      size="small"
                      color={totalStock > 5 ? 'success' : totalStock > 0 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                  
                  {sizeVariants.map((variant, index) => {
                    const variantIndex = variants.findIndex(v => v === variant);
                    const isEditing = editingIndex === variantIndex;
                    
                    return (
                      <Box key={variantIndex} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        py: 0.5 
                      }}>
                        {isEditing ? (
                          <>
                            <TextField
                              size="small"
                              value={editingVariant?.stock || 0}
                              onChange={(e) => setEditingVariant(prev => prev ? 
                                { ...prev, stock: parseInt(e.target.value) || 0 } : null
                              )}
                              type="number"
                              sx={{ width: 80 }}
                            />
                            <IconButton size="small" onClick={handleEditSave}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton size="small" onClick={handleEditCancel}>
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              Stock: {variant.stock}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditStart(variant, variantIndex)}
                            >
                              <EditIcon />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render default list view
  const renderDefaultList = (variants: ProductVariant[]) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Product Variants ({variants.length})
      </Typography>
      
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Size</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.map((variant, index) => {
              const isEditing = editingIndex === index;
              
              return (
                <TableRow key={index}>
                  <TableCell>{variant.size}</TableCell>
                  <TableCell>{variant.color}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editingVariant?.stock || 0}
                        onChange={(e) => setEditingVariant(prev => prev ? 
                          { ...prev, stock: parseInt(e.target.value) || 0 } : null
                        )}
                        type="number"
                        sx={{ width: 80 }}
                      />
                    ) : (
                      variant.stock
                    )}
                  </TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={handleEditSave}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton size="small" onClick={handleEditCancel}>
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditStart(variant, index)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (variants.length === 0) {
    return (
      <Alert severity="info">
        No variants created yet. Use the "Add New Variant" form above to create product variants.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {organizedVariants.type === 'ties' && renderTiesGrid(organizedVariants.data as Record<string, ProductVariant[]>)}
      {organizedVariants.type === 'suits' && renderSuitsMatrix(organizedVariants.data as Record<string, ProductVariant[]>)}
      {organizedVariants.type === 'shirts' && renderShirtsTable(organizedVariants.data as Record<string, ProductVariant[]>)}
      {organizedVariants.type === 'default' && renderDefaultList(organizedVariants.data as ProductVariant[])}
    </Box>
  );
};

export default VariantDisplayGrid; 