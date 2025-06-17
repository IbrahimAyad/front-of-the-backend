import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { appointmentAPI, customerAPI } from '../../services/api';
import type { AppointmentFormData } from '../../types';
import { CLIENT_CONFIG } from '../../config/client';

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
      id={`appointments-tabpanel-${index}`}
      aria-labelledby={`appointments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Types for mock data (for UI only)
type UIAppointment = {
  id: number;
  customerId: number;
  customer: { name: string };
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string;
};
type UICustomer = {
  id: number;
  name: string;
  email: string;
};
// Mock data for development
const mockAppointments: UIAppointment[] = [
  { id: 1, customerId: 1, customer: { name: 'John Doe' }, service: 'consultation', date: '2024-06-20', time: '10:00', duration: 60, status: 'confirmed', notes: 'Initial consult' },
  { id: 2, customerId: 2, customer: { name: 'Jane Smith' }, service: 'fitting', date: '2024-06-21', time: '14:00', duration: 45, status: 'completed', notes: 'Suit fitting' },
  { id: 3, customerId: 3, customer: { name: 'Michael Brown' }, service: 'pickup', date: '2024-06-22', time: '16:00', duration: 30, status: 'pending', notes: 'Order pickup' },
];
const mockCustomers: UICustomer[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
  { id: 3, name: 'Michael Brown', email: 'michael.brown@example.com' },
];

const AppointmentsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    defaultValues: {
      customerId: 0,
      service: 'consultation' as const,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      duration: 60,
      notes: '',
    },
  });

  // Fetch appointments
  const {
    data: appointmentsData,
    error,
  } = useQuery({
    queryKey: ['appointments', { search: searchTerm, status: statusFilter, service: serviceFilter }],
    queryFn: () => appointmentAPI.getAppointments({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      service: serviceFilter || undefined,
    }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getCustomers({ limit: 100 }),
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: appointmentAPI.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment scheduled successfully!');
      setIsAddDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      console.error('Appointment creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to schedule appointment';
      toast.error(errorMessage);
    },
  });

  // Feature flag logic for mock/real data
  const appointments = CLIENT_CONFIG.USE_MOCK_DATA ? mockAppointments : appointmentsData?.data?.appointments || [];
  const customers = CLIENT_CONFIG.USE_MOCK_DATA ? mockCustomers : customersData?.data?.customers || [];

  const handleAddAppointment = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    reset();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get appointment status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  // Get service color
  const getServiceColor = (service: string) => {
    switch (service) {
      case 'consultation': return 'primary';
      case 'measurements': return 'info';
      case 'fitting': return 'warning';
      case 'pickup': return 'success';
      default: return 'default';
    }
  };

  // Generate calendar week view
  const generateWeekDays = (date: Date) => {
    const start = startOfWeek(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const weekDays = generateWeekDays(selectedDate);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.date), date)
    );
  };

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      return appointmentDate >= today && appointmentDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get today's appointments
  const getTodaysAppointments = () => {
    return getAppointmentsForDate(new Date());
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load appointments. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Appointments Scheduling
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage consultations, fittings, and customer appointments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Schedule Appointment
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {appointments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Appointments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {getTodaysAppointments().length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Schedule
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <NotificationIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {getUpcomingAppointments().length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming (7 days)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {appointments.filter(a => a.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Calendar View" />
            <Tab label="All Appointments" />
            <Tab label="Today's Schedule" />
          </Tabs>
        </Box>

        {/* Calendar View Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Week of {format(weekDays[0], 'MMMM dd, yyyy')}
            </Typography>
            <Box>
              <Button
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                sx={{ mr: 1 }}
              >
                Previous Week
              </Button>
              <Button
                onClick={() => setSelectedDate(new Date())}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Today
              </Button>
              <Button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                Next Week
              </Button>
            </Box>
          </Box>

          <Grid container spacing={1}>
            {weekDays.map((day, index) => (
              <Grid item xs key={index}>
                <Card sx={{ minHeight: 200 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {format(day, 'EEE dd')}
                    </Typography>
                    <List dense>
                      {getAppointmentsForDate(day).map((appointment) => (
                        <ListItem key={appointment.id} sx={{ px: 0 }}>
                          <Box width="100%">
                            <Typography variant="caption" display="block">
                              {appointment.time}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {appointment.customer?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={appointment.service}
                              size="small"
                              color={getServiceColor(appointment.service)}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* All Appointments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box mb={2} display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Service</InputLabel>
              <Select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                label="Service"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="measurements">Measurements</MenuItem>
                <MenuItem value="fitting">Fitting</MenuItem>
                <MenuItem value="pickup">Pickup</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {appointment.customer?.name?.charAt(0) || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {appointment.customer?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.customer?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.service}
                        color={getServiceColor(appointment.service)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(appointment.date), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointment.time}
                      </Typography>
                    </TableCell>
                    <TableCell>{appointment.duration} min</TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Appointment">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Today's Schedule Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Today's Schedule - {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </Typography>
          
          {getTodaysAppointments().length === 0 ? (
            <Alert severity="info">No appointments scheduled for today.</Alert>
          ) : (
            <List>
              {getTodaysAppointments()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getServiceColor(appointment.service) + '.main' }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {appointment.time} - {appointment.customer?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={appointment.service}
                              size="small"
                              color={getServiceColor(appointment.service)}
                            />
                            <Chip
                              label={appointment.status}
                              size="small"
                              color={getStatusColor(appointment.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Duration: {appointment.duration} minutes
                            </Typography>
                            {appointment.notes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {appointment.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                    </ListItem>
                    {index < getTodaysAppointments().length - 1 && <Divider />}
                  </React.Fragment>
                ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Schedule Appointment Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <form onSubmit={handleSubmit(handleAddAppointment)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="customerId"
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.customerId}>
                      <InputLabel>Customer</InputLabel>
                      <Select {...field} label="Customer">
                        {customers.map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="service"
                  control={control}
                  rules={{ required: 'Service is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.service}>
                      <InputLabel>Service</InputLabel>
                      <Select {...field} label="Service">
                        <MenuItem value="consultation">Consultation</MenuItem>
                        <MenuItem value="measurements">Measurements</MenuItem>
                        <MenuItem value="fitting">Fitting</MenuItem>
                        <MenuItem value="pickup">Pickup</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: 'Date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="time"
                  control={control}
                  rules={{ required: 'Time is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.time}
                      helperText={errors.time?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Duration</InputLabel>
                      <Select {...field} label="Duration">
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={90}>1.5 hours</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      placeholder="Any special notes for this appointment..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage; 