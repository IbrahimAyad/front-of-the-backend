import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  ShoppingCart as OrderIcon,
  Assessment as ReportIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const AdminDashboardOverview: React.FC = () => {
  const productStats = {
    totalProducts: 146,
    activeProducts: 142,
    lowStock: 8,
    outOfStock: 3,
    totalValue: 89540,
    categories: 12,
  };

  const recentActivities = [
    {
      id: 1,
      action: 'Product Added',
      product: 'Classic Navy Wedding Suit',
      time: '2 hours ago',
      type: 'success',
    },
    {
      id: 2,
      action: 'Stock Alert',
      product: 'Burgundy Bow Tie',
      time: '3 hours ago',
      type: 'warning',
    },
    {
      id: 3,
      action: 'Category Updated',
      product: 'Accessories',
      time: '5 hours ago',
      type: 'info',
    },
    {
      id: 4,
      action: 'Product Updated',
      product: 'Silver Cufflinks',
      time: '1 day ago',
      type: 'info',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Add a new product to the catalog',
      icon: <AddIcon />,
      color: 'primary',
      action: '/admin/products',
    },
    {
      title: 'Manage Categories',
      description: 'Organize product categories',
      icon: <CategoryIcon />,
      color: 'secondary',
      action: '/admin/categories',
    },
    {
      title: 'Stock Alerts',
      description: 'Check low stock items',
      icon: <WarningIcon />,
      color: 'warning',
      action: '/admin/stock-alerts',
    },
    {
      title: 'Build Outfit',
      description: 'Create new outfit combinations',
      icon: <BuildIcon />,
      color: 'success',
      action: '/admin/outfit-builder',
    },
  ];

  const topCategories = [
    { name: 'Suits', products: 45, percentage: 31 },
    { name: 'Ties', products: 38, percentage: 26 },
    { name: 'Shirts', products: 32, percentage: 22 },
    { name: 'Accessories', products: 31, percentage: 21 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Product Management Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your product catalog and inventory
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main" gutterBottom>
                {productStats.totalProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
              <Typography variant="caption" color="success.main">
                {productStats.activeProducts} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" gutterBottom>
                {productStats.lowStock}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock Items
              </Typography>
              <Typography variant="caption" color="error.main">
                {productStats.outOfStock} out of stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" gutterBottom>
                ${productStats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inventory Value
              </Typography>
              <Typography variant="caption" color="success.main">
                +12% this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CategoryIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" gutterBottom>
                {productStats.categories}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
              <Typography variant="caption" color="info.main">
                Well organized
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReportIcon />
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          bgcolor: `${action.color}.main`,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Typography variant="subtitle2" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              Recent Activity
            </Typography>
            <List dense>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: activity.type === 'success' ? 'success.main' : 
                              activity.type === 'warning' ? 'warning.main' : 'info.main'
                    }}>
                      {activity.type === 'success' ? <AddIcon fontSize="small" /> :
                       activity.type === 'warning' ? <WarningIcon fontSize="small" /> :
                       <CategoryIcon fontSize="small" />}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {activity.product}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
              View All Activity
            </Button>
          </Paper>
        </Grid>

        {/* Top Categories */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon />
              Top Product Categories
            </Typography>
            <Grid container spacing={3}>
              {topCategories.map((category) => (
                <Grid item xs={12} sm={6} md={3} key={category.name}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {category.name}
                      </Typography>
                      <Chip 
                        label={`${category.products} items`} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={category.percentage} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {category.percentage}% of total inventory
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardOverview; 