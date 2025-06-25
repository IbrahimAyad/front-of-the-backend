import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Button,
  Collapse,
  IconButton,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Checkroom,
  Category,
  Diamond,
  WorkOutline,
  Favorite,
  LocalOffer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { SEOCategory, ProductFilter } from '../../types';

interface SmartCategoryNavProps {
  currentCategory?: string;
  currentSubcategory?: string;
  productCounts?: Record<string, number>;
  onFilterChange?: (filters: ProductFilter) => void;
  mobileCollapsed?: boolean;
}

// Your 6 main categories with SEO-optimized structure
const mainCategories: SEOCategory[] = [
  {
    id: 'suits',
    name: 'Suits',
    slug: 'suits',
    seoTitle: 'Men\'s Suits | Premium Formal Wear | KCT Menswear',
    metaDescription: 'Shop premium men\'s suits. Wedding suits, business suits, tuxedos. Expert fit, free shipping. Complete looks from $229.',
    h1Heading: 'Premium Men\'s Suits',
    schemaType: 'ProductCollection',
    navPriority: 1,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shirts',
    name: 'Shirts',
    slug: 'shirts',
    seoTitle: 'Men\'s Dress Shirts | Business & Wedding Shirts',
    metaDescription: 'Premium men\'s dress shirts. Perfect fit guarantee. Wedding, business, casual styles. Free shipping over $100.',
    h1Heading: 'Premium Men\'s Dress Shirts',
    schemaType: 'ProductCollection',
    navPriority: 2,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ties',
    name: 'Ties',
    slug: 'ties',
    seoTitle: 'Men\'s Ties & Neckties | Wedding Ties | Silk Ties',
    metaDescription: 'Ultimate tie collection. 65+ colors, perfect for weddings. Silk ties, bow ties, pocket squares. Color coordination available.',
    h1Heading: 'Ultimate Tie Collection',
    schemaType: 'ProductCollection',
    navPriority: 3,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vests',
    name: 'Vests',
    slug: 'vests',
    seoTitle: 'Men\'s Vests & Waistcoats | Formal Vests',
    metaDescription: 'Premium men\'s vests and waistcoats. Wedding vests, business vests, patterned designs. Complete your formal look.',
    h1Heading: 'Premium Men\'s Vests',
    schemaType: 'ProductCollection',
    navPriority: 4,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'complete-looks',
    name: 'Complete Looks',
    slug: 'complete-looks',
    seoTitle: 'Complete Suit Packages | Men\'s Outfit Bundles',
    metaDescription: 'Complete outfit packages from $229. Suit + shirt + tie bundles. Wedding packages, business looks, prom outfits.',
    h1Heading: 'Complete Outfit Packages',
    schemaType: 'ProductCollection',
    navPriority: 5,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wedding-services',
    name: 'Wedding Services',
    slug: 'wedding-services',
    seoTitle: 'Wedding Services | Groomsmen Coordination',
    metaDescription: 'Complete wedding services. Color coordination, groomsmen packages, wedding planning assistance. Make your wedding perfect.',
    h1Heading: 'Complete Wedding Services',
    schemaType: 'ProductCollection',
    navPriority: 6,
    showInMenu: true,
    showInBreadcrumbs: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Subcategories for each main category
const subcategories: Record<string, Array<{ name: string; slug: string; description: string }>> = {
  suits: [
    { name: 'Wedding Suits', slug: 'wedding', description: 'Perfect for your special day' },
    { name: 'Business Suits', slug: 'business', description: 'Professional attire' },
    { name: 'Tuxedos', slug: 'tuxedos', description: 'Formal evening wear' },
    { name: 'Prom Suits', slug: 'prom', description: 'Stand out at prom' },
  ],
  shirts: [
    { name: 'Dress Shirts', slug: 'dress', description: 'Classic formal shirts' },
    { name: 'Tuxedo Shirts', slug: 'tuxedo', description: 'For black-tie events' },
    { name: 'Casual Shirts', slug: 'casual', description: 'Relaxed style' },
  ],
  ties: [
    { name: 'Neckties', slug: 'neckties', description: 'Classic tie styles' },
    { name: 'Bow Ties', slug: 'bow-ties', description: 'Formal bow ties' },
    { name: 'Pocket Squares', slug: 'pocket-squares', description: 'Complete the look' },
  ],
  vests: [
    { name: 'Formal Vests', slug: 'formal', description: 'Business and wedding' },
    { name: 'Casual Vests', slug: 'casual', description: 'Everyday style' },
    { name: 'Patterned Vests', slug: 'patterned', description: 'Unique designs' },
  ],
  'complete-looks': [
    { name: 'Wedding Packages', slug: 'wedding', description: 'Complete wedding attire' },
    { name: 'Business Packages', slug: 'business', description: 'Professional packages' },
    { name: 'Prom Packages', slug: 'prom', description: 'Prom night ready' },
  ],
  'wedding-services': [
    { name: 'Color Coordination', slug: 'color-coordination', description: 'Perfect color matching' },
    { name: 'Groomsmen Packages', slug: 'groomsmen', description: 'Group coordination' },
    { name: 'Wedding Planning', slug: 'planning', description: 'Complete planning support' },
  ],
};

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  suits: <Checkroom />,
  shirts: <Category />,
  ties: <Diamond />,
  vests: <WorkOutline />,
  'complete-looks': <LocalOffer />,
  'wedding-services': <Favorite />,
};

const SmartCategoryNav: React.FC<SmartCategoryNavProps> = ({
  currentCategory,
  currentSubcategory,
  productCounts = {},
  onFilterChange,
  mobileCollapsed = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(currentCategory || null);
  const [showAllCategories, setShowAllCategories] = useState(!mobileCollapsed);

  const handleCategoryClick = (category: SEOCategory) => {
    if (expandedCategory === category.slug) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category.slug);
    }
    
    // Navigate to category page
    navigate(`/products/${category.slug}`);
    
    // Update filters
    if (onFilterChange) {
      onFilterChange({
        category: category.slug,
        subcategory: undefined, // Clear subcategory when changing main category
      });
    }
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    navigate(`/products/${categorySlug}/${subcategorySlug}`);
    
    if (onFilterChange) {
      onFilterChange({
        category: categorySlug,
        subcategory: subcategorySlug,
      });
    }
  };

  const isActiveCategory = (categorySlug: string) => currentCategory === categorySlug;
  const isActiveSubcategory = (subcategorySlug: string) => currentSubcategory === subcategorySlug;

  return (
    <Box>
      {/* Mobile Toggle */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setShowAllCategories(!showAllCategories)}
            endIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
            sx={{
              justifyContent: 'space-between',
              textTransform: 'none',
              py: 1.5,
            }}
          >
            <Typography variant="body1" fontWeight="medium">
              Browse Categories
            </Typography>
          </Button>
        </Box>
      )}

      {/* Category Navigation */}
      <Collapse in={showAllCategories || !isMobile}>
        <Grid container spacing={isMobile ? 1 : 2}>
          {mainCategories.map((category) => {
            const isActive = isActiveCategory(category.slug);
            const isExpanded = expandedCategory === category.slug;
            const categorySubcategories = subcategories[category.slug] || [];
            const categoryProductCount = productCounts[category.slug] || 0;

            return (
                             <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: isActive 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.light,
                    },
                    height: 'fit-content',
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: isActive 
                            ? theme.palette.primary.main 
                            : theme.palette.primary.light + '20',
                          color: isActive ? 'white' : theme.palette.primary.main,
                          mr: 1.5,
                        }}
                      >
                        {categoryIcons[category.slug]}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={isActive ? 'primary.main' : 'text.primary'}
                          sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                        >
                          {category.name}
                        </Typography>
                        {categoryProductCount > 0 && (
                          <Badge
                            badgeContent={categoryProductCount}
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease-in-out',
                        }}
                      >
                        <ExpandMore fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Subcategories */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                        {categorySubcategories.map((sub) => (
                          <Chip
                            key={sub.slug}
                            label={sub.name}
                            size="small"
                            variant={isActiveSubcategory(sub.slug) ? 'filled' : 'outlined'}
                            color={isActiveSubcategory(sub.slug) ? 'primary' : 'default'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubcategoryClick(category.slug, sub.slug);
                            }}
                            sx={{
                              m: 0.5,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                backgroundColor: theme.palette.primary.light + '20',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Collapse>

      {/* Quick Filters for Current Category */}
      {currentCategory && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Quick Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {['Wedding', 'Business', 'Casual', 'Formal'].map((occasion) => (
              <Chip
                key={occasion}
                label={occasion}
                size="small"
                variant="outlined"
                onClick={() => onFilterChange?.({ occasions: [occasion.toLowerCase()] })}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SmartCategoryNav; 