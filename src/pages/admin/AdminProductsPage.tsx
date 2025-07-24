import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProductDataTable from '../../components/Admin/ProductDataTable';
import api from '../../services/api';

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
  images: Array<{ url: string; isPrimary: boolean }>;
  variants: Array<{ id: string; name: string; stock: number }>;
  brand?: string;
  updatedAt: Date;
  sales?: number;
  revenue?: number;
}

const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export functionality can be added later
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
    if (product.id) {
      navigate(`/admin/products/${product.id}/edit`);
    } else {
      navigate('/admin/products/new/edit');
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
        case 'export':
          // Implement export functionality
          toast('Export feature coming soon');
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
      const response = await api.post('/restore/catalog');
      if (response.data.success) {
        toast.success(`✅ Catalog restored! Added ${response.data.data.totalProducts} products`);
        await fetchProducts(); // Refresh the table
      } else {
        toast.error('Failed to restore catalog');
      }
    } catch (error: any) {
      console.error('Error restoring catalog:', error);
      if (error.response?.status === 404) {
        toast.error('Restore endpoint not available yet. Railway is still deploying...');
      } else {
        toast.error('Failed to restore catalog');
      }
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
            onClick={() => navigate('/admin/products/new')}
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
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        onRefresh={fetchProducts}
      />
    </Box>
  );
};

export default AdminProductsPage;