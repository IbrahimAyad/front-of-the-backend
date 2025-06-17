import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ShoppingBag as OrderIcon,
  Straighten as MeasurementIcon,
  Event as AppointmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { customerAPI } from '../../services/api';

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

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  // Redirect if ID is invalid (like 'new')
  React.useEffect(() => {
    if (id === 'new' || !id || id.trim() === '') {
      navigate('/customers');
      return;
    }
  }, [id, navigate]);

  const {
    data: customerData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerAPI.getCustomer(id!),
    enabled: !!id && id !== 'new' && id.trim() !== '',
  });

  const customer = customerData?.data;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    // TODO: Open edit dialog or navigate to edit page
    console.log('Edit customer:', customer?.id);
  };

  const handleDelete = () => {
    // TODO: Show delete confirmation dialog
    console.log('Delete customer:', customer?.id);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load customer details. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Customer Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage customer information
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Customer Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer ID: {customer.id}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body1">{customer.email}</Typography>
                  </Box>
                  {customer.phone && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <PhoneIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body1">{customer.phone}</Typography>
                    </Box>
                  )}
                  {customer.address && (
                    <Box display="flex" alignItems="start" mb={1}>
                      <LocationIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1, mt: 0.2 }} />
                      <Typography variant="body1">{customer.address}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {customer.dateOfBirth && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body1">
                        {format(new Date(customer.dateOfBirth), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body1">
                      Customer since {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {customer.preferences && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Preferences
                  </Typography>
                  <Typography variant="body2">{customer.preferences}</Typography>
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              icon={<OrderIcon />} 
              label={`Orders (${customer.orders?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<MeasurementIcon />} 
              label={`Measurements (${customer.measurements?.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<AppointmentIcon />} 
              label={`Appointments (${customer.appointments?.length || 0})`} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          {customer.orders && customer.orders.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customer.orders.map((order: any) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {order.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={order.status === 'completed' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          ${Number(order.total).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.paymentStatus} 
                          size="small" 
                          color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        {order.dueDate ? format(new Date(order.dueDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <OrderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This customer hasn't placed any orders yet.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Measurements Tab */}
        <TabPanel value={tabValue} index={1}>
          {customer.measurements && customer.measurements.length > 0 ? (
            <Grid container spacing={3}>
              {customer.measurements.map((measurement: any) => (
                <Grid item xs={12} key={measurement.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                        <Typography variant="h6" gutterBottom>
                          Measurements
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recorded: {format(new Date(measurement.dateRecorded), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {measurement.chest && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Chest</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.chest}"</Typography>
                          </Grid>
                        )}
                        {measurement.waist && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Waist</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.waist}"</Typography>
                          </Grid>
                        )}
                        {measurement.hips && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Hips</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.hips}"</Typography>
                          </Grid>
                        )}
                        {measurement.shoulders && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Shoulders</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.shoulders}"</Typography>
                          </Grid>
                        )}
                        {measurement.armLength && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Arm Length</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.armLength}"</Typography>
                          </Grid>
                        )}
                        {measurement.inseam && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Inseam</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.inseam}"</Typography>
                          </Grid>
                        )}
                        {measurement.neck && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Neck</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.neck}"</Typography>
                          </Grid>
                        )}
                        {measurement.height && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Height</Typography>
                            <Typography variant="body1" fontWeight="medium">{measurement.height}"</Typography>
                          </Grid>
                        )}
                      </Grid>
                      {measurement.notes && (
                        <Box mt={2}>
                          <Typography variant="body2" color="text.secondary">Notes</Typography>
                          <Typography variant="body2">{measurement.notes}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <MeasurementIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No measurements recorded
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No measurements have been taken for this customer yet.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Appointments Tab */}
        <TabPanel value={tabValue} index={2}>
          {customer.appointments && customer.appointments.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customer.appointments.map((appointment: any) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {appointment.service}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(appointment.date), 'MMM dd, yyyy')} at {appointment.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.duration} minutes
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={appointment.status} 
                          size="small" 
                          color={appointment.status === 'completed' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.notes || 'No notes'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <AppointmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No appointments scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This customer doesn't have any appointments scheduled.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default CustomerDetailPage; 