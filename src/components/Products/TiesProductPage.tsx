import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Avatar,
  Alert,
  Skeleton,
  Fade,
  Zoom,
  Breadcrumbs,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ShoppingCart,
  Favorite,
  Share,
  StarRate,
  LocalShipping,
  Security,
  Palette,
  Home,
  Category,
  NavigateNext
} from '@mui/icons-material';
import ColorFamilyGrid from './ColorFamilyGrid';
import tiesAPI from '../../services/tiesAPI';

interface TieProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice: string;
  inStock: boolean;
  images?: string[];
  width: string;
  sizing?: {
    type: string;
    width: string;
    length: string;
    description?: string;
  };
}

interface ColorFamily {
  name: string;
  slug: string;
  gradient: { start: string; end: string };
  colors: string[];
  total: number;
}

interface TiesProductPageProps {
  // Props can be added if needed
}

const ProductImage = styled(Box)({
  width: '100%',
  height: '500px',
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid #e0e0e0',
  backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
});

const PriceContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px'
});

const CurrentPrice = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#2e7d32'
});

const ComparePrice = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: 400,
  color: '#757575',
  textDecoration: 'line-through'
});

const SaveBadge = styled(Chip)({
  backgroundColor: '#e8f5e8',
  color: '#2e7d32',
  fontWeight: 600
});

const FeatureCard = styled(Card)({
  padding: '16px',
  textAlign: 'center',
  border: '1px solid #e0e0e0',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  }
});

