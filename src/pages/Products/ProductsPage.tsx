import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Breadcrumbs,
  Link,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
  Badge,
  IconButton,
} from '@mui/material';
import {
  NavigateNext,
  FilterList,
  ViewModule,
  ViewList,
  Add,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Share,
  AutoAwesome,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import SmartCategoryNav from '../../components/Products/SmartCategoryNav';
import SmartFilterPanel from '../../components/Products/SmartFilterPanel';
import AIProductAssistant from '../../components/Products/AIProductAssistant';
import type { SmartProduct, ProductFilter, SEOCategory } from '../../types';

interface ProductsPageProps {
  // Can be extended with props if needed
}

// Mock data for development - replace with API calls
const mockProducts: SmartProduct[] = [
  {
    id: '1',
    name: 'Classic Navy Wedding Suit',
    sku: 'KCT-WS-001',
    slug: 'classic-navy-wedding-suit',
    primaryCategory: 'suits',
    subcategory: 'wedding',
    occasions: ['wedding', 'formal'],
    styleAttributes: ['classic', 'slim'],
    colorFamily: 'navys',
    priceTier: 'premium',
    fabricType: 'wool',
    description: 'A timeless navy suit perfect for your wedding day. Crafted from premium wool with a modern slim fit.',
    shortDescription: 'Premium navy wedding suit with slim fit',
    features: ['100% Wool', 'Slim Fit', 'Half Canvas Construction', 'Free Alterations'],
    price: 329,
    compareAtPrice: 429,
    inventory: 25,
    lowStockThreshold: 5,
    trackInventory: true,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500',
        altText: 'Classic Navy Wedding Suit',
        isPrimary: true,
        order: 1,
      },
    ],
    videos: [],
    variants: [
      {
        id: '1',
        sku: 'KCT-WS-001-42R',
        name: 'Navy - Size 42R',
        size: '42R',
        color: 'Navy',
        inventory: 5,
        available: true,
      },
    ],
    isDigital: false,
    requiresShipping: true,
    status: 'active',
    featured: true,
    newProduct: false,
    bestseller: true,
    views: 1250,
    searchKeywords: ['navy suit', 'wedding suit', 'groom suit'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Burgundy Bow Tie',
    sku: 'KCT-BT-001',
    slug: 'burgundy-silk-bow-tie',
    primaryCategory: 'ties',
    subcategory: 'bow-ties',
    occasions: ['wedding', 'formal', 'cocktail'],
    styleAttributes: ['classic', 'luxury'],
    colorFamily: 'burgundy',
    priceTier: 'budget',
    fabricType: 'silk',
    description: 'Elegant silk bow tie in rich burgundy. Perfect for weddings and formal events.',
    shortDescription: 'Premium silk bow tie in burgundy',
    features: ['100% Silk', 'Self-Tie', 'Adjustable', 'Pre-Tied Option Available'],
    price: 45,
    inventory: 50,
    lowStockThreshold: 10,
    trackInventory: true,
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1506629905607-4c8c2e45f1e1?w=500',
        altText: 'Burgundy Silk Bow Tie',
        isPrimary: true,
        order: 1,
      },
    ],
    videos: [],
    variants: [
      {
        id: '2',
        sku: 'KCT-BT-001-OS',
        name: 'Burgundy - One Size',
        color: 'Burgundy',
        inventory: 50,
        available: true,
      },
    ],
    isDigital: false,
    requiresShipping: true,
    status: 'active',
    featured: false,
    newProduct: true,
    bestseller: false,
    views: 324,
    searchKeywords: ['bow tie', 'burgundy', 'wedding tie'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ProductsPage: React.FC<ProductsPageProps> = () => {
  const { category, subcategory } = useParams<{ category?: string; subcategory?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [products, setProducts] = useState<SmartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilter>({
    category,
    subcategory,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Load products based on filters
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        // 🔥 NEW: Load from Suits API if category is suits
        if (filters.category === 'suits') {
          const { suitsAPIClient } = await import('../../services/suitsAPI');
          
          const suitsResponse = await suitsAPIClient.getSuitsWithImages();
          
          // Convert suits to SmartProduct format
          const convertedSuits: SmartProduct[] = suitsResponse.suits.map(suit => {
            // Parse prices from string to number
            const price2pc = parseFloat(suit.base_price_2pc) || 0;
            const price3pc = parseFloat(suit.base_price_3pc) || 0;
            
            // Debug logging for images
            if (suit.slug === 'black-suit') {
              console.log('🖼️ Black suit images data:', suit.images);
            }
            
            return {
              id: suit.id.toString(), // Convert number to string for SmartProduct
              name: suit.name,
              sku: `SUIT-${suit.id}`,
              slug: suit.slug,
              primaryCategory: 'suits' as const,
              subcategory: suit.category,
              occasions: suit.target_events || (
                suit.category === 'wedding' ? ['wedding', 'formal'] : 
                suit.category === 'business' ? ['business', 'professional'] :
                suit.category === 'prom' ? ['prom', 'formal'] :
                suit.is_tuxedo ? ['formal', 'black-tie'] : ['formal']
              ),
              styleAttributes: [suit.fit_type.toLowerCase(), 'classic'],
              colorFamily: suit.base_color || 'neutrals',
              priceTier: price2pc < 300 ? 'budget' : 
                        price2pc < 500 ? 'premium' : 'luxury',
              fabricType: 'wool', // Default since not in API
              description: `Premium ${suit.category} ${suit.is_tuxedo ? 'tuxedo' : 'suit'} in ${suit.base_color}. ${suit.fit_type} fit for the perfect look.`,
              shortDescription: `${suit.name} - ${suit.fit_type} ${suit.category} ${suit.is_tuxedo ? 'tuxedo' : 'suit'}`,
              features: [
                'Professional Tailoring',
                `${suit.fit_type} Fit`,
                suit.is_tuxedo ? 'Tuxedo Style' : 'Suit Style',
                'Perfect Fit Guarantee'
              ],
              price: price2pc,
              compareAtPrice: price3pc > price2pc ? price3pc : undefined,
              inventory: 50, // Default inventory since not in API
              lowStockThreshold: 5,
              trackInventory: true,
              searchKeywords: [
                suit.name.toLowerCase(),
                suit.category,
                suit.base_color,
                suit.fit_type.toLowerCase(),
                suit.is_tuxedo ? 'tuxedo' : 'suit',
                'menswear'
              ],
              images: (() => {
                const imageUrls: string[] = [];
                const suitImages = suit.images || {};
                
                // Add main image first if available
                if (suitImages.main) imageUrls.push(suitImages.main);
                
                // Add other single images
                if (suitImages.front) imageUrls.push(suitImages.front);
                if (suitImages.detail) imageUrls.push(suitImages.detail);
                if (suitImages.thumbnail) imageUrls.push(suitImages.thumbnail);
                
                // Add gallery images if available
                if (Array.isArray(suitImages.gallery)) {
                  imageUrls.push(...suitImages.gallery);
                }
                
                // Convert to SmartProduct image format
                return imageUrls.map((url, index) => ({
                  id: `${suit.id}-${index}`,
                  productId: suit.id.toString(),
                  url: url,
                  altText: `${suit.name} - Image ${index + 1}`,
                  isPrimary: index === 0,
                  position: index + 1,
                  createdAt: new Date().toISOString(),
                }));
              })(),
              videos: [],
              variants: [
                {
                  id: `${suit.id}-2pc`,
                  productId: suit.id.toString(),
                  name: '2-Piece',
                  sku: `${suit.id}-2PC`,
                  price: price2pc,
                  stock: 50, // Default stock
                  reservedStock: 0,
                  minimumStock: 5,
                  reorderPoint: 10,
                  isActive: true,
                  position: 1,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                ...(price3pc > 0 ? [{
                  id: `${suit.id}-3pc`,
                  productId: suit.id.toString(),
                  name: '3-Piece',
                  sku: `${suit.id}-3PC`,
                  price: price3pc,
                  stock: 50, // Default stock
                  reservedStock: 0,
                  minimumStock: 5,
                  reorderPoint: 10,
                  isActive: true,
                  position: 2,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }] : []),
              ],
              isDigital: false,
              requiresShipping: true,
              status: 'active' as const,
              featured: suit.prom_trending,
              newProduct: false,
              bestseller: suit.prom_trending,
              views: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });
          
          // Apply subcategory filter
          let filteredSuits = convertedSuits;
          if (filters.subcategory) {
            filteredSuits = filteredSuits.filter(p => p.subcategory === filters.subcategory);
          }
          
          setProducts(filteredSuits);
        } else {
          // Use mock data for other categories
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          let filteredProducts = mockProducts;
          
          // Apply filters
          if (filters.category) {
            filteredProducts = filteredProducts.filter(p => p.primaryCategory === filters.category);
          }
          if (filters.subcategory) {
            filteredProducts = filteredProducts.filter(p => p.subcategory === filters.subcategory);
          }
          if (filters.occasions?.length) {
            filteredProducts = filteredProducts.filter(p => 
              p.occasions.some(occ => filters.occasions!.includes(occ))
            );
          }
          
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to mock data on error
        let filteredProducts = mockProducts;
        if (filters.category) {
          filteredProducts = filteredProducts.filter(p => p.primaryCategory === filters.category);
        }
        setProducts(filteredProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters]);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category,
      subcategory,
    }));
  }, [category, subcategory]);

  // SEO data for current page
  const getPageSEO = () => {
    if (category === 'suits' && subcategory === 'wedding') {
      return {
        title: 'Wedding Suits for Grooms | Premium Wedding Attire | KCT Menswear',
        description: 'Discover premium wedding suits for grooms. From classic tuxedos to modern wedding attire. Complete wedding packages from $229. Free shipping & expert styling.',
        h1: 'Wedding Suits for Grooms',
      };
    } else if (category === 'suits') {
      return {
        title: 'Men\'s Suits | Premium Formal Wear | KCT Menswear',
        description: 'Shop premium men\'s suits. Wedding suits, business suits, tuxedos. Expert fit, free shipping. Complete looks from $229.',
        h1: 'Premium Men\'s Suits',
      };
    } else {
      return {
        title: 'Premium Menswear | Suits, Shirts, Ties | KCT Menswear',
        description: 'Shop premium menswear at KCT. Suits, shirts, ties, complete looks. Expert tailoring, free shipping. Wedding packages from $229.',
        h1: 'Premium Menswear Collection',
      };
    }
  };

  const seoData = getPageSEO();

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
    ];

    if (category) {
      crumbs.push({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        href: `/products/${category}`,
      });
    }

    if (subcategory) {
      crumbs.push({
        label: subcategory.charAt(0).toUpperCase() + subcategory.slice(1),
        href: `/products/${category}/${subcategory}`,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={`https://kctmenswear.com/products${category ? `/${category}` : ''}${subcategory ? `/${subcategory}` : ''}`} />
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProductCollection",
            "name": seoData.h1,
            "description": seoData.description,
            "url": `https://kctmenswear.com/products${category ? `/${category}` : ''}${subcategory ? `/${subcategory}` : ''}`,
            "numberOfItems": products.length,
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": Math.min(...products.map(p => p.price)),
              "highPrice": Math.max(...products.map(p => p.price)),
              "priceCurrency": "USD"
            }
          })}
        </script>
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 3 }}
        >
          {breadcrumbs.map((crumb, index) => (
            index === breadcrumbs.length - 1 ? (
              <Typography key={crumb.label} color="text.primary">
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.label}
                color="inherit"
                href={crumb.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(crumb.href);
                }}
                sx={{ textDecoration: 'none' }}
              >
                {crumb.label}
              </Link>
            )
          ))}
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            {seoData.h1}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
            {seoData.description}
          </Typography>
        </Box>

        {/* Category Navigation */}
        {!category && (
          <Box sx={{ mb: 4 }}>
            <SmartCategoryNav
              currentCategory={category}
              currentSubcategory={subcategory}
              onFilterChange={setFilters}
              mobileCollapsed={isMobile}
            />
          </Box>
        )}

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Filters Sidebar */}
          {(showFilters || !isMobile) && (
            <Box sx={{ 
              width: { xs: '100%', md: '300px' },
              flexShrink: 0 
            }}>
              <SmartFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                totalProducts={products.length}
                productCounts={{
                  occasions: { wedding: 15, business: 8, prom: 5 },
                  styleAttributes: { classic: 12, modern: 8, slim: 10 },
                  colorFamilies: { navys: 8, blacks: 6, greys: 4 },
                  priceTiers: { budget: 5, premium: 10, luxury: 3 },
                  fabricTypes: { wool: 8, cotton: 6, silk: 4 },
                }}
              />
            </Box>
          )}
 
          {/* Products Content */}
          <Box sx={{ flex: 1 }}>
            {/* Toolbar */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}>
              <Typography variant="body1" color="text.secondary">
                {loading ? 'Loading...' : `${products.length} products found`}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Mobile Filter Toggle */}
                {isMobile && (
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    color={showFilters ? 'primary' : 'default'}
                  >
                    <Badge badgeContent={Object.keys(filters).length - 2} color="primary">
                      <FilterList />
                    </Badge>
                  </IconButton>
                )}
                
                {/* View Mode Toggle */}
                <Button
                  size="small"
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  sx={{ minWidth: 40 }}
                >
                  <ViewModule />
                </Button>
                <Button
                  size="small"
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('list')}
                  sx={{ minWidth: 40 }}
                >
                  <ViewList />
                </Button>
              </Box>
            </Box>

            {/* Products Loading State */}
            {loading && (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2,
              }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="30%" />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: viewMode === 'list' 
                  ? '1fr' 
                  : {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    },
                gap: 2,
              }}>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product} 
                    viewMode={viewMode} 
                  />
                ))}
              </Box>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <Alert severity="info" sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2">
                  Try adjusting your filters or browse our main categories.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setFilters({ category: undefined, subcategory: undefined })}
                  sx={{ mt: 2 }}
                >
                  Clear All Filters
                </Button>
              </Alert>
            )}
          </Box>
        </Box>

        {/* AI Product Assistant */}
        {showAIAssistant && (
          <AIProductAssistant 
            selectedProducts={products}
            onApplyChanges={(changes) => {
              console.log('AI Suggestions Applied:', changes);
              // Here you can implement the logic to apply AI suggestions
            }}
          />
        )}
      </Container>

      {/* Mobile FAB for Cart */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/cart')}
        >
          <ShoppingCart />
        </Fab>
      )}

      {/* AI Assistant FAB */}
      <Fab
        color="secondary"
        sx={{ 
          position: 'fixed', 
          bottom: isMobile ? 80 : 16, 
          right: 16,
          background: 'linear-gradient(45deg, #8B1538 30%, #D4AF37 90%)',
        }}
        onClick={() => setShowAIAssistant(!showAIAssistant)}
      >
        <AutoAwesome />
      </Fab>
    </>
  );
};

