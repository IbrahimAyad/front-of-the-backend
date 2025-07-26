import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

// Import our new Phase 1 components
import EnhancedImageGallery from './EnhancedImageGallery';
import BundlePriceCalculator from './BundlePriceCalculator';
import EnhancedVariantSelector from './EnhancedVariantSelector';
import SmartProductRecommendations from './SmartProductRecommendations';

// Import existing components we'll reuse
import { ProductImage, Product, ProductVariant } from '../../types';

interface EnhancedProductPageProps {
  productId: string;
}

/**
 * Example integration of all Phase 1 components
 * This shows how to use the new components without breaking existing functionality
 */
const EnhancedProductPage: React.FC<EnhancedProductPageProps> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [bundleItems, setBundleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Simulate fetching product data
  useEffect(() => {
    // In real implementation, this would be an API call
    // For now, we'll use mock data to demonstrate
    setTimeout(() => {
      setProduct({
        id: productId,
        name: 'Classic Navy Suit',
        category: 'Suits',
        subcategory: 'Business',
        price: 899,
        compareAtPrice: 1299,
        description: 'A timeless navy suit perfect for any business occasion.',
        images: [
          { url: '/suit-navy-1.jpg', isPrimary: true, altText: 'Navy suit front view' },
          { url: '/suit-navy-2.jpg', isPrimary: false, altText: 'Navy suit back view' },
          { url: '/suit-navy-3.jpg', isPrimary: false, altText: 'Navy suit detail' },
        ],
        variants: [
          { id: 'v1', name: 'Navy - 40R', size: '40R', color: 'Navy', price: 899, stock: 5, isActive: true, sku: 'SUIT-NAVY-40R' },
          { id: 'v2', name: 'Navy - 42R', size: '42R', color: 'Navy', price: 899, stock: 3, isActive: true, sku: 'SUIT-NAVY-42R' },
          { id: 'v3', name: 'Navy - 44R', size: '44R', color: 'Navy', price: 899, stock: 0, isActive: true, sku: 'SUIT-NAVY-44R' },
        ],
        totalStock: 8,
        pairsWellWith: ['Shirts', 'Ties', 'Shoes'],
        smartAttributes: {
          formality_level: 4,
          occasion_suitability: ['Business', 'Wedding', 'Evening'],
        },
      } as any);

      // Mock recommendations
      setRecommendations([
        {
          id: 'rec1',
          name: 'White Dress Shirt',
          category: 'Shirts',
          price: 149,
          compareAtPrice: 199,
          images: [{ url: '/shirt-white.jpg', isPrimary: true }],
          totalStock: 20,
          variants: [
            { id: 'sv1', size: '16', color: 'White', price: 149, stock: 10 },
            { id: 'sv2', size: '16.5', color: 'White', price: 149, stock: 10 },
          ],
        },
        {
          id: 'rec2',
          name: 'Silk Navy Tie',
          category: 'Ties',
          price: 89,
          images: [{ url: '/tie-navy.jpg', isPrimary: true }],
          totalStock: 15,
          variants: [
            { id: 'tv1', color: 'Navy', price: 89, stock: 15 },
          ],
        },
        {
          id: 'rec3',
          name: 'Light Blue Dress Shirt',
          category: 'Shirts',
          price: 159,
          images: [{ url: '/shirt-blue.jpg', isPrimary: true }],
          totalStock: 12,
          variants: [
            { id: 'sbv1', size: '16', color: 'Light Blue', price: 159, stock: 6 },
            { id: 'sbv2', size: '16.5', color: 'Light Blue', price: 159, stock: 6 },
          ],
        },
      ] as any);

      setLoading(false);
    }, 1000);
  }, [productId]);

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    // Update bundle items if this product is part of a bundle
    updateBundleItem(product!, variant);
  };

  const updateBundleItem = (product: Product, variant: any) => {
    setBundleItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, variant, price: variant.price || product.price }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: variant.price || product.price,
        compareAtPrice: product.compareAtPrice,
        category: product.category,
        variant: {
          size: variant.size,
          color: variant.color,
        },
        quantity: 1,
      }];
    });
  };

  const handleAddToBundle = (recProduct: Product, variant?: any) => {
    const bundleItem = {
      id: recProduct.id,
      name: recProduct.name,
      price: variant?.price || recProduct.price,
      compareAtPrice: recProduct.compareAtPrice,
      category: recProduct.category,
      variant: variant ? {
        size: variant.size,
        color: variant.color,
      } : undefined,
      quantity: 1,
    };
    
    setBundleItems(prev => {
      const existing = prev.find(item => item.id === recProduct.id);
      if (existing) {
        return prev.map(item => 
          item.id === recProduct.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, bundleItem];
    });
  };

  const handleBundleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setBundleItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setBundleItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  if (loading || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={600} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/" sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link href="/products" color="inherit">
          Products
        </Link>
        <Link href={`/products/${product.category.toLowerCase()}`} color="inherit">
          {product.category}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left Column - Image Gallery */}
        <Grid item xs={12} md={6}>
          <EnhancedImageGallery
            images={product.images as ProductImage[]}
            productName={product.name}
            showThumbnails={true}
            enableZoom={true}
          />
        </Grid>

        {/* Right Column - Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Product Header */}
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {product.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">
                ${selectedVariant?.price || product.price}
              </Typography>
              {product.compareAtPrice && (
                <Typography
                  variant="h6"
                  sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                >
                  ${product.compareAtPrice}
                </Typography>
              )}
              {product.compareAtPrice && (
                <Chip
                  label={`Save ${Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%`}
                  color="error"
                  size="small"
                />
              )}
            </Box>

            {/* Enhanced Variant Selector */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
              <EnhancedVariantSelector
                variants={product.variants as any}
                selectedVariantId={selectedVariant?.id}
                onVariantSelect={handleVariantSelect}
                productName={product.name}
                productCategory={product.category}
                showPrices={false}
                showStock={true}
              />
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CartIcon />}
                fullWidth
                disabled={!selectedVariant || selectedVariant.stock === 0}
                sx={{
                  backgroundColor: '#8B0000',
                  '&:hover': {
                    backgroundColor: '#660000',
                  },
                }}
              >
                Add to Cart
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{ minWidth: 64 }}
              >
                <FavoriteIcon color={isFavorite ? 'error' : 'inherit'} />
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ minWidth: 64 }}
              >
                <ShareIcon />
              </Button>
            </Box>

            {/* Trust Badges */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon color="action" />
                <Typography variant="body2">Free Shipping</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="action" />
                <Typography variant="body2">Secure Payment</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon color="action" />
                <Typography variant="body2">Quality Guaranteed</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Product Tabs */}
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
              <Tab label="Description" />
              <Tab label="Size Guide" />
              <Tab label="Care Instructions" />
            </Tabs>
            
            <Box sx={{ py: 2 }}>
              {activeTab === 0 && (
                <Typography variant="body1" color="text.secondary">
                  {product.description || 'No description available.'}
                </Typography>
              )}
              {activeTab === 1 && (
                <Alert severity="info">
                  Size guide coming soon. For now, please refer to standard sizing.
                </Alert>
              )}
              {activeTab === 2 && (
                <Typography variant="body1" color="text.secondary">
                  Dry clean only. Store in a cool, dry place.
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Bundle Price Calculator - Sticky on Desktop */}
      {bundleItems.length > 0 && (
        <Box
          sx={{
            position: { md: 'fixed' },
            right: { md: 20 },
            bottom: { md: 20 },
            width: { xs: '100%', md: 320 },
            zIndex: 10,
            mt: { xs: 4, md: 0 },
          }}
        >
          <BundlePriceCalculator
            items={bundleItems}
            onItemQuantityChange={handleBundleQuantityChange}
            showBreakdown={true}
          />
        </Box>
      )}

      {/* Smart Product Recommendations */}
      <Box sx={{ mt: 6 }}>
        <SmartProductRecommendations
          currentProduct={product}
          recommendations={recommendations}
          onAddToCart={handleAddToBundle}
          onProductSelect={(p) => console.log('Navigate to:', p)}
          title="Complete Your Look"
          subtitle="Hand-picked items that pair perfectly with your selection"
          showBundlePrice={true}
          layout="carousel"
        />
      </Box>
    </Container>
  );
};

export default EnhancedProductPage;