const TiesProductPage: React.FC<TiesProductPageProps> = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const productSlug = slug || 'classic-width-tie';
  const [product, setProduct] = useState<TieProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadProduct();
    
    // Load color and family from URL parameters
    const colorParam = searchParams.get('color');
    const familyParam = searchParams.get('family');
    
    if (colorParam) {
      // Convert URL format back to display format
      const displayColor = colorParam.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      setSelectedColor(displayColor);
    }
    
    if (familyParam) {
      setSelectedFamily(familyParam);
    }
  }, [productSlug, searchParams]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');

      // Get product data and color information
      const colorData = tiesAPI.generateColorData('1', 'Classic Width Tie', productSlug);
      
      // Create mock product based on the slug
      const mockProduct: TieProduct = {
        id: '1',
        name: getProductNameFromSlug(productSlug),
        slug: productSlug,
        description: getProductDescription(productSlug),
        price: getProductPrice(productSlug),
        compareAtPrice: getComparePrice(productSlug),
        inStock: true,
        width: getWidthFromSlug(productSlug),
        sizing: colorData.sizingInfo
      };

      setProduct(mockProduct);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const getProductNameFromSlug = (slug: string): string => {
    const nameMap: Record<string, string> = {
      'ultra-skinny-tie': 'Ultra Skinny Tie',
      'skinny-tie': 'Skinny Tie',
      'classic-width-tie': 'Classic Width Tie',
      'bow-tie': 'Bow Tie'
    };
    return nameMap[slug] || 'KCT Tie';
  };

  const getProductDescription = (slug: string): string => {
    const descMap: Record<string, string> = {
      'ultra-skinny-tie': 'Modern minimalist design perfect for contemporary looks. Ultra slim 2.25" width for the fashion-forward gentleman.',
      'skinny-tie': 'Contemporary slim profile that works for both business and casual settings. Popular 2.75" width.',
      'classic-width-tie': 'Traditional standard width tie that never goes out of style. Timeless 3.25" width for all occasions.',
      'bow-tie': 'Pre-tied bow tie with adjustable strap. Perfect for formal events and special occasions.'
    };
    return descMap[slug] || 'Premium quality tie from KCT collection.';
  };

  const getProductPrice = (slug: string): string => {
    return slug === 'classic-width-tie' ? '29.99' : '24.99';
  };

  const getComparePrice = (slug: string): string => {
    return slug === 'classic-width-tie' ? '44.99' : '39.99';
  };

  const getWidthFromSlug = (slug: string): string => {
    const widthMap: Record<string, string> = {
      'ultra-skinny-tie': '2.25"',
      'skinny-tie': '2.75"',
      'classic-width-tie': '3.25"',
      'bow-tie': 'adjustable'
    };
    return widthMap[slug] || 'standard';
  };

  const calculateSavings = (): number => {
    if (!product) return 0;
    const current = parseFloat(product.price);
    const compare = parseFloat(product.compareAtPrice);
    return Math.round(((compare - current) / compare) * 100);
  };

  const handleColorFamilySelect = (family: ColorFamily) => {
    setSelectedFamily(family.slug);
    console.log('Selected family:', family.name);
  };

  const handleColorSelect = (color: string, family: ColorFamily) => {
    setSelectedColor(color);
    setSelectedFamily(family.slug);
    
    // Update URL with color selection
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('color', color.toLowerCase().replace(/\s+/g, '-'));
    newSearchParams.set('family', family.slug);
    setSearchParams(newSearchParams);
    
    console.log('Selected color:', color, 'from family:', family.name);
  };

  const handleAddToCart = () => {
    if (!selectedColor) {
      alert('Please select a color first!');
      return;
    }
    console.log('Adding to cart:', {
      product: product?.name,
      color: selectedColor,
      family: selectedFamily,
      width: product?.width
    });
    // Implement cart logic here
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="rectangular" height={200} sx={{ my: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!product) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        sx={{ mb: 3 }}
        aria-label="breadcrumb"
      >
        <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Home fontSize="small" />
          Home
        </Link>
        <Link color="inherit" href="/products" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Category fontSize="small" />
          Products
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Palette fontSize="small" />
          Ties
        </Typography>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      {/* Product Details Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <ProductImage>
            <Box textAlign="center">
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, backgroundColor: 'primary.main' }}>
                <Palette sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary">
                {selectedColor ? `${selectedColor} ${product.name}` : `${product.name} Preview`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {product.width} Width • Premium Quality
              </Typography>
            </Box>
          </ProductImage>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              {product.name}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box display="flex" alignItems="center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarRate key={star} sx={{ color: '#ffc107', fontSize: 20 }} />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                (4.8) • 324 reviews
              </Typography>
            </Box>

            <PriceContainer>
              <CurrentPrice>${product.price}</CurrentPrice>
              <ComparePrice>${product.compareAtPrice}</ComparePrice>
              <SaveBadge label={`Save ${calculateSavings()}%`} size="small" />
            </PriceContainer>

            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            {/* Product Features */}
            <Box display="flex" gap={1} mb={3} flexWrap="wrap">
              <Chip label={`${product.width} Width`} variant="outlined" />
              <Chip label="One Size Fits All" variant="outlined" />
              <Chip label="Premium Silk" variant="outlined" />
              <Chip label="Wedding Collection" variant="outlined" />
            </Box>

            {/* Color Selection Status */}
            {selectedColor && (
              <Fade in timeout={300}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Selected:</strong> {selectedColor} from {selectedFamily} family
                  </Typography>
                </Alert>
              </Fade>
            )}

            {/* Action Buttons */}
            <Box display="flex" gap={2} mb={3}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={!selectedColor}
                sx={{ flex: 1 }}
              >
                Add to Cart
              </Button>
              <Button variant="outlined" size="large" startIcon={<Favorite />}>
                Save
              </Button>
              <Button variant="outlined" size="large" startIcon={<Share />}>
                Share
              </Button>
            </Box>

            {/* Features Grid */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FeatureCard elevation={0}>
                  <LocalShipping color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>Free Shipping</Typography>
                  <Typography variant="caption" color="text.secondary">On orders over $50</Typography>
                </FeatureCard>
              </Grid>
              <Grid item xs={4}>
                <FeatureCard elevation={0}>
                  <Security color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>Secure Payment</Typography>
                  <Typography variant="caption" color="text.secondary">256-bit SSL encryption</Typography>
                </FeatureCard>
              </Grid>
              <Grid item xs={4}>
                <FeatureCard elevation={0}>
                  <StarRate color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>Quality Guarantee</Typography>
                  <Typography variant="caption" color="text.secondary">100% satisfaction</Typography>
                </FeatureCard>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Revolutionary Color Family Grid */}
      <Box>
        <ColorFamilyGrid
          onColorFamilySelect={handleColorFamilySelect}
          onColorSelect={handleColorSelect}
          selectedFamily={selectedFamily}
        />
      </Box>
    </Container>
  );
};

export default TiesProductPage;