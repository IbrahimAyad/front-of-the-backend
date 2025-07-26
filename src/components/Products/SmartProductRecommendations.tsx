import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Grid,
  Skeleton,
  Alert,
  Badge,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Zoom,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  CheckCircle as CheckIcon,
  AutoAwesome as AutoAwesomeIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingIcon,
  Palette as ColorIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{ url: string; isPrimary?: boolean }>;
  totalStock: number;
  pairsWellWith?: string[];
  smartAttributes?: any;
  variants?: Array<{
    id: string;
    size?: string;
    color?: string;
    stock: number;
    price: number;
  }>;
}

interface SmartProductRecommendationsProps {
  currentProduct: Product;
  recommendations: Product[];
  onProductSelect?: (product: Product) => void;
  onAddToCart?: (product: Product, variant?: any) => void;
  onToggleFavorite?: (productId: string) => void;
  favoriteIds?: string[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  layout?: 'carousel' | 'grid';
  showBundlePrice?: boolean;
  selectedVariants?: { [productId: string]: string };
}

const SmartProductRecommendations: React.FC<SmartProductRecommendationsProps> = ({
  currentProduct,
  recommendations = [],
  onProductSelect,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  loading = false,
  title = "Complete the Look",
  subtitle = "Perfectly matched items for your selection",
  maxItems = 4,
  layout = 'carousel',
  showBundlePrice = true,
  selectedVariants = {},
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});

