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
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Straighten as MeasureIcon,
  History as HistoryIcon,
  Recommend as RecommendIcon,

  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { measurementAPI, customerAPI } from '../../services/api';
import type { MeasurementFormData, Measurement, Customer } from '../../types';

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
      id={`measurements-tabpanel-${index}`}
      aria-labelledby={`measurements-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MeasurementsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeasurementFormData>({
    defaultValues: {
      customerId: 0,
      chest: undefined,
      waist: undefined,
      hips: undefined,
      shoulders: undefined,
      armLength: undefined,
      inseam: undefined,
      neck: undefined,
      height: undefined,
      weight: undefined,
      notes: '',
    },
  });

  // Fetch measurements
  const {
    data: measurementsData,
    error,
  } = useQuery({
    queryKey: ['measurements', { search: searchTerm }],
    queryFn: () => measurementAPI.getMeasurements({
      search: searchTerm || undefined,
    }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getCustomers({ limit: 100 }),
  });

  // Create measurement mutation
  const createMeasurementMutation = useMutation({
    mutationFn: measurementAPI.createMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      toast.success('Measurements recorded successfully!');
      setIsAddDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      console.error('Measurement creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to record measurements';
      toast.error(errorMessage);
    },
  });

  const measurements = measurementsData?.data?.measurements || [];
  const customers = customersData?.data?.customers || [];

  const handleAddMeasurement = (data: MeasurementFormData) => {
    createMeasurementMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    reset();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewCustomerMeasurements = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTabValue(1);
  };

  // Get size recommendations based on measurements
  const getSizeRecommendations = (measurement: Measurement) => {
    const recommendations = [];
    
    if (measurement.chest) {
      if (measurement.chest <= 36) recommendations.push('36R');
      else if (measurement.chest <= 38) recommendations.push('38R');
      else if (measurement.chest <= 40) recommendations.push('40R');
      else if (measurement.chest <= 42) recommendations.push('42R');
      else if (measurement.chest <= 44) recommendations.push('44R');
      else recommendations.push('46R+');
    }

    if (measurement.neck) {
      if (measurement.neck <= 14.5) recommendations.push('14.5" Neck');
      else if (measurement.neck <= 15) recommendations.push('15" Neck');
      else if (measurement.neck <= 15.5) recommendations.push('15.5" Neck');
      else if (measurement.neck <= 16) recommendations.push('16" Neck');
      else if (measurement.neck <= 16.5) recommendations.push('16.5" Neck');
      else recommendations.push('17"+ Neck');
    }

    return recommendations;
  };

  // Get measurement completeness score
  const getMeasurementCompleteness = (measurement: Measurement) => {
    const fields = ['chest', 'waist', 'hips', 'shoulders', 'armLength', 'inseam', 'neck', 'height'];
    const filledFields = fields.filter(field => measurement[field as keyof Measurement] != null);
    return Math.round((filledFields.length / fields.length) * 100);
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load measurements. Please try again later.
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
            Measurements System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record and track customer measurements for perfect fit
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Record Measurements
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MeasureIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {measurements.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
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
                <PersonIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {new Set(measurements.map(m => m.customerId)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customers Measured
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
                <HistoryIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {measurements.filter(m => new Date(m.dateRecorded) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
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
                <RecommendIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(measurements.reduce((acc, m) => acc + getMeasurementCompleteness(m), 0) / measurements.length || 0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Completeness
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
            <Tab label="All Measurements" />
            <Tab label="Customer History" />
            <Tab label="Size Recommendations" />
          </Tabs>
        </Box>

        {/* All Measurements Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box mb={2}>
            <TextField
              fullWidth
              placeholder="Search by customer name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date Recorded</TableCell>
                  <TableCell>Chest</TableCell>
                  <TableCell>Waist</TableCell>
                  <TableCell>Height</TableCell>
                  <TableCell>Completeness</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {measurement.customer?.name?.charAt(0) || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {measurement.customer?.name || 'Unknown Customer'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {measurement.customer?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(measurement.dateRecorded), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{measurement.chest ? `${measurement.chest}"` : '-'}</TableCell>
                    <TableCell>{measurement.waist ? `${measurement.waist}"` : '-'}</TableCell>
                    <TableCell>{measurement.height ? `${measurement.height}"` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${getMeasurementCompleteness(measurement)}%`}
                        color={getMeasurementCompleteness(measurement) >= 80 ? 'success' : 
                               getMeasurementCompleteness(measurement) >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCustomerMeasurements(measurement.customer!)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Customer History Tab */}
        <TabPanel value={tabValue} index={1}>
          {selectedCustomer ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Measurement History for {selectedCustomer.name}
              </Typography>
              <Grid container spacing={2}>
                {measurements
                  .filter(m => m.customerId === selectedCustomer.id)
                  .map((measurement) => (
                    <Grid item xs={12} md={6} key={measurement.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {format(new Date(measurement.dateRecorded), 'MMMM dd, yyyy')}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Chest</Typography>
                              <Typography variant="body1">{measurement.chest ? `${measurement.chest}"` : 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Waist</Typography>
                              <Typography variant="body1">{measurement.waist ? `${measurement.waist}"` : 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Shoulders</Typography>
                              <Typography variant="body1">{measurement.shoulders ? `${measurement.shoulders}"` : 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Height</Typography>
                              <Typography variant="body1">{measurement.height ? `${measurement.height}"` : 'N/A'}</Typography>
                            </Grid>
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
            </Box>
          ) : (
            <Alert severity="info">
              Select a customer from the measurements table to view their history.
            </Alert>
          )}
        </TabPanel>

        {/* Size Recommendations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Size Recommendations
          </Typography>
          <Grid container spacing={2}>
            {measurements.map((measurement) => {
              const recommendations = getSizeRecommendations(measurement);
              if (recommendations.length === 0) return null;
              
              return (
                <Grid item xs={12} md={6} key={measurement.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {measurement.customer?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Based on measurements from {format(new Date(measurement.dateRecorded), 'MMM dd, yyyy')}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {recommendations.map((rec, index) => (
                          <Chip key={index} label={rec} color="primary" size="small" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Card>

      {/* Add Measurement Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Record New Measurements</DialogTitle>
        <form onSubmit={handleSubmit(handleAddMeasurement)}>
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
              
              <Grid item xs={6}>
                <Controller
                  name="chest"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Chest (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="waist"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Waist (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="hips"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Hips (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="shoulders"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Shoulders (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="armLength"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Arm Length (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="inseam"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Inseam (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="neck"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Neck (inches)"
                      type="number"
                      inputProps={{ step: 0.25, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="height"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Height (inches)"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="weight"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Weight (lbs)"
                      type="number"
                      inputProps={{ step: 1, min: 0 }}
                    />
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
                      placeholder="Any special notes about the measurements..."
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
              {isSubmitting ? 'Recording...' : 'Record Measurements'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MeasurementsPage; 