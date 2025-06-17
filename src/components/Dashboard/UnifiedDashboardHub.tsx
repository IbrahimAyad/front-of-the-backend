import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  People,
  ShoppingCart,
  Event,
  Notifications,
  Add,
  ArrowForward,
  Warning,
  AttachMoney,
  ContentCut,
  Favorite,
  Campaign,
  CalendarToday,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockStats = {
  totalRevenue: 125000,
  revenueGrowth: 12.5,
  totalOrders: 89,
  ordersGrowth: 8.2,
  totalCustomers: 456,
  customersGrowth: 15.3,
  activeAppointments: 23,
  appointmentsGrowth: -2.1,
};

const mockRecentActivities = [
  { id: 1, type: 'order', message: 'New order from James Wilson', time: '5 min ago', priority: 'high' },
  { id: 2, type: 'appointment', message: 'Fitting appointment scheduled', time: '12 min ago', priority: 'medium' },
  { id: 3, type: 'customer', message: 'New customer registration', time: '25 min ago', priority: 'low' },
  { id: 4, type: 'wedding', message: 'Wedding party measurement complete', time: '1 hour ago', priority: 'high' },
  { id: 5, type: 'payment', message: 'Payment received - $2,500', time: '2 hours ago', priority: 'medium' },
];

const mockUrgentTasks = [
  { id: 1, task: 'Follow up with premium client', deadline: 'Today 3:00 PM', type: 'customer' },
  { id: 2, task: 'Complete wedding measurements', deadline: 'Tomorrow 10:00 AM', type: 'wedding' },
  { id: 3, task: 'Process rush order delivery', deadline: 'Today 5:00 PM', type: 'order' },
];

const mockQuickActions = [
  { label: 'New Order', icon: <Add />, path: '/orders', color: 'primary' },
  { label: 'Schedule Appointment', icon: <CalendarToday />, path: '/appointments', color: 'secondary' },
  { label: 'Add Customer', icon: <People />, path: '/customers', color: 'success' },
  { label: 'Wedding Registration', icon: <Favorite />, path: '/weddings', color: 'error' },
];

const UnifiedDashboardHub: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart color="primary" />;
      case 'appointment': return <Event color="secondary" />;
      case 'customer': return <People color="success" />;
      case 'wedding': return <Favorite color="error" />;
      case 'payment': return <AttachMoney color="warning" />;
      default: return <Notifications />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, growth, icon, color }: {
    title: string;
    value: number;
    growth: number;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {typeof value === 'number' && title.includes('Revenue') 
                ? `$${value.toLocaleString()}` 
                : value.toLocaleString()}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp 
                sx={{ 
                  fontSize: 16, 
                  mr: 0.5, 
                  color: growth >= 0 ? 'success.main' : 'error.main' 
                }} 
              />
              <Typography 
                variant="body2" 
                color={growth >= 0 ? 'success.main' : 'error.main'}
                fontWeight="medium"
              >
                {growth >= 0 ? '+' : ''}{growth}%
              </Typography>
            </Box>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard Hub
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back! Here's what's happening at KCT Menswear today.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/orders/new')}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={mockStats.totalRevenue}
            growth={mockStats.revenueGrowth}
            icon={<AttachMoney />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Orders"
            value={mockStats.totalOrders}
            growth={mockStats.ordersGrowth}
            icon={<ShoppingCart />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={mockStats.totalCustomers}
            growth={mockStats.customersGrowth}
            icon={<People />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Appointments"
            value={mockStats.activeAppointments}
            growth={mockStats.appointmentsGrowth}
            icon={<Event />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {mockQuickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={action.icon}
                  onClick={() => navigate(action.path)}
                  sx={{
                    py: 2,
                    borderColor: theme.palette[action.color as keyof typeof theme.palette].main,
                    color: theme.palette[action.color as keyof typeof theme.palette].main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette[action.color as keyof typeof theme.palette].main, 0.1),
                      borderColor: theme.palette[action.color as keyof typeof theme.palette].main,
                    },
                  }}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Activities
                </Typography>
                <Badge badgeContent={mockRecentActivities.length} color="primary">
                  <Notifications />
                </Badge>
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {mockRecentActivities.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.time}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        size="small"
                        label={activity.priority}
                        color={getPriorityColor(activity.priority) as any}
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Urgent Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Urgent Tasks
              </Typography>
              <List>
                {mockUrgentTasks.map((task) => (
                  <ListItem key={task.id} divider>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.task}
                      secondary={`Deadline: ${task.deadline}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" size="small">
                        <ArrowForward />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Box mt={2}>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate('/tasks')}
                >
                  View All Tasks
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Cards */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => navigate('/tailoring')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <ContentCut />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Tailoring Journey
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Manage customer lifecycle from consultation to delivery
              </Typography>
              <Button size="small" endIcon={<ArrowForward />}>
                Open Tailoring
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => navigate('/weddings')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Favorite />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Wedding Services
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Premium wedding coordination and party management
              </Typography>
              <Button size="small" endIcon={<ArrowForward />}>
                Open Weddings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => navigate('/marketing')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Campaign />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Marketing Hub
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                AI-powered content generation and lead acquisition
              </Typography>
              <Button size="small" endIcon={<ArrowForward />}>
                Open Marketing
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnifiedDashboardHub; 