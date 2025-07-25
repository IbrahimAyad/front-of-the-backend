import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  OutlinedInput,
  IconButton,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Download as DownloadIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProductDataTable from '../../components/Admin/ProductDataTable';
import CloudflareImageUpload, { ProductImage as CloudflareProductImage } from '../../components/Products/CloudflareImageUpload';
import VariantDisplayGrid from '../../components/Admin/VariantDisplayGrid';
import api from '../../services/api';

// Use compatible ProductImage interface
interface ProductImage {
  id?: string;
  cloudflareId?: string;
  url: string;
  altText?: string;
  isPrimary: boolean; // Required for compatibility
  position?: number;
}

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

interface Product {
  id: string;
  name: string;
  description?: string;
  longDescription?: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  slug?: string;
  brand?: string;
  fabric?: string;
  pattern?: string;
  season?: string;
  occasions: string[];
  styleAttributes: string[];
  care?: string;
  
  // Smart Product Attributes
  smartAttributes?: any; // JSON field for formality_level, conservative_rating, etc.
  fabricMarketing?: string;
  fabricCare?: string;
  fabricBenefits: string[];
  
  // Color Intelligence
  colorFamily?: string;
  hexPrimary?: string;
  hexSecondary?: string;
  
  // Event & Occasion
  primaryOccasion?: string;
  occasionTags: string[];
  trendingFor: string[];
  
  // Outfit Building Helpers
  outfitRole?: string;
  pairsWellWith: string[];
  styleNotes?: string;
  
  // Local SEO
  localKeywords: string[];
  targetLocation?: string;
  
  // Inventory Management
  trackStock: boolean;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  
  // Status & Visibility
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  
  // SEO & Marketing
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  weight?: number;
  dimensions?: string;
  
  // Supplier Information
  supplierId?: string;
  supplierSku?: string;
  leadTime?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt: Date;
  publishedAt?: string;
  discontinuedAt?: string;
  
  // Relations
  variants: ProductVariant[];
  images: ProductImage[];
  
  // Computed fields (for backward compatibility)
  sales?: number;
  revenue?: number;
}

const AdminProductsPageWithDialog: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    price: 0,
    compareAtPrice: 0,
    description: '',
    longDescription: '',
    brand: '',
    fabric: '',
    pattern: '',
    season: '',
    care: '',
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    isOnSale: false,
    trackStock: true,
    minimumStock: 5,
    reorderPoint: 10,
    reorderQuantity: 50,
    tags: [],
    occasions: [],
    styleAttributes: [],
  });
  const [saving, setSaving] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

  // Add refs for variant form inputs
  const variantSizeRef = useRef<HTMLInputElement>(null);
  const variantColorRef = useRef<HTMLInputElement>(null);
  const variantStockRef = useRef<HTMLInputElement>(null);
  const variantSkuRef = useRef<HTMLInputElement>(null);

  // Debug variants state changes
  useEffect(() => {
    console.log('🔧 ProductVariants state updated:', productVariants);
  }, [productVariants]);

  const handleExport = async () => {
    setExporting(true);
    try {
      toast.success('Export feature coming soon!');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Fetch fresh data
      const response = await api.get(`/products?limit=100`);
      const formattedProducts = response.data.data.products.map((product: any) => ({
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
        costPrice: product.costPrice ? Number(product.costPrice) : undefined,
        images: product.images || [],
        variants: product.variants || [],
        updatedAt: new Date(product.updatedAt),
        tags: product.tags || [],
        occasions: product.occasions || [],
        styleAttributes: product.styleAttributes || [],
        occasionTags: product.occasionTags || [],
        fabricBenefits: product.fabricBenefits || [],
        pairsWellWith: product.pairsWellWith || [],
        trendingFor: product.trendingFor || [],
        localKeywords: product.localKeywords || [],
        // Include all smart attributes from database
        smartAttributes: product.smartAttributes || null,
        colorFamily: product.colorFamily || null,
        fabricMarketing: product.fabricMarketing || null,
        fabricCare: product.fabricCare || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
      }));
      
      // Direct update - no aggressive clearing
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      // Ensure arrays are properly initialized
      tags: product.tags || [],
      occasions: product.occasions || [],
      styleAttributes: product.styleAttributes || [],
      occasionTags: product.occasionTags || [],
      fabricBenefits: product.fabricBenefits || [],
      pairsWellWith: product.pairsWellWith || [],
      trendingFor: product.trendingFor || [],
      localKeywords: product.localKeywords || [],
      // Ensure smart attributes are loaded
      smartAttributes: product.smartAttributes || undefined,
      colorFamily: product.colorFamily || undefined,
      fabricMarketing: product.fabricMarketing || undefined,
      fabricCare: product.fabricCare || undefined,
      metaTitle: product.metaTitle || undefined,
      metaDescription: product.metaDescription || undefined,
    });
    setProductImages(product.images || []);
    console.log('🔧 Loading variants for product:', product.name);
    console.log('🔧 Raw product variants:', product.variants);
    console.log('🔧 Variants count:', product.variants?.length || 0);
    console.log('🎨 Smart attributes loaded:', product.smartAttributes);
    console.log('🌈 Color family:', product.colorFamily);
    setProductVariants(product.variants || []);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: '',
      subcategory: '',
      price: 0,
      compareAtPrice: 0,
      description: '',
      status: 'ACTIVE',
      isPublished: true,
      isFeatured: false,
      tags: [],
      occasions: [],
      styleAttributes: [],
    });
    setProductImages([]);
    setProductVariants([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setProductForm({});
  };

  const handleSave = async () => {
    // Prevent double-click
    if (saving) return;
    
    setSaving(true);
    try {
      // Build comprehensive product data with ALL fields
      const productData: any = {
        name: productForm.name,
        description: productForm.description,
        longDescription: productForm.longDescription,
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
        sku: productForm.sku,
        barcode: productForm.barcode,
        slug: productForm.slug,
        brand: productForm.brand,
        fabric: productForm.fabric,
        pattern: productForm.pattern,
        season: productForm.season,
        care: productForm.care,
        
        // Arrays and collections
        occasions: productForm.occasions || [],
        styleAttributes: productForm.styleAttributes || [],
        tags: productForm.tags || [],
        occasionTags: productForm.occasionTags || [],
        fabricBenefits: productForm.fabricBenefits || [],
        pairsWellWith: productForm.pairsWellWith || [],
        trendingFor: productForm.trendingFor || [],
        localKeywords: productForm.localKeywords || [],
        
        // Smart attributes
        smartAttributes: productForm.smartAttributes,
        fabricMarketing: productForm.fabricMarketing,
        fabricCare: productForm.fabricCare,
        
        // Color intelligence
        colorFamily: productForm.colorFamily,
        hexPrimary: productForm.hexPrimary,
        hexSecondary: productForm.hexSecondary,
        
        // Event & occasion
        primaryOccasion: productForm.primaryOccasion,
        
        // Outfit building
        outfitRole: productForm.outfitRole,
        styleNotes: productForm.styleNotes,
        
        // SEO & marketing
        metaTitle: productForm.metaTitle,
        metaDescription: productForm.metaDescription,
        weight: productForm.weight ? Number(productForm.weight) : undefined,
        dimensions: productForm.dimensions,
        targetLocation: productForm.targetLocation,
        
        // Inventory management
        trackStock: productForm.trackStock ?? true,
        minimumStock: productForm.minimumStock ? Number(productForm.minimumStock) : 5,
        reorderPoint: productForm.reorderPoint ? Number(productForm.reorderPoint) : 10,
        reorderQuantity: productForm.reorderQuantity ? Number(productForm.reorderQuantity) : 50,
        
        // Status & visibility
        status: productForm.status || 'ACTIVE',
        isPublished: productForm.isPublished ?? true,
        isFeatured: productForm.isFeatured ?? false,
        isOnSale: productForm.isOnSale ?? false,
      };

      // Add images if we have any (for Prisma nested update)
      if (productImages.length > 0) {
        productData.images = {
          deleteMany: {}, // Clear existing images
          create: productImages.map((img, index) => ({
            url: img.url,
            altText: img.altText || `Product image ${index + 1}`,
            isPrimary: img.isPrimary || index === 0,
            position: img.position || index,
          }))
        };
      }

      // Add variants if we have any (for Prisma nested update)
      if (productVariants.length > 0) {
        productData.variants = {
          deleteMany: {}, // Clear existing variants
          create: productVariants.map((variant, index) => ({
            name: variant.name || `${productData.sku}-${index + 1}`,
            sku: variant.sku || `${productData.sku}-${index + 1}`,
            size: variant.size || null,
            color: variant.color || null,
            price: variant.price ? Number(variant.price) : Number(productData.price),
            stock: variant.stock ? Number(variant.stock) : 0,
            isActive: variant.isActive ?? true,
          }))
        };
      }

      console.log('🚀 Sending product data:', productData);
      console.log('🖼️ Product images to save:', productImages);
      console.log('🔧 Product variants to save:', productVariants);

      if (editingProduct) {
        // Update existing product (main data only)
        const response = await api.put(`/products/${editingProduct.id}`, productData);
        console.log('✅ Product update response:', response.data);
        
        // Images and variants are now saved as part of the main product update
        
        toast.success('Product updated successfully');
      } else {
        // Create new product (main data only)
        await api.post('/products', productData);
        toast.success('Product created successfully (variants/images support coming soon)');
      }
      
      handleCloseDialog();
      await fetchProducts(false); // Don't show loading spinner
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productIds: string[]) => {
    try {
      await Promise.all(
        productIds.map(id => api.delete(`/products/${id}`))
      );
      toast.success(`${productIds.length} product(s) deleted`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const handleBulkAction = async (action: string, productIds: string[]) => {
    try {
      switch (action) {
        case 'publish':
          await Promise.all(
            productIds.map(id => api.patch(`/products/${id}`, { isPublished: true }))
          );
          toast.success(`${productIds.length} product(s) published`);
          break;
        case 'unpublish':
          await Promise.all(
            productIds.map(id => api.patch(`/products/${id}`, { isPublished: false }))
          );
          toast.success(`${productIds.length} product(s) unpublished`);
          break;
        case 'archive':
          await Promise.all(
            productIds.map(id => api.patch(`/products/${id}`, { status: 'INACTIVE' }))
          );
          toast.success(`${productIds.length} product(s) archived`);
          break;
        default:
          break;
      }
      fetchProducts();
    } catch (error) {
      toast.error(`Failed to ${action} products`);
    }
  };

  const handleRestoreCatalog = async () => {
    if (!confirm('This will replace ALL current products with a fresh catalog of 51+ products. Continue?')) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await api.post('/restore/catalog', {});
      if (response.data.success) {
        toast.success(`✅ Catalog restored! Added ${response.data.data.totalProducts} products`);
        await fetchProducts();
      } else {
        toast.error('Failed to restore catalog');
      }
    } catch (error: any) {
      console.error('Error restoring catalog:', error);
      toast.error('Failed to restore catalog');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleAddVariant = () => {
    const size = variantSizeRef.current?.value || '';
    const color = variantColorRef.current?.value || '';
    const stock = parseInt(variantStockRef.current?.value || '0');
    const sku = variantSkuRef.current?.value || '';

    // Auto-generate SKU if not provided
    const autoSku = sku || `${productForm.sku || 'VAR'}-${size}-${color}`.toUpperCase().replace(/\s+/g, '-');

    if (size || color) { // At least size or color is required
      const newVariant = {
        name: `${productForm.name || 'Product'} - ${size} ${color}`.trim(),
        sku: autoSku,
        size: size || undefined,
        color: color || undefined,
        stock,
        isActive: true,
      };

      setProductVariants([...productVariants, newVariant]);

      // Clear form inputs
      if (variantSizeRef.current) variantSizeRef.current.value = '';
      if (variantColorRef.current) variantColorRef.current.value = '';
      if (variantStockRef.current) variantStockRef.current.value = '0';
      if (variantSkuRef.current) variantSkuRef.current.value = '';

      // Focus back to size field for quick entry
      variantSizeRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Products ({products.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={async () => {
              if (confirm('Remove all mock/test products? This cannot be undone.')) {
                try {
                  const response = await api.delete('/restore/mock-products');
                  if (response.data.success) {
                    toast.success(`Removed ${response.data.deletedCount} mock products`);
                    await fetchProducts();
                  }
                } catch (error) {
                  toast.error('Failed to remove mock products');
                }
              }
            }}
            color="error"
            sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
          >
            Remove Mock Products
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </Box>
      </Box>
      
      <ProductDataTable
        products={products.map(p => ({
          ...p,
          variants: p.variants.map(v => ({
            id: v.id || '',
            name: v.name,
            stock: v.stock
          }))
        }))}
        onEdit={(product: any) => handleEdit(product as Product)}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        onRefresh={fetchProducts}
      />

      {/* Product Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <TextField
                  fullWidth
                  label="SKU"
                  required
                  value={productForm.sku || ''}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="Suits">Suits</MenuItem>
                    <MenuItem value="Shirts">Shirts</MenuItem>
                    <MenuItem value="Ties">Ties</MenuItem>
                    <MenuItem value="Accessories">Accessories</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <TextField
                  fullWidth
                  label="Subcategory"
                  value={productForm.subcategory || ''}
                  onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 30%', minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  required
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 30%', minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="Compare At Price"
                  type="number"
                  value={productForm.compareAtPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, compareAtPrice: parseFloat(e.target.value) })}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 30%', minWidth: 150 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={productForm.status || 'ACTIVE'}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    label="Status"
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="DISCONTINUED">Discontinued</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={productForm.description || ''}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={productForm.tags || []}
                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value as string[] })}
                    input={<OutlinedInput label="Tags" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="sale">Sale</MenuItem>
                    <MenuItem value="featured">Featured</MenuItem>
                    <MenuItem value="bestseller">Bestseller</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
                <FormControl fullWidth>
                  <InputLabel>Occasions</InputLabel>
                  <Select
                    multiple
                    value={productForm.occasions || []}
                    onChange={(e) => setProductForm({ ...productForm, occasions: e.target.value as string[] })}
                    input={<OutlinedInput label="Occasions" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="wedding">Wedding</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                    <MenuItem value="formal">Formal</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                    <MenuItem value="prom">Prom</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.isPublished || false}
                    onChange={(e) => setProductForm({ ...productForm, isPublished: e.target.checked })}
                  />
                }
                label="Published"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.isFeatured || false}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  />
                }
                label="Featured"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.isOnSale || false}
                    onChange={(e) => setProductForm({ ...productForm, isOnSale: e.target.checked })}
                  />
                }
                label="On Sale"
              />
            </Box>
            
            {/* Variants Section - Enhanced with Simple Input + Organized Display */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Variants
              </Typography>
              
              {/* Simple Variant Creation (Keep Text Inputs) */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Variant (Simple Entry)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    inputRef={variantSizeRef}
                    size="small"
                    label="Size"
                    placeholder="e.g., 42R, 16.5, Medium"
                    sx={{ minWidth: 120 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        variantColorRef.current?.focus();
                      }
                    }}
                  />
                  <TextField
                    inputRef={variantColorRef}
                    size="small"
                    label="Color"
                    placeholder="e.g., Navy Blue, White"
                    sx={{ minWidth: 120 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        variantStockRef.current?.focus();
                      }
                    }}
                  />
                  <TextField
                    inputRef={variantStockRef}
                    size="small"
                    label="Stock"
                    type="number"
                    defaultValue={0}
                    sx={{ width: 80 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        variantSkuRef.current?.focus();
                      }
                    }}
                  />
                  <TextField
                    inputRef={variantSkuRef}
                    size="small"
                    label="SKU"
                    placeholder="Auto-generated"
                    sx={{ minWidth: 140 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddVariant();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddVariant}
                    sx={{ bgcolor: '#1976d2' }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Enhanced Variant Display Grid */}
              <VariantDisplayGrid
                variants={productVariants}
                productCategory={productForm.category || ''}
                onVariantUpdate={(updatedVariant, index) => {
                  const updated = [...productVariants];
                  updated[index] = updatedVariant;
                  setProductVariants(updated);
                }}
                onVariantDelete={(index) => {
                  const updated = productVariants.filter((_, i) => i !== index);
                  setProductVariants(updated);
                }}
                colorHexMap={productForm.smartAttributes?.colorHexMap || {}}
              />

              {/* Quick Actions for Existing Variants */}
              {productVariants.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // Clear all variants
                        if (confirm('Remove all variants?')) {
                          setProductVariants([]);
                        }
                      }}
                    >
                      Clear All
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // Set all stock to same value
                        const stock = prompt('Set all stock to:');
                        if (stock !== null && !isNaN(parseInt(stock))) {
                          const updated = productVariants.map(v => ({ ...v, stock: parseInt(stock) }));
                          setProductVariants(updated);
                        }
                      }}
                    >
                      Bulk Stock Update
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // Generate quick suit sizes
                        if (productForm.category?.toLowerCase().includes('suit')) {
                          const suitSizes = ['38R', '40R', '42R', '44R', '46R', '48R'];
                          const newVariants = suitSizes.map(size => ({
                            name: `${productForm.name} - ${size}`,
                            sku: `${productForm.sku}-${size}`,
                            size,
                            color: undefined,
                            stock: 5,
                            isActive: true,
                          }));
                          setProductVariants([...productVariants, ...newVariants]);
                        }
                      }}
                    >
                      Quick Add Suit Sizes
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // Generate quick shirt sizes
                        if (productForm.category?.toLowerCase().includes('shirt')) {
                          const shirtSizes = ['15"', '15.5"', '16"', '16.5"', '17"'];
                          const newVariants = shirtSizes.map(size => ({
                            name: `${productForm.name} - ${size}`,
                            sku: `${productForm.sku}-${size.replace('"', 'IN')}`,
                            size,
                            color: undefined,
                            stock: 10,
                            isActive: true,
                          }));
                          setProductVariants([...productVariants, ...newVariants]);
                        }
                      }}
                    >
                      Quick Add Shirt Sizes
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Cloudflare Images Section */}
            <Box sx={{ mt: 3 }}>
              <CloudflareImageUpload
                images={productImages as CloudflareProductImage[]}
                onChange={(images) => setProductImages(images.map(img => ({
                  ...img,
                  isPrimary: img.isPrimary || false // Ensure boolean
                })))}
                productName={productForm.name || 'Product'}
                maxImages={10}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProductsPageWithDialog;