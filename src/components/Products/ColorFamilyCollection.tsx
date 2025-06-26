import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Breadcrumbs,
  Link,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Fade,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Home,
  Category,
  Palette,
  NavigateNext,
  ArrowBack,
  CheckCircle,
  ShoppingCart,
  Favorite,
  Share,
  AutoAwesome,
  CompareArrows
} from '@mui/icons-material';
import tiesAPI from '../../services/tiesAPI';

interface ColorFamily {
  name: string;
  slug: string;
  gradient: { start: string; end: string };
  colors: string[];
  total: number;
}

interface TieWidth {
  width: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
}

interface ColorFamilyCollectionProps {
  // Props can be extended if needed
}

// Styled components
const HeroSection = styled(Box)<{ gradient: { start: string; end: string } }>(({ gradient }) => ({
  background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
  color: 'white',
  padding: '60px 0',
  marginBottom: '40px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.2)',
    zIndex: 1
  },
  '& > *': {
    position: 'relative',
    zIndex: 2
  }
}));

const ColorCard = styled(Card)<{ selected?: boolean; colorHex?: string }>(({ theme, selected, colorHex }) => ({
  height: '200px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: selected ? `3px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  borderRadius: '16px',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: colorHex || '#f5f5f5',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
  '&.selected': {
    boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
  }
}));

const ColorInfo = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  color: 'white',
  padding: '20px 16px 16px',
});

const WidthSelector = styled(Box)({
  display: 'flex',
  gap: '12px',
  marginBottom: '24px',
  overflowX: 'auto',
  paddingBottom: '8px'
});

const WidthChip = styled(Chip)<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: '8px 16px',
  height: 'auto',
  cursor: 'pointer',
  backgroundColor: selected ? theme.palette.primary.main : 'rgba(0,0,0,0.04)',
  color: selected ? 'white' : theme.palette.text.primary,
  fontWeight: selected ? 600 : 400,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : 'rgba(0,0,0,0.08)',
  }
}));

const SelectionBadge = styled(Box)({
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 10
});

// Color mapping for better visual representation
const getColorHex = (colorName: string, familyName: string): string => {
  const colorMaps: Record<string, Record<string, string>> = {
    'Blues': {
      'Dark Navy': '#001f3f',
      'Navy Blue': '#003d7a',
      'Royal Blue': '#0074cc',
      'French Blue': '#318ce7',
      'Sapphire Blue': '#4dabf7',
      'Cobalt Blue': '#339af0',
      'Carolina Blue': '#74c0fc',
      'Baby Blue': '#a5d8ff',
      'Powder Blue': '#c5f0ff',
      'Aqua': '#e3faff',
      'Tiffany Blue': '#40e0d0'
    },
    'Reds': {
      'True Red': '#e74c3c',
      'Apple Red': '#c0392b',
      'Burgundy': '#8b0000',
      'Chianti': '#d63031',
      'Rust': '#b85450',
      'Coral': '#ff7675',
      'Salmon': '#fd79a8',
      'Peach': '#fdcb6e'
    },
    'Greens': {
      'Emerald Green': '#2ecc71',
      'Forest Green': '#27ae60',
      'Mint Green': '#55efc4',
      'Dark Green': '#00695c',
      'Olive Green': '#6c7b7f',
      'Lime Green': '#a4e685',
      'Mermaid Green': '#00cec9',
      'Lettuce Green': '#a8e6cf',
      'Pastel Green': '#c8e6c9'
    },
    'Pinks': {
      'Pink': '#e91e63',
      'Rose Gold': '#f06292',
      'Dusty Rose': '#f48fb1',
      'Light Pink': '#f8bbd9',
      'Blush': '#ffcdd2',
      'Fuchsia': '#c71585',
      'French Rose': '#f39c12',
      'Mauve': '#e1bee7'
    },
    'Purples': {
      'Deep Purple': '#4b0082',
      'Lavender': '#e1bee7',
      'Pastel Purple': '#f3e5f5',
      'Lilac': '#ce93d8',
      'Light Purple': '#ba68c8',
      'Plum': '#9c27b0',
      'Medium Purple': '#7b1fa2',
      'Magenta': '#e91e63'
    },
    'Yellows/Oranges': {
      'Canary Yellow': '#ffd700',
      'Banana Yellow': '#fff59d',
      'Yellow': '#ffeb3b',
      'Gold': '#ffb74d',
      'Orange': '#ff9800',
      'Champagne': '#f7e7ce',
      'Beige': '#f5f5dc',
      'Cinnamon': '#d2691e'
    },
    'Grays/Blacks': {
      'Black': '#000000',
      'Dark Grey': '#424242',
      'Charcoal': '#616161',
      'Teal': '#009688'
    },
    'Whites/Creams': {
      'White': '#ffffff',
      'Silver': '#c0c0c0',
      'Dark Silver': '#a0a0a0',
      'Ivory': '#fffaf0'
    },
    'Browns/Neutrals': {
      'Chocolate Brown': '#8b4513',
      'Taupe': '#deb887',
      'Tan': '#d2b48c'
    }
  };
  
  return colorMaps[familyName]?.[colorName] || '#cccccc';
};

