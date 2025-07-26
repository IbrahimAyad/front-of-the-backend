import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Badge,
  useTheme,
  alpha,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  People,
  TrendingUp,
  Event,
  Straighten,
  Add,
  Search,
  FilterList,
  MoreVert,
  Star,
  DiamondOutlined,
  LocalOffer,
  AttachMoney,
  ShoppingBag,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CLIENT_CONFIG } from '../../config/client';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types';

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
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  // Real data fetching (customers only for now) - moved inside component
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const realCustomers: UICustomer[] = (customersData as any)?.data?.customers ? 
    (customersData as any).data.customers.map((c: Customer) => ({
      ...c,
      status: 'Active', // TODO: Add status field to Customer type
      value: 0, // TODO: Replace with real value
      lastVisit: '', // TODO: Replace with real last visit
    })) : [];
  // TODO: Replace with real data fetching for leads, appointments, and measurements
  const realLeads: UILead[] = [];
  const realAppointments: UIAppointment[] = [];
  const realMeasurements: UIMeasurement[] = [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // In the component logic, use CLIENT_CONFIG.USE_MOCK_DATA to determine data source
  const customers = CLIENT_CONFIG.USE_MOCK_DATA ? mockCustomers : realCustomers;
  const leads = CLIENT_CONFIG.USE_MOCK_DATA ? mockLeads : realLeads;
  const appointments = CLIENT_CONFIG.USE_MOCK_DATA ? mockAppointments : realAppointments;
  const measurements = CLIENT_CONFIG.USE_MOCK_DATA ? mockMeasurements : realMeasurements;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Customer Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage customers, leads, appointments, and measurements in one place
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/leads/new')}
          >
            New Lead
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/customers')}
          >
            New Customer
          </Button>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
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

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search customers, leads, appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer management tabs">
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <People />
                  Customers
                  <Badge badgeContent={customers.length} color="primary" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp />
                  Leads
                  <Badge badgeContent={leads.length} color="secondary" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Event />
                  Appointments
                  <Badge badgeContent={appointments.length} color="success" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Straighten />
                  Measurements
                  <Badge badgeContent={measurements.length} color="warning" />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Customers Tab */}
        <TabPanel value={tabValue} index={0}>
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
                  <TableRow key={customer.id} hover>
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
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{customer.email}</Typography>
                        <Typography variant="body2" color="textSecondary">{customer.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip 
                          label={customer.status ?? 'N/A'} 
                          color={getStatusColor(customer.status) as any}
                          size="small"
                        />
                        {customer.engagementScore && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LinearProgress
                              variant="determinate"
                              value={customer.engagementScore}
                              sx={{ width: 40, height: 4, borderRadius: 2 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {customer.engagementScore}%
                            </Typography>
                          </Box>
                        )}
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
                        {customer.averageOrderValue && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AttachMoney sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="textSecondary">
                              Avg: ${customer.averageOrderValue}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ${customer.value?.toLocaleString() || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {customer.engagementScore && customer.engagementScore >= 80 ? (
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        ) : null}
                        <Typography variant="body2">
                          {customer.lastVisit || 'N/A'}
                        </Typography>
                      </Box>
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

        {/* Leads Tab */}
        <TabPanel value={tabValue} index={1}>
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
        <TabPanel value={tabValue} index={2}>
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
        <TabPanel value={tabValue} index={3}>
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
    </Box>
  );
};

export default CustomerManagementPage; 