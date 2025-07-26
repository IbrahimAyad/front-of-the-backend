import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Recommend,
  TrendingUp,
  ShoppingCart,
  Star,
  Lightbulb,
  CheckCircle,
} from '@mui/icons-material';

interface ProductRecommendationsProps {
  customerId: string;
  recommendations: any[];
  customerProfile: any;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  customerId,
  recommendations,
  customerProfile,
}) => {
  // Mock recommendations data for demonstration
  const mockRecommendations = [
    {
      id: 'rec1',
      product: 'Charcoal Grey Business Suit - Slim Fit',
      category: 'Suit',
      reason: 'Matches your navy blue and black preference pattern',
      confidence: 0.92,
      type: 'cross-sell',
      price: 749.99,
      image: '🤵',
      priority: 9,
      basedOn: ['Navy Blue Tuxedo', 'Black Accessories'],
      benefits: ['Professional versatility', 'Color coordination', 'Size confidence: 42R'],
    },
    {
      id: 'rec2',
      product: 'French Cuff Dress Shirt - White',
      category: 'Shirt',
      reason: 'Essential complement to your formal wear collection',
      confidence: 0.85,
      type: 'upsell',
      price: 189.99,
      image: '👕',
      priority: 8,
      basedOn: ['Tuxedo purchases', 'Formal occasions'],
      benefits: ['Formal occasions', 'Quality upgrade', 'Professional appearance'],
    },
    {
      id: 'rec3',
      product: 'Navy Blue Blazer - Classic Fit',
      category: 'Blazer',
      reason: 'Expands your navy blue collection for versatility',
      confidence: 0.78,
      type: 'cross-sell',
      price: 449.99,
      image: '🧥',
      priority: 7,
      basedOn: ['Color preferences', 'Occasion patterns'],
      benefits: ['Casual-formal versatility', 'Color preference match', 'Size: 42R available'],
    },
    {
      id: 'rec4',
      product: 'Black Leather Dress Shoes',
      category: 'Shoes',
      reason: 'Complete your formal look with quality footwear',
      confidence: 0.70,
      type: 'cross-sell',
      price: 299.99,
      image: '👞',
      priority: 6,
      basedOn: ['Formal wear purchases', 'Quality preference'],
      benefits: ['Complete formal outfit', 'Long-term investment', 'Professional appearance'],
    },
  ];

  const displayRecommendations = recommendations.length > 0 ? recommendations : mockRecommendations;

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'cross-sell': return 'primary';
      case 'upsell': return 'success';
      case 'repurchase': return 'info';
      case 'occasion-based': return 'warning';
      default: return 'default';
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'cross-sell': return 'Cross-sell';
      case 'upsell': return 'Upgrade';
      case 'repurchase': return 'Repurchase';
      case 'occasion-based': return 'Occasion';
      default: return type;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Recommendations Overview */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Recommend color="primary" />
          <Typography variant="h6">
            Personalized Recommendations
          </Typography>
          <Chip 
            label={`${displayRecommendations.length} suggestions`}
            size="small"
            color="primary"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" mb={3}>
          Based on your purchase history, size profile, and style preferences
        </Typography>
      </Box>

      {/* Recommendation Cards */}
      <Grid container spacing={3} mb={4}>
        {displayRecommendations.map((rec) => (
          <Grid item xs={12} md={6} key={rec.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    {rec.image}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {rec.product}
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip 
                        label={getRecommendationTypeLabel(rec.type)}
                        size="small"
                        color={getRecommendationTypeColor(rec.type) as any}
                      />
                      <Chip 
                        label={rec.category}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${rec.price}
                  </Typography>
                </Box>

                {/* Confidence Score */}
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      Recommendation Confidence
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(rec.confidence * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={rec.confidence * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={getConfidenceColor(rec.confidence) as any}
                  />
                </Box>

                {/* Reason */}
                <Box mb={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Lightbulb color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2" fontWeight="medium">
                      Why we recommend this:
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {rec.reason}
                  </Typography>
                </Box>

                {/* Based On */}
                <Box mb={2}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Based on your purchases:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {rec.basedOn.map((item: string, index: number) => (
                      <Chip 
                        key={index}
                        label={item}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Benefits */}
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Benefits:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {rec.benefits.map((benefit: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckCircle sx={{ fontSize: 14 }} color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<ShoppingCart />}
                  color="primary"
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <Star sx={{ fontSize: 16 }} />
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recommendation Insights */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recommendation Insights
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {Math.round(displayRecommendations.reduce((acc, rec) => acc + rec.confidence, 0) / displayRecommendations.length * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Confidence
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <ShoppingCart color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  ${displayRecommendations.reduce((acc, rec) => acc + rec.price, 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Value
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {Math.max(...displayRecommendations.map(rec => rec.priority))}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Highest Priority
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {displayRecommendations.length === 0 && (
        <Box textAlign="center" py={6}>
          <Recommend sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No recommendations available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Recommendations will be generated based on purchase history
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProductRecommendations; 