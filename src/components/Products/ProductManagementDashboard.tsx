import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { productAPI, supplierAPI, inventoryAPI } from '../../services/api';
import {
  Product,
  ProductVariant,
  Supplier,
  PurchaseOrder,
  StockAlert,
  ProductDashboardStats,
  ProductFilters,
  CreateProductRequest,
} from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductManagementDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [dashboardStats, setDashboardStats] = useState<ProductDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [stockAdjustmentDialogOpen, setStockAdjustmentDialogOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Form states
  const [productForm, setProductForm] = useState<Partial<CreateProductRequest>>({
    trackStock: true,
    isPublished: true,
    status: 'ACTIVE',
    occasions: [],
    styleAttributes: [],
    tags: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        productsResponse,
        suppliersResponse,
        alertsResponse,
        statsResponse,
      ] = await Promise.all([
        productAPI.getProducts(filters),
        supplierAPI.getSuppliers({ isActive: true }),
        productAPI.getStockAlerts({ resolved: false }),
        productAPI.getDashboardStats(),
      ]);

      if (productsResponse.success) {
        setProducts(productsResponse.data?.products || []);
      }
      if (suppliersResponse.success) {
        setSuppliers(suppliersResponse.data?.suppliers || []);
      }
      if (alertsResponse.success) {
        setStockAlerts(alertsResponse.data || []);
      }
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      if (!productForm.name || !productForm.sku || !productForm.price || !productForm.category) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await productAPI.createProduct(productForm as CreateProductRequest);
      if (response.success) {
        setProductDialogOpen(false);
        setProductForm({
          trackStock: true,
          isPublished: true,
          status: 'ACTIVE',
          occasions: [],
          styleAttributes: [],
          tags: [],
        });
        loadDashboardData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    }
  };

  const handleStockAdjustment = async (productId: string, adjustment: { type: string; quantity: number; reason?: string }) => {
    try {
      const response = await productAPI.adjustStock(productId, adjustment as any);
      if (response.success) {
        setStockAdjustmentDialogOpen(false);
        loadDashboardData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  const getStockLevelColor = (product: Product) => {
    if (product.availableStock <= 0) return 'error';
    if (product.availableStock <= product.reorderPoint) return 'warning';
    return 'success';
  };

  const getStockHealthPercentage = (stats: ProductDashboardStats) => {
    const total = stats.stockHealth.healthy + stats.stockHealth.lowStock + stats.stockHealth.outOfStock;
    return total > 0 ? (stats.stockHealth.healthy / total) * 100 : 0;
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000' }}>
          Inventory Management System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => {/* Handle import */}}
            sx={{ backgroundColor: '#8B0000' }}
          >
            Import Products
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {/* Handle export */}}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProductDialogOpen(true)}
            sx={{ backgroundColor: '#8B0000' }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Stats */}
      {dashboardStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Products
                    </Typography>
                    <Typography variant="h4" component="h2">
                      {dashboardStats.totalProducts}
                    </Typography>
                  </Box>
                  <InventoryIcon sx={{ fontSize: 40, color: '#8B0000' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography variant="h4" component="h2" color="warning.main">
                      {dashboardStats.lowStockProducts}
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Inventory Value
                    </Typography>
                    <Typography variant="h4" component="h2">
                      ${dashboardStats.totalInventoryValue.toLocaleString()}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Stock Health
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={getStockHealthPercentage(dashboardStats)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {Math.round(getStockHealthPercentage(dashboardStats))}%
                      </Typography>
                    </Box>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Stock Alerts ({stockAlerts.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stockAlerts.slice(0, 5).map((alert) => (
                <Chip
                  key={alert.id}
                  label={alert.message}
                  color={alert.priority === 'CRITICAL' ? 'error' : 'warning'}
                  variant="outlined"
                  size="small"
                />
              ))}
              {stockAlerts.length > 5 && (
                <Chip label={`+${stockAlerts.length - 5} more`} variant="outlined" size="small" />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Products" />
            <Tab label="Suppliers" />
            <Tab label="Purchase Orders" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="suits">Suits</MenuItem>
                <MenuItem value="shirts">Shirts</MenuItem>
                <MenuItem value="ties">Ties</MenuItem>
                <MenuItem value="vests">Vests</MenuItem>
                <MenuItem value="accessories">Accessories</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="DISCONTINUED">Discontinued</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })}
              color={filters.lowStock ? 'primary' : 'inherit'}
            >
              Low Stock Only
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        {product.brand && (
                          <Typography variant="caption" color="textSecondary">
                            {product.brand}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <Chip 
                        label={product.category} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">${product.price}</Typography>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                            ${product.compareAtPrice}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={product.availableStock}
                          color={getStockLevelColor(product)}
                          size="small"
                        />
                        {product.availableStock <= product.reorderPoint && (
                          <Tooltip title="Low stock - reorder needed">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        color={product.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductForm(product);
                            setProductDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockAdjustmentDialogOpen(true);
                          }}
                        >
                          <InventoryIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Suppliers Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Supplier Management</Typography>
          {/* Supplier content will be implemented here */}
        </TabPanel>

        {/* Purchase Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Purchase Order Management</Typography>
          {/* Purchase order content will be implemented here */}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Inventory Analytics</Typography>
          {/* Analytics content will be implemented here */}
        </TabPanel>
      </Card>

      {/* Product Dialog */}
      <Dialog 
        open={productDialogOpen} 
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Create New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                required
                value={productForm.name || ''}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                required
                value={productForm.sku || ''}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={productForm.category || ''}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <MenuItem value="suits">Suits</MenuItem>
                  <MenuItem value="shirts">Shirts</MenuItem>
                  <MenuItem value="ties">Ties</MenuItem>
                  <MenuItem value="vests">Vests</MenuItem>
                  <MenuItem value="accessories">Accessories</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                required
                value={productForm.price || ''}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={productForm.description || ''}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </Grid>
            {/* Add more form fields as needed */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProduct}
            variant="contained"
            sx={{ backgroundColor: '#8B0000' }}
          >
            {selectedProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={stockAdjustmentDialogOpen}
        onClose={() => setStockAdjustmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          {/* Stock adjustment form will be implemented here */}
          <Typography>Stock adjustment functionality coming soon...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockAdjustmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ backgroundColor: '#8B0000' }}>
            Adjust Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductManagementDashboard; 