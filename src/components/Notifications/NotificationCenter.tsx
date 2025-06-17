import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'order' | 'appointment' | 'lead' | 'customer' | 'system';
  actionUrl?: string;
}

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'New Order Received',
      message: 'John Doe placed a new order for $1,299',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      category: 'order',
      actionUrl: '/orders/ORD-001',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Appointment Reminder',
      message: 'Consultation with Michael Smith in 30 minutes',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
      category: 'appointment',
      actionUrl: '/appointments',
    },
    {
      id: '3',
      type: 'success',
      title: 'Lead Converted',
      message: 'Sarah Johnson converted to customer',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      category: 'lead',
      actionUrl: '/customers/3',
    },
    {
      id: '4',
      type: 'info',
      title: 'Measurement Recorded',
      message: 'New measurements added for David Wilson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      category: 'customer',
      actionUrl: '/measurements',
    },
    {
      id: '5',
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment failed for order ORD-002',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: false,
      category: 'order',
      actionUrl: '/orders/ORD-002',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const open = Boolean(anchorEl);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving a new notification
      if (Math.random() > 0.95) { // 5% chance every 5 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as any,
          title: 'New Activity',
          message: 'A new activity has occurred in your system',
          timestamp: new Date(),
          read: false,
          category: ['order', 'appointment', 'lead', 'customer'][Math.floor(Math.random() * 4)] as any,
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
        
        // Show toast notification
        toast.success(newNotification.title, {
          duration: 4000,
          position: 'top-right',
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case 'order':
        return <ShoppingCartIcon />;
      case 'appointment':
        return <ScheduleIcon />;
      case 'customer':
      case 'lead':
        return <PersonIcon />;
      default:
        switch (type) {
          case 'success':
            return <CheckCircleIcon />;
          case 'warning':
            return <WarningIcon />;
          case 'error':
            return <ErrorIcon />;
          default:
            return <InfoIcon />;
        }
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'info.main';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'order':
        return 'primary';
      case 'appointment':
        return 'warning';
      case 'lead':
        return 'success';
      case 'customer':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 400, maxHeight: 500 }}>
          <Box p={2} borderBottom={1} borderColor="divider">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </Box>
          </Box>

          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                />
              </ListItem>
            ) : (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification.type),
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getNotificationIcon(notification.category, notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                            component="span"
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                          )}
                          <Chip
                            label={notification.category}
                            size="small"
                            color={getCategoryColor(notification.category)}
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      }
                                              secondary={
                          <Box component="span">
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }} component="span">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span">
                              {format(notification.timestamp, 'MMM dd, HH:mm')}
                            </Typography>
                          </Box>
                        }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>

          {notifications.length > 0 && (
            <Box p={2} borderTop={1} borderColor="divider">
              <Button fullWidth variant="outlined" size="small">
                View All Notifications
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationCenter; 