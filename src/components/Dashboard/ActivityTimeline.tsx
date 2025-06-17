import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Collapse,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  ShoppingCart as OrderIcon,
  Event as EventIcon,
  TrendingUp as LeadIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'order' | 'customer' | 'appointment' | 'lead' | 'payment' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
  isRead?: boolean;
}

const ActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'order',
      title: 'New Order Created',
      description: 'Order #ORD-2024-001 for custom tuxedo by John Doe',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      user: { name: 'Sarah Johnson', avatar: '/avatars/sarah.jpg' },
      priority: 'high',
      status: 'success',
      metadata: { orderId: 'ORD-2024-001', amount: 2500 },
      isRead: false,
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Appointment Scheduled',
      description: 'Fitting appointment for Michael Smith on March 15th',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: { name: 'David Wilson', avatar: '/avatars/david.jpg' },
      priority: 'medium',
      status: 'info',
      metadata: { customerId: 'CUST-001', appointmentId: 'APT-001' },
      isRead: true,
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      description: '$1,200 payment received for Order #ORD-2024-002',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: { name: 'System', avatar: undefined },
      priority: 'medium',
      status: 'success',
      metadata: { amount: 1200, orderId: 'ORD-2024-002' },
      isRead: true,
    },
    {
      id: '4',
      type: 'lead',
      title: 'Hot Lead Identified',
      description: 'Lead score increased to 95 for Robert Brown',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: { name: 'AI System', avatar: undefined },
      priority: 'urgent',
      status: 'warning',
      metadata: { leadId: 'LEAD-001', score: 95 },
      isRead: false,
    },
    {
      id: '5',
      type: 'system',
      title: 'Inventory Alert',
      description: 'Low stock alert: Navy Wool Fabric (5 units remaining)',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      user: { name: 'Inventory System', avatar: undefined },
      priority: 'medium',
      status: 'warning',
      metadata: { productId: 'FABRIC-001', stock: 5 },
      isRead: true,
    },
  ]);

  const [groupedView, setGroupedView] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const unreadCount = activities.filter(a => !a.isRead).length;

  const getActivityIcon = (type: Activity['type'], status: Activity['status']) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'order':
        return <OrderIcon {...iconProps} />;
      case 'customer':
        return <PersonIcon {...iconProps} />;
      case 'appointment':
        return <EventIcon {...iconProps} />;
      case 'lead':
        return <LeadIcon {...iconProps} />;
      case 'payment':
        return <PaymentIcon {...iconProps} />;
      case 'system':
        switch (status) {
          case 'success':
            return <CheckIcon {...iconProps} />;
          case 'warning':
            return <WarningIcon {...iconProps} />;
          case 'error':
            return <ErrorIcon {...iconProps} />;
          default:
            return <InfoIcon {...iconProps} />;
        }
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const markAsRead = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, isRead: true }
        : activity
    ));
  };

  const markAllAsRead = () => {
    setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })));
  };

  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: Record<string, Activity[]> = {};
    
    activities.forEach(activity => {
      const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  };

  const filteredActivities = filterType === 'all' 
    ? activities 
    : activities.filter(a => a.type === filterType);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderTimelineView = () => (
    <Timeline>
      {filteredActivities.map((activity, index) => (
        <TimelineItem key={activity.id}>
          <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </TimelineOppositeContent>
          
          <TimelineSeparator>
            <TimelineDot 
              color={getStatusColor(activity.status)}
              sx={{ 
                border: `2px solid ${getPriorityColor(activity.priority)}`,
                position: 'relative',
              }}
            >
              {getActivityIcon(activity.type, activity.status)}
              {!activity.isRead && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                  }}
                />
              )}
            </TimelineDot>
            {index < filteredActivities.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                opacity: activity.isRead ? 0.8 : 1,
                '&:hover': { boxShadow: 2 },
              }}
              onClick={() => markAsRead(activity.id)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {activity.title}
                      </Typography>
                      <Chip 
                        label={activity.priority} 
                        size="small" 
                        color={activity.priority === 'urgent' ? 'error' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {activity.description}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 20, height: 20 }}>
                        {activity.user.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} />
                        ) : (
                          activity.user.name.charAt(0)
                        )}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {activity.user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {format(activity.timestamp, 'MMM dd, HH:mm')}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  const renderGroupedView = () => {
    const groupedActivities = groupActivitiesByDate(filteredActivities);
    
    return (
      <Box>
        {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => {
          const isExpanded = expandedGroups.has(dateKey);
          const dateObj = new Date(dateKey);
          
          return (
            <Box key={dateKey} mb={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => toggleGroup(dateKey)}
                startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'flex-start', mb: 1 }}
              >
                <Box display="flex" justifyContent="space-between" width="100%">
                  <Typography variant="subtitle2">
                    {format(dateObj, 'EEEE, MMMM dd, yyyy')}
                  </Typography>
                  <Badge badgeContent={dayActivities.length} color="primary" />
                </Box>
              </Button>
              
              <Collapse in={isExpanded}>
                <List>
                  {dayActivities.map((activity) => (
                    <ListItem
                      key={activity.id}
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        opacity: activity.isRead ? 0.8 : 1,
                      }}
                      onClick={() => markAsRead(activity.id)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPriorityColor(activity.priority) }}>
                          {getActivityIcon(activity.type, activity.status)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.user.name} • {format(activity.timestamp, 'HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        {!activity.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'error.main',
                            }}
                          />
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
            <Typography variant="h6" fontWeight="bold">
              Activity Timeline
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="View Options">
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filter Chips */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {['all', 'order', 'customer', 'appointment', 'lead', 'payment', 'system'].map(type => (
            <Chip
              key={type}
              label={type === 'all' ? 'All Activities' : type.charAt(0).toUpperCase() + type.slice(1)}
              onClick={() => setFilterType(type)}
              color={filterType === type ? 'primary' : 'default'}
              variant={filterType === type ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {/* Activities */}
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {groupedView ? renderGroupedView() : renderTimelineView()}
        </Box>

        {/* Options Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { setGroupedView(!groupedView); handleMenuClose(); }}>
            {groupedView ? 'Timeline View' : 'Grouped View'}
          </MenuItem>
          <MenuItem onClick={() => { markAllAsRead(); handleMenuClose(); }}>
            Mark All as Read
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            Export Activities
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            Notification Settings
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline; 