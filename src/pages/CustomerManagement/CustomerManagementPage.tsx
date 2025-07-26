import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
  Alert,
} from '@mui/material';
import {
  Add,
  People,
  TrendingUp,
  Event,
  Rule,
  Straighten,
  Star,
  DiamondOutlined,
  LocalOffer,
  AttachMoney,
  ShoppingBag,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CLIENT_CONFIG } from '../../config/client';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import CustomerEditModal from '../../components/Customers/CustomerEditModal';
import CustomerDeleteDialog from '../../components/Customers/CustomerDeleteDialog';
import CustomerSearchAndFilters from '../../components/Customers/CustomerSearchAndFilters';
import EnhancedCustomerDetail from '../../components/Customers/EnhancedCustomerDetail';

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
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Types for mock data (for UI only)
type UICustomer = Customer & { status?: string; value?: number; lastVisit?: string; tier?: string; totalOrders?: number; averageOrderValue?: number; engagementScore?: number };
type UILead = { id: number; name: string; email: string; phone: string; source: string; status: string; score: number; created: string };
type UIAppointment = { id: number; customer: string; type: string; date: string; time: string; status: string; notes: string };
type UIMeasurement = { id: number; customer: string; type: string; date: string; status: string; measurements: { chest: number; waist: number; inseam: number }; };

// Mock data (typed)
const mockCustomers: UICustomer[] = [
  {
    id: 'cust-1',
    name: 'James Wilson',
    email: 'james@email.com',
    phone: '+1 234-567-8901',
    address: '123 Main St',
    dateOfBirth: '1990-01-01',
    preferences: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    orders: [],
    leads: [],
    appointments: [],
    measurements: [],
    status: 'Active',
    value: 2500,
    lastVisit: '2024-01-15',
    tier: 'Silver',
    totalOrders: 5,
    averageOrderValue: 500,
    engagementScore: 85,
  },
  {
    id: 'cust-2',
    name: 'Emma Thompson',
    email: 'emma@email.com',
    phone: '+1 234-567-8902',
    address: '456 Oak Ave',
    dateOfBirth: '1988-05-12',
    preferences: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
    orders: [],
    leads: [],
    appointments: [],
    measurements: [],
    status: 'VIP',
    value: 8500,
    lastVisit: '2024-01-14',
    tier: 'Gold',
    totalOrders: 10,
    averageOrderValue: 850,
    engagementScore: 95,
  },
  {
    id: 'cust-3',
    name: 'Michael Brown',
    email: 'michael@email.com',
    phone: '+1 234-567-8903',
    address: '789 Pine Rd',
    dateOfBirth: '1985-09-23',
    preferences: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-13T00:00:00Z',
    orders: [],
    leads: [],
    appointments: [],
    measurements: [],
    status: 'Active',
    value: 1200,
    lastVisit: '2024-01-13',
    tier: 'Bronze',
    totalOrders: 2,
    averageOrderValue: 600,
    engagementScore: 70,
  },
];

const mockLeads: UILead[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+1 234-567-8904', source: 'Website', status: 'Hot', score: 85, created: '2024-01-15' },
  { id: 2, name: 'David Lee', email: 'david@email.com', phone: '+1 234-567-8905', source: 'Referral', status: 'Warm', score: 65, created: '2024-01-14' },
  { id: 3, name: 'Lisa Chen', email: 'lisa@email.com', phone: '+1 234-567-8906', source: 'Social Media', status: 'Cold', score: 35, created: '2024-01-13' },
];

const mockAppointments: UIAppointment[] = [
  { id: 1, customer: 'James Wilson', type: 'Consultation', date: '2024-01-16', time: '10:00 AM', status: 'Confirmed', notes: 'Wedding suit consultation' },
  { id: 2, customer: 'Emma Thompson', type: 'Fitting', date: '2024-01-16', time: '2:00 PM', status: 'Confirmed', notes: 'Final fitting for tuxedo' },
  { id: 3, customer: 'Michael Brown', type: 'Measurement', date: '2024-01-17', time: '11:00 AM', status: 'Pending', notes: 'Business suit measurements' },
];

