import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  LocalOffer as OfferIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { customerAPI } from '../../services/api';
import CustomerJourney from '../../components/CRM/CustomerJourney';
import CustomerLoyalty from '../../components/CRM/CustomerLoyalty';
import FollowUpSystem from '../../components/CRM/FollowUpSystem';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { frontendConfig } from '../../utils/config';

interface Customer {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  lifetimeValue: number;
  loyaltyTier: string;
  lastInteraction: Date;
}

// Types for mock data (for UI only)
type CRMStats = {
  totalCustomers: number;
  activeLeads: number;
  loyaltyMembers: number;
  pendingFollowUps: number;
  avgCustomerValue: number;
  retentionRate: number;
  npsScore: number;
  conversionRate: number;
};

const CRMDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch customers data
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getCustomers({ limit: 100 }),
  });

  // Mock CRM stats
  const mockCRMStats: CRMStats = {
    totalCustomers: 156,
    activeLeads: 23,
    loyaltyMembers: 89,
    pendingFollowUps: 12,
    avgCustomerValue: 2450,
    retentionRate: 87.5,
    npsScore: 8.4,
    conversionRate: 34.2,
  };

  // Mock top customers for quick access
  const mockTopCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0101',
      totalOrders: 8,
      lifetimeValue: 4500,
      loyaltyTier: 'Gold',
      lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Michael Smith',
      email: 'michael.smith@example.com',
      phone: '+1-555-0102',
      totalOrders: 12,
      lifetimeValue: 7200,
      loyaltyTier: 'Platinum',
      lastInteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-0103',
      totalOrders: 5,
      lifetimeValue: 2800,
      loyaltyTier: 'Silver',
      lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  // Feature flag logic for mock/real data
  const crmStats = frontendConfig.USE_MOCK_DATA ? mockCRMStats : {
    totalCustomers: customersData?.data?.pagination?.total ?? 0,
    activeLeads: 0, // TODO: Replace with real data
    loyaltyMembers: 0, // TODO: Replace with real data
    pendingFollowUps: 0, // TODO: Replace with real data
    avgCustomerValue: 0, // TODO: Replace with real data
    retentionRate: 0, // TODO: Replace with real data
    npsScore: 0, // TODO: Replace with real data
    conversionRate: 0, // TODO: Replace with real data
  };
  const topCustomers = frontendConfig.USE_MOCK_DATA ? mockTopCustomers : [];

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchOpen(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#9E9E9E';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Relationship Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer relationships, loyalty programs, and automated follow-ups
        </Typography>
      </Box>

      {/* CRM Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {crmStats.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <StarIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {crmStats.loyaltyMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Loyalty Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <NotificationsIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {crmStats.pendingFollowUps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Follow-ups
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {crmStats.activeLeads}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Leads
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Customer Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => setCustomerSearchOpen(true)}
            >
              Select Customer
            </Button>
          </Box>

          {selectedCustomer ? (
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getTierColor(selectedCustomer.loyaltyTier) }}>
                  {selectedCustomer.name.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{selectedCustomer.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCustomer.email}
                  </Typography>
                </Box>
                <Chip
                  label={`${selectedCustomer.loyaltyTier} Member`}
                  sx={{ bgcolor: getTierColor(selectedCustomer.loyaltyTier), color: 'white' }}
                />
                <Typography variant="body2" color="text.secondary">
                  LTV: ${selectedCustomer.lifetimeValue.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                Select a customer to view their journey, loyalty status, and manage follow-ups
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Quick Access - Top Customers */}
      {!selectedCustomer && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Customers - Quick Access
            </Typography>
            <List>
              {topCustomers.map((customer, index) => (
                <ListItem component="li" button onClick={() => handleCustomerSelect(customer)} sx={{ borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getTierColor(customer.loyaltyTier) }}>
                      {customer.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{customer.name}</Typography>
                        <Chip
                          label={customer.loyaltyTier}
                          size="small"
                          sx={{ bgcolor: getTierColor(customer.loyaltyTier), color: 'white' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {customer.email} • {customer.totalOrders} orders • ${customer.lifetimeValue.toLocaleString()} LTV
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* CRM Tabs */}
      <Card>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label="Customer Journey"
            icon={<TimelineIcon />}
            iconPosition="start"
          />
          <Tab
            label="Loyalty Program"
            icon={<StarIcon />}
            iconPosition="start"
          />
          <Tab
            label="Follow-up System"
            icon={<EmailIcon />}
            iconPosition="start"
          />
        </Tabs>

        <CardContent>
          {/* Customer Journey Tab */}
          {selectedTab === 0 && (
            <Box>
              {selectedCustomer ? (
                <CustomerJourney
                  customerId={selectedCustomer.id}
                  customerName={selectedCustomer.name}
                  customerEmail={selectedCustomer.email}
                />
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Customer Journey Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a customer to view their complete interaction timeline,
                    track touchpoints, and manage next actions.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Loyalty Program Tab */}
          {selectedTab === 1 && (
            <Box>
              {selectedCustomer ? (
                <CustomerLoyalty
                  customerId={selectedCustomer.id}
                  customerName={selectedCustomer.name}
                />
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Loyalty Program Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a customer to view their loyalty status, points balance,
                    tier benefits, and available offers.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Follow-up System Tab */}
          {selectedTab === 2 && (
            <Box>
              <FollowUpSystem
                customerId={selectedCustomer?.id}
                showAllCustomers={!selectedCustomer}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Customer Search Dialog */}
      <Dialog
        open={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={customersData?.data?.customers || []}
              getOptionLabel={(option: any) => `${option.name} (${option.email})`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search customers"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, option: any) => (
                <Box component="li" {...props}>
                  <Avatar sx={{ mr: 2 }}>
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              onChange={(event, value) => {
                if (value) {
                  const customer: Customer = {
                    id: value.id,
                    name: value.name,
                    email: value.email,
                    phone: value.phone,
                    totalOrders: 0, // Would come from API
                    lifetimeValue: 0, // Would come from API
                    loyaltyTier: 'Bronze', // Would come from API
                    lastInteraction: new Date(),
                  };
                  handleCustomerSelect(customer);
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CRMDashboard; 