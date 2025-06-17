import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Warning,
  Insights,
  FilterList,
  Refresh,
  Download,
  Visibility,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  averageValue: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface CustomerInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  customersAffected: number;
  potentialValue?: number;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lifetimeValue: number;
  recentActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextAction: string;
}

const CustomerIntelligence: React.FC = () => {
  const { theme } = useCustomTheme();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');

  // Mock data - in real app, this would come from API
  const customerSegments: CustomerSegment[] = [
    {
      id: 'vip',
      name: 'VIP Customers',
      count: 45,
      percentage: 12,
      averageValue: 8500,
      color: '#FFD700',
      trend: 'up',
      trendValue: 8.5,
    },
    {
      id: 'loyal',
      name: 'Loyal Customers',
      count: 128,
      percentage: 34,
      averageValue: 3200,
      color: '#4CAF50',
      trend: 'up',
      trendValue: 5.2,
    },
    {
      id: 'regular',
      name: 'Regular Customers',
      count: 156,
      percentage: 42,
      averageValue: 1800,
      color: '#2196F3',
      trend: 'stable',
      trendValue: 0.8,
    },
    {
      id: 'at-risk',
      name: 'At-Risk Customers',
      count: 45,
      percentage: 12,
      averageValue: 950,
      color: '#FF5722',
      trend: 'down',
      trendValue: -12.3,
    },
  ];

  const customerInsights: CustomerInsight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Upselling Opportunity',
      description: '23 customers showing interest in premium fabrics but haven\'t upgraded',
      impact: 'high',
      actionable: true,
      customersAffected: 23,
      potentialValue: 45000,
    },
    {
      id: '2',
      type: 'risk',
      title: 'Churn Risk Alert',
      description: '12 high-value customers haven\'t placed orders in 90+ days',
      impact: 'high',
      actionable: true,
      customersAffected: 12,
      potentialValue: 28000,
    },
    {
      id: '3',
      type: 'trend',
      title: 'Seasonal Pattern',
      description: 'Wedding season approaching - 35% increase in consultation requests',
      impact: 'medium',
      actionable: true,
      customersAffected: 67,
    },
    {
      id: '4',
      type: 'recommendation',
      title: 'Loyalty Program',
      description: 'Consider introducing referral rewards for platinum customers',
      impact: 'medium',
      actionable: true,
      customersAffected: 45,
      potentialValue: 15000,
    },
  ];

  const topCustomers: TopCustomer[] = [
    {
      id: '1',
      name: 'James Wilson',
      email: 'james.wilson@example.com',
      lifetimeValue: 15400,
      recentActivity: '2 days ago',
      riskLevel: 'low',
      loyaltyTier: 'platinum',
      nextAction: 'Schedule fitting',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      lifetimeValue: 12800,
      recentActivity: '1 week ago',
      riskLevel: 'low',
      loyaltyTier: 'gold',
      nextAction: 'Follow up on order',
    },
    {
      id: '3',
      name: 'Robert Davis',
      email: 'robert.davis@example.com',
      lifetimeValue: 9600,
      recentActivity: '3 weeks ago',
      riskLevel: 'medium',
      loyaltyTier: 'gold',
      nextAction: 'Re-engagement call',
    },
    {
      id: '4',
      name: 'David Thompson',
      email: 'david.thompson@example.com',
      lifetimeValue: 8200,
      recentActivity: '5 days ago',
      riskLevel: 'low',
      loyaltyTier: 'silver',
      nextAction: 'Upsell consultation',
    },
  ];

  const valueDistributionData = [
    { range: '$0-1K', customers: 89, value: 45000 },
    { range: '$1K-3K', customers: 156, value: 312000 },
    { range: '$3K-5K', customers: 78, value: 312000 },
    { range: '$5K-10K', customers: 45, value: 337500 },
    { range: '$10K+', customers: 23, value: 345000 },
  ];

  const engagementTrendData = [
    { month: 'Jan', active: 245, new: 23, churned: 8 },
    { month: 'Feb', active: 267, new: 31, churned: 9 },
    { month: 'Mar', active: 289, new: 28, churned: 6 },
    { month: 'Apr', active: 311, new: 35, churned: 13 },
    { month: 'May', active: 333, new: 42, churned: 20 },
    { month: 'Jun', active: 355, new: 38, churned: 16 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp color="success" />;
      case 'risk': return <Warning color="error" />;
      case 'trend': return <Insights color="info" />;
      case 'recommendation': return <Star color="warning" />;
      default: return <Insights />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return theme.palette.grey[500];
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'high': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Customer Intelligence
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Advanced customer analytics and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterList />}>
            Filters
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <IconButton>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Segments */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Segments
              </Typography>
              <Grid container spacing={2}>
                {customerSegments.map((segment) => (
                  <Grid item xs={12} sm={6} md={3} key={segment.id}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        border: selectedSegment === segment.id ? `2px solid ${segment.color}` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => setSelectedSegment(segment.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: segment.color,
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {segment.name}
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {segment.count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {segment.percentage}% of total
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        Avg: {formatCurrency(segment.averageValue)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        {segment.trend === 'up' ? (
                          <TrendingUp color="success" fontSize="small" />
                        ) : segment.trend === 'down' ? (
                          <TrendingDown color="error" fontSize="small" />
                        ) : null}
                        <Typography
                          variant="caption"
                          color={
                            segment.trend === 'up' ? 'success.main' :
                            segment.trend === 'down' ? 'error.main' : 'text.secondary'
                          }
                          sx={{ ml: 0.5 }}
                        >
                          {segment.trend === 'stable' ? 'Stable' : `${Math.abs(segment.trendValue)}%`}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Value Distribution */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Value Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valueDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value, name) => [
                      name === 'customers' ? `${value} customers` : formatCurrency(Number(value)),
                      name === 'customers' ? 'Customers' : 'Total Value'
                    ]}
                  />
                  <Bar dataKey="customers" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Trends */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Engagement Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={engagementTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stackId="1"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stackId="2"
                    stroke={theme.palette.success.main}
                    fill={theme.palette.success.main}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="churned"
                    stackId="3"
                    stroke={theme.palette.error.main}
                    fill={theme.palette.error.main}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Key Insights */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Key Insights
              </Typography>
              <List>
                {customerInsights.map((insight, index) => (
                  <React.Fragment key={insight.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getInsightIcon(insight.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium" component="span">
                              {insight.title}
                            </Typography>
                            <Chip
                              label={insight.impact}
                              size="small"
                              color={
                                insight.impact === 'high' ? 'error' :
                                insight.impact === 'medium' ? 'warning' : 'default'
                              }
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <span>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }} component="span">
                              {insight.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {insight.customersAffected} customers affected
                              {insight.potentialValue && ` • ${formatCurrency(insight.potentialValue)} potential`}
                            </Typography>
                          </span>
                        }
                      />
                      {insight.actionable && (
                        <Button size="small" variant="outlined">
                          Act
                        </Button>
                      )}
                    </ListItem>
                    {index < customerInsights.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Customers
              </Typography>
              <List>
                {topCustomers.map((customer, index) => (
                  <React.Fragment key={customer.id}>
                    <ListItem sx={{ px: 0 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: getRiskColor(customer.riskLevel),
                              border: `2px solid ${theme.palette.background.paper}`,
                            }}
                          />
                        }
                      >
                        <Avatar
                          src={customer.avatar}
                          sx={{
                            backgroundColor: getTierColor(customer.loyaltyTier),
                            color: theme.palette.text.primary,
                            mr: 2,
                          }}
                        >
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Badge>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium" component="span">
                              {customer.name}
                            </Typography>
                            <Chip
                              label={customer.loyaltyTier}
                              size="small"
                              sx={{
                                backgroundColor: getTierColor(customer.loyaltyTier),
                                color: theme.palette.text.primary,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <span>
                            <Typography variant="body2" color="primary" fontWeight="medium" sx={{ display: 'block' }} component="span">
                              {formatCurrency(customer.lifetimeValue)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {customer.recentActivity} • {customer.nextAction}
                            </Typography>
                          </span>
                        }
                      />
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </ListItem>
                    {index < topCustomers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Customers
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerIntelligence;