import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Avatar,
} from '@mui/material';
import { Save, Close } from '@mui/icons-material';
import { customerAPI } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  profile?: {
    customerTier: string;
    vipStatus: boolean;
    engagementScore: number;
    totalSpent: string;
    totalOrders: number;
    averageOrderValue: string;
  };
}

interface CustomerEditModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  open,
  onClose,
  customer,
}) => {
  const queryClient = useQueryClient();
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    notes: '',
    // Profile data
    customerTier: 'Silver',
    vipStatus: false,
    engagementScore: 0,
  });

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || 'US',
        notes: customer.notes || '',
        customerTier: customer.profile?.customerTier || 'Silver',
        vipStatus: customer.profile?.vipStatus || false,
        engagementScore: customer.profile?.engagementScore || 0,
      });
      setError(null);
    }
  }, [customer]);

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!formData.name && !formData.firstName && !formData.lastName) {
      setError('At least name or first/last name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);

    try {
      // Prepare update data
      const updateData = {
        name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        country: formData.country,
        notes: formData.notes || null,
      };

      // Update customer
      await customerAPI.updateCustomer(customer!.id, updateData);

      // Invalidate and refetch customer data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast.success('Customer updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setError(error.response?.data?.message || 'Failed to update customer');
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {customer.name?.charAt(0) ?? '?'}
          </Avatar>
          <Box>
            <Typography variant="h6">Edit Customer</Typography>
            <Typography variant="caption" color="textSecondary">
              Customer ID: {customer.id}
            </Typography>
          </Box>
          <Chip 
            label={formData.customerTier}
            sx={{ 
              backgroundColor: formData.customerTier === 'Platinum' ? '#E5E4E2' : 
                             formData.customerTier === 'Gold' ? '#FFD700' :
                             formData.customerTier === 'Silver' ? '#C0C0C0' : '#CD7F32',
              color: 'black',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={handleInputChange('phone')}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Customer Tier</InputLabel>
              <Select
                value={formData.customerTier}
                label="Customer Tier"
                onChange={handleInputChange('customerTier')}
              >
                <MenuItem value="Bronze">Bronze</MenuItem>
                <MenuItem value="Silver">Silver</MenuItem>
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Platinum">Platinum</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Address Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={handleInputChange('address')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleInputChange('city')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="State"
              value={formData.state}
              onChange={handleInputChange('state')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={formData.zipCode}
              onChange={handleInputChange('zipCode')}
            />
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Additional Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.vipStatus}
                  onChange={handleInputChange('vipStatus')}
                />
              }
              label="VIP Status"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Engagement Score"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={formData.engagementScore}
              onChange={handleInputChange('engagementScore')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Add any additional notes about this customer..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<Close />}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerEditModal; 