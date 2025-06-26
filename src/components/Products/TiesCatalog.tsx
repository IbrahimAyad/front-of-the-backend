import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Skeleton,
  Fade,
  Breadcrumbs,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowForward,
  Palette,
  Home,
  Category,
  NavigateNext,
  ShoppingCart
} from '@mui/icons-material';
import tiesAPI from '../../services/tiesAPI';

interface TieProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  width: string;
  totalColors: number;
  totalVariants: number;
}

const ProductCard = styled(Card)({
  height: '100%',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid #e0e0e0',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
    borderColor: '#1976d2',
  }
});

const PriceBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px'
});

const CurrentPrice = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#2e7d32'
});

const ComparePrice = styled(Typography)({
  fontSize: '1rem',
  fontWeight: 400,
  color: '#757575',
  textDecoration: 'line-through'
});

const TiesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<TieProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Create mock product data based on the 4 tie widths
      const mockProducts: TieProduct[] = [
        {
          id: '1',
          name: 'Ultra Skinny Tie',
          slug: 'ultra-skinny-tie',
          description: 'Modern minimalist design perfect for contemporary looks. Ultra slim 2.25" width for the fashion-forward gentleman.',
          price: '24.99',
          compareAtPrice: '39.99',
          width: '2.25"',
          totalColors: 63,
          totalVariants: 63
        },
        {
          id: '2',
          name: 'Skinny Tie',
          slug: 'skinny-tie',
          description: 'Contemporary slim profile that works for both business and casual settings. Popular 2.75" width.',
          price: '24.99',
          compareAtPrice: '39.99',
          width: '2.75"',
          totalColors: 63,
          totalVariants: 63
        },
        {
          id: '3',
          name: 'Classic Width Tie',
          slug: 'classic-width-tie',
          description: 'Traditional standard width tie that never goes out of style. Timeless 3.25" width for all occasions.',
          price: '29.99',
          compareAtPrice: '44.99',
          width: '3.25"',
          totalColors: 63,
          totalVariants: 63
        },
        {
          id: '4',
          name: 'Bow Tie',
          slug: 'bow-tie',
          description: 'Pre-tied bow tie with adjustable strap. Perfect for formal events and special occasions.',
          price: '24.99',
          compareAtPrice: '39.99',
          width: 'adjustable',
          totalColors: 63,
          totalVariants: 63
        }
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: TieProduct) => {
    navigate(`/ties/${product.slug}`);
  };

  const calculateSavings = (current: string, compare: string): number => {
    const currentPrice = parseFloat(current);
    const comparePrice = parseFloat(compare);
    return Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={40} width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        sx={{ mb: 4 }}
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
          Ties Collection
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={4} textAlign="center">
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎯 KCT Ties Collection
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
          Discover our revolutionary ties collection featuring 4 distinct widths, each available in 63 curated wedding collection colors. 
          From ultra-skinny modern styles to timeless classic widths - find your perfect match.
        </Typography>
        
        {/* Collection Stats */}
        <Box 
          display="flex" 
          justifyContent="center" 
          gap={4} 
          mb={4}
          sx={{ 
            backgroundColor: 'background.paper', 
            borderRadius: 2,
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <Box textAlign="center">
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              4
            </Typography>
            <Typography variant="body2" color="text.secondary">Tie Widths</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
              63
            </Typography>
            <Typography variant="body2" color="text.secondary">Colors Each</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              252
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Options</Typography>
          </Box>
        </Box>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} md={3} key={product.id}>
            <Fade in timeout={300 + index * 100}>
              <ProductCard 
                onClick={() => handleProductClick(product)}
                elevation={0}
              >
                {/* Product Image Placeholder */}
                <Box 
                  sx={{ 
                    height: 200, 
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                >
                  <Avatar sx={{ width: 80, height: 80, backgroundColor: 'primary.main' }}>
                    <Palette sx={{ fontSize: 40 }} />
                  </Avatar>
                  
                  {/* Save Badge */}
                  <Chip
                    label={`Save ${calculateSavings(product.price, product.compareAtPrice)}%`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: '#e8f5e8',
                      color: '#2e7d32',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <CardContent sx={{ p: 3 }}>
                  {/* Product Name */}
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {product.name}
                  </Typography>
                  
                  {/* Width Badge */}
                  <Chip 
                    label={`${product.width} Width`} 
                    size="small" 
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {product.description}
                  </Typography>
                  
                  {/* Color Info */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Palette fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {product.totalColors} colors available
                    </Typography>
                  </Box>
                  
                  {/* Price */}
                  <PriceBox>
                    <CurrentPrice>${product.price}</CurrentPrice>
                    <ComparePrice>${product.compareAtPrice}</ComparePrice>
                  </PriceBox>
                  
                  {/* Action Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    endIcon={<ArrowForward />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    Explore Colors
                  </Button>
                </CardContent>
              </ProductCard>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box textAlign="center" mt={6}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Ready to Find Your Perfect Tie?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Each tie style features our revolutionary color family system with 63 curated wedding collection colors.
          Click any product above to explore the beautiful color options and find your perfect match.
        </Typography>
        <Button 
          variant="outlined" 
          size="large" 
          startIcon={<ShoppingCart />}
          onClick={() => navigate('/products')}
        >
          View All Products
        </Button>
      </Box>
    </Container>
  );
};

export default TiesCatalog;