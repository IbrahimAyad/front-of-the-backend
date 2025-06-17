import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Badge,
  SwipeableDrawer,
  Grid,
  Alert,
  Divider,
  Paper,
  Slide,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Mic as MicIcon,
  Send as SendIcon,
  Offline as OfflineIcon,
  CloudDone as OnlineIcon,
  Straighten as MeasureIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
  Chat as ChatIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { WeddingParty, WeddingMember } from '../../types';

interface WeddingMobileAppProps {
  wedding?: WeddingParty;
  currentUser?: {
    id: string;
    name: string;
    role: 'coordinator' | 'member';
  };
  onUpdate?: () => void;
}

const WeddingMobileApp: React.FC<WeddingMobileAppProps> = ({ wedding, currentUser, onUpdate }) => {
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  // Simulate offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mock notifications
  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        title: 'Measurement Reminder',
        message: 'Please submit your measurements by Friday',
        type: 'warning' as const,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
      },
      {
        id: '2',
        title: 'Fitting Scheduled',
        message: 'Your fitting is scheduled for tomorrow at 2 PM',
        type: 'info' as const,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleVoiceCommand = () => {
    setVoiceRecording(true);
    // Simulate voice recording
    setTimeout(() => {
      setVoiceRecording(false);
      // Process voice command here
    }, 3000);
  };

  const handleSync = () => {
    setShowSyncDialog(true);
    setSyncProgress(0);
    
    // Simulate sync process
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowSyncDialog(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const speedDialActions = [
    { icon: <CameraIcon />, name: 'Take Photo', action: () => {} },
    { icon: <MicIcon />, name: 'Voice Note', action: handleVoiceCommand },
    { icon: <QrCodeIcon />, name: 'Scan QR', action: () => {} },
    { icon: <ShareIcon />, name: 'Share', action: () => {} },
  ];

  const HomeTab = () => (
    <Box sx={{ p: 2 }}>
      {wedding && (
        <>
          {/* Wedding Header */}
          <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {wedding.groomInfo.name} & {wedding.brideInfo.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {format(wedding.weddingDate, 'MMMM dd, yyyy')}
              </Typography>
              <Chip
                label={`${differenceInDays(wedding.weddingDate, new Date())} days to go!`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <CardContent>
                  <MeasureIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Measurements
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <CardContent>
                  <ShippingIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Shipping
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <CardContent>
                  <PaymentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Payment
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <CardContent>
                  <TimelineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Timeline
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Progress Overview */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Your Progress
              </Typography>
              {wedding.members.filter(m => m.id === currentUser?.id).map(member => {
                const progress = [
                  { label: 'Measurements', completed: !!member.measurements },
                  { label: 'Shipping Address', completed: !!member.shippingAddress },
                  { label: 'Payment', completed: member.orderStatus === 'delivered' || member.orderStatus === 'shipped' },
                ];
                const completedSteps = progress.filter(p => p.completed).length;
                
                return (
                  <Box key={member.id}>
                    <LinearProgress
                      variant="determinate"
                      value={(completedSteps / progress.length) * 100}
                      sx={{ mb: 2, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {completedSteps} of {progress.length} steps completed
                    </Typography>
                    <List dense>
                      {progress.map((step, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: step.completed ? 'success.main' : 'grey.300',
                              width: 24,
                              height: 24
                            }}>
                              {step.completed ? '✓' : index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={step.label}
                            sx={{ 
                              textDecoration: step.completed ? 'line-through' : 'none',
                              opacity: step.completed ? 0.7 : 1
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Updates
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <EventIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Fitting scheduled"
                    secondary="Tomorrow at 2:00 PM"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <MeasureIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Measurements approved"
                    secondary="Ready for production"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {!wedding && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to Wedding Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your wedding code to get started
            </Typography>
            <Button variant="contained" size="large">
              Enter Wedding Code
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const ProfileTab = () => (
    <Box sx={{ p: 2 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
            {currentUser?.name?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            {currentUser?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUser?.role === 'coordinator' ? 'Wedding Coordinator' : 'Wedding Party Member'}
          </Typography>
        </CardContent>
      </Card>

      <List>
        <ListItem>
          <ListItemText primary="Edit Profile" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Notification Settings" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Privacy Settings" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Help & Support" />
        </ListItem>
        <ListItem>
          <ListItemText primary="About" />
        </ListItem>
      </List>
    </Box>
  );

  const NotificationsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Notifications
      </Typography>
      {notifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {notifications.map((notification) => (
            <Card key={notification.id} sx={{ mb: 1 }}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: notification.type === 'warning' ? 'warning.main' : 'info.main' 
                  }}>
                    <NotificationIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box component="span">
                      <Typography variant="body2" component="span" display="block">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {format(notification.timestamp, 'MMM dd, HH:mm')}
                      </Typography>
                    </Box>
                  }
                />
                {!notification.read && (
                  <Badge color="primary" variant="dot" />
                )}
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );

  const SettingsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isOffline ? (
              <OfflineIcon color="error" />
            ) : (
              <OnlineIcon color="success" />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {isOffline ? 'Offline Mode' : 'Online'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOffline ? 'Working offline. Data will sync when online.' : 'Connected to server'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSync}
              disabled={isOffline}
              startIcon={<SyncIcon />}
            >
              Sync
            </Button>
          </Box>
        </CardContent>
      </Card>

      <List>
        <ListItem>
          <ListItemText 
            primary="Offline Mode" 
            secondary="Download data for offline access"
          />
          <IconButton>
            <DownloadIcon />
          </IconButton>
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Push Notifications" 
            secondary="Receive updates and reminders"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Dark Mode" 
            secondary="Switch to dark theme"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Language" 
            secondary="English"
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderTabContent = () => {
    switch (bottomNavValue) {
      case 0: return <HomeTab />;
      case 1: return <ProfileTab />;
      case 2: return <NotificationsTab />;
      case 3: return <SettingsTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Wedding Portal
          </Typography>
          <IconButton color="inherit">
            <SearchIcon />
          </IconButton>
          <IconButton 
            color="inherit"
            onClick={() => setShowNotifications(true)}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Offline Banner */}
      {isOffline && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          You're offline. Some features may be limited.
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 7 }}>
        {renderTabContent()}
      </Box>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          value={bottomNavValue}
          onChange={(event, newValue) => setBottomNavValue(newValue)}
          showLabels
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
          <BottomNavigationAction 
            label="Notifications" 
            icon={
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationIcon />
              </Badge>
            } 
          />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>

      {/* Side Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Menu
          </Typography>
          <List>
            <ListItem button>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MeasureIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Submit Measurements" />
            </ListItem>
            <ListItem button>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ShippingIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Shipping Info" />
            </ListItem>
            <ListItem button>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PaymentIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Payment" />
            </ListItem>
            <ListItem button>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ChatIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Chat Support" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Voice Recording Dialog */}
      <Dialog open={voiceRecording} onClose={() => setVoiceRecording(false)}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Zoom in={voiceRecording}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2, 
              bgcolor: 'error.main',
              animation: 'pulse 1s infinite'
            }}>
              <MicIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Zoom>
          <Typography variant="h6" gutterBottom>
            Listening...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Speak your command or question
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Sync Progress Dialog */}
      <Dialog open={showSyncDialog} onClose={() => {}}>
        <DialogContent sx={{ textAlign: 'center', py: 4, minWidth: 300 }}>
          <SyncIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Syncing Data...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={syncProgress} 
            sx={{ mb: 2, width: '100%' }}
          />
          <Typography variant="body2" color="text.secondary">
            {syncProgress}% complete
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WeddingMobileApp; 