import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Assignment as OrderIcon,
} from '@mui/icons-material';
import { productAPI, supplierAPI } from '../../services/api';
import {
  Product,
  ProductVariant,
  Supplier,
  InventoryLog,
  StockAlert,
} from '../../types';
import ProductImageManager from '../../components/Products/ProductImageManager';

const EnhancedProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id]);

  const loadProductDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const [
        productResponse,
        variantsResponse,
        inventoryLogsResponse,
        alertsResponse,
      ] = await Promise.all([
        productAPI.getProduct(id),
        productAPI.getVariants(id),
        productAPI.getInventoryLogs(id),
        productAPI.getStockAlerts({ productId: id }),
      ]);

      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
        
        // Load supplier if product has one
        if (productResponse.data.supplierId) {
          const supplierResponse = await supplierAPI.getSupplier(productResponse.data.supplierId);
          if (supplierResponse.success) {
            setSupplier(supplierResponse.data);
          }
        }
      }

      if (variantsResponse.success) {
        setVariants(variantsResponse.data || []);
      }

      if (inventoryLogsResponse.success) {
        setInventoryLogs(inventoryLogsResponse.data || []);
      }

      if (alertsResponse.success) {
        setStockAlerts(alertsResponse.data || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const getStockLevelColor = (stock: number, reorderPoint: number) => {
    if (stock <= 0) return 'error';
    if (stock <= reorderPoint) return 'warning';
    return 'success';
  };

  const getStockHealthPercentage = () => {
    if (!product) return 0;
    const total = product.totalStock;
    const available = product.availableStock;
    return total > 0 ? (available / total) * 100 : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!product) return <Alert severity="warning">Product not found</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/inventory')}>
          <BackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000' }}>
            {product.name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            SKU: {product.sku} • Category: {product.category}
            {product.brand && ` • Brand: ${product.brand}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {/* Navigate to edit page */}}
          >
            Edit Product
          </Button>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            sx={{ backgroundColor: '#8B0000' }}
            onClick={() => {/* Open stock adjustment dialog */}}
          >
            Adjust Stock
          </Button>
        </Box>
      </Box>

      {/* Status Chips */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={product.status}
          color={product.status === 'ACTIVE' ? 'success' : 'default'}
        />
        {product.isPublished && <Chip label="Published" color="primary" />}
        {product.isFeatured && <Chip label="Featured" icon={<StarIcon />} />}
        {product.isOnSale && <Chip label="On Sale" color="error" />}
        {product.availableStock <= product.reorderPoint && (
          <Chip
            label="Low Stock"
            color="warning"
            icon={<WarningIcon />}
          />
        )}
      </Box>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Stock Alerts ({stockAlerts.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stockAlerts.map((alert) => (
              <Chip
                key={alert.id}
                label={alert.message}
                size="small"
                color={alert.priority === 'CRITICAL' ? 'error' : 'warning'}
              />
            ))}
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Product Info */}
        <Grid item xs={12} md={8}>
          {/* Product Images */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Images
              </Typography>
              <ProductImageManager
                productId={product.id}
                images={product.images || []}
                onImagesUpdate={(images) => setProduct({ ...product, images })}
              />
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {product.description || 'No description available'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Long Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {product.longDescription || 'No detailed description available'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Fabric & Care
                  </Typography>
                  <Typography variant="body1">
                    {product.fabric && `Fabric: ${product.fabric}`}
                    {product.pattern && ` • Pattern: ${product.pattern}`}
                    {product.care && (
                      <Box component="span" display="block" sx={{ mt: 0.5 }}>
                        Care: {product.care}
                      </Box>
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Occasions & Attributes
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {product.occasions.map((occasion) => (
                      <Chip key={occasion} label={occasion} size="small" variant="outlined" />
                    ))}
                    {product.styleAttributes.map((attr) => (
                      <Chip key={attr} label={attr} size="small" />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Product Variants */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Product Variants ({variants.length})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {/* Open add variant dialog */}}
                >
                  Add Variant
                </Button>
              </Box>

              {variants.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>{variant.name}</TableCell>
                          <TableCell>{variant.sku}</TableCell>
                          <TableCell>{variant.size || '-'}</TableCell>
                          <TableCell>{variant.color || '-'}</TableCell>
                          <TableCell>
                            {variant.price ? formatCurrency(variant.price) : 'Inherit'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={variant.stock}
                              color={getStockLevelColor(variant.stock, variant.reorderPoint)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={variant.isActive ? 'Active' : 'Inactive'}
                              color={variant.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No variants configured. Add variants to track different sizes, colors, or styles.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Inventory History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory History
              </Typography>
              
              {inventoryLogs.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Stock Change</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Reference</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryLogs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.createdAt)}</TableCell>
                          <TableCell>
                            <Chip label={log.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {log.type === 'SALE' || log.type === 'DAMAGE' ? (
                                <TrendingDownIcon color="error" fontSize="small" />
                              ) : (
                                <TrendingUpIcon color="success" fontSize="small" />
                              )}
                              {log.quantity}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {log.previousStock} → {log.newStock}
                          </TableCell>
                          <TableCell>{log.reason || '-'}</TableCell>
                          <TableCell>{log.reference || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No inventory history available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Pricing & Inventory */}
        <Grid item xs={12} md={4}>
          {/* Pricing Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {formatCurrency(product.price)}
                </Typography>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <Typography
                    variant="body1"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                  >
                    {formatCurrency(product.compareAtPrice)}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Cost Price
                  </Typography>
                  <Typography variant="body1">
                    {product.costPrice ? formatCurrency(product.costPrice) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Margin
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    {product.costPrice
                      ? `${Math.round(((product.price - product.costPrice) / product.price) * 100)}%`
                      : 'N/A'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Status
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Stock Health</Typography>
                  <Typography variant="body2">
                    {Math.round(getStockHealthPercentage())}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getStockHealthPercentage()}
                  color={getStockLevelColor(product.availableStock, product.reorderPoint)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Stock
                  </Typography>
                  <Typography variant="h6">{product.totalStock}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Available
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {product.availableStock}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Reserved
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {product.reservedStock}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Reorder Point
                  </Typography>
                  <Typography variant="h6">{product.reorderPoint}</Typography>
                </Grid>
              </Grid>

              {product.availableStock <= product.reorderPoint && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Stock is below reorder point. Consider ordering {product.reorderQuantity} units.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {supplier && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Supplier
                </Typography>

                <Typography variant="subtitle1" gutterBottom>
                  {supplier.name}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Contact: {supplier.contactName}
                </Typography>
                
                {supplier.email && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Email: {supplier.email}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Lead Time
                    </Typography>
                    <Typography variant="body1">
                      {supplier.leadTime || product.leadTime || 'N/A'} days
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Rating
                    </Typography>
                    <Typography variant="body1">
                      {supplier.rating ? `${supplier.rating}/5` : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<OrderIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => {/* Create purchase order */}}
                >
                  Create Purchase Order
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SEO & Marketing */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">SEO & Marketing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Meta Title
                  </Typography>
                  <Typography variant="body2">
                    {product.metaTitle || 'Not set'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Meta Description
                  </Typography>
                  <Typography variant="body2">
                    {product.metaDescription || 'Not set'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Tags
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {product.tags.length > 0 ? (
                      product.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No tags set
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedProductDetailPage; 