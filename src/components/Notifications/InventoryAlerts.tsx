import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
  lastRestocked?: Date;
  estimatedDaysLeft: number;
}

const InventoryAlerts: React.FC = () => {
  const { theme } = useCustomTheme();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState('');

  // Mock inventory data
  useEffect(() => {
    const mockInventory: InventoryItem[] = [
      {
        id: '1',
        name: 'Premium Wool Fabric',
        sku: 'FABRIC-001',
        category: 'Fabrics',
        currentStock: 3,
        minStock: 10,
        maxStock: 50,
        unit: 'yards',
        supplier: 'Italian Textiles Co.',
        lastRestocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        estimatedDaysLeft: 5,
      },
      {
        id: '2',
        name: 'Silk Lining',
        sku: 'LINING-001',
        category: 'Linings',
        currentStock: 2,
        minStock: 8,
        maxStock: 30,
        unit: 'yards',
        supplier: 'Luxury Linings Ltd.',
        lastRestocked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        estimatedDaysLeft: 3,
      },
      {
        id: '3',
        name: 'Mother of Pearl Buttons',
        sku: 'BTN-001',
        category: 'Accessories',
        currentStock: 15,
        minStock: 25,
        maxStock: 100,
        unit: 'pieces',
        supplier: 'Button Specialists Inc.',
        lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        estimatedDaysLeft: 12,
      },
      {
        id: '4',
        name: 'Thread - Navy Blue',
        sku: 'THREAD-001',
        category: 'Threads',
        currentStock: 1,
        minStock: 5,
        maxStock: 20,
        unit: 'spools',
        supplier: 'Thread Masters',
        lastRestocked: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        estimatedDaysLeft: 2,
      },
    ];

    setInventoryItems(mockInventory);
  }, []);

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock * 0.5) return 'critical';
    if (item.currentStock <= item.minStock) return 'low';
    if (percentage < 30) return 'medium';
    return 'good';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'critical': return 'error';
      case 'low': return 'warning';
      case 'medium': return 'info';
      case 'good': return 'success';
      default: return 'default';
    }
  };

  const getStockIcon = (level: string) => {
    switch (level) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'low': return <WarningIcon color="warning" />;
      default: return <InventoryIcon />;
    }
  };

  const lowStockItems = inventoryItems.filter(item => 
    getStockLevel(item) === 'critical' || getStockLevel(item) === 'low'
  );

  const criticalItems = inventoryItems.filter(item => 
    getStockLevel(item) === 'critical'
  );

  const handleReorder = (item: InventoryItem) => {
    setSelectedItem(item);
    setReorderQuantity(String(item.maxStock - item.currentStock));
    setReorderDialogOpen(true);
  };

  const handleReorderSubmit = () => {
    if (selectedItem && reorderQuantity) {
      // In real app, this would call API to create purchase order
      console.log(`Reordering ${reorderQuantity} ${selectedItem.unit} of ${selectedItem.name}`);
      
      // Update local state to simulate reorder
      setInventoryItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, currentStock: item.currentStock + parseInt(reorderQuantity) }
            : item
        )
      );
      
      setReorderDialogOpen(false);
      setSelectedItem(null);
      setReorderQuantity('');
    }
  };

  const refreshInventory = () => {
    // In real app, this would fetch latest inventory data
    console.log('Refreshing inventory data...');
  };

  return (
    <Box>
      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Critical Stock Alert</AlertTitle>
          {criticalItems.length} item(s) are critically low and need immediate attention!
        </Alert>
      )}

      {/* Low Stock Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Inventory Alerts
            </Typography>
            <IconButton onClick={refreshInventory} title="Refresh inventory">
              <RefreshIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {criticalItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {lowStockItems.length - criticalItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Low Stock
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {inventoryItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {Math.min(...lowStockItems.map(item => item.estimatedDaysLeft))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days Left
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {lowStockItems.length === 0 ? (
            <Alert severity="success">
              <AlertTitle>All Good!</AlertTitle>
              All inventory items are adequately stocked.
            </Alert>
          ) : (
            <List>
              {lowStockItems.map((item) => {
                const stockLevel = getStockLevel(item);
                const stockPercentage = (item.currentStock / item.maxStock) * 100;

                return (
                  <ListItem
                    key={item.id}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: stockLevel === 'critical' 
                        ? theme.palette.error.light + '20'
                        : theme.palette.warning.light + '20',
                    }}
                  >
                    <ListItemIcon>
                      {getStockIcon(stockLevel)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {item.name}
                          </Typography>
                          <Chip
                            label={stockLevel.toUpperCase()}
                            size="small"
                            color={getStockColor(stockLevel) as any}
                            variant="filled"
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ mt: 1, display: 'block' }}>
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            SKU: {item.sku} • Category: {item.category}
                          </Typography>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="body2" component="span">
                              {item.currentStock} / {item.maxStock} {item.unit}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={stockPercentage}
                              color={getStockColor(stockLevel) as any}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" component="span">
                            Estimated {item.estimatedDaysLeft} days remaining
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => handleReorder(item)}
                        color={stockLevel === 'critical' ? 'error' : 'warning'}
                      >
                        Reorder
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Reorder Dialog */}
      <Dialog open={reorderDialogOpen} onClose={() => setReorderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reorder Item
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedItem.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                SKU: {selectedItem.sku} • Current Stock: {selectedItem.currentStock} {selectedItem.unit}
              </Typography>
              
              <TextField
                fullWidth
                label={`Quantity to Order (${selectedItem.unit})`}
                type="number"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                sx={{ mt: 2 }}
                helperText={`Recommended: ${selectedItem.maxStock - selectedItem.currentStock} ${selectedItem.unit} to reach maximum stock`}
              />

              {selectedItem.supplier && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Supplier: {selectedItem.supplier}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReorderDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleReorderSubmit} 
            variant="contained"
            disabled={!reorderQuantity || parseInt(reorderQuantity) <= 0}
          >
            Create Purchase Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryAlerts; 