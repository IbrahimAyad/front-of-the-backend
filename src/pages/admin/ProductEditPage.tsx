import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormGroup,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContentCopy as DuplicateIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  LocalOffer as PriceIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  ColorLens as ColorIcon,
  Straighten as SizeIcon,
  Checkroom as FabricIcon,
  Schedule as SeasonIcon,
  Star as FeaturedIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../utils/api';

interface ProductFormData {
  name: string;
  description: string;
  longDescription: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  brand: string;
  fabric: string;
  pattern: string;
  season: string;
  occasions: string[];
  styleAttributes: string[];
  care: string;
  trackStock: boolean;
  totalStock: number;
  minimumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  weight: number;
  dimensions: string;
  supplierId: string;
  supplierSku: string;
  leadTime: number;
}

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  material: string;
  fit: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  stock: number;
  minimumStock: number;
  isActive: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  position: number;
}

const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEdit = !!productId && productId !== 'new';
  
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    longDescription: '',
    category: '',
    subcategory: '',
    price: 0,
    compareAtPrice: 0,
    costPrice: 0,
    sku: '',
    barcode: '',
    brand: 'KCT',
    fabric: '',
    pattern: '',
    season: 'All Season',
    occasions: [],
    styleAttributes: [],
    care: '',
    trackStock: true,
    totalStock: 0,
    minimumStock: 5,
    reorderPoint: 10,
    reorderQuantity: 50,
    status: 'ACTIVE',
    isPublished: false,
    isFeatured: false,
    isOnSale: false,
    metaTitle: '',
    metaDescription: '',
    tags: [],
    weight: 0,
    dimensions: '',
    supplierId: '',
    supplierSku: '',
    leadTime: 7,
  });
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  
  // Categories and options
  const categories = ['Suits', 'Shirts', 'Ties', 'Vests', 'Pants', 'Accessories'];
  const subcategories = {
    Suits: ['Business', 'Wedding', 'Formal', 'Casual'],
    Shirts: ['Dress', 'Casual', 'Formal', 'Wedding'],
    Ties: ['Silk', 'Wool', 'Cotton', 'Knit'],
    Vests: ['Formal', 'Casual', 'Wedding'],
    Pants: ['Dress', 'Casual', 'Chinos', 'Formal'],
    Accessories: ['Cufflinks', 'Pocket Squares', 'Belts', 'Suspenders'],
  };
  
  const occasions = ['Wedding', 'Business', 'Casual', 'Formal', 'Party', 'Date Night'];
  const styleAttributes = ['Classic', 'Modern', 'Slim Fit', 'Regular Fit', 'Vintage', 'Trendy'];
  const seasons = ['Spring/Summer', 'Fall/Winter', 'All Season'];
  const fabrics = ['Wool', 'Cotton', 'Silk', 'Linen', 'Polyester', 'Blend'];
  const patterns = ['Solid', 'Striped', 'Checkered', 'Plaid', 'Paisley', 'Floral'];
  
  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);
  
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/products/${productId}`);
      const product = response.data.data;
      
      // Map product data to form
      setFormData({
        name: product.name || '',
        description: product.description || '',
        longDescription: product.longDescription || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        costPrice: Number(product.costPrice) || 0,
        sku: product.sku || '',
        barcode: product.barcode || '',
        brand: product.brand || 'KCT',
        fabric: product.fabric || '',
        pattern: product.pattern || '',
        season: product.season || 'All Season',
        occasions: product.occasions || [],
        styleAttributes: product.styleAttributes || [],
        care: product.care || '',
        trackStock: product.trackStock ?? true,
        totalStock: product.totalStock || 0,
        minimumStock: product.minimumStock || 5,
        reorderPoint: product.reorderPoint || 10,
        reorderQuantity: product.reorderQuantity || 50,
        status: product.status || 'ACTIVE',
        isPublished: product.isPublished || false,
        isFeatured: product.isFeatured || false,
        isOnSale: product.isOnSale || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        tags: product.tags || [],
        weight: Number(product.weight) || 0,
        dimensions: product.dimensions || '',
        supplierId: product.supplierId || '',
        supplierSku: product.supplierSku || '',
        leadTime: product.leadTime || 7,
      });
      
      setVariants(product.variants || []);
      setImages(product.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof ProductFormData) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice),
        costPrice: Number(formData.costPrice),
        totalStock: Number(formData.totalStock),
        weight: Number(formData.weight),
        variants,
        images,
      };
      
      if (isEdit) {
        await api.put(`/api/products/${productId}`, payload);
        toast.success('Product updated successfully');
      } else {
        const response = await api.post('/api/products', payload);
        toast.success('Product created successfully');
        navigate(`/admin/products/${response.data.data.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddVariant = () => {
    setCurrentVariant({
      name: '',
      sku: '',
      barcode: '',
      size: '',
      color: '',
      material: formData.fabric,
      fit: '',
      price: formData.price,
      compareAtPrice: formData.compareAtPrice,
      costPrice: formData.costPrice,
      stock: 0,
      minimumStock: 2,
      isActive: true,
    });
    setVariantDialogOpen(true);
  };
  
  const handleSaveVariant = () => {
    if (currentVariant) {
      if (currentVariant.id) {
        // Update existing
        setVariants(prev => prev.map(v => v.id === currentVariant.id ? currentVariant : v));
      } else {
        // Add new
        setVariants(prev => [...prev, { ...currentVariant, id: `temp-${Date.now()}` }]);
      }
      setVariantDialogOpen(false);
      setCurrentVariant(null);
    }
  };
  
  const handleDeleteVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real app, you would upload to a server
      // For now, we'll use local URLs
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: ProductImage = {
            id: `temp-${Date.now()}-${index}`,
            url: e.target?.result as string,
            altText: formData.name,
            isPrimary: images.length === 0,
            position: images.length + index,
          };
          setImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handleImageDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions
    const updatedImages = items.map((img, index) => ({
      ...img,
      position: index,
    }));
    
    setImages(updatedImages);
  };
  
  const calculateMargin = () => {
    if (formData.costPrice && formData.price) {
      const margin = ((formData.price - formData.costPrice) / formData.price) * 100;
      return margin.toFixed(1);
    }
    return '0';
  };
  
  const calculateDiscount = () => {
    if (formData.compareAtPrice && formData.price && formData.compareAtPrice > formData.price) {
      const discount = ((formData.compareAtPrice - formData.price) / formData.compareAtPrice) * 100;
      return discount.toFixed(0);
    }
    return '0';
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/products')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Product' : 'Create New Product'}
          </Typography>
          {isEdit && (
            <Chip
              label={formData.status}
              color={formData.status === 'ACTIVE' ? 'success' : 'default'}
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => window.open(`/products/${formData.sku}`, '_blank')}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={handleInputChange('sku')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Barcode"
                    value={formData.barcode}
                    onChange={handleInputChange('barcode')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Short Description"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Long Description"
                    value={formData.longDescription}
                    onChange={handleInputChange('longDescription')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Images */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Product Images</Typography>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  component="label"
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </Box>
              
              <DragDropContext onDragEnd={handleImageDragEnd}>
                <Droppable droppableId="images" direction="horizontal">
                  {(provided) => (
                    <Box
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}
                    >
                      {images.map((image, index) => (
                        <Draggable key={image.id} draggableId={image.id!} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                width: 150,
                                cursor: 'move',
                                opacity: snapshot.isDragging ? 0.5 : 1,
                              }}
                            >
                              <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                  component="img"
                                  height="150"
                                  image={image.url}
                                  alt={image.altText}
                                />
                                {image.isPrimary && (
                                  <Chip
                                    label="Primary"
                                    size="small"
                                    color="primary"
                                    sx={{
                                      position: 'absolute',
                                      top: 8,
                                      left: 8,
                                    }}
                                  />
                                )}
                                <Box
                                  {...provided.dragHandleProps}
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    p: 0.5,
                                  }}
                                >
                                  <DragIcon fontSize="small" />
                                </Box>
                              </Box>
                              <CardActions>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setImages(prev => prev.map(img => ({
                                      ...img,
                                      isPrimary: img.id === image.id,
                                    })));
                                  }}
                                >
                                  <StarIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => setImages(prev => prev.filter(img => img.id !== image.id))}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </CardActions>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
              
              {images.length === 0 && (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    Upload product images
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Variants */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Product Variants</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariant}
                >
                  Add Variant
                </Button>
              </Box>
              
              {variants.length === 0 ? (
                <Alert severity="info">
                  No variants added yet. Add variants for different sizes, colors, or materials.
                </Alert>
              ) : (
                <List>
                  {variants.map((variant, index) => (
                    <ListItem
                      key={variant.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: variant.color || 'grey.300',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {variant.size || '?'}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={variant.name || `${variant.color} - ${variant.size}`}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption">SKU: {variant.sku}</Typography>
                            <Typography variant="caption">Stock: {variant.stock}</Typography>
                            <Typography variant="caption">${variant.price}</Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setCurrentVariant(variant);
                            setVariantDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteVariant(variant.id!)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Status & Visibility */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status & Visibility
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublished}
                      onChange={handleInputChange('isPublished')}
                    />
                  }
                  label="Published"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFeatured}
                      onChange={handleInputChange('isFeatured')}
                    />
                  }
                  label="Featured Product"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isOnSale}
                      onChange={handleInputChange('isOnSale')}
                    />
                  }
                  label="On Sale"
                />
              </FormGroup>
              
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="DISCONTINUED">Discontinued</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          
          {/* Pricing */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Price"
                    value={formData.price}
                    onChange={handleInputChange('price')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Compare at Price"
                    value={formData.compareAtPrice}
                    onChange={handleInputChange('compareAtPrice')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={formData.compareAtPrice > formData.price ? `${calculateDiscount()}% off` : ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost Price"
                    value={formData.costPrice}
                    onChange={handleInputChange('costPrice')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={`Margin: ${calculateMargin()}%`}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Organization */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Organization
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={handleInputChange('category')}
                      label="Category"
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!formData.category}>
                    <InputLabel>Subcategory</InputLabel>
                    <Select
                      value={formData.subcategory}
                      onChange={handleInputChange('subcategory')}
                      label="Subcategory"
                    >
                      {(subcategories[formData.category as keyof typeof subcategories] || []).map(sub => (
                        <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Brand"
                    value={formData.brand}
                    onChange={handleInputChange('brand')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={formData.tags}
                    onChange={(e, value) => setFormData(prev => ({ ...prev, tags: value }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Add tags"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Inventory */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.trackStock}
                    onChange={handleInputChange('trackStock')}
                  />
                }
                label="Track Stock"
                sx={{ mb: 2 }}
              />
              
              {formData.trackStock && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Stock"
                      value={formData.totalStock}
                      onChange={handleInputChange('totalStock')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Stock"
                      value={formData.minimumStock}
                      onChange={handleInputChange('minimumStock')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Reorder Point"
                      value={formData.reorderPoint}
                      onChange={handleInputChange('reorderPoint')}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Variant Dialog */}
      <Dialog
        open={variantDialogOpen}
        onClose={() => setVariantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentVariant?.id ? 'Edit Variant' : 'Add Variant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variant Name"
                value={currentVariant?.name || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="SKU"
                value={currentVariant?.sku || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, sku: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={currentVariant?.barcode || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, barcode: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Size"
                value={currentVariant?.size || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, size: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Color"
                value={currentVariant?.color || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, color: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Material"
                value={currentVariant?.material || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, material: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fit"
                value={currentVariant?.fit || ''}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, fit: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                value={currentVariant?.price || 0}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, price: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Compare Price"
                value={currentVariant?.compareAtPrice || 0}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, compareAtPrice: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Cost"
                value={currentVariant?.costPrice || 0}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, costPrice: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock"
                value={currentVariant?.stock || 0}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, stock: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Stock"
                value={currentVariant?.minimumStock || 0}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev!, minimumStock: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentVariant?.isActive || false}
                    onChange={(e) => setCurrentVariant(prev => ({ ...prev!, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVariant}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductEditPage;