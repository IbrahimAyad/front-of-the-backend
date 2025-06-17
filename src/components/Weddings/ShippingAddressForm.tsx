import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { ShippingAddress, WeddingMember } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';

interface ShippingAddressFormProps {
  open: boolean;
  onClose: () => void;
  member: WeddingMember;
  weddingId: string;
  onUpdate: (updatedMember: WeddingMember) => void;
}

const schema = yup.object({
  fullName: yup.string().required('Full name is required'),
  addressLine1: yup.string().required('Address line 1 is required'),
  addressLine2: yup.string().nullable(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zipCode: yup.string().required('ZIP code is required').matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: yup.string().required('Country is required'),
  phoneNumber: yup.string().nullable(),
  deliveryInstructions: yup.string().nullable(),
  isDefault: yup.boolean(),
});

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  open,
  onClose,
  member,
  weddingId,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ShippingAddress>({
    resolver: yupResolver(schema),
    defaultValues: member.shippingAddress || {
      fullName: member.name,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      phoneNumber: member.phone || '',
      deliveryInstructions: '',
      isDefault: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset(member.shippingAddress || {
        fullName: member.name,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        phoneNumber: member.phone || '',
        deliveryInstructions: '',
        isDefault: false,
      });
    }
  }, [open, member, reset]);

  const onSubmit = async (data: ShippingAddress) => {
    setLoading(true);
    try {
      const updatedMember = weddingAPI.updateMemberShippingAddress(
        weddingId,
        member.id,
        data
      );

      if (updatedMember) {
        onUpdate(updatedMember);
        toast.success('Shipping address saved successfully!');
        onClose();
      } else {
        toast.error('Failed to save shipping address');
      }
    } catch (error) {
      console.error('Error saving shipping address:', error);
      toast.error('Failed to save shipping address');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Shipping Address - {member.name}
          </Typography>
          <Chip 
            label={member.role.replace('_', ' ').toUpperCase()} 
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {member.shippingAddress && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Shipping address on file. Update as needed.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    required
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="addressLine1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 1"
                    fullWidth
                    required
                    placeholder="Street address, P.O. box, company name, c/o"
                    error={!!errors.addressLine1}
                    helperText={errors.addressLine1?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="addressLine2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 2 (Optional)"
                    fullWidth
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    error={!!errors.addressLine2}
                    helperText={errors.addressLine2?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City"
                    fullWidth
                    required
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="State"
                    fullWidth
                    required
                    placeholder="CA"
                    error={!!errors.state}
                    helperText={errors.state?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ZIP Code"
                    fullWidth
                    required
                    placeholder="12345"
                    error={!!errors.zipCode}
                    helperText={errors.zipCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country"
                    fullWidth
                    required
                    error={!!errors.country}
                    helperText={errors.country?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number (Optional)"
                    fullWidth
                    placeholder="For delivery notifications"
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="deliveryInstructions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Delivery Instructions (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Special delivery instructions, gate codes, etc."
                    error={!!errors.deliveryInstructions}
                    helperText={errors.deliveryInstructions?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value || false}
                      />
                    }
                    label="Set as default shipping address"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ShippingAddressForm; 