import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  useTheme,
  Paper,
  Divider
} from '@mui/material';
import { 
  People, 
  ShoppingCart, 
  TrendingUp, 
  Event,
  Star,
  Person,
  AttachMoney
} from '@mui/icons-material';
import { format } from 'date-fns';
import { dashboardAPI } from '../../services/api';

// Import new chart components
import SalesChart from '../../components/Dashboard/SalesChart';
import LeadFunnelChart from '../../components/Dashboard/LeadFunnelChart';
import CustomerGrowthChart from '../../components/Dashboard/CustomerGrowthChart';
import OrderStatusChart from '../../components/Dashboard/OrderStatusChart';
import InventoryAlerts from '../../components/Notifications/InventoryAlerts';
import CustomerProfileCard from '../../components/Customers/CustomerProfileCard';
import CustomerIntelligence from '../../components/Customers/CustomerIntelligence';
import PredictiveAnalyticsDashboard from '../../components/Analytics/PredictiveAnalyticsDashboard';
import WorkflowAutomationDashboard from '../../components/Automation/WorkflowAutomationDashboard';

const EnhancedDashboardPage: React.FC = () => {
  const theme = useTheme();

  // State for real data
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      dashboardAPI.getStats(),
      dashboardAPI.getRecentActivities(),
    ])
      .then(([statsRes, recentRes]) => {
        if (!mounted) return;
        setStats(statsRes.data);
        setRecentOrders(recentRes.data.recentOrders);
        setRecentLeads(recentRes.data.recentLeads);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load dashboard data');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

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

  const handleEditCustomer = (customer: any) => {
    console.log('Edit customer:', customer);
    // In real app, this would open an edit dialog or navigate to edit page
  };

  const handleToggleFavorite = (customerId: string) => {
    console.log('Toggle favorite for customer:', customerId);
    // In real app, this would update the customer's favorite status
  };

  const handleScheduleAppointment = (customerId: string) => {
    console.log('Schedule appointment for customer:', customerId);
    // In real app, this would open appointment scheduling dialog
  };

  if (loading) {
    return <Box p={4}><Typography>Loading dashboard...</Typography></Box>;
  }
  if (error) {
    return <Box p={4}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Enhanced Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Modern analytics and insights for KCT Menswear
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${stats?.revenue?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +15.3% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <AttachMoney sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Customers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                  <People sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +8% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Leads
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalLeads}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    +5% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <SalesChart />
        </Grid>
        <Grid item xs={12} lg={4}>
          <OrderStatusChart />
        </Grid>
        <Grid item xs={12} lg={6}>
          <LeadFunnelChart />
        </Grid>
        <Grid item xs={12} lg={6}>
          <CustomerGrowthChart />
        </Grid>
      </Grid>

      {/* Inventory Alerts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <InventoryAlerts />
        </Grid>
      </Grid>

      {/* Customer Intelligence Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 0 }}>
              <CustomerIntelligence />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Predictive Analytics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 0 }}>
              <PredictiveAnalyticsDashboard />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Automation Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <WorkflowAutomationDashboard />
        </Grid>
      </Grid>

      {/* Top Customer Profiles Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Top Customer Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Advanced customer insights and interaction history
          </Typography>
        </Grid>
        {stats?.customers.map((customer: any) => (
          <Grid item xs={12} md={6} key={customer.id}>
            <CustomerProfileCard
              customer={customer}
              interactions={recentOrders}
              onEdit={handleEditCustomer}
              onToggleFavorite={handleToggleFavorite}
              onScheduleAppointment={handleScheduleAppointment}
            />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                Recent Orders
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ p: 0 }}>
                {recentOrders.map((order, index) => (
                  <ListItem 
                    key={order.id} 
                    sx={{ 
                      px: 0, 
                      borderBottom: index < recentOrders.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getOrderStatusColor(order.status)}.main`, width: 40, height: 40 }}>
                        <ShoppingCart sx={{ fontSize: 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight="medium">
                            {order.id}
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            ${order.total}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                          <Box>
                            <Typography variant="body2" color="text.primary">
                              {order.customer}
                            </Typography>
                            <Chip 
                              label={order.status.replace('_', ' ')} 
                              size="small" 
                              color={getOrderStatusColor(order.status) as any}
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {format(order.createdAt, 'MMM dd')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                Recent Leads
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ p: 0 }}>
                {recentLeads.map((lead, index) => (
                  <ListItem 
                    key={lead.id} 
                    sx={{ 
                      px: 0,
                      borderBottom: index < recentLeads.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getLeadStatusColor(lead.status)}.main`, width: 40, height: 40 }}>
                        <Star sx={{ fontSize: 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight="medium">
                            {lead.customer.name}
                          </Typography>
                          <Chip 
                            label={lead.source.replace('_', ' ')} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                          <Chip 
                            label={lead.status} 
                            size="small" 
                            color={getLeadStatusColor(lead.status) as any}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {format(lead.createdAt, 'MMM dd')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center', 
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50] 
          }}>
            <Typography variant="h6" gutterBottom>
              🎉 Advanced Customer Profiles Feature
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive customer intelligence with predictive insights, interaction history, and advanced analytics
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboardPage; 