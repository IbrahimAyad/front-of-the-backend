import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Badge,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Share,
  AutoAwesome,
  FilterList,
  ViewModule,
  ViewList,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { suitsAPIClient, productCatalogAPI } from '../../services/suitsAPI';
import type { SuitWithImages, SuitFilters } from '../../types';

interface SuitsCatalogProps {
  category?: string;
  showFeatured?: boolean;
  limit?: number;
  title?: string;
}

const SuitsCatalog: React.FC<SuitsCatalogProps> = ({
  category,
  showFeatured = false,
  limit,
  title = 'Our Suits Collection'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State
  const [suits, setSuits] = useState<SuitWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<SuitFilters>({
    category,
    available_only: true,
    page: 1,
    limit: limit || 20,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Load suits
  useEffect(() => {
    const loadSuits = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        if (showFeatured) {
          // Load featured suits for homepage
          const featuredData = await productCatalogAPI.getFeaturedProducts();
          setSuits([
            ...featuredData.promSuits.slice(0, 6),
            ...featuredData.weddingSuits.slice(0, 6),
          ]);
          setTotalCount(12);
        } else if (searchQuery) {
          // Search suits
          response = await suitsAPIClient.searchSuits(searchQuery, filters);
          setSuits(response.suits.map(suit => ({ ...suit, images: {} })));
          setTotalCount(response.count);
        } else {
          // Load all suits with images
          response = await suitsAPIClient.getSuitsWithImages();
          let filteredSuits = response.suits;
          
          // Apply client-side filters
          if (filters.category) {
            filteredSuits = filteredSuits.filter(suit => suit.category === filters.category);
          }
          if (filters.prom_trending) {
            filteredSuits = filteredSuits.filter(suit => suit.prom_trending);
          }
          if (filters.wedding_popular) {
            filteredSuits = filteredSuits.filter(suit => suit.wedding_popular);
          }
          
          setSuits(filteredSuits);
          setTotalCount(filteredSuits.length);
        }
      } catch (err) {
        console.error('Error loading suits:', err);
        setError('Failed to load suits. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSuits();
  }, [filters, searchQuery, showFeatured, category, limit]);

  const handleFilterChange = (key: keyof SuitFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSuitClick = (suit: SuitWithImages) => {
    navigate(`/products/suits/${suit.slug}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={300} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title} - KCT Menswear</title>
        <meta name="description" content={`Browse our collection of ${totalCount} premium suits with professional tailoring and fast delivery.`} />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {totalCount} suits available with professional tailoring
          </Typography>
        </Box>

        {/* Filters & Search */}
        {!showFeatured && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search suits..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category || ''}
                    label="Category"
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="wedding">Wedding</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                    <MenuItem value="tuxedo">Tuxedo</MenuItem>
                    <MenuItem value="formal">Formal</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Price Range</InputLabel>
                  <Select
                    value={filters.price_max || ''}
                    label="Price Range"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      if (value === '') {
                        handleFilterChange('price_min', undefined);
                        handleFilterChange('price_max', undefined);
                      } else if (value === '200') {
                        handleFilterChange('price_min', 0);
                        handleFilterChange('price_max', 200);
                      } else if (value === '400') {
                        handleFilterChange('price_min', 200);
                        handleFilterChange('price_max', 400);
                      } else if (value === '600') {
                        handleFilterChange('price_min', 400);
                        handleFilterChange('price_max', 600);
                      } else {
                        handleFilterChange('price_min', 600);
                        handleFilterChange('price_max', undefined);
                      }
                    }}
                  >
                    <MenuItem value="">All Prices</MenuItem>
                    <MenuItem value="200">Under $200</MenuItem>
                    <MenuItem value="400">$200 - $400</MenuItem>
                    <MenuItem value="600">$400 - $600</MenuItem>
                    <MenuItem value="999">$600+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <ViewModule />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ViewList />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Suits Grid */}
        <Grid container spacing={3}>
          {suits.map((suit) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'list' ? 12 : 6} 
              md={viewMode === 'list' ? 12 : 4} 
              lg={viewMode === 'list' ? 12 : 3} 
              key={suit.id}
            >
              <SuitCard 
                suit={suit} 
                viewMode={viewMode}
                onClick={() => handleSuitClick(suit)}
              />
            </Grid>
          ))}
        </Grid>

        {/* Load More */}
        {!showFeatured && suits.length < totalCount && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => handleFilterChange('limit', (filters.limit || 20) + 20)}
            >
              Load More Suits
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {suits.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No suits found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Try adjusting your filters or search terms
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setFilters({ available_only: true });
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

// Individual Suit Card Component
interface SuitCardProps {
  suit: SuitWithImages;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

const SuitCard: React.FC<SuitCardProps> = ({ suit, viewMode, onClick }) => {
  const [favorite, setFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mainImage = suit.images?.main || suit.images?.front || '/placeholder-suit.jpg';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: viewMode === 'list' ? 'row' : 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        }
      }}
      onClick={onClick}
    >
      {/* Image */}
      <CardMedia
        component="img"
        height={viewMode === 'list' ? 200 : 300}
        image={imageError ? '/placeholder-suit.jpg' : mainImage}
        alt={suit.name}
        onError={handleImageError}
        sx={{
          width: viewMode === 'list' ? 200 : '100%',
          objectFit: 'cover',
        }}
      />

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {suit.name}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setFavorite(!favorite);
            }}
          >
            {favorite ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        {/* Category & Badges */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={suit.category} 
            size="small" 
            variant="outlined"
            color="primary"
          />
          {suit.prom_trending && (
            <Chip 
              label="Prom Trending" 
              size="small" 
              color="secondary"
              icon={<AutoAwesome />}
            />
          )}
          {suit.wedding_popular && (
            <Chip 
              label="Wedding Popular" 
              size="small" 
              color="success"
            />
          )}
          {!suit.is_available && (
            <Chip 
              label="Out of Stock" 
              size="small" 
              color="error"
            />
          )}
        </Box>

        {/* Description */}
        {suit.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {suit.description}
          </Typography>
        )}

        {/* Pricing */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            2-Piece: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(suit.base_price_2pc)}
          </Typography>
          {suit.base_price_3pc && (
            <Typography variant="body2" color="text.secondary">
              3-Piece: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(suit.base_price_3pc)}
            </Typography>
          )}
        </Box>

        {/* Stock Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            2-PC Stock: {suit.stock_2pc} | 3-PC Stock: {suit.stock_3pc}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!suit.is_available}
            startIcon={<ShoppingCart />}
            onClick={(e) => {
              e.stopPropagation();
              // Handle add to cart
            }}
          >
            Add to Cart
          </Button>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              // Handle share
            }}
          >
            <Share />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SuitsCatalog; 