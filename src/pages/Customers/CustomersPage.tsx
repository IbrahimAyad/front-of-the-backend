import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { customerAPI } from '../../services/api';
import ExportButton from '../../components/Export/ExportButton';

// Form validation schema
const customerSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Invalid email format'),
  phone: yup.string().nullable().optional(),
  address: yup.string().nullable().optional(),
  dateOfBirth: yup.string().nullable().optional(),
  preferences: yup.string().nullable().optional(),
});

type CustomerFormData = yup.InferType<typeof customerSchema>;

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      preferences: '',
    },
  });

  // Fetch customers
  const {
    data: customersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => customerAPI.getCustomers({ search: searchTerm }),
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: customerAPI.createCustomer,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
      setIsAddDialogOpen(false);
      setEmailError(null);
      reset();
      
      // Add console.log to debug the response structure
      console.log('Customer creation response:', response);
      
      // Navigate to customer detail page if ID is available
      if (response.success && response.data?.customer?.id) {
        console.log('Navigating to customer:', response.data.customer.id);
        navigate(`/customers/${response.data.customer.id}`);
      }
    },
    onError: (error: any) => {
      console.error('Customer creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create customer';
      const errorDetails = error.response?.data?.details;
      const statusCode = error.response?.status;
      
      // Handle specific error cases
      if (statusCode === 409 || errorMessage.includes('already exists')) {
        toast.error('A customer with this email address already exists. Please use a different email.');
      } else if (errorDetails && Array.isArray(errorDetails)) {
        const detailMessages = errorDetails.map((detail: any) => detail.message).join(', ');
        toast.error(`Validation Error: ${detailMessages}`);
      } else if (statusCode === 400) {
        toast.error('Please check your input and try again.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const customers = customersData?.data?.customers || [];

  // Check for duplicate email
  const checkDuplicateEmail = (email: string): boolean => {
    return customers.some(customer => customer.email.toLowerCase() === email.toLowerCase());
  };

  const handleAddCustomer = (data: CustomerFormData) => {
    // Clear any previous email error
    setEmailError(null);
    
    // Check for duplicate email before submitting
    const emailToCheck = data.email.trim();
    if (checkDuplicateEmail(emailToCheck)) {
      setEmailError('A customer with this email address already exists');
      toast.error('A customer with this email address already exists. Please use a different email.');
      return;
    }

    // Clean up data: convert empty strings to null for optional fields
    const cleanData = {
      name: data.name.trim(),
      email: emailToCheck,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      preferences: data.preferences?.trim() || undefined,
    };

    console.log('Submitting customer data:', cleanData);
    createCustomerMutation.mutate(cleanData);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEmailError(null);
    reset();
  };

  const handleEditCustomer = (customerId: string) => {
    // TODO: Open edit dialog or navigate to edit page
    console.log('Edit customer:', customerId);
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load customers. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Customers
        </Typography>
        <Box display="flex" gap={2}>
          <ExportButton
            data={customers}
            filename="customers"
            title="Customer List"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'address', label: 'Address' },
              { key: 'createdAt', label: 'Created Date' },
            ]}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            sx={{ px: 3 }}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : customers.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No customers found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first customer'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Address</strong></TableCell>
                    <TableCell><strong>Date Added</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer: any) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {customer.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {customer.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                          {customer.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.phone}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {customer.address ? (
                          <Box display="flex" alignItems="start" gap={1}>
                            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {customer.address}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No address
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="View customer details"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditCustomer(customer.id)}
                            title="Edit customer"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={createCustomerMutation.isPending}
        aria-labelledby="add-customer-dialog-title"
        aria-describedby="add-customer-dialog-description"
      >
        <form onSubmit={handleSubmit(handleAddCustomer)}>
                  <DialogTitle id="add-customer-dialog-title">
          Add New Customer
        </DialogTitle>
          <DialogContent>
            <Typography 
              id="add-customer-dialog-description" 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2 }}
            >
              Fill in the customer information below. Required fields are marked with an asterisk (*).
            </Typography>
            
            {emailError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {emailError}
              </Alert>
            )}
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!errors.email || !!emailError}
                      helperText={errors.email?.message || emailError}
                      required
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear email error when user starts typing
                        if (emailError) {
                          setEmailError(null);
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="e.g., +1-555-0123"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      placeholder="e.g., 123 Main St, New York, NY 10001"
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="preferences"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Preferences (Style, Fabric, etc.)"
                      multiline
                      rows={2}
                      placeholder="e.g., Prefers modern style, wool fabrics, navy colors"
                      error={!!errors.preferences}
                      helperText={errors.preferences?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              disabled={createCustomerMutation.isPending}
              tabIndex={createCustomerMutation.isPending ? -1 : 0}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || createCustomerMutation.isPending}
              startIcon={createCustomerMutation.isPending ? <CircularProgress size={16} /> : <AddIcon />}
              tabIndex={createCustomerMutation.isPending ? -1 : 0}
            >
              {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CustomersPage; 