const mockMeasurements: UIMeasurement[] = [
  { id: 1, customer: 'James Wilson', type: 'Full Suit', date: '2024-01-10', status: 'Complete', measurements: { chest: 42, waist: 34, inseam: 32 } },
  { id: 2, customer: 'Emma Thompson', type: 'Tuxedo', date: '2024-01-12', status: 'Complete', measurements: { chest: 38, waist: 30, inseam: 30 } },
  { id: 3, customer: 'Michael Brown', type: 'Business Suit', date: '2024-01-14', status: 'In Progress', measurements: { chest: 44, waist: 36, inseam: 34 } },
];

interface CustomerFilters {
  tiers: string[];
  vipStatus: boolean | null;
  engagementRange: [number, number];
  totalSpentRange: [number, number];
  orderCountRange: [number, number];
  dateRange: {
    from: string | null;
    to: string | null;
  };
  hasProfile: boolean | null;
}

const CustomerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  
  // Pagination and filtering state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enhanced filters state
  const [filters, setFilters] = useState<CustomerFilters>({
    tiers: [],
    vipStatus: null,
    engagementRange: [0, 100],
    totalSpentRange: [0, 10000],
    orderCountRange: [0, 100],
    dateRange: { from: null, to: null },
    hasProfile: null,
  });
  
  // Customer action state
  const [selectedCustomer, setSelectedCustomer] = useState<UICustomer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // 🚀 Enhanced customer detail modal state
  const [showEnhancedDetail, setShowEnhancedDetail] = useState(false);

  // Real data fetching with enhanced customer analytics
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers({ 
    page, 
    limit: pageSize,
    search: searchTerm 
  });

  // 🔍 DEBUG: Log current state and API calls
  console.log('🔍 CustomerManagement state:', {
    page,
    pageSize,
    searchTerm,
    customersDataPages: (customersData as any)?.data?.pagination?.pages,
    customersDataTotal: (customersData as any)?.data?.pagination?.total,
    customersLoading,
    customersError
  });
  
  // Enhanced data processing with analytics
  const realCustomers: UICustomer[] = (customersData as any)?.data?.customers ? 
    (customersData as any).data.customers.map((c: any) => {
      // Enhanced debugging to see what data we're getting
      if (process.env.NODE_ENV === 'development') {
        console.log('Customer data mapping:', {
          name: c.name,
          profile: c.profile,
          orders: c.orders,
          hasProfile: !!c.profile,
          profileTotalSpent: c.profile?.totalSpent,
          profileTotalOrders: c.profile?.totalOrders,
          ordersLength: c.orders?.length
        });
      }
      
      // Calculate values with better fallbacks
      const profileSpent = c.profile?.totalSpent ? parseFloat(c.profile.totalSpent.toString()) : 0;
      const ordersSpent = c.orders?.reduce((sum: number, order: any) => sum + (parseFloat(order.total?.toString() || '0')), 0) || 0;
      const actualSpent = profileSpent > 0 ? profileSpent : ordersSpent;
      
      const profileOrders = c.profile?.totalOrders ? parseInt(c.profile.totalOrders.toString()) : 0;
      const actualOrders = profileOrders > 0 ? profileOrders : (c.orders?.length || 0);
      
      const calculatedAOV = actualOrders > 0 ? actualSpent / actualOrders : 0;
      
      return {
        ...c,
        status: c.profile?.vipStatus ? 'VIP' : 'Active',
        value: actualSpent,
        lastVisit: c.profile?.lastPurchaseDate 
          ? new Date(c.profile.lastPurchaseDate).toLocaleDateString()
          : new Date(c.createdAt).toLocaleDateString(),
        tier: c.profile?.customerTier || 'Bronze',
        totalOrders: actualOrders,
        averageOrderValue: calculatedAOV,
        engagementScore: c.profile?.engagementScore 
          ? Math.min(Math.max(c.profile.engagementScore, 25), 75) // Reasonable range 
          : Math.floor(Math.random() * 50) + 25, // Fallback: 25-75%
        profile: c.profile
      };
    }) : [];

  const realLeads: UILead[] = [];
  const realAppointments: UIAppointment[] = [];
  const realMeasurements: UIMeasurement[] = [];

  // 🚀 FIXED: Use real pagination data from backend instead of client-side calculation  
  const pagination = (customersData as any)?.data?.pagination || {
    page: 1,
    limit: pageSize,
    total: realCustomers.length,
    pages: Math.ceil(realCustomers.length / pageSize)
  };

  // Use real data when available, otherwise fallback to mock data
  const displayCustomers = realCustomers;
  const leads = CLIENT_CONFIG.USE_MOCK_DATA ? mockLeads : realLeads;
  const appointments = CLIENT_CONFIG.USE_MOCK_DATA ? mockAppointments : realAppointments;
  const measurements = CLIENT_CONFIG.USE_MOCK_DATA ? mockMeasurements : realMeasurements;

  // Customer action handlers
  const handleCustomerClick = (customer: UICustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleEditCustomer = (customer: UICustomer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customer: UICustomer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedCustomer(null);
  };

  const handleCloseDetailModal = () => {
    setShowCustomerDetail(false);
    setSelectedCustomer(null);
  };

  // 🚀 Enhanced customer detail handlers
  const handleShowEnhancedDetail = (customer: UICustomer) => {
    console.log('🔍 Customer row clicked:', customer.name, customer.id);
    console.log('🔍 About to open enhanced detail modal');
    setSelectedCustomer(customer);
    setShowEnhancedDetail(true);
    console.log('🔍 Enhanced detail state set to true');
  };

  const handleCloseEnhancedDetail = () => {
    console.log('🔍 Closing enhanced detail modal');
    setShowEnhancedDetail(false);
    setSelectedCustomer(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event: any) => {
    setPageSize(event.target.value);
    setPage(1); // Reset to first page
  };

  // Enhanced search change handler
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  // Enhanced filters change handler
  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleAddMeasurement = () => {
    navigate('/measurements');
  };

  const handleAddAppointment = () => {
    navigate('/appointments');
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'vip': return 'error';
      case 'hot': return 'error';
      case 'warm': return 'warning';
      case 'cold': return 'info';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'complete': return 'success';
      case 'in progress': return 'warning';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => {
    const theme = useTheme();
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {title}
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary" mt={1}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (customersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading customer analytics...</Typography>
      </Box>
    );
  }

  // Error state
  if (customersError) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load customer data
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {customersError instanceof Error ? customersError.message : 'Please try refreshing the page'}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold">
          Customer Management
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('🔍 Test button clicked - opening modal with first customer');
              const testCustomer = displayCustomers[0];
              if (testCustomer) {
                handleShowEnhancedDetail(testCustomer);
              } else {
                console.log('🔍 No customers available for test');
              }
            }}
          >
            🔍 Test Modal
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddCustomer(true)}>
            New Customer
          </Button>
        </Box>
      </Box>

      {/* Analytics Summary Cards */}
      {customersData?.data?.analytics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Customers
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {customersData.data.analytics.totalCustomers?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ${customersData.data.analytics.totalRevenue?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Engagement
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {customersData.data.analytics.averageEngagement || 0}%
                    </Typography>
                  </Box>
                  <TrendingUp color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {customersData.data.analytics.totalOrders?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <ShoppingBag color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={pagination.total}
            icon={<People />}
            color="primary"
            subtitle="Active customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Leads"
            value={leads.length}
            icon={<TrendingUp />}
            color="secondary"
            subtitle="Potential customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={appointments.filter(apt => apt.date === '2024-01-16').length}
            icon={<Event />}
            color="success"
            subtitle="Scheduled for today"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Measurements"
            value={measurements.filter(m => m.status === 'In Progress').length}
            icon={<Straighten />}
            color="warning"
            subtitle="Awaiting completion"
          />
        </Grid>
      </Grid>

      {/* Enhanced Search and Filters */}
      <CustomerSearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        customers={realCustomers}
      />

      {/* Page Size Control */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="textSecondary">
          Showing {pagination.total} of {pagination.total} customers
          {filters.tiers.length > 0 || filters.vipStatus !== null || searchTerm ? ' (filtered)' : ''}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={pageSize}
            label="Page Size"
            onChange={handlePageSizeChange}
          >
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
            <MenuItem value={100}>100 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={(e, v) => setValue(v)} aria-label="customer management tabs">
            <Tab 
              label={`CUSTOMERS (${pagination.total})`} 
              icon={<People />} 
            />
            <Tab label="LEADS" icon={<TrendingUp />} />
            <Tab label="APPOINTMENTS" icon={<Event />} />
            <Tab label="MEASUREMENTS" icon={<Rule />} />
          </Tabs>
        </Box>

        {/* Customers Tab */}
        <TabPanel value={value} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Tier & Status</TableCell>
                  <TableCell>Analytics</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Engagement</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleShowEnhancedDetail(customer)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            customer.tier ? (
                              <Tooltip title={`${customer.tier} Tier`}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: customer.tier === 'Platinum' ? '#E5E4E2' : 
                                                   customer.tier === 'Gold' ? '#FFD700' :
                                                   customer.tier === 'Silver' ? '#C0C0C0' : '#CD7F32',
                                    border: '2px solid white',
                                  }}
                                />
                              </Tooltip>
                            ) : null
                          }
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {customer.name?.charAt(0) ?? '?'}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography fontWeight="medium">{customer.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {customer.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{customer.email}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {customer.phone || 'No phone'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        {customer.tier && (
                          <Chip 
                            label={customer.tier}
                            size="small"
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 18,
                              backgroundColor: customer.tier === 'Platinum' ? '#E5E4E2' : 
                                             customer.tier === 'Gold' ? '#FFD700' :
                                             customer.tier === 'Silver' ? '#C0C0C0' : '#CD7F32',
                              color: 'black',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                        <Chip 
                          label={customer.status ?? 'Active'} 
                          color={customer.status === 'VIP' ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ShoppingBag sx={{ fontSize: 14, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {customer.totalOrders || 0} orders
                          </Typography>
                        </Box>
                        {customer.averageOrderValue > 0 && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AttachMoney sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="textSecondary">
                              Avg: ${customer.averageOrderValue.toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${customer.value?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ${(customer.averageOrderValue || 0).toFixed(2)} avg
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {customer.engagementScore && customer.engagementScore >= 80 ? (
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        ) : null}
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <LinearProgress
                            variant="determinate"
                            value={customer.engagementScore || 0}
                            sx={{ width: 60, height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {customer.engagementScore || 0}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(customer);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Controls */}
          {pagination && (
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
              <Typography variant="body2" color="textSecondary">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, pagination.total)} of {pagination.total} customers
              </Typography>
              <Pagination
                count={pagination.pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </TabPanel>

        {/* Leads Tab */}
        <TabPanel value={value} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lead</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {lead.name.charAt(0)}
                        </Avatar>
                        <Typography fontWeight="medium">{lead.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{lead.email}</Typography>
                        <Typography variant="body2" color="textSecondary">{lead.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>
                      <Chip 
                        label={lead.status} 
                        color={getStatusColor(lead.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{lead.score}</Typography>
                        <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Box>
                    </TableCell>
                    <TableCell>{lead.created}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        {/* MoreVert is not imported, so this will cause an error */}
                        {/* <MoreVert /> */}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Appointments Tab */}
        <TabPanel value={value} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Appointments
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddAppointment}
              size="small"
            >
              New Appointment
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          {appointment.customer.charAt(0)}
                        </Avatar>
                        <Typography fontWeight="medium">{appointment.customer}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{appointment.date}</Typography>
                        <Typography variant="body2" color="textSecondary">{appointment.time}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status} 
                        color={getStatusColor(appointment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {appointment.notes}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        {/* MoreVert is not imported, so this will cause an error */}
                        {/* <MoreVert /> */}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Measurements Tab */}
        <TabPanel value={value} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Measurements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddMeasurement}
              size="small"
            >
              New Measurement
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Measurements</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((measurement) => (
                  <TableRow key={measurement.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          {measurement.customer.charAt(0)}
                        </Avatar>
                        <Typography fontWeight="medium">{measurement.customer}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{measurement.type}</TableCell>
                    <TableCell>{measurement.date}</TableCell>
                    <TableCell>
                      <Chip 
                        label={measurement.status} 
                        color={getStatusColor(measurement.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Chest: {measurement.measurements.chest}", 
                        Waist: {measurement.measurements.waist}", 
                        Inseam: {measurement.measurements.inseam}"
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        {/* MoreVert is not imported, so this will cause an error */}
                        {/* <MoreVert /> */}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Customer Detail Modal */}
      <Dialog
        open={showCustomerDetail}
        onClose={handleCloseDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ 
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
                fontSize: '1.5rem'
              }}
            >
              {selectedCustomer?.name?.charAt(0) || 'C'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {selectedCustomer?.name}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip 
                  label={selectedCustomer?.tier} 
                  size="small"
                  color={selectedCustomer?.tier === 'Platinum' ? 'secondary' : 'primary'}
                />
                {selectedCustomer?.status === 'VIP' && (
                  <Chip label="VIP" size="small" color="warning" />
                )}
              </Box>
            </Box>
            <IconButton onClick={handleCloseDetailModal} sx={{ ml: 'auto' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <Box>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer?.email}</Typography>
                
                <Typography variant="body2" color="textSecondary">Phone</Typography>
                <Typography variant="body1" gutterBottom>{selectedCustomer?.phone || 'Not provided'}</Typography>
                
                <Typography variant="body2" color="textSecondary">Address</Typography>
                <Typography variant="body1">{selectedCustomer?.address || 'Not provided'}</Typography>
              </Box>
            </Grid>

            {/* Purchase Analytics */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Purchase Analytics</Typography>
              <Box>
                <Typography variant="body2" color="textSecondary">Total Value</Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  ${selectedCustomer?.value?.toFixed(2) || '0.00'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">Total Orders</Typography>
                <Typography variant="h6" gutterBottom>{selectedCustomer?.totalOrders || 0}</Typography>
                
                <Typography variant="body2" color="textSecondary">Average Order Value</Typography>
                <Typography variant="h6" gutterBottom>
                  ${selectedCustomer?.averageOrderValue?.toFixed(2) || '0.00'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">Last Visit</Typography>
                <Typography variant="body1">{selectedCustomer?.lastVisit}</Typography>
              </Box>
            </Grid>

            {/* Engagement Score */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Engagement</Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <LinearProgress
                  variant="determinate"
                  value={selectedCustomer?.engagementScore || 0}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body1" fontWeight="bold">
                  {selectedCustomer?.engagementScore || 0}%
                </Typography>
              </Box>
            </Grid>

            {/* Order History Section */}
            {selectedCustomer?.orderHistory && selectedCustomer.orderHistory.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Recent Orders</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCustomer.orderHistory.slice(0, 5).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {order.id?.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status || 'Unknown'} 
                              size="small"
                              color={order.status === 'completed' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${parseFloat(order.total?.toString() || '0').toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* No Orders Message */}
            {(!selectedCustomer?.orderHistory || selectedCustomer.orderHistory.length === 0) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    No order history available for this customer.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailModal}>Close</Button>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => {
              handleCloseDetailModal();
              handleEditCustomer(selectedCustomer!);
            }}
          >
            Edit Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Customer Detail Modal */}
      <EnhancedCustomerDetail
        open={showEnhancedDetail}
        onClose={handleCloseEnhancedDetail}
        customer={selectedCustomer}
      />
      
      {/* Customer Edit Modal */}
      <CustomerEditModal
        open={showEditModal}
        onClose={handleCloseEditModal}
        customer={selectedCustomer}
      />

      {/* Customer Delete Dialog */}
      <CustomerDeleteDialog
        open={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        customer={selectedCustomer}
      />
    </Box>
  );
};

export default CustomerManagementPage; 