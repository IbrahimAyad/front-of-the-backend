import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  ShoppingBag,
  Event,
  Group,
  Person,
  Star,
  TrendingUp,
} from '@mui/icons-material';

interface CustomerTimelineProps {
  customerId: string;
  purchaseHistory: any[];
}

const CustomerTimeline: React.FC<CustomerTimelineProps> = ({
  customerId,
  purchaseHistory,
}) => {
  // Enhanced timeline data combining purchases with milestones
  const createTimelineItems = (purchases: any[]) => {
    const items = [...purchases];
    
    // Add milestone events
    items.push({
      id: 'milestone_1',
      type: 'milestone',
      title: 'Became VIP Customer',
      date: '2024-06-15',
      description: 'Achieved VIP status after $2,000+ in purchases',
      icon: <Star color="warning" />,
      color: 'warning',
    });

    items.push({
      id: 'milestone_2', 
      type: 'milestone',
      title: 'First Group Order',
      date: '2024-12-20',
      description: 'Placed first wedding party order for 4 people',
      icon: <Group color="info" />,
      color: 'info',
    });

    // Sort by date
    return items.sort((a, b) => new Date(b.date || b.orderDate).getTime() - new Date(a.date || a.orderDate).getTime());
  };

  const mockPurchaseHistory = [
    {
      id: 'ph1',
      productName: 'Navy Blue Tuxedo Complete Set',
      category: 'Tuxedo',
      size: '42R',
      color: 'Navy Blue',
      occasion: 'wedding',
      orderDate: '2024-12-20',
      price: 899.99,
      isGroupOrder: true,
      type: 'purchase',
    },
    {
      id: 'ph2',
      productName: 'Charcoal Business Suit',
      category: 'Suit',
      size: '42R',
      color: 'Charcoal Grey',
      occasion: 'business',
      orderDate: '2024-10-15',
      price: 749.99,
      isGroupOrder: false,
      type: 'purchase',
    },
    {
      id: 'ph3',
      productName: 'Royal Blue Prom Tuxedo',
      category: 'Tuxedo',
      size: '42R',
      color: 'Royal Blue',
      occasion: 'prom',
      orderDate: '2024-03-28',
      price: 449.99,
      isGroupOrder: false,
      type: 'purchase',
    },
  ];

  const displayHistory = purchaseHistory.length > 0 ? purchaseHistory : mockPurchaseHistory;
  const timelineItems = createTimelineItems(displayHistory);

  const getTimelineIcon = (item: any) => {
    if (item.type === 'milestone') {
      return item.icon;
    }
    
    if (item.isGroupOrder) {
      return <Group />;
    }
    
    switch (item.category?.toLowerCase()) {
      case 'tuxedo': return <span style={{ fontSize: '1.2em' }}>🤵</span>;
      case 'suit': return <span style={{ fontSize: '1.2em' }}>👔</span>;
      case 'shirt': return <span style={{ fontSize: '1.2em' }}>👕</span>;
      default: return <ShoppingBag />;
    }
  };

  const getTimelineColor = (item: any) => {
    if (item.type === 'milestone') {
      return item.color || 'primary';
    }
    
    if (item.isGroupOrder) {
      return 'secondary';
    }
    
    switch (item.occasion) {
      case 'wedding': return 'error';
      case 'prom': return 'secondary';
      case 'business': return 'primary';
      default: return 'primary';
    }
  };

  const getOccasionIcon = (occasion: string) => {
    switch (occasion) {
      case 'wedding': return '💒';
      case 'prom': return '🎓';
      case 'business': return '💼';
      default: return '🎉';
    }
  };

  // Calculate summary stats
  const totalSpent = displayHistory.reduce((sum, item) => sum + (item.price || 0), 0);
  const groupOrders = displayHistory.filter(item => item.isGroupOrder).length;
  const categories = [...new Set(displayHistory.map(item => item.category))];

  return (
    <Box>
      {/* Timeline Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Event color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {timelineItems.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingBag color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                ${totalSpent.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Group color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {groupOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Group Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {categories.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Journey Timeline
          </Typography>
          
          <Timeline>
            {timelineItems.map((item, index) => (
              <TimelineItem key={item.id}>
                <TimelineSeparator>
                  <TimelineDot color={getTimelineColor(item) as any}>
                    {getTimelineIcon(item)}
                  </TimelineDot>
                  {index < timelineItems.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      {item.type === 'milestone' ? (
                        // Milestone Event
                        <Box>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="h6" fontWeight="bold">
                              {item.title}
                            </Typography>
                            <Chip 
                              label="Milestone"
                              size="small"
                              color={item.color as any}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary" mb={1}>
                            {item.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      ) : (
                        // Purchase Event
                        <Box>
                          <Box display="flex" alignItems="flex-start" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getOccasionIcon(item.occasion)}
                            </Avatar>
                            <Box flexGrow={1}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="h6" fontWeight="medium">
                                  {item.productName}
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                  ${item.price?.toFixed(2)}
                                </Typography>
                              </Box>
                              
                              <Box display="flex" gap={1} mb={2}>
                                <Chip 
                                  label={item.category}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                {item.size && (
                                  <Chip 
                                    label={item.size}
                                    size="small"
                                  />
                                )}
                                {item.color && (
                                  <Chip 
                                    label={item.color}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                <Chip 
                                  label={item.occasion}
                                  size="small"
                                  color={getTimelineColor(item) as any}
                                />
                                {item.isGroupOrder && (
                                  <Chip 
                                    label="Group Order"
                                    size="small"
                                    color="secondary"
                                    icon={<Group />}
                                  />
                                )}
                              </Box>
                              
                              <Typography variant="caption" color="textSecondary">
                                {new Date(item.orderDate).toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
          
          {timelineItems.length === 0 && (
            <Box textAlign="center" py={4}>
              <Event sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No timeline data available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Timeline will populate as customer activity occurs
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerTimeline; 