import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  TrendingUp,
  Star,
  ShoppingBag,
  Event,
  AttachMoney,
  Insights,
  Edit,
  MoreVert,
  Favorite,
  FavoriteBorder,
  Schedule,
  Assignment,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  joinDate: string;
  lastActivity: string;
  customerScore: number;
  lifetimeValue: number;
  totalOrders: number;
  averageOrderValue: number;
  preferredStyle: string;
  preferredFabric: string;
  preferredColors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextAppointment?: string;
  tags: string[];
  notes: string;
  isVip: boolean;
  isFavorite: boolean;
}

interface InteractionData {
  id: string;
  type: 'order' | 'appointment' | 'call' | 'email' | 'visit';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status: 'completed' | 'pending' | 'cancelled';
}

interface CustomerProfileCardProps {
  customer: CustomerData;
  interactions: InteractionData[];
  onEdit?: (customer: CustomerData) => void;
  onToggleFavorite?: (customerId: string) => void;
  onScheduleAppointment?: (customerId: string) => void;
}

const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({
  customer,
  interactions,
  onEdit,
  onToggleFavorite,
  onScheduleAppointment,
}) => {
  const { theme } = useCustomTheme();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'high': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return theme.palette.grey[500];
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag />;
      case 'appointment': return <Event />;
      case 'call': return <Phone />;
      case 'email': return <Email />;
      case 'visit': return <Person />;
      default: return <Assignment />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: customer.isVip ? `2px solid ${theme.palette.warning.main}` : 'none',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {customer.isVip && (
          <Chip
            label="VIP"
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              backgroundColor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText,
              fontWeight: 'bold',
              zIndex: 1,
            }}
          />
        )}

        <CardHeader
          avatar={
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: customer.riskLevel === 'low' 
                      ? theme.palette.success.main 
                      : customer.riskLevel === 'medium'
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
              }
            >
              <Avatar
                src={customer.avatar}
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: getTierColor(customer.loyaltyTier),
                  color: theme.palette.text.primary,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {customer.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Badge>
          }
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="div">
                {customer.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onToggleFavorite?.(customer.id)}
                sx={{ color: customer.isFavorite ? theme.palette.error.main : theme.palette.grey[400] }}
              >
                {customer.isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Box>
          }
          subheader={
            <Box component="span">
              <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                {customer.email}
              </Typography>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={customer.loyaltyTier.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: getTierColor(customer.loyaltyTier),
                    color: theme.palette.text.primary,
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="caption" color="text.secondary" component="span">
                  Last active {getTimeAgo(customer.lastActivity)}
                </Typography>
              </Box>
            </Box>
          }
          action={
            <IconButton onClick={() => setDetailsOpen(true)}>
              <MoreVert />
            </IconButton>
          }
        />

        <CardContent sx={{ pt: 0 }}>
          {/* Customer Score */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Customer Score
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={getScoreColor(customer.customerScore)}>
                {customer.customerScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={customer.customerScore}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(customer.customerScore),
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(customer.lifetimeValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lifetime Value
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  {customer.totalOrders}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Preferences */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label={customer.preferredStyle} size="small" variant="outlined" />
              <Chip label={customer.preferredFabric} size="small" variant="outlined" />
              {customer.preferredColors.slice(0, 2).map((color, index) => (
                <Chip key={index} label={color} size="small" variant="outlined" />
              ))}
              {customer.preferredColors.length > 2 && (
                <Chip label={`+${customer.preferredColors.length - 2}`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          {/* Tags */}
          {customer.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {customer.tags.slice(0, 3).map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
                {customer.tags.length > 3 && (
                  <Chip 
                    label={`+${customer.tags.length - 3}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Next Appointment */}
          {customer.nextAppointment && (
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: theme.palette.primary.main + '10',
              borderRadius: 1,
              border: `1px solid ${theme.palette.primary.main}30`,
              mb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" fontSize="small" />
                <Typography variant="body2" fontWeight="medium">
                  Next Appointment
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatDate(customer.nextAppointment)}
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Event />}
              onClick={() => onScheduleAppointment?.(customer.id)}
              sx={{ flex: 1 }}
            >
              Schedule
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={() => onEdit?.(customer)}
              sx={{ flex: 1 }}
            >
              Edit
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={customer.avatar}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: getTierColor(customer.loyaltyTier),
              }}
            >
              {customer.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h6">{customer.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Profile Details
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Interactions" />
            <Tab label="Analytics" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Email /></ListItemIcon>
                      <ListItemText primary={customer.email} secondary="Email" />
                    </ListItem>
                    {customer.phone && (
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText primary={customer.phone} secondary="Phone" />
                      </ListItem>
                    )}
                    {customer.address && (
                      <ListItem>
                        <ListItemIcon><LocationOn /></ListItemIcon>
                        <ListItemText primary={customer.address} secondary="Address" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Customer Metrics</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><AttachMoney /></ListItemIcon>
                      <ListItemText 
                        primary={formatCurrency(customer.lifetimeValue)} 
                        secondary="Lifetime Value" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ShoppingBag /></ListItemIcon>
                      <ListItemText 
                        primary={`${customer.totalOrders} orders`} 
                        secondary="Total Orders" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TrendingUp /></ListItemIcon>
                      <ListItemText 
                        primary={formatCurrency(customer.averageOrderValue)} 
                        secondary="Average Order Value" 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.notes || 'No notes available.'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Interactions</Typography>
              <List>
                {interactions.slice(0, 10).map((interaction, index) => (
                  <React.Fragment key={interaction.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getInteractionIcon(interaction.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={interaction.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {interaction.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(interaction.date)}
                              {interaction.amount && ` • ${formatCurrency(interaction.amount)}`}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={interaction.status}
                        size="small"
                        color={
                          interaction.status === 'completed' ? 'success' :
                          interaction.status === 'pending' ? 'warning' : 'error'
                        }
                      />
                    </ListItem>
                    {index < interactions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Risk Assessment</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getRiskColor(customer.riskLevel),
                      }}
                    />
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {customer.riskLevel} Risk
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Based on payment history, order frequency, and engagement patterns.
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Loyalty Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Star sx={{ color: getTierColor(customer.loyaltyTier) }} />
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {customer.loyaltyTier} Member
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Customer since {formatDate(customer.joinDate)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Predictive Insights</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Insights color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="High likelihood of repeat purchase within 30 days"
                        secondary="Based on historical ordering patterns"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TrendingUp color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Potential for upselling premium services"
                        secondary="Customer shows interest in luxury fabrics"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Schedule color="warning" /></ListItemIcon>
                      <ListItemText 
                        primary="Recommended follow-up in 2 weeks"
                        secondary="Optimal engagement timing based on activity patterns"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => onEdit?.(customer)}>
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerProfileCard;