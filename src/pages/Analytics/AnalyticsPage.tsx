import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  People,
  ShoppingCart,
  TrendingUp,
  AttachMoney,
} from '@mui/icons-material';

// Import enhanced components
import SalesChart from '../../components/Dashboard/SalesChart';
import LeadFunnelChart from '../../components/Dashboard/LeadFunnelChart';
import CustomerGrowthChart from '../../components/Dashboard/CustomerGrowthChart';
import OrderStatusChart from '../../components/Dashboard/OrderStatusChart';
import InventoryAlerts from '../../components/Notifications/InventoryAlerts';
import CustomerIntelligence from '../../components/Customers/CustomerIntelligence';
import PredictiveAnalyticsDashboard from '../../components/Analytics/PredictiveAnalyticsDashboard';
import WorkflowAutomationDashboard from '../../components/Automation/WorkflowAutomationDashboard';
import { dashboardAPI } from '../../services/api';
import { frontendConfig } from '../../utils/config';
import { DashboardStats } from '../../types';

// Type for stats
interface AnalyticsStats {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalLeads: number;
}

// Mock data for development
const mockStats: DashboardStats = {
  totalCustomers: 180,
  totalOrders: 420,
  totalLeads: 60,
  pendingAppointments: 12,
  recentOrders: [],
};

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (frontendConfig.USE_MOCK_DATA) {
      setStats(mockStats);
      setLoading(false);
    } else {
      dashboardAPI.getStats()
        .then((res) => {
          setStats(res.data as DashboardStats);
          setLoading(false);
        })
        .catch((err) => {
          setError(err?.message || 'Failed to load analytics data');
          setLoading(false);
        });
    }
  }, []);

  if (loading) {
    return <Box p={4}><Typography>Loading analytics...</Typography></Box>;
  }
  if (error) {
    return <Box p={4}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        p: 3,
      }}
    >
      {/* Header */}
      <Box mb={4}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Analytics & Reports
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced Business Intelligence & Real-Time Analytics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalOrders ?? 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +8% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Customers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalCustomers ?? 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <People sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Leads
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats?.totalLeads ?? 0}
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
    </Box>
  );
};

export default AnalyticsPage; 