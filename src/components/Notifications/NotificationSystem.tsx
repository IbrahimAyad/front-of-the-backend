import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'inventory' | 'appointment' | 'payment' | 'customer' | 'order';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  data?: any;
}

const NotificationSystem: React.FC = () => {
  const { theme } = useCustomTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock notifications - in real app, these would come from API/WebSocket
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'inventory',
        title: 'Low Stock Alert',
        message: 'Premium Wool fabric is running low (3 units remaining)',
        priority: 'high',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionable: true,
        data: { productId: 'fabric-001', currentStock: 3, minStock: 5 }
      },
      {
        id: '2',
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'John Doe has a fitting appointment in 30 minutes',
        priority: 'medium',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        actionable: true,
        data: { customerId: 1, appointmentId: 'apt-001' }
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Overdue',
        message: 'Michael Smith has an overdue payment of $1,299.99',
        priority: 'urgent',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionable: true,
        data: { customerId: 2, amount: 1299.99, orderId: 'ord-001' }
      },
      {
        id: '4',
        type: 'customer',
        title: 'Follow-up Required',
        message: 'Sarah Johnson\'s lead needs follow-up (Hot lead)',
        priority: 'medium',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: true,
        actionable: true,
        data: { leadId: 'lead-001', customerId: 3 }
      },
      {
        id: '5',
        type: 'order',
        title: 'Order Ready',
        message: 'Custom tuxedo for David Wilson is ready for pickup',
        priority: 'low',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: false,
        actionable: true,
        data: { orderId: 'ord-002', customerId: 4 }
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setSnackbarMessage('Notification marked as read');
    setSnackbarOpen(true);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setSnackbarMessage('All notifications marked as read');
    setSnackbarOpen(true);
  };

  const handleAction = (notification: Notification) => {
    // Handle different notification actions
    switch (notification.type) {
      case 'inventory':
        setSnackbarMessage('Redirecting to inventory management...');
        break;
      case 'appointment':
        setSnackbarMessage('Opening appointment details...');
        break;
      case 'payment':
        setSnackbarMessage('Opening payment processing...');
        break;
      case 'customer':
        setSnackbarMessage('Opening customer profile...');
        break;
      case 'order':
        setSnackbarMessage('Opening order details...');
        break;
    }
    setSnackbarOpen(true);
    handleClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <InventoryIcon />;
      case 'appointment': return <ScheduleIcon />;
      case 'payment': return <PaymentIcon />;
      case 'customer': return <PersonIcon />;
      case 'order': return <CheckCircleIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{
          position: 'relative',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<MarkReadIcon />}
              >
                Mark all read
              </Button>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread notifications
          </Typography>
        </Box>

        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.read 
                      ? 'transparent' 
                      : theme.palette.action.hover,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    }
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {!notification.read && (
                        <IconButton
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <MarkReadIcon fontSize="small" />
                        </IconButton>
                      )}
                      {notification.actionable && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAction(notification)}
                        >
                          Action
                        </Button>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>

        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button fullWidth variant="outlined">
            View All Notifications
          </Button>
        </Box>
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default NotificationSystem; 