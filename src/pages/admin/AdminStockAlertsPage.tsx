import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ReorderIcon,
} from '@mui/icons-material';

interface StockAlert {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  category: string;
  status: 'low_stock' | 'out_of_stock' | 'critical';
  lastUpdated: string;
}

const AdminStockAlertsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockAlert | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  const [stockAlerts] = useState<StockAlert[]>([
    {
      id: '1',
      productName: 'Classic Navy Wedding Suit',
      sku: 'CNW-001',
      currentStock: 3,
      reorderPoint: 5,
      category: 'Suits',
      status: 'low_stock',
      lastUpdated: '2024-07-23T10:30:00Z',
    },
    {
      id: '2',
      productName: 'Burgundy Silk Bow Tie',
      sku: 'BSB-002',
      currentStock: 0,
      reorderPoint: 10,
      category: 'Ties',
      status: 'out_of_stock',
      lastUpdated: '2024-07-23T09:15:00Z',
    },
    {
      id: '3',
      productName: 'Silver Cufflinks Set',
      sku: 'SCL-003',
      currentStock: 1,
      reorderPoint: 8,
      category: 'Accessories',
      status: 'critical',
      lastUpdated: '2024-07-23T08:45:00Z',
    },
    {
      id: '4',
      productName: 'Black Formal Tie',
      sku: 'BFT-004',
      currentStock: 4,
      reorderPoint: 10,
      category: 'Ties',
      status: 'low_stock',
      lastUpdated: '2024-07-23T11:00:00Z',
    },
  ]);

  const getFilteredAlerts = () => {
    switch (tabValue) {
      case 0: return stockAlerts; // All alerts
      case 1: return stockAlerts.filter(alert => alert.status === 'out_of_stock');
      case 2: return stockAlerts.filter(alert => alert.status === 'critical');
      case 3: return stockAlerts.filter(alert => alert.status === 'low_stock');
      default: return stockAlerts;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'error';
      case 'critical': return 'warning';
      case 'low_stock': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock': return <ErrorIcon />;
      case 'critical': return <WarningIcon />;
      case 'low_stock': return <WarningIcon />;
      default: return <WarningIcon />;
    }
  };

  const handleQuickAdjust = (product: StockAlert, type: 'add' | 'remove') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentAmount('');
    setAdjustDialogOpen(true);
  };

  const handleStockAdjustment = () => {
    // Handle stock adjustment logic here
    console.log(`${adjustmentType} ${adjustmentAmount} for product ${selectedProduct?.sku}`);
    setAdjustDialogOpen(false);
  };

  const alertCounts = {
    total: stockAlerts.length,
    outOfStock: stockAlerts.filter(a => a.status === 'out_of_stock').length,
    critical: stockAlerts.filter(a => a.status === 'critical').length,
    lowStock: stockAlerts.filter(a => a.status === 'low_stock').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Stock Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor low stock and out of stock items
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Alert Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" color="text.primary">
              {alertCounts.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Alerts
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}>
            <Typography variant="h6" color="error.main">
              {alertCounts.outOfStock}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Out of Stock
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'warning.main' }}>
            <Typography variant="h6" color="warning.main">
              {alertCounts.critical}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="h6" color="info.main">
              {alertCounts.lowStock}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Low Stock
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All Alerts (${alertCounts.total})`} />
          <Tab label={`Out of Stock (${alertCounts.outOfStock})`} />
          <Tab label={`Critical (${alertCounts.critical})`} />
          <Tab label={`Low Stock (${alertCounts.lowStock})`} />
        </Tabs>
      </Paper>

      {/* Alerts Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Current Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Reorder Point</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Quick Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredAlerts().map((alert) => (
                <TableRow key={alert.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {alert.productName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {alert.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={alert.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={alert.currentStock === 0 ? 'error.main' : 'text.primary'}
                    >
                      {alert.currentStock}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {alert.reorderPoint}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      icon={getStatusIcon(alert.status)}
                      label={alert.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(alert.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(alert.lastUpdated).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleQuickAdjust(alert, 'add')}
                        title="Add Stock"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      {alert.currentStock > 0 && (
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleQuickAdjust(alert, 'remove')}
                          title="Remove Stock"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        color="primary"
                        title="Reorder"
                      >
                        <ReorderIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {getFilteredAlerts().length === 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          No alerts in this category. All products are well stocked!
        </Alert>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'} - {selectedProduct?.productName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Current Stock: {selectedProduct?.currentStock} units
            </Alert>
            <TextField
              label={`Amount to ${adjustmentType}`}
              type="number"
              fullWidth
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStockAdjustment} variant="contained">
            {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminStockAlertsPage; 