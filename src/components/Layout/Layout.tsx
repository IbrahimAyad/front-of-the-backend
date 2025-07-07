import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  useTheme,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  People,
  TrendingUp,
  ShoppingCart,
  Inventory,
  Event,
  Straighten,
  Analytics,
  Logout,
  Menu as MenuIcon,
  Handshake,
  ContentCut,
  Favorite,
  Assessment,
  Campaign,
  LocalShipping,
  ManageAccounts,
  Assignment,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import NotificationSystem from '../Notifications/NotificationSystem';
import AdvancedSearch from '../Search/AdvancedSearch';
import DarkModeToggle from './DarkModeToggle';
import MobileDrawer from './MobileDrawer';

const drawerWidth = 240;

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/tailoring', label: 'Tailoring Journey', icon: <ContentCut /> },
  { path: '/weddings', label: 'Wedding Services', icon: <Favorite /> },
  { path: '/customer-management', label: 'Customer Management', icon: <ManageAccounts /> },
  { path: '/products', label: 'Products Catalog', icon: <Inventory /> },
  { path: '/orders', label: 'Orders & Fulfillment', icon: <LocalShipping /> },
  { path: '/analytics', label: 'Analytics & Reports', icon: <Assessment /> },
  { path: '/marketing', label: 'Marketing Hub', icon: <Campaign /> },
  { path: '/inventory', label: 'Inventory Management', icon: <Assignment /> },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    return currentItem?.label || 'KCT Menswear';
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.primary.main,
              color: 'white',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" color="white">
              KCT Menswear
            </Typography>
          </Box>
          
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
              
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Drawer>
      )}

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        menuItems={menuItems}
      />

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <AppBar 
          position="static" 
          color="inherit" 
          elevation={1}
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography 
              variant="h6" 
              sx={{ 
                flexGrow: 0, 
                mr: { xs: 2, md: 4 }, 
                color: theme.palette.text.primary,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getPageTitle()}
            </Typography>
            
            {/* Advanced Search - Hidden on mobile */}
            <Box sx={{ 
              flexGrow: 1, 
              maxWidth: 600, 
              mx: 2,
              display: { xs: 'none', md: 'block' }
            }}>
              <AdvancedSearch />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <DarkModeToggle />
              <NotificationSystem />
              
              {/* User info - Hidden on mobile */}
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Welcome, {user?.name || user?.email}
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleLogout}
                size="small"
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Logout
                </Box>
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            backgroundColor: theme.palette.background.default,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 