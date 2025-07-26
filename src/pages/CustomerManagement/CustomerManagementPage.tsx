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
} from '@mui/material';
import {
  Add,
  People,
  TrendingUp,
  Event,
  Rule,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CLIENT_CONFIG } from '../../config/client';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

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
  const [selectedCustomer, setSelectedCustomer] = useState<UICustomer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);

  // Real data fetching with enhanced customer analytics
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers({ 
    page, 
    limit: pageSize,
    search: searchTerm 
  });
  
  // Enhanced data processing with analytics
  const realCustomers: UICustomer[] = (customersData as any)?.data?.customers ? 
    (customersData as any).data.customers.map((c: any) => ({
      ...c,
      status: c.profile?.vipStatus ? 'VIP' : 'Active',
      value: parseFloat(c.profile?.totalSpent || '0'),
      lastVisit: c.profile?.lastPurchaseDate ? new Date(c.profile.lastPurchaseDate).toLocaleDateString() : 'Never',
      tier: c.profile?.customerTier || 'Silver',
      totalOrders: c.profile?.totalOrders || 0,
      averageOrderValue: parseFloat(c.profile?.averageOrderValue || '0'),
      engagementScore: c.profile?.engagementScore || 0,
    })) : [];

  const pagination = (customersData as any)?.data?.pagination;
  const analytics = (customersData as any)?.data?.analytics;

  // TODO: Replace with real data fetching for leads, appointments, and measurements
  const realLeads: UILead[] = [];
  const realAppointments: UIAppointment[] = [];
  const realMeasurements: UIMeasurement[] = [];

  // Use real data if available, otherwise fallback to mock data
  const customers = realCustomers.length > 0 ? realCustomers : mockCustomers;
  const leads = CLIENT_CONFIG.USE_MOCK_DATA ? mockLeads : realLeads;
  const appointments = CLIENT_CONFIG.USE_MOCK_DATA ? mockAppointments : realAppointments;
  const measurements = CLIENT_CONFIG.USE_MOCK_DATA ? mockMeasurements : realMeasurements;

  // Customer action handlers
  const handleCustomerClick = (customer: UICustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleEditCustomer = (customer: UICustomer) => {
    console.log('Edit customer:', customer);
    // TODO: Open edit modal
  };

  const handleDeleteCustomer = (customer: UICustomer) => {
    console.log('Delete customer:', customer);
    // TODO: Show confirmation dialog and delete
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event: any) => {
    setPageSize(event.target.value);
    setPage(1); // Reset to first page
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
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

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
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
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
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
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage customers, leads, appointments, and measurements
        </Typography>
      </Box>

      {/* Analytics Summary Cards */}
      {analytics && (
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
                      {analytics.totalCustomers?.toLocaleString() || '0'}
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
                      ${analytics.totalRevenue?.toLocaleString() || '0'}
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
                      {analytics.averageEngagement || 0}%
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
                      {analytics.totalOrders?.toLocaleString() || '0'}
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
            value={customers.length}
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

      {/* Enhanced Search and Controls */}
      <Box mb={3}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
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
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              fullWidth
            >
              Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              onClick={() => setShowAddCustomer(true)}
            >
              New Customer
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={(e, v) => setValue(v)} aria-label="customer management tabs">
            <Tab 
              label={`CUSTOMERS (${pagination?.total || customers.length})`} 
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
                {customers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleCustomerClick(customer)}
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
                      <Typography variant="h6" fontWeight="bold" color={customer.value > 0 ? 'primary' : 'textSecondary'}>
                        ${customer.value?.toLocaleString() || '0.00'}
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
                        <MoreVert />
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
                        <MoreVert />
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
                        <MoreVert />
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
        onClose={() => setShowCustomerDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedCustomer?.name?.charAt(0) ?? '?'}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedCustomer?.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                Customer ID: {selectedCustomer?.id}
              </Typography>
            </Box>
            {selectedCustomer?.tier && (
              <Chip 
                label={selectedCustomer.tier}
                sx={{ 
                  backgroundColor: selectedCustomer.tier === 'Platinum' ? '#E5E4E2' : 
                                 selectedCustomer.tier === 'Gold' ? '#FFD700' :
                                 selectedCustomer.tier === 'Silver' ? '#C0C0C0' : '#CD7F32',
                  color: 'black',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Contact Information</Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Email</Typography>
                  <Typography variant="body1">{selectedCustomer.email}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{selectedCustomer.phone || 'Not provided'}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Address</Typography>
                  <Typography variant="body1">
                    {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.zipCode]
                      .filter(Boolean).join(', ') || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Purchase Analytics</Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Total Spent</Typography>
                  <Typography variant="h5" color="primary">${selectedCustomer.value?.toLocaleString() || '0.00'}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Total Orders</Typography>
                  <Typography variant="body1">{selectedCustomer.totalOrders || 0}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Average Order Value</Typography>
                  <Typography variant="body1">${selectedCustomer.averageOrderValue?.toFixed(2) || '0.00'}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Engagement Score</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedCustomer.engagementScore || 0}
                      sx={{ width: 100, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body1">{selectedCustomer.engagementScore || 0}%</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomerDetail(false)}>Close</Button>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => handleEditCustomer(selectedCustomer!)}
          >
            Edit Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerManagementPage; 