  // Filter and enhance recommendations
  const enhancedRecommendations = useMemo(() => {
    // Smart matching logic
    const scored = recommendations.map(rec => {
      let score = 0;
      
      // Check if it's in pairsWellWith
      if (currentProduct.pairsWellWith?.includes(rec.category)) {
        score += 10;
      }
      
      // Category matching scores
      if (currentProduct.category === 'Suits' && rec.category === 'Shirts') {
        score += 8;
      }
      if (currentProduct.category === 'Suits' && rec.category === 'Ties') {
        score += 7;
      }
      if (currentProduct.category === 'Shirts' && rec.category === 'Ties') {
        score += 6;
      }
      
      // Color matching (simplified - you could enhance this)
      const currentColors = currentProduct.variants?.map(v => v.color) || [];
      const recColors = rec.variants?.map(v => v.color) || [];
      const hasMatchingColors = currentColors.some(c => recColors.includes(c));
      if (hasMatchingColors) {
        score += 5;
      }
      
      // Price range matching (within 50% of current product)
      const priceDiff = Math.abs(rec.price - currentProduct.price) / currentProduct.price;
      if (priceDiff < 0.5) {
        score += 3;
      }
      
      return { ...rec, score };
    });
    
    // Sort by score and limit
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);
  }, [recommendations, currentProduct, maxItems]);

  // Calculate bundle price
  const bundlePrice = useMemo(() => {
    const selectedProducts = enhancedRecommendations.filter(
      rec => addedToCart.includes(rec.id)
    );
    const total = selectedProducts.reduce((sum, product) => sum + product.price, 0) + currentProduct.price;
    const discount = selectedProducts.length >= 2 ? 0.15 : selectedProducts.length >= 1 ? 0.10 : 0;
    const finalPrice = total * (1 - discount);
    
    return {
      total,
      discount,
      finalPrice,
      savings: total - finalPrice,
      itemCount: selectedProducts.length + 1,
    };
  }, [enhancedRecommendations, addedToCart, currentProduct]);

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      const variant = product.variants?.find(v => v.id === selectedVariants[product.id]);
      onAddToCart(product, variant);
    }
    setAddedToCart(prev => [...prev, product.id]);
    
    // Remove from cart after animation
    setTimeout(() => {
      setAddedToCart(prev => prev.filter(id => id !== product.id));
    }, 2000);
  };

  const handleSizeSelect = (productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const getMatchingSize = (product: Product): string | null => {
    // Smart size matching based on current product selection
    if (!product.variants || product.variants.length === 0) return null;
    
    // If we have a selected size for current product, try to match it
    const currentSize = currentProduct.variants?.find(v => 
      v.id === selectedVariants[currentProduct.id]
    )?.size;
    
    if (currentSize) {
      // Direct size match
      const exactMatch = product.variants.find(v => v.size === currentSize && v.stock > 0);
      if (exactMatch) return exactMatch.size;
      
      // Smart size conversion (e.g., suit 42R -> shirt 16.5)
      if (currentProduct.category === 'Suits' && product.category === 'Shirts') {
        const suitToShirtMap: { [key: string]: string } = {
          '38R': '15',
          '40R': '15.5',
          '42R': '16',
          '44R': '16.5',
          '46R': '17',
          '48R': '17.5',
        };
        const mappedSize = suitToShirtMap[currentSize];
        const mappedVariant = product.variants.find(v => v.size === mappedSize && v.stock > 0);
        if (mappedVariant) return mappedVariant.size;
      }
    }
    
    // Return first available size
    return product.variants.find(v => v.stock > 0)?.size || null;
  };

  const renderProductCard = (product: Product, index: number) => {
    const isFavorite = favoriteIds.includes(product.id);
    const isInCart = addedToCart.includes(product.id);
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    const matchingSize = getMatchingSize(product);
    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
      : 0;

    return (
      <Card
        key={product.id}
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease',
          transform: hoveredProduct === product.id ? 'translateY(-4px)' : 'none',
          boxShadow: hoveredProduct === product.id ? theme.shadows[8] : theme.shadows[2],
          cursor: 'pointer',
          '&:hover': {
            '& .product-overlay': {
              opacity: 1,
            },
          },
        }}
        onClick={() => onProductSelect?.(product)}
      >
        {/* Badges */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          {hasDiscount && (
            <Chip
              size="small"
              label={`-${discountPercentage}%`}
              sx={{
                backgroundColor: 'error.main',
                color: 'white',
                fontWeight: 'bold',
                mb: 0.5,
              }}
            />
          )}
          {index === 0 && (
            <Chip
              size="small"
              icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
              label="Best Match"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'block',
              }}
            />
          )}
        </Box>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'background.paper',
              },
            }}
          >
            {isFavorite ? (
              <FavoriteIcon sx={{ color: 'error.main', fontSize: 20 }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        )}

        {/* Product Image */}
        <Box sx={{ position: 'relative', paddingTop: '120%', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={primaryImage?.url || '/placeholder.png'}
            alt={product.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          
          {/* Quick Add Overlay */}
          <Box
            className="product-overlay"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              p: 2,
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {matchingSize && (
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Recommended Size: {matchingSize}
              </Typography>
            )}
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={isInCart ? <CheckIcon /> : <AddIcon />}
              onClick={() => handleAddToCart(product)}
              disabled={product.totalStock === 0}
              sx={{
                backgroundColor: isInCart ? 'success.main' : 'primary.main',
                '&:hover': {
                  backgroundColor: isInCart ? 'success.dark' : 'primary.dark',
                },
              }}
            >
              {isInCart ? 'Added!' : 'Quick Add'}
            </Button>
          </Box>
        </Box>

        {/* Product Details */}
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {product.category}
          </Typography>
          <Typography variant="subtitle2" gutterBottom noWrap>
            {product.name}
          </Typography>
          
          {/* Color swatches preview */}
          {product.variants && product.variants.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              {Array.from(new Set(product.variants.map(v => v.color)))
                .filter(Boolean)
                .slice(0, 5)
                .map((color) => (
                  <Tooltip key={color} title={color}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: color?.toLowerCase() || 'grey',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Tooltip>
                ))}
              {product.variants.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  +{product.variants.length - 5}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              ${product.price.toFixed(2)}
            </Typography>
            {hasDiscount && (
              <Typography
                variant="body2"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                ${product.compareAtPrice?.toFixed(2)}
              </Typography>
            )}
          </Box>
          
          {/* Stock Status */}
          {product.totalStock <= 5 && product.totalStock > 0 && (
            <Typography variant="caption" color="warning.main">
              Only {product.totalStock} left
            </Typography>
          )}
          {product.totalStock === 0 && (
            <Typography variant="caption" color="error.main">
              Out of Stock
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item key={i} xs={6} sm={3}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (enhancedRecommendations.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        
        {/* Bundle Price Display */}
        {showBundlePrice && addedToCart.length > 0 && (
          <Fade in={true}>
            <Card sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
              <CardContent sx={{ py: 1, px: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Bundle Price ({bundlePrice.itemCount} items)
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${bundlePrice.finalPrice.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="success.main">
                  Save ${bundlePrice.savings.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Box>

      {/* Product Grid/Carousel */}
      {layout === 'grid' ? (
        <Grid container spacing={2}>
          {enhancedRecommendations.map((product, index) => (
            <Grid item key={product.id} xs={6} sm={6} md={3}>
              {renderProductCard(product, index)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {enhancedRecommendations.map((product, index) => (
              <Box
                key={product.id}
                sx={{
                  minWidth: { xs: '80%', sm: '45%', md: '23%' },
                  scrollSnapAlign: 'start',
                }}
              >
                {renderProductCard(product, index)}
              </Box>
            ))}
          </Box>
          
          {/* Carousel Navigation */}
          {enhancedRecommendations.length > 4 && (
            <>
              <IconButton
                sx={{
                  position: 'absolute',
                  left: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    backgroundColor: 'background.paper',
                  },
                }}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <NavigateBefore />
              </IconButton>
              <IconButton
                sx={{
                  position: 'absolute',
                  right: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    backgroundColor: 'background.paper',
                  },
                }}
                onClick={() => setCurrentIndex(Math.min(enhancedRecommendations.length - 4, currentIndex + 1))}
                disabled={currentIndex >= enhancedRecommendations.length - 4}
              >
                <NavigateNext />
              </IconButton>
            </>
          )}
        </Box>
      )}

      {/* Call to Action */}
      {addedToCart.length > 0 && onAddToCart && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CartIcon />}
            onClick={() => {
              // Add all selected items to cart
              enhancedRecommendations
                .filter(rec => addedToCart.includes(rec.id))
                .forEach(product => handleAddToCart(product));
            }}
            sx={{
              backgroundColor: '#8B0000',
              '&:hover': {
                backgroundColor: '#660000',
              },
            }}
          >
            Add Complete Outfit to Cart
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SmartProductRecommendations;