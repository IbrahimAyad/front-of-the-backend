import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,

} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ShoppingBag as OrderIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { orderAPI, customerAPI, productAPI } from '../../services/api';
import type { OrderFormData } from '../../types';

// Form validation schema
const orderSchema = yup.object({
  customerId: yup.number().required('Customer is required'),
  items: yup.array().of(
    yup.object({
      productId: yup.number().required('Product is required'),
      quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      price: yup.number().min(0, 'Price must be positive').required('Price is required'),
      customizations: yup.string().optional(),
    })
  ).min(1, 'At least one item is required').required(),
  dueDate: yup.string().optional(),
  notes: yup.string().optional(),
}) satisfies yup.ObjectSchema<OrderFormData>;

const OrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      items: [{ productId: 0, quantity: 1, price: 0, customizations: '' }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Fetch orders
  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', { search: searchTerm, status: statusFilter, paymentStatus: paymentFilter }],
    queryFn: () => orderAPI.getOrders({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
    }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getCustomers({ limit: 100 }),
  });

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getProducts({ limit: 100 }),
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: orderAPI.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully!');
      setIsAddDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      console.error('Order creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create order';
      toast.error(errorMessage);
    },
  });

  const orders = ordersData?.data?.orders || [];
  const customers = customersData?.data?.customers || [];
  const products = productsData?.data?.products || [];

  const handleAddOrder = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    reset();
  };

  const handleEditOrder = (orderId: string) => {
    console.log('Edit order:', orderId);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate total for form
  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Order status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Payment status colors
  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  // Filter orders by status
  const ordersByStatus = {
    new: orders.filter(order => order.status === 'new'),
    in_progress: orders.filter(order => order.status === 'in_progress'),
    completed: orders.filter(order => order.status === 'completed'),
    cancelled: orders.filter(order => order.status === 'cancelled'),
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load orders. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and track customer orders through production
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Create Order
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <OrderIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {orders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
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
                    {ordersByStatus.in_progress.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
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
                    {ordersByStatus.completed.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
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
                <MoneyIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Orders" />
            <Tab label="Status Board" />
          </Tabs>
        </Box>

        {/* All Orders Tab */}
        {tabValue === 0 && (
          <CardContent>
            {/* Filters */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
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
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentFilter}
                    label="Payment Status"
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <MenuItem value="">All Payment Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Orders Table */}
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {order.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {order.customer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.customer.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status.replace('_', ' ')} 
                            size="small" 
                            color={getStatusColor(order.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.paymentStatus} 
                            size="small" 
                            color={getPaymentColor(order.paymentStatus) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="medium">
                            ${Number(order.total).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.dueDate ? (
                            <Typography variant="body2">
                              {format(new Date(order.dueDate), 'MMM dd, yyyy')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/orders/${order.id}`)}
                              title="View order details"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditOrder(order.id)}
                              title="Edit order"
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
        )}

        {/* Status Board Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Grid container spacing={2}>
              {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
                <Grid item xs={12} md={3} key={status}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom textTransform="capitalize">
                        {status.replace('_', ' ')} ({statusOrders.length})
                      </Typography>
                      <Box>
                        {statusOrders.map((order: any) => (
                          <Card key={order.id} sx={{ mb: 1, p: 1 }} variant="outlined">
                            <Typography variant="body2" fontWeight="medium">
                              {order.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.customer.name}
                            </Typography>
                            <Typography variant="caption" display="block" fontWeight="medium">
                              ${Number(order.total).toFixed(2)}
                            </Typography>
                          </Card>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Create Order Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown={createOrderMutation.isPending}
      >
        <form onSubmit={handleSubmit(handleAddOrder)}>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.customerId}>
                      <InputLabel>Customer *</InputLabel>
                      <Select
                        {...field}
                        label="Customer *"
                      >
                        {customers.map((customer: any) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Order Items */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                {fields.map((field, index) => (
                  <Card key={field.id} sx={{ mb: 2, p: 2 }} variant="outlined">
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Controller
                          name={`items.${index}.productId`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.items?.[index]?.productId}>
                              <InputLabel>Product *</InputLabel>
                              <Select
                                {...field}
                                label="Product *"
                              >
                                {products.map((product: any) => (
                                  <MenuItem key={product.id} value={product.id}>
                                    {product.name} - ${product.price}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Quantity *"
                              type="number"
                              inputProps={{ min: 1 }}
                              error={!!errors.items?.[index]?.quantity}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller
                          name={`items.${index}.price`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Price *"
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              error={!!errors.items?.[index]?.price}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Controller
                          name={`items.${index}.customizations`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Customizations"
                              placeholder="Special requests..."
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        {fields.length > 1 && (
                          <IconButton 
                            color="error" 
                            onClick={() => remove(index)}
                            title="Remove item"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Card>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => append({ productId: 0, quantity: 1, price: 0, customizations: '' })}
                >
                  Add Item
                </Button>
              </Grid>

              {/* Order Total */}
              <Grid item xs={12}>
                <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" textAlign="right">
                    Total: ${calculateTotal().toFixed(2)}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Due Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
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
                      label="Order Notes"
                      multiline
                      rows={3}
                      placeholder="Special instructions or notes..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              disabled={createOrderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || createOrderMutation.isPending}
              startIcon={createOrderMutation.isPending ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default OrdersPage; 