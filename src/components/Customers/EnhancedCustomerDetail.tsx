import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  IconButton,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Close,
  Person,
  ShoppingBag,
  Straighten,
  TrendingUp,
  Star,
  Timeline,
  Recommend,
  Insights,
} from '@mui/icons-material';

interface EnhancedCustomerDetailProps {
  open: boolean;
  onClose: () => void;
  customer: any; // Will be properly typed later
}

// Simple TabPanel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedCustomerDetail: React.FC<EnhancedCustomerDetailProps> = ({
  open,
  onClose,
  customer,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  console.log('🔍 EnhancedCustomerDetail render:', { open, customer: customer?.name || 'No customer' });

  if (!customer) {
    console.log('🔍 No customer provided to EnhancedCustomerDetail');
    return null;
  }

  // Create display customer with safe fallbacks
  const displayCustomer = {
    id: customer?.id || '',
    name: customer?.name || 'Unknown Customer',
    email: customer?.email || '',
    phone: customer?.phone || '',
    tier: customer?.profile?.customerTier || 'Bronze',
    totalOrders: customer?.profile?.totalOrders || 0,
    totalSpent: customer?.profile?.totalSpent || 0,
    vipStatus: customer?.profile?.vipStatus || false,
    engagementScore: customer?.profile?.engagementScore || 50,
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return 'primary';
      case 'gold': return 'warning';
      case 'silver': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {displayCustomer.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip 
                  label={displayCustomer.tier} 
                  color={getTierColor(displayCustomer.tier) as any}
                  size="small" 
                />
                {displayCustomer.vipStatus && (
                  <Chip 
                    label="VIP" 
                    color="primary" 
                    size="small" 
                    icon={<Star />}
                  />
                )}
                <Chip 
                  label={`${displayCustomer.totalOrders} Orders`} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  label={`$${(displayCustomer.totalSpent || 0).toLocaleString()}`} 
                  size="small" 
                  color="success" 
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<ShoppingBag />} label="Purchase History" iconPosition="start" />
          <Tab icon={<Straighten />} label="Size Profile" iconPosition="start" />
          <Tab icon={<Insights />} label="Customer Insights" iconPosition="start" />
          <Tab icon={<Recommend />} label="Recommendations" iconPosition="start" />
          <Tab icon={<Timeline />} label="Timeline" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Purchase History
              </Typography>
              <Typography color="textSecondary">
                Customer has {displayCustomer.totalOrders} orders totaling ${(displayCustomer.totalSpent || 0).toLocaleString()}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  • Email: {displayCustomer.email}
                </Typography>
                <Typography variant="body2">
                  • Phone: {displayCustomer.phone || 'Not provided'}
                </Typography>
                <Typography variant="body2">
                  • Customer ID: {displayCustomer.id}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Size Profile
              </Typography>
              <Typography color="textSecondary">
                Size analysis and measurement history for {displayCustomer.name}
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Insights
              </Typography>
              <Typography color="textSecondary">
                Engagement Score: {displayCustomer.engagementScore}%
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Recommendations
              </Typography>
              <Typography color="textSecondary">
                Personalized recommendations for {displayCustomer.name}
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Timeline
              </Typography>
              <Typography color="textSecondary">
                Customer journey and interaction history
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" onClick={onClose}>
          Edit Customer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedCustomerDetail; 