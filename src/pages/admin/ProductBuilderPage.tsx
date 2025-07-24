import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
  Alert,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Checkroom as OutfitIcon,
  BusinessCenter as BusinessIcon,
  Celebration as WeddingIcon,
  Star as FeaturedIcon,
  AttachMoney as PriceIcon,
  Inventory as StockIcon,
  ShoppingCart as BundleIcon,
  ContentCopy as DuplicateIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  subcategory?: string;
  totalStock: number;
  images?: { url: string; isPrimary: boolean }[];
}

interface BundleComponent {
  productId: string;
  productName: string;
  productSku: string;
  componentType: 'JACKET' | 'PANTS' | 'SHIRT' | 'TIE' | 'VEST' | 'ACCESSORY';
  quantity: number;
  price: number;
  isRequired: boolean;
}

interface ProductBundle {
  id?: string;
  name: string;
  description: string;
  bundleType: 'BUSINESS' | 'WEDDING' | 'FORMAL' | 'CASUAL';
  components: BundleComponent[];
  bundlePrice: number;
  originalPrice: number;
  discount: number;
  isActive: boolean;
  isFeatured: boolean;
  sku: string;
}

const ProductBuilderPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<ProductBundle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Component types with colors
  const componentTypes = [
    { type: 'JACKET', label: 'Jacket', color: '#1976d2' },
    { type: 'PANTS', label: 'Pants', color: '#388e3c' },
    { type: 'SHIRT', label: 'Shirt', color: '#7b1fa2' },
    { type: 'TIE', label: 'Tie', color: '#d32f2f' },
    { type: 'VEST', label: 'Vest', color: '#f57c00' },
    { type: 'ACCESSORY', label: 'Accessory', color: '#0288d1' },
  ];

  const bundleTypes = [
    { type: 'BUSINESS', label: 'Business', icon: <BusinessIcon />, color: 'primary' },
    { type: 'WEDDING', label: 'Wedding', icon: <WeddingIcon />, color: 'secondary' },
    { type: 'FORMAL', label: 'Formal', icon: <OutfitIcon />, color: 'success' },
    { type: 'CASUAL', label: 'Casual', icon: <OutfitIcon />, color: 'info' },
  ];

  useEffect(() => {
    fetchProducts();
    fetchBundles();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?limit=100');
      setAvailableProducts(response.data.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchBundles = async () => {
    // Mock data for now - you can implement API later
    setBundles([
      {
        id: '1',
        name: 'Executive Business Bundle',
        description: 'Complete professional outfit for business meetings',
        bundleType: 'BUSINESS',
        components: [
          {
            productId: '1',
            productName: 'Navy Business Suit',
            productSku: 'SUIT-001',
            componentType: 'JACKET',
            quantity: 1,
            price: 299,
            isRequired: true,
          },
          {
            productId: '2',
            productName: 'White Dress Shirt',
            productSku: 'SHIRT-001',
            componentType: 'SHIRT',
            quantity: 1,
            price: 69,
            isRequired: true,
          },
          {
            productId: '3',
            productName: 'Silk Business Tie',
            productSku: 'TIE-001',
            componentType: 'TIE',
            quantity: 1,
            price: 39,
            isRequired: false,
          },
        ],
        bundlePrice: 369,
        originalPrice: 407,
        discount: 9.3,
        isActive: true,
        isFeatured: true,
        sku: 'BUNDLE-001',
      },
    ]);
  };

  const createNewBundle = () => {
    setSelectedBundle({
      name: '',
      description: '',
      bundleType: 'BUSINESS',
      components: [],
      bundlePrice: 0,
      originalPrice: 0,
      discount: 0,
      isActive: true,
      isFeatured: false,
      sku: '',
    });
    setIsEditing(true);
  };

  const addProductToBundle = (product: ProductItem, componentType: string) => {
    if (!selectedBundle) return;

    const newComponent: BundleComponent = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      componentType: componentType as any,
      quantity: 1,
      price: product.price,
      isRequired: true,
    };

    const updatedComponents = [...selectedBundle.components, newComponent];
    const newOriginalPrice = updatedComponents.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);

    setSelectedBundle({
      ...selectedBundle,
      components: updatedComponents,
      originalPrice: newOriginalPrice,
      bundlePrice: selectedBundle.bundlePrice || newOriginalPrice * 0.9, // 10% default discount
      discount: ((newOriginalPrice - (selectedBundle.bundlePrice || newOriginalPrice * 0.9)) / newOriginalPrice) * 100,
    });

    setProductDialogOpen(false);
  };

  const removeComponent = (index: number) => {
    if (!selectedBundle) return;

    const updatedComponents = selectedBundle.components.filter((_, i) => i !== index);
    const newOriginalPrice = updatedComponents.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);

    setSelectedBundle({
      ...selectedBundle,
      components: updatedComponents,
      originalPrice: newOriginalPrice,
      discount: newOriginalPrice > 0 ? ((newOriginalPrice - selectedBundle.bundlePrice) / newOriginalPrice) * 100 : 0,
    });
  };

  const saveBundle = async () => {
    if (!selectedBundle) return;

    try {
      // Generate SKU if not provided
      if (!selectedBundle.sku) {
        selectedBundle.sku = `BUNDLE-${Date.now()}`;
      }

      // Mock save - implement API call later
      if (selectedBundle.id) {
        setBundles(prev => prev.map(b => b.id === selectedBundle.id ? selectedBundle : b));
        toast.success('Bundle updated successfully');
      } else {
        const newBundle = { ...selectedBundle, id: Date.now().toString() };
        setBundles(prev => [...prev, newBundle]);
        toast.success('Bundle created successfully');
      }

      setIsEditing(false);
      setSelectedBundle(null);
    } catch (error) {
      toast.error('Failed to save bundle');
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBundlesList = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Product Bundles
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createNewBundle}
        >
          Create Bundle
        </Button>
      </Box>

      <Stack spacing={2}>
        {bundles.map((bundle) => (
          <Card key={bundle.id} sx={{ cursor: 'pointer' }} onClick={() => setSelectedBundle(bundle)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {bundle.name}
                    </Typography>
                    {bundle.isFeatured && (
                      <Chip icon={<FeaturedIcon />} label="Featured" size="small" color="primary" />
                    )}
                    <Chip 
                      label={bundleTypes.find(t => t.type === bundle.bundleType)?.label} 
                      size="small" 
                      color={bundleTypes.find(t => t.type === bundle.bundleType)?.color as any}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {bundle.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Typography variant="h6" color="primary">
                      ${bundle.bundlePrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through' }} color="text.secondary">
                      ${bundle.originalPrice.toFixed(2)}
                    </Typography>
                    <Chip label={`${bundle.discount.toFixed(0)}% OFF`} size="small" color="success" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {bundle.components.map((comp, index) => (
                      <Chip
                        key={index}
                        label={componentTypes.find(t => t.type === comp.componentType)?.label}
                        size="small"
                        sx={{ 
                          bgcolor: componentTypes.find(t => t.type === comp.componentType)?.color,
                          color: 'white'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Switch checked={bundle.isActive} size="small" />}
                    label="Active"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBundle(bundle);
                      setIsEditing(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );

  const renderBundleEditor = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {selectedBundle?.id ? 'Edit Bundle' : 'Create New Bundle'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setIsEditing(false);
              setSelectedBundle(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveBundle}
          >
            Save Bundle
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Bundle Name"
              value={selectedBundle?.name || ''}
              onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={selectedBundle?.description || ''}
              onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, description: e.target.value } : null)}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Bundle Type</InputLabel>
                <Select
                  value={selectedBundle?.bundleType || 'BUSINESS'}
                  onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, bundleType: e.target.value as any } : null)}
                  label="Bundle Type"
                >
                  {bundleTypes.map((type) => (
                    <MenuItem key={type.type} value={type.type}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="SKU"
                value={selectedBundle?.sku || ''}
                onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, sku: e.target.value } : null)}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={selectedBundle?.isActive || false}
                    onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={selectedBundle?.isFeatured || false}
                    onChange={(e) => setSelectedBundle(prev => prev ? { ...prev, isFeatured: e.target.checked } : null)}
                  />
                }
                label="Featured"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Bundle Components ({selectedBundle?.components.length || 0})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setProductDialogOpen(true)}
            >
              Add Product
            </Button>
          </Box>

          <Stack spacing={2}>
            {selectedBundle?.components.map((component, index) => (
              <Card key={index} variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={componentTypes.find(t => t.type === component.componentType)?.label}
                        size="small"
                        sx={{ 
                          bgcolor: componentTypes.find(t => t.type === component.componentType)?.color,
                          color: 'white'
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle2">{component.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{component.productSku}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2">Qty: {component.quantity}</Typography>
                      <Typography variant="body2" fontWeight="bold">${component.price}</Typography>
                      <Chip 
                        label={component.isRequired ? 'Required' : 'Optional'} 
                        size="small" 
                        color={component.isRequired ? 'primary' : 'default'}
                      />
                      <IconButton size="small" color="error" onClick={() => removeComponent(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {(!selectedBundle?.components || selectedBundle.components.length === 0) && (
              <Alert severity="info">
                No components added yet. Click "Add Product" to start building your bundle.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pricing
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Bundle Price"
                type="number"
                value={selectedBundle?.bundlePrice || 0}
                onChange={(e) => {
                  const bundlePrice = parseFloat(e.target.value) || 0;
                  const discount = selectedBundle?.originalPrice ? ((selectedBundle.originalPrice - bundlePrice) / selectedBundle.originalPrice) * 100 : 0;
                  setSelectedBundle(prev => prev ? { ...prev, bundlePrice, discount } : null);
                }}
                InputProps={{
                  startAdornment: '$',
                }}
              />
              
              <TextField
                fullWidth
                label="Original Price"
                type="number"
                value={selectedBundle?.originalPrice || 0}
                InputProps={{
                  startAdornment: '$',
                }}
                disabled
              />

              <TextField
                fullWidth
                label="Discount %"
                value={selectedBundle?.discount.toFixed(1) || 0}
                InputProps={{
                  endAdornment: '%',
                }}
                disabled
              />
            </Stack>

            <Alert severity="success">
              <Typography variant="body2">
                Customers save ${((selectedBundle?.originalPrice || 0) - (selectedBundle?.bundlePrice || 0)).toFixed(2)} with this bundle!
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Bundles" />
        <Tab label="Bundle Editor" disabled={!isEditing && !selectedBundle} />
      </Tabs>

      {tabValue === 0 && renderBundlesList()}
      {tabValue === 1 && (isEditing || selectedBundle) && renderBundleEditor()}

      {/* Product Selection Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Product to Bundle
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Select component type:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {componentTypes.map((type) => (
              <Chip
                key={type.type}
                label={type.label}
                sx={{ bgcolor: type.color, color: 'white' }}
              />
            ))}
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredProducts.map((product) => (
                <ListItem
                  key={product.id}
                  onClick={() => addProductToBundle(product, 'JACKET')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar src={product.images?.[0]?.url} variant="rounded">
                      {product.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={product.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">{product.sku}</Typography>
                        <Typography variant="body2" color="primary">${product.price}</Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={`${product.totalStock} in stock`} 
                      size="small" 
                      color={product.totalStock > 10 ? 'success' : 'warning'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductBuilderPage; 