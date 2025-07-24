import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  CheckroomOutlined as OutfitIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  LocalOffer as OffersIcon,
  Reviews as ReviewsIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminProductsPage from './AdminProductsPage';
import OutfitBuilderSection from '../../components/Admin/OutfitBuilderSection';

const drawerWidth = 280;

interface MenuItemConfig {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  children?: MenuItemConfig[];
}

const EnhancedAdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [currentView, setCurrentView] = useState('products');

  // Handle URL-based routing
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/products')) {
      setCurrentView('products');
    } else if (path.includes('/admin/dashboard')) {
      setCurrentView('dashboard');
    } else if (path.includes('/admin/inventory')) {
      setCurrentView('inventory');
    } else if (path.includes('/admin/outfit-builder')) {
      setCurrentView('outfit-builder');
    } else if (path.includes('/admin/orders')) {
      setCurrentView('orders');
    } else if (path.includes('/admin/customers')) {
      setCurrentView('customers');
    } else if (path.includes('/admin/analytics')) {
      setCurrentView('analytics');
    } else if (path.includes('/admin/marketing')) {
      setCurrentView('marketing');
    } else if (path.includes('/admin/settings')) {
      setCurrentView('settings');
    } else {
      // Default to products for /admin or /admin/
      setCurrentView('products');
    }
  }, [location.pathname]);

  const menuItems: MenuItemConfig[] = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard',
      badge: 3,
    },
    {
      text: 'Inventory',
      icon: <InventoryIcon />,
      path: '/admin/inventory',
      children: [
        { text: 'Products', icon: <CategoryIcon />, path: '/admin/products' },
        { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
        { text: 'Stock Alerts', icon: <WarningIcon />, path: '/admin/stock-alerts', badge: 5 },
      ],
    },
    {
      text: 'Outfit Builder',
      icon: <OutfitIcon />,
      path: '/admin/outfit-builder',
    },
    {
      text: 'Orders',
      icon: <OrdersIcon />,
      path: '/admin/orders',
      badge: 12,
    },
    {
      text: 'Customers',
      icon: <PeopleIcon />,
      path: '/admin/customers',
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/admin/analytics',
    },
    {
      text: 'Marketing',
      icon: <TrendingIcon />,
      path: '/admin/marketing',
      children: [
        { text: 'Campaigns', icon: <OffersIcon />, path: '/admin/campaigns' },
        { text: 'Discounts', icon: <OffersIcon />, path: '/admin/discounts' },
        { text: 'Reviews', icon: <ReviewsIcon />, path: '/admin/reviews', badge: 8 },
      ],
    },
    {
      text: 'Store Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string, view?: string) => {
    if (view) {
      setCurrentView(view);
    }
    navigate(path);
  };

  const drawer = (
    <div>
      <Toolbar
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              KCT Admin
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Management Portal
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItemButton
              onClick={() => {
                if (item.children) {
                  setInventoryOpen(!inventoryOpen);
                } else {
                  handleNavigation(
                    item.path,
                    item.text === 'Outfit Builder' ? 'outfit-builder' : item.text.toLowerCase()
                  );
                }
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon>
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.children && (inventoryOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {item.children && (
              <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.text}
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigation(child.path, child.text.toLowerCase())}
                      selected={location.pathname === child.path}
                    >
                      <ListItemIcon>
                        <Badge badgeContent={child.badge} color="error">
                          {child.icon}
                        </Badge>
                      </ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Quick Stats
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="234 Products" size="small" color="primary" />
            <Chip label="12 Low Stock" size="small" color="warning" />
            <Chip label="45 Orders Today" size="small" color="success" />
          </Box>
        </Box>
      </Box>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'products':
        return <AdminProductsPage />;
      case 'outfit-builder':
        return <OutfitBuilderSection />;
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4">Welcome to {currentView}</Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              {currentView.charAt(0).toUpperCase() + currentView.slice(1).replace('-', ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={(e) => setNotificationAnchor(e.currentTarget)}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" fontWeight="medium">
                  Admin User
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Super Admin
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: 'grey.50',
          minHeight: '100vh',
        }}
      >
        {renderContent()}
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{ sx: { width: 360, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <WarningIcon color="warning" />
          </ListItemIcon>
          <ListItemText
            primary="Low Stock Alert"
            secondary="5 products are running low on stock"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <OrdersIcon color="success" />
          </ListItemIcon>
          <ListItemText
            primary="New Orders"
            secondary="You have 12 new orders to process"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <ReviewsIcon color="info" />
          </ListItemIcon>
          <ListItemText
            primary="New Reviews"
            secondary="8 new customer reviews to moderate"
          />
        </MenuItem>
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button fullWidth size="small">
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default EnhancedAdminDashboard;