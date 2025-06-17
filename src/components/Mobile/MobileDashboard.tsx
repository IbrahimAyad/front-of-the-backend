import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Fab,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  Badge,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Receipt,
  Person,
  Settings,
  Notifications,
  Add,
  CameraAlt,
  Payment,
  Inventory,
  Logout,
  ChevronLeft,
  AccountCircle,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import QuickOrderStatus from './QuickOrderStatus';
import PhotoCaptureModal from './PhotoCaptureModal';
import MobilePaymentProcessor from './MobilePaymentProcessor';

// Mock data
const mockOrders = [
  { id: 'ORD-2024-001', customerName: 'James Wilson', status: 'processing' as const },
  { id: 'ORD-2024-002', customerName: 'Emma Thompson', status: 'ready' as const },
  { id: 'ORD-2024-003', customerName: 'Michael Brown', status: 'pending' as const },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
      style={{ paddingBottom: 72 }} // Space for FAB
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `mobile-tab-${index}`,
    'aria-controls': `mobile-tabpanel-${index}`,
  };
};

const MobileDashboard: React.FC = () => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleOpenPhotoCapture = () => {
    setPhotoCaptureOpen(true);
  };

  const handleClosePhotoCapture = () => {
    setPhotoCaptureOpen(false);
  };

  const handlePhotoCapture = (photoData: string) => {
    console.log('Photo captured:', photoData.substring(0, 50) + '...');
    // Here you would typically upload the photo to your server
  };

  const handleOpenPayment = (orderId: string) => {
    setSelectedOrder(orderId);
    setPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    setPaymentModalOpen(false);
  };

  const handlePaymentComplete = (paymentInfo: any) => {
    console.log('Payment completed:', paymentInfo);
    // Here you would typically process the payment on your server
    setTimeout(() => {
      setPaymentModalOpen(false);
    }, 2000);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1, pb: 7 }}>
      {/* App Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KCT Mobile
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton
            edge="end"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>My Account</MenuItem>
            <Divider />
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
        
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="mobile navigation tabs"
        >
          <Tab icon={<Dashboard />} label="Dashboard" {...a11yProps(0)} />
          <Tab icon={<Receipt />} label="Orders" {...a11yProps(1)} />
          <Tab icon={<Person />} label="Customers" {...a11yProps(2)} />
        </Tabs>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}>
            <Typography variant="h6">KCT Menswear</Typography>
            <IconButton color="inherit" onClick={toggleDrawer}>
              <ChevronLeft />
            </IconButton>
          </Box>
          <Divider />
          <List>
            <ListItem button onClick={() => { setTabValue(0); toggleDrawer(); }}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={() => { setTabValue(1); toggleDrawer(); }}>
              <ListItemIcon>
                <Receipt />
              </ListItemIcon>
              <ListItemText primary="Orders" />
            </ListItem>
            <ListItem button onClick={() => { setTabValue(2); toggleDrawer(); }}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Customers" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleOpenPhotoCapture}>
              <ListItemIcon>
                <CameraAlt />
              </ListItemIcon>
              <ListItemText primary="Take Measurements" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Inventory />
              </ListItemIcon>
              <ListItemText primary="Inventory" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Tab Content */}
      <Container maxWidth="sm" disableGutters={isMobile}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: isMobile ? 2 : 0 }}>
            <Typography variant="h5" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Here's a quick overview of your recent activities.
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Today's Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Box>
                  <Typography variant="h4">5</Typography>
                  <Typography variant="body2">Orders</Typography>
                </Box>
                <Box>
                  <Typography variant="h4">3</Typography>
                  <Typography variant="body2">Fittings</Typography>
                </Box>
                <Box>
                  <Typography variant="h4">$2.4k</Typography>
                  <Typography variant="body2">Revenue</Typography>
                </Box>
              </Box>
            </Paper>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Recent Orders
            </Typography>
            
            {mockOrders.map(order => (
              <QuickOrderStatus 
                key={order.id}
                orderId={order.id}
                customerName={order.customerName}
                initialStatus={order.status}
                isStaff={true}
              />
            ))}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: isMobile ? 2 : 0 }}>
            <Typography variant="h5" gutterBottom>
              Order Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              View and update your customer orders.
            </Typography>
            
            {mockOrders.map(order => (
              <Box key={order.id} sx={{ mb: 2 }}>
                <QuickOrderStatus 
                  orderId={order.id}
                  customerName={order.customerName}
                  initialStatus={order.status}
                  isStaff={true}
                  onStatusUpdate={(id, status) => console.log(`Order ${id} updated to ${status}`)}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                  <IconButton 
                    color="primary"
                    onClick={() => handleOpenPayment(order.id)}
                    size="small"
                  >
                    <Payment />
                  </IconButton>
                  <IconButton 
                    color="primary"
                    onClick={handleOpenPhotoCapture}
                    size="small"
                  >
                    <CameraAlt />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: isMobile ? 2 : 0 }}>
            <Typography variant="h5" gutterBottom>
              Customer Profiles
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              View and manage your customer information.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1">Coming Soon</Typography>
              <Typography variant="body2" color="text.secondary">
                Customer management features will be available in the next update.
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      {/* Photo Capture Modal */}
      <PhotoCaptureModal
        open={photoCaptureOpen}
        onClose={handleClosePhotoCapture}
        onCapture={handlePhotoCapture}
        title="Capture Measurement Photo"
      />

      {/* Payment Modal */}
      {selectedOrder && paymentModalOpen && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'background.paper',
          zIndex: 1300,
          overflow: 'auto',
          p: 2,
        }}>
          <IconButton
            sx={{ position: 'absolute', top: 8, right: 8 }}
            onClick={handleClosePayment}
          >
            <ChevronLeft />
          </IconButton>
          <Box sx={{ pt: 4 }}>
            <MobilePaymentProcessor
              orderId={selectedOrder}
              amount={1250.00}
              onPaymentComplete={handlePaymentComplete}
              customerName={mockOrders.find(o => o.id === selectedOrder)?.customerName}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MobileDashboard; 