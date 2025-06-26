import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, Chip, Tooltip, IconButton, Fade, Zoom, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Palette, Info, ArrowForward, ViewList } from '@mui/icons-material';
import tiesAPI from '../../services/tiesAPI';

// Types for color families
interface ColorFamily {
  name: string;
  slug: string;
  gradient: { start: string; end: string };
  colors: string[];
  total: number;
}

interface ColorFamilyGridProps {
  onColorFamilySelect?: (family: ColorFamily) => void;
  onColorSelect?: (color: string, family: ColorFamily) => void;
  selectedFamily?: string;
  compact?: boolean;
}

// Styled components for revolutionary UI
const GradientCard = styled(Card)<{ gradient: { start: string; end: string } }>(({ theme, gradient }) => ({
  position: 'relative',
  height: '180px',
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: '16px',
  background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  border: '1px solid rgba(255,255,255,0.1)',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    '& .color-dots': {
      transform: 'scale(1.1)',
    },
    '& .family-info': {
      transform: 'translateY(0)',
      opacity: 1,
    },
    '& .expand-button': {
      opacity: 1,
      transform: 'scale(1)',
    }
  },
  '&.selected': {
    transform: 'scale(1.05)',
    boxShadow: `0 0 30px ${gradient.end}40`,
    borderColor: gradient.end,
  }
}));

const ColorDotsContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '8px',
  transition: 'transform 0.3s ease',
});

const ColorDot = styled(Box)<{ color: string }>(({ color }) => ({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: color,
  border: '2px solid rgba(255,255,255,0.8)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.3)',
    borderColor: '#fff',
  }
}));

const FamilyInfo = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  color: 'white',
  padding: '20px 16px 16px',
  transform: 'translateY(20px)',
  opacity: 0,
  transition: 'all 0.3s ease',
});

const ExpandButton = styled(IconButton)({
  position: 'absolute',
  top: '12px',
  right: '12px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: 'white',
  opacity: 0,
  transform: 'scale(0.8)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.3)',
  }
});

const StyledChip = styled(Chip)({
  backgroundColor: 'rgba(255,255,255,0.9)',
  color: 'rgba(0,0,0,0.8)',
  fontWeight: 600,
  fontSize: '0.75rem',
});

// Color mappings for better visual representation
const getRepresentativeColors = (familyName: string): string[] => {
  const colorMaps: Record<string, string[]> = {
    'Blues': ['#001f3f', '#003d7a', '#0074cc', '#4dabf7', '#74c0fc', '#a5d8ff', '#c5f0ff', '#e3faff'],
    'Reds': ['#8b0000', '#d63031', '#e84393', '#fd79a8', '#ff6b6b', '#ff8a80', '#ffab91', '#ffccbc'],
    'Greens': ['#013220', '#00695c', '#2ecc71', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'],
    'Pinks': ['#c71585', '#e91e63', '#f06292', '#f48fb1', '#ffb6c1', '#ffcdd2', '#f8bbd9', '#fce4ec'],
    'Purples': ['#4b0082', '#7b1fa2', '#9c27b0', '#ba68c8', '#ce93d8', '#e1bee7', '#f3e5f5', '#fce4fc'],
    'Yellows/Oranges': ['#ff8c00', '#ff9800', '#ffb74d', '#ffcc02', '#ffd700', '#ffe082', '#fff176', '#fff59d'],
    'Grays/Blacks': ['#000000', '#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd', '#e0e0e0', '#f5f5f5'],
    'Whites/Creams': ['#fffaf0', '#fff8e1', '#ffffff', '#f5f5dc', '#faf0e6', '#fdf5e6', '#fffacd', '#f0f8ff'],
    'Browns/Neutrals': ['#8b4513', '#a0522d', '#cd853f', '#daa520', '#f4a460', '#deb887', '#d2b48c', '#f5deb3']
  };
  
  return colorMaps[familyName] || ['#cccccc', '#dddddd', '#eeeeee', '#f0f0f0', '#f5f5f5', '#fafafa', '#fcfcfc', '#ffffff'];
};

const ColorFamilyGrid: React.FC<ColorFamilyGridProps> = ({
  onColorFamilySelect,
  onColorSelect,
  selectedFamily,
  compact = false
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [colorFamilies, setColorFamilies] = useState<ColorFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  useEffect(() => {
    loadColorFamilies();
  }, []);

  const loadColorFamilies = async () => {
    try {
      setLoading(true);
      // Get color families from the ties API
      const mockData = tiesAPI.generateColorData('mock', 'Mock Product', 'mock-product');
      setColorFamilies(mockData.colorFamilies);
    } catch (error) {
      console.error('Failed to load color families:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyClick = (family: ColorFamily) => {
    if (expandedFamily === family.slug) {
      setExpandedFamily(null);
    } else {
      setExpandedFamily(family.slug);
      onColorFamilySelect?.(family);
    }
  };

  const handleColorClick = (color: string, family: ColorFamily, event: React.MouseEvent) => {
    event.stopPropagation();
    onColorSelect?.(color, family);
    
    // Update URL with color selection
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('color', color.toLowerCase().replace(/\s+/g, '-'));
    newSearchParams.set('family', family.slug);
    setSearchParams(newSearchParams);
  };

  const handleViewAllFamily = (family: ColorFamily, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/collections/${family.slug}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Palette sx={{ fontSize: 48, color: 'primary.main', animation: 'pulse 2s infinite' }} />
          <Typography variant="h6" color="text.secondary">Loading Color Families...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3} textAlign="center">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎨 Revolutionary Color Families
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Choose from 9 curated color families with 63 wedding collection colors. 
          Each family offers multiple shades perfect for any occasion.
        </Typography>
      </Box>

      {/* 3x3 Color Family Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {colorFamilies.map((family, index) => {
          const representativeColors = getRepresentativeColors(family.name);
          const isSelected = selectedFamily === family.slug;
          const isExpanded = expandedFamily === family.slug;

          return (
            <Grid item xs={12} sm={6} md={4} key={family.slug}>
              <Zoom in timeout={300 + index * 100}>
                <GradientCard
                  gradient={family.gradient}
                  onClick={() => handleFamilyClick(family)}
                  className={isSelected ? 'selected' : ''}
                  elevation={0}
                >
                  {/* Expand Button */}
                  <ExpandButton className="expand-button" size="small">
                    <ArrowForward fontSize="small" />
                  </ExpandButton>

                  {/* Color Count Chip */}
                  <Box position="absolute" top={12} left={12}>
                    <StyledChip 
                      label={`${family.total} colors`} 
                      size="small"
                      icon={<Palette fontSize="small" />}
                    />
                  </Box>

                  {/* Representative Color Dots */}
                  <ColorDotsContainer className="color-dots">
                    {representativeColors.slice(0, 8).map((color, colorIndex) => (
                      <Tooltip key={colorIndex} title={`${family.name} family colors`} arrow>
                        <ColorDot 
                          color={color}
                          onClick={(e) => handleColorClick(color, family, e)}
                        />
                      </Tooltip>
                    ))}
                  </ColorDotsContainer>

                  {/* Family Info Overlay */}
                  <FamilyInfo className="family-info">
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {family.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {family.total} beautiful shades
                    </Typography>
                  </FamilyInfo>
                </GradientCard>
              </Zoom>

              {/* Expanded Family Colors */}
              <Fade in={isExpanded} timeout={300}>
                <Box mt={2} sx={{ display: isExpanded ? 'block' : 'none' }}>
                  <Card sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {family.name} Collection
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewList />}
                        onClick={(e) => handleViewAllFamily(family, e)}
                        sx={{ textTransform: 'none' }}
                      >
                        View All {family.name}
                      </Button>
                    </Box>
                    <Grid container spacing={1}>
                      {family.colors.map((color, colorIndex) => (
                        <Grid item key={colorIndex}>
                          <Tooltip title={color} arrow>
                            <Chip
                              label={color}
                              size="small"
                              onClick={(e) => handleColorClick(color, family, e as any)}
                              sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: 2,
                                }
                              }}
                            />
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Card>
                </Box>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Stats */}
      <Box 
        display="flex" 
        justifyContent="center" 
        gap={4} 
        mt={4} 
        p={3}
        sx={{ 
          backgroundColor: 'background.paper', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box textAlign="center">
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {colorFamilies.reduce((sum, family) => sum + family.total, 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">Total Colors</Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
            9
          </Typography>
          <Typography variant="body2" color="text.secondary">Color Families</Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
            252
          </Typography>
          <Typography variant="body2" color="text.secondary">Total Variants</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ColorFamilyGrid;