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
  Avatar,
  Chip,
  useTheme,
  alpha,
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

// Import sub-components
import PurchaseHistoryTable from './PurchaseHistoryTable';
import CustomerSizeProfile from './CustomerSizeProfile';
import CustomerInsightsPanel from './CustomerInsightsPanel';
import ProductRecommendations from './ProductRecommendations';
import CustomerTimeline from './CustomerTimeline';

interface EnhancedCustomerDetailProps {
  open: boolean;
  onClose: () => void;
  customer: any; // Will be properly typed later
}

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
      id={`enhanced-customer-tabpanel-${index}`}
      aria-labelledby={`enhanced-customer-tab-${index}`}
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
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Mock data for development - will be replaced with real data
  const mockCustomer = {
    id: 'cust_123',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    tier: 'Platinum',
    vipStatus: true,
    totalSpent: 2547.98,
    totalOrders: 8,
    averageOrderValue: 318.50,
    engagementScore: 92,
    joinDate: '2023-01-15',
    lastPurchase: '2024-12-20',
    favoriteCategory: 'Formal Wear',
    primaryOccasion: 'Wedding',
    loyaltyScore: 88,
    riskScore: 12,
    // Additional enhanced data
    purchaseHistory: [
      {
        id: 'ph1',
        productName: 'Navy Blue Tuxedo - Slim Fit',
        category: 'Tuxedo',
        size: '42R',
        color: 'Navy Blue',
        occasion: 'wedding',
        orderDate: '2024-12-20',
        price: 599.99,
        isGroupOrder: true,
      },
      {
        id: 'ph2', 
        productName: 'White Dress Shirt - Classic',
        category: 'Shirt',
        size: '16.5/34',
        color: 'White',
        occasion: 'wedding',
        orderDate: '2024-12-20',
        price: 89.99,
        isGroupOrder: true,
      },
      {
        id: 'ph3',
        productName: 'Black Bow Tie - Silk',
        category: 'Accessories',
        color: 'Black',
        occasion: 'wedding',
        orderDate: '2024-12-20',
        price: 45.99,
        isGroupOrder: true,
      },
    ],
    sizeProfile: {
      jacket: '42R',
      shirt: '16.5/34',
      pants: '34W/32L',
      shoes: '10.5',
      confidence: 0.95,
    },
    insights: {
      favoriteColors: ['Navy Blue', 'Black', 'Charcoal'],
      preferredFit: 'Slim',
      seasonalPreference: 'Fall/Winter',
      pricePoint: 'Premium',
      groupOrderCustomer: true,
    },
    recommendations: [
      {
        product: 'Charcoal Grey Suit - Slim Fit',
        reason: 'Matches your style preferences',
        confidence: 0.88,
        category: 'Business Formal',
      },
      {
        product: 'Navy Dress Shirt - French Cuff',
        reason: 'Complements recent tuxedo purchase',
        confidence: 0.75,
        category: 'Formal Shirts',
      },
    ],
  };

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
    loyaltyScore: 85, // Mock data
    riskScore: 15,    // Mock data
    joinDate: customer?.createdAt || new Date().toISOString(),
    lastPurchase: customer?.profile?.lastPurchaseDate || new Date().toISOString(),
    purchaseHistory: [], // Mock data
    sizeProfile: {      // Mock data for size tab
      jacketSize: '42R',
      shirtSize: '16/34',
      pantsSize: '34W/32L',
      shoeSize: '10',
      confidence: 85
    },
    insights: {         // Mock data for insights tab
      favoriteCategories: ['Blazers', 'Tuxedos'],
      favoriteColors: ['Navy', 'Black'],
      customerJourney: 'loyal',
      spendingTrend: 'stable'
    },
    recommendations: [] // Mock data for recommendations tab
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '#E5E4E2';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Enhanced Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: getTierColor(displayCustomer.tier),
                color: 'black',
                width: 64,
                height: 64,
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              {getInitials(displayCustomer.name)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {displayCustomer.name}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  label={displayCustomer.tier}
                  size="small"
                  sx={{
                    bgcolor: getTierColor(displayCustomer.tier),
                    color: 'black',
                    fontWeight: 'bold',
                  }}
                />
                {displayCustomer.vipStatus && (
                  <Chip label="VIP" size="small" color="secondary" />
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
          
          {/* Quick Stats */}
          <Box display="flex" gap={3} textAlign="center">
            <Box>
              <Typography variant="h6" color="primary">
                {displayCustomer.engagementScore}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Engagement
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main">
                {displayCustomer.loyaltyScore}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Loyalty
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="error.main">
                {displayCustomer.riskScore}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Risk
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Contact Info Bar */}
        <Box 
          mt={2} 
          p={2} 
          bgcolor={alpha(theme.palette.primary.main, 0.05)}
          borderRadius={1}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="body2" color="textSecondary">Email</Typography>
            <Typography variant="body1">{displayCustomer.email}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Phone</Typography>
            <Typography variant="body1">{displayCustomer.phone}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Member Since</Typography>
            <Typography variant="body1">{new Date(displayCustomer.joinDate).toLocaleDateString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Last Purchase</Typography>
            <Typography variant="body1">{new Date(displayCustomer.lastPurchase).toLocaleDateString()}</Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Enhanced Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<ShoppingBag />} 
            label="Purchase History" 
            iconPosition="start"
          />
          <Tab 
            icon={<Straighten />} 
            label="Size Profile" 
            iconPosition="start"
          />
          <Tab 
            icon={<Insights />} 
            label="Customer Insights" 
            iconPosition="start"
          />
          <Tab 
            icon={<Recommend />} 
            label="Recommendations" 
            iconPosition="start"
          />
          <Tab 
            icon={<Timeline />} 
            label="Timeline" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <DialogContent sx={{ p: 0, height: '100%' }}>
        <TabPanel value={activeTab} index={0}>
          <PurchaseHistoryTable 
            customerId={displayCustomer.id}
            purchaseHistory={displayCustomer.purchaseHistory}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <CustomerSizeProfile 
            customerId={displayCustomer.id}
            sizeProfile={displayCustomer.sizeProfile}
            purchaseHistory={displayCustomer.purchaseHistory}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <CustomerInsightsPanel 
            customerId={displayCustomer.id}
            insights={displayCustomer.insights}
            customerData={displayCustomer}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <ProductRecommendations 
            customerId={displayCustomer.id}
            recommendations={displayCustomer.recommendations}
            customerProfile={displayCustomer}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <CustomerTimeline 
            customerId={displayCustomer.id}
            purchaseHistory={displayCustomer.purchaseHistory}
          />
        </TabPanel>
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button variant="outlined" startIcon={<Person />}>
          Edit Customer
        </Button>
        <Button variant="outlined" startIcon={<ShoppingBag />}>
          New Order
        </Button>
        <Button variant="contained" color="primary">
          Contact Customer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedCustomerDetail; 