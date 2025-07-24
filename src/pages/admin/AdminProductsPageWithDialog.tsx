import React, { useState, useEffect } from 'react';
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
import api from '../../services/api';

interface ProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
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
  sku: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  brand?: string;
  updatedAt: Date;
  sales?: number;
  revenue?: number;
  description?: string;
  tags?: string[];
  occasions?: string[];
  styleAttributes?: string[];
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
    status: 'ACTIVE',
    isPublished: true,
    isFeatured: false,
    tags: [],
    occasions: [],
    styleAttributes: [],
  });
  const [saving, setSaving] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

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

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
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
      }));
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      tags: product.tags || [],
      occasions: product.occasions || [],
      styleAttributes: product.styleAttributes || [],
    });
    setProductImages(product.images || []);
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
    setSaving(true);
    try {
      // Separate main product data from variants and images
      const productData = {
        ...productForm,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
      };

      if (editingProduct) {
        // Update existing product (main data only)
        await api.put(`/products/${editingProduct.id}`, productData);
        
        // TODO: Handle variants and images separately when backend routes are available
        // For now, we'll just update the main product data
        toast.success('Product updated successfully (variants/images support coming soon)');
      } else {
        // Create new product (main data only)
        await api.post('/products', productData);
        toast.success('Product created successfully (variants/images support coming soon)');
      }
      
      handleCloseDialog();
      fetchProducts();
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
            startIcon={<RefreshIcon />}
            onClick={handleRestoreCatalog}
            disabled={isRestoring}
            color="warning"
            sx={{ 
              borderColor: '#ff9800', 
              color: '#ff9800',
              '&:hover': { 
                borderColor: '#f57c00', 
                backgroundColor: 'rgba(255, 152, 0, 0.04)' 
              }
            }}
          >
            {isRestoring ? 'Restoring...' : 'Restore Full Catalog (51+ Products)'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
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
            
            {/* Variants Section */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Variants
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {productVariants.map((variant, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <TextField
                      size="small"
                      label="Size"
                      value={variant.size || ''}
                      onChange={(e) => {
                        const updated = [...productVariants];
                        updated[index] = { ...variant, size: e.target.value };
                        setProductVariants(updated);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Color"
                      value={variant.color || ''}
                      onChange={(e) => {
                        const updated = [...productVariants];
                        updated[index] = { ...variant, color: e.target.value };
                        setProductVariants(updated);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Stock"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => {
                        const updated = [...productVariants];
                        updated[index] = { ...variant, stock: parseInt(e.target.value) || 0 };
                        setProductVariants(updated);
                      }}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      size="small"
                      label="SKU"
                      value={variant.sku || ''}
                      onChange={(e) => {
                        const updated = [...productVariants];
                        updated[index] = { ...variant, sku: e.target.value };
                        setProductVariants(updated);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setProductVariants(productVariants.filter((_, i) => i !== index));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setProductVariants([
                      ...productVariants,
                      {
                        name: '',
                        sku: '',
                        size: '',
                        color: '',
                        stock: 0,
                        isActive: true,
                      },
                    ]);
                  }}
                >
                  Add Variant
                </Button>
              </Box>
            </Box>

            {/* Images Section */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Images
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {productImages.map((image, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <TextField
                      size="small"
                      label="Image URL"
                      value={image.url || ''}
                      onChange={(e) => {
                        const updated = [...productImages];
                        updated[index] = { ...image, url: e.target.value };
                        setProductImages(updated);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Alt Text"
                      value={image.altText || ''}
                      onChange={(e) => {
                        const updated = [...productImages];
                        updated[index] = { ...image, altText: e.target.value };
                        setProductImages(updated);
                      }}
                      sx={{ width: 200 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={image.isPrimary}
                          onChange={(e) => {
                            const updated = productImages.map((img, i) => ({
                              ...img,
                              isPrimary: i === index ? e.target.checked : false,
                            }));
                            setProductImages(updated);
                          }}
                        />
                      }
                      label="Primary"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setProductImages(productImages.filter((_, i) => i !== index));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setProductImages([
                      ...productImages,
                      {
                        url: '',
                        altText: '',
                        isPrimary: productImages.length === 0,
                      },
                    ]);
                  }}
                >
                  Add Image
                </Button>
              </Box>
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