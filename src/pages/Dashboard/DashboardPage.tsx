import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dashboardAPI, analyticsAPI } from '../../services/api';
import { CLIENT_CONFIG } from '../../config/client';

// Types for mock data (for UI only)
type DashboardStats = {
  totalCustomers: number;
  totalLeads: number;
  pendingAppointments: number;
};
type SalesAnalytics = {
  totalSales: number;
  totalOrders: number;
};
type LeadsAnalytics = {
  leadsByStatus: Array<{ status: string; _count: number }>;
};
// Mock data for development
const mockStats: DashboardStats = {
  totalCustomers: 180,
  totalLeads: 60,
  pendingAppointments: 12,
};
const mockSalesAnalytics: SalesAnalytics = { totalSales: 125000, totalOrders: 420 };
const mockLeadsAnalytics: LeadsAnalytics = {
  leadsByStatus: [
    { status: 'converted', _count: 20 },
    { status: 'hot', _count: 10 },
    { status: 'warm', _count: 15 },
    { status: 'qualified', _count: 5 },
    { status: 'lost', _count: 2 },
  ],
};

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState('30d');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
  });

  // Fetch recent activities
  const { data: activitiesData } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: dashboardAPI.getRecentActivities,
  });

  // Fetch sales analytics
  const { data: salesData } = useQuery({
    queryKey: ['sales-analytics', period],
    queryFn: () => analyticsAPI.getSalesAnalytics({ period }),
  });

  // Fetch lead analytics
  const { data: leadsData } = useQuery({
    queryKey: ['leads-analytics', period],
    queryFn: () => analyticsAPI.getLeadAnalytics({ period }),
  });

  // Feature flag logic for mock/real data
  const stats = CLIENT_CONFIG.USE_MOCK_DATA ? mockStats : statsData?.data;
  const salesAnalytics = CLIENT_CONFIG.USE_MOCK_DATA ? mockSalesAnalytics : salesData?.data;
  const leadsAnalytics = CLIENT_CONFIG.USE_MOCK_DATA ? mockLeadsAnalytics : leadsData?.data;

  // Calculate metrics
  const totalRevenue = salesAnalytics?.totalSales || 0;
  const totalOrders = salesAnalytics?.totalOrders || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Lead conversion rate
  const totalLeads = leadsAnalytics?.leadsByStatus?.reduce((sum: number, item: any) => sum + item._count, 0) || 0;
  const convertedLeads = leadsAnalytics?.leadsByStatus?.find((item: any) => item.status === 'converted')?._count || 0;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Get status color for orders
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'new': return 'primary';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  // Get lead status color
  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'success';
      case 'hot': return 'error';
      case 'warm': return 'warning';
      case 'qualified': return 'primary';
      case 'lost': return 'error';
      default: return 'primary';
    }
  };

  if (statsLoading) {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Business performance overview and key metrics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">
                      +12.5% vs last period
                    </Typography>
                  </Box>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {totalOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">
                      +8.2% vs last period
                    </Typography>
                  </Box>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats?.totalCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">
                      +15.3% vs last period
                    </Typography>
                  </Box>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {conversionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lead Conversion
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">
                      +3.1% vs last period
                    </Typography>
                  </Box>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                ${avgOrderValue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Order Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                {stats?.totalLeads || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Leads
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                {stats?.pendingAppointments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                4.8/5.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Satisfaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales by Status Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orders by Status
              </Typography>
              {salesAnalytics?.salesByStatus?.map((item: any, index: number) => (
                <Box key={index} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {item.status.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item._count} orders
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(item._count / totalOrders) * 100}
                    color={getOrderStatusColor(item.status)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Sources */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Sources
              </Typography>
              {leadsAnalytics?.leadsBySource && Object.entries(leadsAnalytics.leadsBySource).map(([source, count], index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {source.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {count} leads
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(Number(count) / totalLeads) * 100}
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activitiesData?.recentOrders?.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 1, width: 24, height: 24, fontSize: 12 }}>
                              {order.customer?.name?.charAt(0) || 'C'}
                            </Avatar>
                            <Typography variant="body2">
                              {order.customer?.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            ${Number(order.total).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={getOrderStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {format(new Date(order.createdAt), 'MMM dd')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Pipeline Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Pipeline Status
              </Typography>
              <List dense>
                {leadsAnalytics?.leadsByStatus?.map((item: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getLeadStatusColor(item.status)}.main`, width: 32, height: 32 }}>
                          <StarIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {item.status}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item._count}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <LinearProgress
                            variant="determinate"
                            value={(item._count / totalLeads) * 100}
                            color={getLeadStatusColor(item.status)}
                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                          />
                        }
                      />
                    </ListItem>
                    {index < (leadsAnalytics?.leadsByStatus?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Notifications */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Priorities & Notifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {stats?.pendingAppointments || 0} appointments scheduled for today
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      3 follow-ups due this week
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      2 orders completed today
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 