// Product Card Component
interface ProductCardProps {
  product: SmartProduct;
  viewMode: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(false);
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 0;
  const savingsPercentage = product.compareAtPrice 
    ? Math.round((savings / product.compareAtPrice) * 100) 
    : 0;

  const handleProductClick = () => {
    navigate(`/products/${product.primaryCategory}/${product.slug}`);
  };

  if (viewMode === 'list') {
    return (
      <Card 
        sx={{ 
          display: 'flex', 
          cursor: 'pointer',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
          transition: 'all 0.2s ease-in-out',
        }}
        onClick={handleProductClick}
      >
        <CardMedia
          component="img"
          sx={{ width: 200, height: 150 }}
          image={primaryImage?.url}
          alt={primaryImage?.altText}
        />
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {product.shortDescription}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                {product.occasions.slice(0, 2).map((occasion) => (
                  <Chip key={occasion} label={occasion} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', ml: 2 }}>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                ${product.price}
              </Typography>
              {product.compareAtPrice && (
                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  ${product.compareAtPrice}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
      }}
      onClick={handleProductClick}
    >
      {/* Badges */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
        {product.newProduct && (
          <Chip label="New" size="small" color="success" sx={{ mr: 0.5, mb: 0.5 }} />
        )}
        {product.bestseller && (
          <Chip label="Best Seller" size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
        )}
        {savingsPercentage > 0 && (
          <Chip label={`-${savingsPercentage}%`} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
        )}
      </Box>

      {/* Favorite Button */}
      <IconButton
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }}
        onClick={(e) => {
          e.stopPropagation();
          setFavorite(!favorite);
        }}
      >
        {favorite ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>

      <CardMedia
        component="img"
        height="240"
        image={primaryImage?.url}
        alt={primaryImage?.altText}
      />
      
      <CardContent>
        <Typography variant="h6" gutterBottom noWrap>
          {product.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: 40, overflow: 'hidden' }}>
          {product.shortDescription}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
          {product.occasions.slice(0, 2).map((occasion) => (
            <Chip 
              key={occasion} 
              label={occasion} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              ${product.price}
            </Typography>
            {product.compareAtPrice && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ${product.compareAtPrice}
              </Typography>
            )}
          </Box>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCart />}
            onClick={(e) => {
              e.stopPropagation();
              // Add to cart logic
            }}
          >
            Add to Cart
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductsPage; 