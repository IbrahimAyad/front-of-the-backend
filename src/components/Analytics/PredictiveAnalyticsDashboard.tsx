import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Inventory,
  AttachMoney,
  Timeline,
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

// Mock data for demonstration
const seasonalDemandData = [
  { month: 'Jan', sales: 22 },
  { month: 'Feb', sales: 28 },
  { month: 'Mar', sales: 35 },
  { month: 'Apr', sales: 40 },
  { month: 'May', sales: 55 },
  { month: 'Jun', sales: 70 },
  { month: 'Jul', sales: 90 },
  { month: 'Aug', sales: 85 },
  { month: 'Sep', sales: 60 },
  { month: 'Oct', sales: 45 },
  { month: 'Nov', sales: 30 },
  { month: 'Dec', sales: 25 },
];

const churnData = {
  churnRate: 7.2,
  atRiskCustomers: [
    { name: 'John Doe', email: 'john.doe@example.com', risk: 0.82 },
    { name: 'Michael Smith', email: 'michael.smith@example.com', risk: 0.76 },
    { name: 'Sarah Johnson', email: 'sarah.johnson@example.com', risk: 0.69 },
  ],
};

const inventoryForecast = [
  { name: 'Premium Wool Fabric', current: 3, optimal: 20, predictedStockout: '6 days' },
  { name: 'Silk Lining', current: 2, optimal: 15, predictedStockout: '3 days' },
  { name: 'Mother of Pearl Buttons', current: 15, optimal: 40, predictedStockout: '18 days' },
  { name: 'Thread Navy Blue', current: 1, optimal: 10, predictedStockout: '2 days' },
];

const revenueProjection = [
  { month: 'Jul', revenue: 12000 },
  { month: 'Aug', revenue: 13500 },
  { month: 'Sep', revenue: 14200 },
  { month: 'Oct', revenue: 15500 },
  { month: 'Nov', revenue: 17000 },
  { month: 'Dec', revenue: 21000 },
];

const PredictiveAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Simulate loading state
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        <Timeline sx={{ verticalAlign: 'middle', mr: 1, color: theme.palette.primary.main }} /> Predictive Analytics
      </Typography>
      <Grid container spacing={3}>
        {/* Seasonal Demand Forecasting */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Seasonal Demand Forecasting</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Predicted sales volume by month (next 12 months)
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={seasonalDemandData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="sales" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        {/* Customer Churn Prediction */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Customer Churn Prediction</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Estimated churn rate and at-risk customers
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip
                  label={`Churn Risk: ${churnData.churnRate}%`}
                  color={churnData.churnRate > 10 ? 'error' : 'warning'}
                  icon={<Warning />}
                  sx={{ fontWeight: 700, mr: 2 }}
                />
                <LinearProgress
                  variant="determinate"
                  value={churnData.churnRate}
                  sx={{ width: 120, height: 10, borderRadius: 5, background: theme.palette.grey[300] }}
                  color={churnData.churnRate > 10 ? 'error' : 'warning'}
                />
              </Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                At-Risk Customers
              </Typography>
              <Box>
                {churnData.atRiskCustomers.map((c) => (
                  <Box key={c.email} display="flex" alignItems="center" mb={0.5}>
                    <Avatar sx={{ width: 28, height: 28, mr: 1 }}>{c.name[0]}</Avatar>
                    <Typography variant="body2" component="span" sx={{ flex: 1 }}>{c.name}</Typography>
                    <Chip
                      label={`Risk ${(c.risk * 100).toFixed(0)}%`}
                      color={c.risk > 0.8 ? 'error' : c.risk > 0.6 ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Inventory Optimization */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Inventory color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Inventory Optimization</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Predicted stockouts and optimal reorder levels
              </Typography>
              <Box>
                {inventoryForecast.map((item) => (
                  <Box key={item.name} display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" component="span" sx={{ flex: 1 }}>{item.name}</Typography>
                    <Chip
                      label={`Current: ${item.current}`}
                      color={item.current < 3 ? 'error' : 'warning'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Optimal: ${item.optimal}`}
                      color="success"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Stockout: ${item.predictedStockout}`}
                      color={item.current < 3 ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Revenue Projection */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Revenue Projection</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Projected revenue for the next 6 months
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueProjection} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <RechartsTooltip />
                  <Bar dataKey="revenue" fill={theme.palette.success.main} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictiveAnalyticsDashboard; 