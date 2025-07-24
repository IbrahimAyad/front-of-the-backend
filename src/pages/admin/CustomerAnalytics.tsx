import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  ButtonGroup,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  ShoppingBag,
  Star,
  WorkspacePremium,
  Analytics as AnalyticsIcon,
  CalendarMonth,
  Refresh,
  Download,
  FilterList,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../services/api';

// Color palette
const COLORS = {
  platinum: '#E5E4E2',
  gold: '#FFD700',
  silver: '#C0C0C0',
  prospect: '#CD7F32',
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
};

interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface CustomerSegment {
  name: string;
  count: number;
  avgOrderValue: number;
  totalRevenue: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  customers: number;
  revenue: number;
  orders: number;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  tier: string;
  lastPurchase: string;
}

const CustomerAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [sizeDistribution, setSizeDistribution] = useState<any[]>([]);
  const [occasionData, setOccasionData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        metricsRes,
        segmentsRes,
        timeSeriesRes,
        topCustomersRes,
        sizesRes,
        occasionsRes,
      ] = await Promise.all([
        api.get('/api/analytics/customer-metrics'),
        api.get('/api/analytics/customer-segments'),
        api.get(`/api/analytics/time-series?range=${timeRange}`),
        api.get('/api/analytics/top-customers?limit=10'),
        api.get('/api/analytics/size-distribution'),
        api.get('/api/analytics/occasion-distribution'),
      ]);

      // Process metrics
      const metricsData = metricsRes.data.data;
      setMetrics([
        {
          label: 'Total Customers',
          value: metricsData.totalCustomers.toLocaleString(),
          change: metricsData.customerGrowth,
          changeLabel: 'vs last period',
          icon: <People />,
          color: COLORS.primary,
        },
        {
          label: 'Total Revenue',
          value: `$${metricsData.totalRevenue.toLocaleString()}`,
          change: metricsData.revenueGrowth,
          changeLabel: 'vs last period',
          icon: <AttachMoney />,
          color: COLORS.success,
        },
        {
          label: 'Average Order Value',
          value: `$${metricsData.avgOrderValue.toFixed(2)}`,
          change: metricsData.aovGrowth,
          changeLabel: 'vs last period',
          icon: <ShoppingBag />,
          color: COLORS.warning,
        },
        {
          label: 'VIP Customers',
          value: metricsData.vipCustomers,
          change: metricsData.vipGrowth,
          changeLabel: 'new VIPs',
          icon: <Star />,
          color: COLORS.gold,
        },
      ]);

      // Process segments
      const segmentData = segmentsRes.data.data.map((seg: any) => ({
        name: seg.name,
        count: seg.customerCount,
        avgOrderValue: seg.avgOrderValue,
        totalRevenue: seg.totalRevenue,
        color: seg.name.includes('Platinum') ? COLORS.platinum :
               seg.name.includes('Gold') ? COLORS.gold :
               seg.name.includes('Silver') ? COLORS.silver :
               seg.name.includes('VIP') ? COLORS.gold :
               COLORS.primary,
      }));
      setSegments(segmentData);

      // Process time series
      setTimeSeriesData(timeSeriesRes.data.data);

      // Process top customers
      setTopCustomers(topCustomersRes.data.data);

      // Process size distribution
      setSizeDistribution(sizesRes.data.data);

      // Process occasion data
      setOccasionData(occasionsRes.data.data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Use mock data for development
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    // Mock metrics
    setMetrics([
      {
        label: 'Total Customers',
        value: '3,369',
        change: 12.5,
        changeLabel: 'vs last period',
        icon: <People />,
        color: COLORS.primary,
      },
      {
        label: 'Total Revenue',
        value: '$1,247,890',
        change: 8.3,
        changeLabel: 'vs last period',
        icon: <AttachMoney />,
        color: COLORS.success,
      },
      {
        label: 'Average Order Value',
        value: '$1,850',
        change: -2.1,
        changeLabel: 'vs last period',
        icon: <ShoppingBag />,
        color: COLORS.warning,
      },
      {
        label: 'VIP Customers',
        value: 148,
        change: 15,
        changeLabel: 'new VIPs',
        icon: <Star />,
        color: COLORS.gold,
      },
    ]);

    // Mock segments
    setSegments([
      { name: 'Platinum Tier', count: 32, avgOrderValue: 5200, totalRevenue: 166400, color: COLORS.platinum },
      { name: 'Gold Tier', count: 245, avgOrderValue: 2800, totalRevenue: 686000, color: COLORS.gold },
      { name: 'Silver Tier', count: 717, avgOrderValue: 1500, totalRevenue: 1075500, color: COLORS.silver },
      { name: 'Prospects', count: 2375, avgOrderValue: 450, totalRevenue: 1068750, color: COLORS.prospect },
    ]);

    // Mock time series data
    const mockTimeSeries = [];
    for (let i = 29; i >= 0; i--) {
      mockTimeSeries.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        customers: Math.floor(3000 + Math.random() * 400),
        revenue: Math.floor(30000 + Math.random() * 20000),
        orders: Math.floor(15 + Math.random() * 10),
      });
    }
    setTimeSeriesData(mockTimeSeries);

    // Mock top customers
    setTopCustomers([
      { id: '1', name: 'James Wilson', email: 'james.wilson@email.com', totalSpent: 18500, totalOrders: 12, tier: 'Platinum', lastPurchase: '2024-01-15' },
      { id: '2', name: 'Michael Chen', email: 'michael.chen@email.com', totalSpent: 15200, totalOrders: 8, tier: 'Platinum', lastPurchase: '2024-01-20' },
      { id: '3', name: 'Robert Johnson', email: 'robert.j@email.com', totalSpent: 12800, totalOrders: 10, tier: 'Gold', lastPurchase: '2024-01-18' },
      { id: '4', name: 'David Smith', email: 'david.smith@email.com', totalSpent: 11500, totalOrders: 7, tier: 'Gold', lastPurchase: '2024-01-22' },
      { id: '5', name: 'William Brown', email: 'w.brown@email.com', totalSpent: 9800, totalOrders: 6, tier: 'Gold', lastPurchase: '2024-01-19' },
    ]);

    // Mock size distribution
    setSizeDistribution([
      { size: '38R', count: 245 },
      { size: '40R', count: 512 },
      { size: '42R', count: 789 },
      { size: '44R', count: 623 },
      { size: '46R', count: 412 },
      { size: '48R', count: 298 },
    ]);

    // Mock occasion data
    setOccasionData([
      { name: 'Wedding', value: 1097, percentage: 32.6 },
      { name: 'Business', value: 892, percentage: 26.5 },
      { name: 'Formal', value: 623, percentage: 18.5 },
      { name: 'Casual', value: 512, percentage: 15.2 },
      { name: 'Other', value: 245, percentage: 7.2 },
    ]);
  };

  const renderMetricCard = (metric: DashboardMetric) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: metric.color, mr: 2 }}>
            {metric.icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {metric.label}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {metric.value}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {metric.change > 0 ? (
            <TrendingUp sx={{ color: COLORS.success, mr: 1 }} />
          ) : (
            <TrendingDown sx={{ color: COLORS.error, mr: 1 }} />
          )}
          <Typography
            variant="body2"
            sx={{ color: metric.change > 0 ? COLORS.success : COLORS.error }}
          >
            {Math.abs(metric.change)}% {metric.changeLabel}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Customer Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights into your customer base
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchAnalyticsData}>
            <Refresh />
          </IconButton>
          <Button startIcon={<Download />} variant="outlined">
            Export
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            {renderMetricCard(metric)}
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Customer Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Growth & Revenue
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="customers"
                      stroke={COLORS.primary}
                      name="Customers"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke={COLORS.success}
                      name="Revenue ($)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Segments Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Tiers
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Size Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Size Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sizeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="size" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Shopping Occasions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shopping Occasions
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occasionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.warning}>
                      {occasionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Customers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Customers
          </Typography>
          <List>
            {topCustomers.map((customer, index) => (
              <ListItem
                key={customer.id}
                divider={index < topCustomers.length - 1}
                sx={{ px: 0 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: COLORS[customer.tier.toLowerCase()] || COLORS.primary }}>
                    {customer.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={customer.name}
                  secondary={customer.email}
                />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight="bold">
                    ${customer.totalSpent.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.totalOrders} orders
                  </Typography>
                </Box>
                <Chip
                  label={customer.tier}
                  size="small"
                  sx={{
                    ml: 2,
                    bgcolor: COLORS[customer.tier.toLowerCase()] || COLORS.primary,
                    color: customer.tier === 'Silver' ? 'black' : 'white',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerAnalytics;