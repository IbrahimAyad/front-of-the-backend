import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Warning,
  Delete,
  Cancel,
  ShoppingBag,
  Event,
  Assignment,
  Person,
} from '@mui/icons-material';
import { customerAPI } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile?: {
    customerTier: string;
    vipStatus: boolean;
    totalOrders: number;
    totalSpent: string;
  };
}

interface CustomerDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerDeleteDialog: React.FC<CustomerDeleteDialogProps> = ({
  open,
  onClose,
  customer,
}) => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!customer) return;

    setDeleting(true);
    setError(null);

    try {
      await customerAPI.deleteCustomer(customer.id);
      
      // Invalidate and refetch customer data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast.success(`Customer ${customer.name} deleted successfully`);
      onClose();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      setError(error.response?.data?.message || 'Failed to delete customer');
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!customer) return null;

  const isVIP = customer.profile?.vipStatus;
  const hasOrders = (customer.profile?.totalOrders || 0) > 0;
  const totalSpent = parseFloat(customer.profile?.totalSpent || '0');
  const tier = customer.profile?.customerTier || 'Silver';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Warning color="error" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="error">
              Delete Customer
            </Typography>
            <Typography variant="caption" color="textSecondary">
              This action cannot be undone
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Customer Information */}
        <Box display="flex" alignItems="center" gap={2} mb={3} p={2} 
             sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {customer.name?.charAt(0) ?? '?'}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6">{customer.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {customer.email}
            </Typography>
            {customer.phone && (
              <Typography variant="body2" color="textSecondary">
                {customer.phone}
              </Typography>
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            <Chip 
              label={tier}
              size="small"
              sx={{ 
                backgroundColor: tier === 'Platinum' ? '#E5E4E2' : 
                               tier === 'Gold' ? '#FFD700' :
                               tier === 'Silver' ? '#C0C0C0' : '#CD7F32',
                color: 'black',
                fontWeight: 'bold'
              }}
            />
            {isVIP && (
              <Chip label="VIP" color="warning" size="small" />
            )}
          </Box>
        </Box>

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this customer? This will also delete:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Person color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Customer Profile & Analytics"
              secondary="All engagement scores, tier status, and profile data"
            />
          </ListItem>
          
          {hasOrders && (
            <ListItem>
              <ListItemIcon>
                <ShoppingBag color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={`${customer.profile?.totalOrders} Order${(customer.profile?.totalOrders || 0) > 1 ? 's' : ''}`}
                secondary={`Total value: $${totalSpent.toLocaleString()}`}
              />
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <Event color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Appointments & Measurements"
              secondary="All scheduled appointments and sizing data"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Assignment color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Customer History"
              secondary="All notes, communications, and interaction history"
            />
          </ListItem>
        </List>

        {isVIP && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ⚠️ <strong>VIP Customer Warning:</strong> This customer has VIP status. 
              Deleting them will remove all VIP privileges and special handling.
            </Typography>
          </Alert>
        )}

        {totalSpent > 1000 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              🚨 <strong>High-Value Customer:</strong> This customer has spent 
              ${totalSpent.toLocaleString()}. Consider carefully before deleting.
            </Typography>
          </Alert>
        )}

        <Box mt={3} p={2} sx={{ backgroundColor: 'error.50', borderRadius: 1 }}>
          <Typography variant="body2" color="error.dark">
            <strong>This action is permanent and cannot be undone.</strong>
            <br />
            Consider deactivating the customer instead of deleting if you might need their data later.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<Cancel />}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          startIcon={<Delete />}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDeleteDialog; 