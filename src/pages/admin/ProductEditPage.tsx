import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  Divider,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice: number;
  sku: string;
  totalStock: number;
  minimumStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
}

const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEdit = !!productId && productId !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: 0,
    compareAtPrice: 0,
    sku: '',
    totalStock: 0,
    minimumStock: 5,
    status: 'ACTIVE',
    isPublished: false,
    isFeatured: false,
  });
  
  const categories = ['Suits', 'Shirts', 'Ties', 'Vests', 'Pants', 'Accessories'];
  
  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);
  
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        sku: product.sku || '',
        totalStock: product.totalStock || 0,
        minimumStock: product.minimumStock || 5,
        status: product.status || 'ACTIVE',
        isPublished: product.isPublished || false,
        isFeatured: product.isFeatured || false,
      });
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
        totalStock: Number(formData.totalStock),
        minimumStock: Number(formData.minimumStock),
      };
      
      if (isEdit) {
        await api.put(`/products/${productId}`, payload);
        toast.success('Product updated successfully');
      } else {
        const response = await api.post('/products', payload);
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<BackIcon />}
            onClick={() => navigate('/admin/products')}
          >
            Back to Products
          </Button>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Product' : 'Create New Product'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Product'}
        </Button>
      </Box>

      {/* Form */}
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={handleInputChange('sku')}
                required
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Category
            </Typography>
            <Stack spacing={2}>
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
              
              <TextField
                fullWidth
                label="Subcategory"
                value={formData.subcategory}
                onChange={handleInputChange('subcategory')}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pricing
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={handleInputChange('price')}
                inputProps={{ step: 0.01, min: 0 }}
              />
              
              <TextField
                fullWidth
                label="Compare at Price"
                type="number"
                value={formData.compareAtPrice}
                onChange={handleInputChange('compareAtPrice')}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <TextField
                fullWidth
                label="Total Stock"
                type="number"
                value={formData.totalStock}
                onChange={handleInputChange('totalStock')}
                inputProps={{ min: 0 }}
              />
              
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                value={formData.minimumStock}
                onChange={handleInputChange('minimumStock')}
                inputProps={{ min: 0 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
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
                label="Featured"
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default ProductEditPage; 