import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Insights,
  ColorLens,
  Event,
  TrendingUp,
  Group,
  AttachMoney,
  Schedule,
  Star,
  Warning,
} from '@mui/icons-material';

interface CustomerInsightsPanelProps {
  customerId: string;
  insights: any;
  customerData: any;
}

const CustomerInsightsPanel: React.FC<CustomerInsightsPanelProps> = ({
  customerId,
  insights,
  customerData,
}) => {
  // Mock insights data for demonstration
  const mockInsights = {
    favoriteColors: ['Navy Blue', 'Black', 'Charcoal Grey', 'Royal Blue'],
    favoriteCategories: [
      { name: 'Tuxedo', frequency: 45 },
      { name: 'Suit', frequency: 30 },
      { name: 'Accessories', frequency: 25 },
    ],
    preferredOccasions: [
      { name: 'Wedding', frequency: 60 },
      { name: 'Business', frequency: 25 },
      { name: 'Prom', frequency: 15 },
    ],
    seasonality: {
      spring: 20,
      summer: 15,
      fall: 40,
      winter: 25,
    },
    pricePoint: 'Premium',
    spendingTrend: 'Increasing',
    groupOrderCustomer: true,
    customerJourney: 'Loyal',
    riskScore: 0.12,
    loyaltyScore: 0.88,
  };

  const displayInsights = insights || mockInsights;

  const getColorChip = (color: string, index: number) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
    return colors[index % colors.length];
  };

  const getJourneyColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'champion':
      case 'loyal': return 'success';
      case 'returning': return 'primary';
      case 'new': return 'info';
      case 'at-risk': return 'warning';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing': return <TrendingUp color="success" />;
      case 'stable': return <TrendingUp color="primary" />;
      case 'decreasing': return <TrendingUp color="error" sx={{ transform: 'rotate(180deg)' }} />;
      default: return <TrendingUp />;
    }
  };

  return (
    <Box>
      {/* Customer Journey & Risk Assessment */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Star color="primary" />
                <Typography variant="h6">Customer Journey</Typography>
              </Box>
              
              <Box textAlign="center">
                <Chip 
                  label={displayInsights.customerJourney}
                  color={getJourneyColor(displayInsights.customerJourney) as any}
                  size="large"
                  sx={{ fontSize: '1rem', py: 2 }}
                />
                <Typography variant="body2" color="textSecondary" mt={2}>
                  Current stage in customer lifecycle
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <TrendingUp color="success" />
                <Typography variant="h6">Loyalty Score</Typography>
              </Box>
              
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={displayInsights.loyaltyScore * 100}
                  sx={{ height: 12, borderRadius: 6, mb: 1 }}
                  color="success"
                />
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {Math.round(displayInsights.loyaltyScore * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  High loyalty indicates strong brand affinity
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Warning color="error" />
                <Typography variant="h6">Churn Risk</Typography>
              </Box>
              
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={displayInsights.riskScore * 100}
                  sx={{ height: 12, borderRadius: 6, mb: 1 }}
                  color={displayInsights.riskScore > 0.5 ? 'error' : 'success'}
                />
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  color={displayInsights.riskScore > 0.5 ? 'error.main' : 'success.main'}
                >
                  {Math.round(displayInsights.riskScore * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {displayInsights.riskScore < 0.3 ? 'Low risk - engaged customer' : 
                   displayInsights.riskScore < 0.7 ? 'Medium risk - monitor activity' : 
                   'High risk - needs attention'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase Preferences */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <ColorLens color="primary" />
                <Typography variant="h6">Favorite Colors</Typography>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {displayInsights.favoriteColors.map((color: string, index: number) => (
                  <Chip 
                    key={color}
                    label={color}
                    color={getColorChip(color, index) as any}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Event color="primary" />
                <Typography variant="h6">Preferred Occasions</Typography>
              </Box>
              
              <List dense>
                {displayInsights.preferredOccasions.map((occasion: any, index: number) => (
                  <ListItem key={occasion.name} disablePadding>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: `${getColorChip(occasion.name, index)}.main`,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={occasion.name}
                      secondary={`${occasion.frequency}% of purchases`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Preferences & Spending Patterns */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Category Preferences
              </Typography>
              
              {displayInsights.favoriteCategories.map((category: any) => (
                <Box key={category.name} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{category.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {category.frequency}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={category.frequency}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending & Behavior Patterns
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Price Point Preference"
                    secondary={displayInsights.pricePoint}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {getTrendIcon(displayInsights.spendingTrend)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Spending Trend"
                    secondary={`${displayInsights.spendingTrend} over time`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Group color={displayInsights.groupOrderCustomer ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Group Order Customer"
                    secondary={displayInsights.groupOrderCustomer ? 'Frequently orders for groups' : 'Individual purchaser'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seasonal Preferences */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Schedule color="primary" />
            <Typography variant="h6">Seasonal Purchase Patterns</Typography>
          </Box>
          
          <Grid container spacing={2}>
            {Object.entries(displayInsights.seasonality).map(([season, percentage]) => (
              <Grid item xs={6} md={3} key={season}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {percentage}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                    {season}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage as number}
                    sx={{ mt: 1, height: 4 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerInsightsPanel; 