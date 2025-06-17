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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { SuitMeasurements, WeddingMember } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';

interface SuitMeasurementsFormProps {
  open: boolean;
  onClose: () => void;
  member: WeddingMember;
  weddingId: string;
  onUpdate: (updatedMember: WeddingMember) => void;
}

const schema = yup.object({
  // Jacket measurements
  jacketChest: yup.number().positive('Must be positive').nullable(),
  jacketWaist: yup.number().positive('Must be positive').nullable(),
  jacketLength: yup.number().positive('Must be positive').nullable(),
  shoulderWidth: yup.number().positive('Must be positive').nullable(),
  sleeveLength: yup.number().positive('Must be positive').nullable(),
  
  // Pants measurements
  pantWaist: yup.number().positive('Must be positive').nullable(),
  pantInseam: yup.number().positive('Must be positive').nullable(),
  pantOutseam: yup.number().positive('Must be positive').nullable(),
  pantRise: yup.number().positive('Must be positive').nullable(),
  pantThigh: yup.number().positive('Must be positive').nullable(),
  pantKnee: yup.number().positive('Must be positive').nullable(),
  pantHem: yup.number().positive('Must be positive').nullable(),
  
  // Shirt measurements
  shirtNeck: yup.number().positive('Must be positive').nullable(),
  shirtChest: yup.number().positive('Must be positive').nullable(),
  shirtWaist: yup.number().positive('Must be positive').nullable(),
  shirtSleeveLength: yup.number().positive('Must be positive').nullable(),
  shirtShoulderWidth: yup.number().positive('Must be positive').nullable(),
  
  // Fit preferences
  jacketFit: yup.string().oneOf(['slim', 'regular', 'relaxed']).nullable(),
  pantFit: yup.string().oneOf(['slim', 'regular', 'relaxed']).nullable(),
  
  // Notes
  alterationNotes: yup.string().nullable(),
  takenBy: yup.string().nullable(),
});

const SuitMeasurementsForm: React.FC<SuitMeasurementsFormProps> = ({
  open,
  onClose,
  member,
  weddingId,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<SuitMeasurements>({
    resolver: yupResolver(schema),
    defaultValues: member.suitMeasurements || {},
  });

  React.useEffect(() => {
    if (open) {
      reset(member.suitMeasurements || {});
    }
  }, [open, member.suitMeasurements, reset]);

  const onSubmit = async (data: SuitMeasurements) => {
    setLoading(true);
    try {
      const measurementsWithTimestamp = {
        ...data,
        finalizedAt: new Date(),
        takenBy: data.takenBy || 'Staff',
      };

      const updatedMember = weddingAPI.updateMemberSuitMeasurements(
        weddingId,
        member.id,
        measurementsWithTimestamp
      );

      if (updatedMember) {
        onUpdate(updatedMember);
        toast.success('Suit measurements saved successfully!');
        onClose();
      } else {
        toast.error('Failed to save measurements');
      }
    } catch (error) {
      console.error('Error saving suit measurements:', error);
      toast.error('Failed to save measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Suit Measurements - {member.name}
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
          {member.suitMeasurements?.finalizedAt && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Last updated: {new Date(member.suitMeasurements.finalizedAt).toLocaleDateString()}
              {member.suitMeasurements.takenBy && ` by ${member.suitMeasurements.takenBy}`}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Jacket Measurements */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Jacket Measurements (inches)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="jacketChest"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Chest"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.jacketChest}
                    helperText={errors.jacketChest?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="jacketWaist"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Waist"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.jacketWaist}
                    helperText={errors.jacketWaist?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="jacketLength"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Length"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.jacketLength}
                    helperText={errors.jacketLength?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="shoulderWidth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Shoulder Width"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.shoulderWidth}
                    helperText={errors.shoulderWidth?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="sleeveLength"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sleeve Length"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.sleeveLength}
                    helperText={errors.sleeveLength?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="jacketFit"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Jacket Fit</InputLabel>
                    <Select {...field} label="Jacket Fit">
                      <MenuItem value="slim">Slim</MenuItem>
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="relaxed">Relaxed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Pants Measurements */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pants Measurements (inches)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantWaist"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Waist"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantWaist}
                    helperText={errors.pantWaist?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantInseam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Inseam"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantInseam}
                    helperText={errors.pantInseam?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantOutseam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Outseam"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantOutseam}
                    helperText={errors.pantOutseam?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantRise"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Rise"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantRise}
                    helperText={errors.pantRise?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantThigh"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Thigh"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantThigh}
                    helperText={errors.pantThigh?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantKnee"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Knee"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantKnee}
                    helperText={errors.pantKnee?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantHem"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hem"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.25, min: 0 }}
                    error={!!errors.pantHem}
                    helperText={errors.pantHem?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                name="pantFit"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Pants Fit</InputLabel>
                    <Select {...field} label="Pants Fit">
                      <MenuItem value="slim">Slim</MenuItem>
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="relaxed">Relaxed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="takenBy"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Measured By"
                    fullWidth
                    placeholder="Staff member name"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="alterationNotes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Alteration Notes"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Any special alteration requirements or notes..."
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
            {loading ? 'Saving...' : 'Save Measurements'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SuitMeasurementsForm; 