const ColorFamilyCollection: React.FC<ColorFamilyCollectionProps> = () => {
  const { family: familySlug } = useParams<{ family: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [colorFamily, setColorFamily] = useState<ColorFamily | null>(null);
  const [tieWidths, setTieWidths] = useState<TieWidth[]>([]);
  const [selectedWidth, setSelectedWidth] = useState<string>('classic-width-tie');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyData();
    // Get selected color from URL params
    const colorParam = searchParams.get('color');
    if (colorParam) {
      setSelectedColor(colorParam);
    }
  }, [familySlug, searchParams]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      // Get color data from ties API
      const colorData = tiesAPI.generateColorData('1', 'Mock Product', 'mock-product');
      const families = colorData.colorFamilies;
      const widths = colorData.availableWidths;
      
      // Find the specific family
      const family = families.find(f => f.slug === familySlug);
      if (!family) {
        throw new Error('Family not found');
      }
      
      setColorFamily(family);
      setTieWidths(widths);
    } catch (error) {
      console.error('Failed to load family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Update URL with color selection
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('color', color.toLowerCase().replace(/\s+/g, '-'));
    setSearchParams(newSearchParams);
  };

  const handleWidthSelect = (widthSlug: string) => {
    setSelectedWidth(widthSlug);
  };

  const handleShopColor = () => {
    if (!selectedColor || !colorFamily) {
      alert('Please select a color first!');
      return;
    }
    
    // Navigate to product page with color selection
    const colorParam = selectedColor.toLowerCase().replace(/\s+/g, '-');
    navigate(`/ties/${selectedWidth}?color=${colorParam}&family=${familySlug}`);
  };

  const getFamilyDescription = (familyName: string): string => {
    const descriptions: Record<string, string> = {
      'Blues': 'From deep navy perfect for business to soft powder blue ideal for spring weddings. Our blues collection offers versatility for every occasion.',
      'Reds': 'Bold and passionate reds ranging from classic burgundy to vibrant coral. Perfect for making a statement at special events.',
      'Greens': 'Natural and sophisticated greens from emerald elegance to mint freshness. Ideal for outdoor weddings and spring celebrations.',
      'Pinks': 'Romantic and modern pinks from subtle blush to vibrant fuchsia. Perfect for weddings and contemporary style.',
      'Purples': 'Regal and creative purples from deep royal tones to soft lavender. Add sophistication to any formal occasion.',
      'Yellows/Oranges': 'Warm and energetic colors from golden yellow to rich cinnamon. Perfect for autumn weddings and creative events.',
      'Grays/Blacks': 'Classic and timeless neutrals that pair with everything. Essential colors for formal wear and business attire.',
      'Whites/Creams': 'Pure and elegant neutrals perfect for weddings and formal events. Timeless colors that never go out of style.',
      'Browns/Neutrals': 'Warm and earthy tones that complement autumn colors and natural settings. Perfect for rustic and outdoor themes.'
    };
    
    return descriptions[familyName] || 'Beautiful colors perfect for any occasion.';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!colorFamily) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Color family not found. Please check the URL and try again.
        </Alert>
      </Container>
    );
  }

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
        <Link color="inherit" href="/ties" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Palette fontSize="small" />
          Ties
        </Link>
        <Typography color="text.primary">{colorFamily.name} Collection</Typography>
      </Breadcrumbs>

      {/* Hero Section */}
      <HeroSection gradient={colorFamily.gradient}>
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {colorFamily.name} Collection
            </Typography>
            <Badge badgeContent={colorFamily.total} color="secondary">
              <AutoAwesome sx={{ fontSize: 32 }} />
            </Badge>
          </Box>
          
          <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 800, mb: 4 }}>
            {getFamilyDescription(colorFamily.name)}
          </Typography>

          {/* Width Selector */}
          <WidthSelector>
            {tieWidths.map((width) => (
              <WidthChip
                key={width.slug}
                label={`${width.name} (${width.width})`}
                selected={selectedWidth === width.slug}
                onClick={() => handleWidthSelect(width.slug)}
              />
            ))}
          </WidthSelector>
        </Container>
      </HeroSection>

      {/* Selected Color Info */}
      {selectedColor && (
        <Fade in timeout={300}>
          <Alert 
            severity="success" 
            sx={{ mb: 4 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleShopColor}
                endIcon={<ShoppingCart />}
              >
                Shop This Color
              </Button>
            }
          >
            <Typography variant="body2">
              <strong>Selected:</strong> {selectedColor} from {colorFamily.name} family
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Colors Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {colorFamily.colors.map((color, index) => {
          const colorHex = getColorHex(color, colorFamily.name);
          const isSelected = selectedColor === color;
          
          return (
            <Grid item xs={6} sm={4} md={3} key={color}>
              <Fade in timeout={300 + index * 50}>
                <ColorCard
                  selected={isSelected}
                  colorHex={colorHex}
                  onClick={() => handleColorSelect(color)}
                  className={isSelected ? 'selected' : ''}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <SelectionBadge>
                      <CheckCircle color="primary" sx={{ fontSize: 32 }} />
                    </SelectionBadge>
                  )}

                  {/* Color Info */}
                  <ColorInfo>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {color}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {colorFamily.name} Family
                    </Typography>
                  </ColorInfo>
                </ColorCard>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Cross-Width Suggestions */}
      {selectedColor && (
        <Box 
          sx={{ 
            backgroundColor: 'background.paper', 
            borderRadius: 2, 
            p: 4, 
            border: '1px solid',
            borderColor: 'divider',
            mb: 4
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <CompareArrows color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {selectedColor} in Other Widths
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {tieWidths.map((width) => (
              <Grid item xs={6} md={3} key={width.slug}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedWidth === width.slug ? '2px solid' : '1px solid',
                    borderColor: selectedWidth === width.slug ? 'primary.main' : 'divider',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => {
                    setSelectedWidth(width.slug);
                    const colorParam = selectedColor.toLowerCase().replace(/\s+/g, '-');
                    navigate(`/ties/${width.slug}?color=${colorParam}&family=${familySlug}`);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {width.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {width.width} Width
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                      ${width.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Call to Action */}
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Found Your Perfect Color?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select any color above and choose your preferred tie width to continue shopping.
        </Typography>
        <Box display="flex" justifyContent="center" gap={2}>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleShopColor}
            disabled={!selectedColor}
            startIcon={<ShoppingCart />}
          >
            Shop Selected Color
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/ties')}
            startIcon={<ArrowBack />}
          >
            Back to Ties
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ColorFamilyCollection;