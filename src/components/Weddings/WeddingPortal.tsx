import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Straighten as MeasureIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Home as HomeIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Timeline as ProgressIcon,
  PhotoCamera as CameraIcon,
  Schedule as ClockIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { WeddingParty, WeddingMember, WeddingMeasurements } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';

interface MeasurementFormData {
  chest: number;
  waist: number;
  inseam: number;
  neck: number;
  sleeve: number;
  height: number;
  weight: number;
  notes: string;
}

interface ShippingFormData {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  deliveryInstructions: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const WeddingPortal: React.FC = () => {
  const [weddingCode, setWeddingCode] = useState('');
  const [wedding, setWedding] = useState<WeddingParty | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WeddingMember | null>(null);

  // Progress tracking and achievements
  const getProgressSteps = () => ['Measurements', 'Shipping', 'Payment'];
  
  const getMemberProgress = (member: WeddingMember) => {
    let completed = 0;
    if (member.measurements) completed++;
    if (member.shippingAddress) completed++;
    if (member.orderStatus === 'delivered' || member.orderStatus === 'shipped') completed++;
    return { completed, total: 3, percentage: (completed / 3) * 100 };
  };

  const getAchievements = (member: WeddingMember) => {
    const achievements = [];
    if (member.measurements) {
      achievements.push({ 
        icon: '📏', 
        title: 'Measured Up!', 
        description: 'Measurements submitted' 
      });
    }
    if (member.shippingAddress) {
      achievements.push({ 
        icon: '📦', 
        title: 'Ready to Ship!', 
        description: 'Shipping address provided' 
      });
    }
    if (member.orderStatus === 'delivered') {
      achievements.push({ 
        icon: '🎉', 
        title: 'All Set!', 
        description: 'Order completed' 
      });
    }
    return achievements;
  };

  const getOverallProgress = () => {
    if (!wedding) return { completed: 0, total: 0, percentage: 0 };
    
    const totalSteps = wedding.members.length * 3;
    let completedSteps = 0;
    
    wedding.members.forEach(member => {
      completedSteps += getMemberProgress(member).completed;
    });
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    };
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeasurementFormData>();

  const {
    control: shippingControl,
    handleSubmit: handleShippingSubmit,
    reset: resetShipping,
    formState: { errors: shippingErrors },
  } = useForm<ShippingFormData>();

  const {
    control: paymentControl,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<PaymentFormData>();

  const handleSearchWedding = async () => {
    if (!weddingCode.trim()) {
      toast.error('Please enter a wedding code');
      return;
    }

    setLoading(true);
    try {
      const foundWedding = await weddingAPI.getWeddingByCode(weddingCode.toUpperCase());
      if (foundWedding) {
        setWedding(foundWedding);
        toast.success('Wedding party found!');
      } else {
        toast.error('Wedding party not found. Please check your code.');
      }
    } catch (error) {
      console.error('Error searching wedding:', error);
      toast.error('Error searching for wedding party');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMeasurements = async (data: MeasurementFormData) => {
    if (!selectedMember || !wedding) return;

    try {
      const measurements: WeddingMeasurements = {
        ...data,
        submittedAt: new Date(),
      };

      await weddingAPI.updateWeddingMember(wedding.id, selectedMember.id, {
        measurements,
        measurementStatus: 'submitted',
      });

      toast.success('Measurements submitted successfully!');
      setShowMeasurementForm(false);
      setSelectedMember(null);
      reset();
      
      // Refresh wedding data
      const updatedWedding = await weddingAPI.getWeddingByCode(wedding.weddingCode);
      if (updatedWedding) {
        setWedding(updatedWedding);
      }
    } catch (error) {
      console.error('Error submitting measurements:', error);
      toast.error('Failed to submit measurements');
    }
  };

  const handleSubmitShipping = async (data: ShippingFormData) => {
    if (!selectedMember || !wedding) return;

    try {
      const shippingAddress = {
        ...data,
        submittedAt: new Date(),
      };

      await weddingAPI.updateMemberShippingAddress(wedding.id, selectedMember.id, shippingAddress);

      toast.success('Shipping address saved successfully!');
      setShowShippingForm(false);
      setSelectedMember(null);
      resetShipping();
      
      // Refresh wedding data
      const updatedWedding = await weddingAPI.getWeddingByCode(wedding.weddingCode);
      if (updatedWedding) {
        setWedding(updatedWedding);
      }
    } catch (error) {
      console.error('Error submitting shipping address:', error);
      toast.error('Failed to save shipping address');
    }
  };

  const handleSubmitPayment = async (data: PaymentFormData) => {
    if (!selectedMember || !wedding) return;

    try {
      // Note: In a real implementation, you would process payment through a secure payment gateway
      // For now, we'll just save the payment intent
      toast('Payment processing will be implemented soon!', { icon: 'ℹ️' });
      
      // Update member status to indicate payment submitted
      await weddingAPI.updateMemberOrderStatus(wedding.id, selectedMember.id, 'pending');

      toast.success('Payment information received! You will be contacted for processing.');
      setShowPaymentForm(false);
      setSelectedMember(null);
      resetPayment();
      
      // Refresh wedding data
      const updatedWedding = await weddingAPI.getWeddingByCode(wedding.weddingCode);
      if (updatedWedding) {
        setWedding(updatedWedding);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to process payment information');
    }
  };

  const openMeasurementForm = (member: WeddingMember) => {
    setSelectedMember(member);
    setShowMeasurementForm(true);
    
    // Pre-fill form if measurements exist
    if (member.measurements) {
      reset({
        chest: member.measurements.chest || 0,
        waist: member.measurements.waist || 0,
        inseam: member.measurements.inseam || 0,
        neck: member.measurements.neck || 0,
        sleeve: member.measurements.sleeve || 0,
        height: member.measurements.height || 0,
        weight: member.measurements.weight || 0,
        notes: member.measurements.notes || '',
      });
    }
  };

  const openShippingForm = (member: WeddingMember) => {
    setSelectedMember(member);
    setShowShippingForm(true);
    
    // Pre-fill form if shipping address exists
    if (member.shippingAddress) {
      resetShipping({
        fullName: member.shippingAddress.fullName || '',
        addressLine1: member.shippingAddress.addressLine1 || '',
        addressLine2: member.shippingAddress.addressLine2 || '',
        city: member.shippingAddress.city || '',
        state: member.shippingAddress.state || '',
        zipCode: member.shippingAddress.zipCode || '',
        country: member.shippingAddress.country || 'United States',
        phoneNumber: member.shippingAddress.phoneNumber || '',
        deliveryInstructions: member.shippingAddress.deliveryInstructions || '',
      });
    }
  };

  const openPaymentForm = (member: WeddingMember) => {
    setSelectedMember(member);
    setShowPaymentForm(true);
  };

  const getStatusColor = (status: WeddingMember['measurementStatus']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: WeddingMember['role']) => {
    switch (role) {
      case 'groom': return '🤵';
      case 'best_man': return '👨‍💼';
      case 'groomsman': return '👥';
      case 'father_groom': return '👨‍🦳';
      case 'father_bride': return '👨‍🦳';
      case 'guest': return '👤';
      default: return '👤';
    }
  };

  if (!wedding) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" mb={2}>
              💍 Wedding Portal
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Enter your wedding code to access your party information and submit measurements.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Wedding Code"
                placeholder="Enter 6-character code"
                value={weddingCode}
                onChange={(e) => setWeddingCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchWedding()}
                inputProps={{ maxLength: 6 }}
              />
              <Button
                variant="contained"
                onClick={handleSearchWedding}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>
            
            <Alert severity="info">
              <Typography variant="body2">
                Your wedding code was provided by the couple or wedding coordinator.
                If you don't have it, please contact them directly.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
  const completedMeasurements = wedding.members.filter(m => m.measurementStatus === 'completed').length;
  const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
  const overallProgress = getOverallProgress();
  const completedShipping = wedding.members.filter(m => m.shippingAddress).length;
  const completedPayments = wedding.members.filter(m => m.orderStatus === 'delivered' || m.orderStatus === 'shipped').length;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h3" fontWeight="bold" mb={1}>
                {wedding.groomInfo.name} & {wedding.brideInfo.name}
              </Typography>
              <Typography variant="h5" color="text.secondary" mb={2}>
                {format(wedding.weddingDate, 'MMMM dd, yyyy')}
              </Typography>
              <Chip 
                label={`${daysUntilWedding} days to go!`}
                color={daysUntilWedding < 30 ? 'error' : 'primary'}
                size="medium"
                icon={<ClockIcon />}
              />
            </Box>

            {/* Overall Progress */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <ProgressIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Overall Progress: {Math.round(overallProgress.percentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overallProgress.percentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  }
                }} 
              />
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
                {overallProgress.completed} of {overallProgress.total} steps completed
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ textAlign: 'center' }}>
              <Grid item xs={12} md={3}>
                <Box>
                  <GroupsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {wedding.members.length} Members
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In wedding party
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Badge badgeContent={completedMeasurements} color="success">
                    <MeasureIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  </Badge>
                  <Typography variant="h6" fontWeight="bold">
                    {completedMeasurements}/{wedding.members.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Measurements
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Badge badgeContent={completedShipping} color="info">
                    <ShippingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  </Badge>
                  <Typography variant="h6" fontWeight="bold">
                    {completedShipping}/{wedding.members.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shipping Addresses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Badge badgeContent={completedPayments} color="warning">
                    <PaymentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  </Badge>
                  <Typography variant="h6" fontWeight="bold">
                    {completedPayments}/{wedding.members.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payments
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Wedding Details */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Wedding Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Style</Typography>
                <Typography mb={2}>
                  {wedding.stylePreferences.suitColor.replace('_', ' ').toUpperCase()} {wedding.attireType.type.replace('_', ' ').toUpperCase()}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Accessories</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {wedding.accessories.map((accessory) => (
                    <Chip key={accessory} label={accessory.replace('_', ' ')} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Special Requests</Typography>
                <Typography>
                  {wedding.specialRequests || 'None specified'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Party Members */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Wedding Party Members
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Achievements</TableCell>
                    <TableCell>Measurements</TableCell>
                    <TableCell>Shipping Address</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wedding.members.map((member) => {
                    const progress = getMemberProgress(member);
                    const achievements = getAchievements(member);
                    
                    return (
                      <TableRow key={member.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{getRoleIcon(member.role)}</Typography>
                            <Box>
                              <Typography fontWeight="bold">{member.name}</Typography>
                              {member.specialNotes && (
                                <Typography variant="caption" color="text.secondary">
                                  {member.specialNotes}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.role.replace('_', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.round(progress.percentage)}%
                              </Typography>
                              {progress.percentage === 100 && (
                                <CelebrationIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              )}
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress.percentage} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                }
                              }} 
                            />
                            <Typography variant="caption" color="text.secondary">
                              {progress.completed}/{progress.total} steps
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {achievements.map((achievement, index) => (
                              <Tooltip 
                                key={index}
                                title={`${achievement.title}: ${achievement.description}`}
                                arrow
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    fontSize: 12,
                                    bgcolor: 'success.light',
                                    cursor: 'help'
                                  }}
                                >
                                  {achievement.icon}
                                </Avatar>
                              </Tooltip>
                            ))}
                            {achievements.length === 0 && (
                              <Typography variant="caption" color="text.secondary">
                                No achievements yet
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.measurementStatus.toUpperCase()}
                            color={getStatusColor(member.measurementStatus)}
                            size="small"
                          />
                          {member.measurements && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {format(member.measurements.submittedAt, 'MMM dd')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.shippingAddress ? 'COMPLETED' : 'PENDING'}
                            color={member.shippingAddress ? 'success' : 'warning'}
                            size="small"
                          />
                          {member.shippingAddress && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {member.shippingAddress.city}, {member.shippingAddress.state}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.orderStatus ? member.orderStatus.toUpperCase() : 'NOT STARTED'}
                            color={member.orderStatus === 'delivered' ? 'success' : member.orderStatus === 'pending' ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant={member.measurementStatus === 'pending' ? 'contained' : 'outlined'}
                              size="small"
                              startIcon={<MeasureIcon />}
                              onClick={() => openMeasurementForm(member)}
                            >
                              Measurements
                            </Button>
                            <Button
                              variant={!member.shippingAddress ? 'contained' : 'outlined'}
                              size="small"
                              startIcon={<ShippingIcon />}
                              onClick={() => openShippingForm(member)}
                              color={!member.shippingAddress ? 'warning' : 'primary'}
                            >
                              Shipping
                            </Button>
                            <Button
                              variant={!member.orderStatus || member.orderStatus === 'pending' ? 'contained' : 'outlined'}
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => openPaymentForm(member)}
                              color={!member.orderStatus ? 'success' : 'primary'}
                              disabled={!member.measurements || !member.shippingAddress}
                            >
                              Payment
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {wedding.members.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }} variant="outlined">
                <GroupsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No party members added yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The couple will add members soon
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>

        {/* Measurement Form Dialog */}
        <Dialog 
          open={showMeasurementForm} 
          onClose={() => setShowMeasurementForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Submit Measurements - {selectedMember?.name}
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Please provide accurate measurements in inches. If you're unsure about any measurement,
                leave it blank and add a note. Our team will follow up with you.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="chest"
                  control={control}
                  rules={{ min: { value: 20, message: 'Chest must be at least 20 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Chest (inches)"
                      type="number"
                      error={!!errors.chest}
                      helperText={errors.chest?.message || 'Measure around the fullest part of chest'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="waist"
                  control={control}
                  rules={{ min: { value: 20, message: 'Waist must be at least 20 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Waist (inches)"
                      type="number"
                      error={!!errors.waist}
                      helperText={errors.waist?.message || 'Measure around natural waistline'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="inseam"
                  control={control}
                  rules={{ min: { value: 20, message: 'Inseam must be at least 20 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Inseam (inches)"
                      type="number"
                      error={!!errors.inseam}
                      helperText={errors.inseam?.message || 'Inside leg measurement'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="neck"
                  control={control}
                  rules={{ min: { value: 10, message: 'Neck must be at least 10 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Neck (inches)"
                      type="number"
                      error={!!errors.neck}
                      helperText={errors.neck?.message || 'Around base of neck'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="sleeve"
                  control={control}
                  rules={{ min: { value: 20, message: 'Sleeve must be at least 20 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Sleeve (inches)"
                      type="number"
                      error={!!errors.sleeve}
                      helperText={errors.sleeve?.message || 'From shoulder to wrist'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="height"
                  control={control}
                  rules={{ min: { value: 48, message: 'Height must be at least 48 inches' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Height (inches)"
                      type="number"
                      error={!!errors.height}
                      helperText={errors.height?.message || 'Total height in inches'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="weight"
                  control={control}
                  rules={{ min: { value: 50, message: 'Weight must be at least 50 lbs' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Weight (lbs)"
                      type="number"
                      error={!!errors.weight}
                      helperText={errors.weight?.message || 'Current weight in pounds'}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              {/* Photo Upload Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CameraIcon color="primary" />
                  Photo Verification (Optional)
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Upload photos of yourself for measurement verification. This helps ensure the best fit.
                    Photos should show your full body from front and side views.
                  </Typography>
                </Alert>
                <Box sx={{ 
                  border: '2px dashed #ccc', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    borderColor: '#999'
                  }
                }}>
                  <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" mb={1}>
                    Click to upload photos or drag and drop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPG, PNG, HEIC (Max 5MB each)
                  </Typography>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    htmlFor="photo-upload"
                    sx={{ mt: 2 }}
                    startIcon={<CameraIcon />}
                  >
                    Choose Photos
                  </Button>
                </Box>
              </Grid>

              {/* Deadline Reminder */}
              <Grid item xs={12}>
                <Alert 
                  severity={daysUntilWedding < 30 ? 'warning' : 'info'} 
                  sx={{ mb: 2 }}
                  icon={<ClockIcon />}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold" component="div">
                      ⏰ Measurement Deadline Reminder
                    </Typography>
                    <Typography variant="body2" component="div">
                      {daysUntilWedding < 30 
                        ? `⚠️ Urgent: Only ${daysUntilWedding} days until the wedding! Please submit measurements ASAP.`
                        : `You have ${daysUntilWedding} days until the wedding. We recommend submitting measurements at least 6-8 weeks before.`
                      }
                    </Typography>
                    {daysUntilWedding < 14 && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }} component="div">
                        🚨 Critical: Rush orders may incur additional fees and limited alteration options.
                      </Typography>
                    )}
                  </Box>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={3}
                      placeholder="Any special requirements, fit preferences, or questions..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMeasurementForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleSubmitMeasurements)}
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Measurements'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Shipping Form Dialog */}
        <Dialog 
          open={showShippingForm} 
          onClose={() => setShowShippingForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Shipping Address - {selectedMember?.name}
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Please provide the address where you'd like your suit to be shipped.
                Make sure all information is accurate to avoid delivery issues.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="fullName"
                  control={shippingControl}
                  rules={{ required: 'Full name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      error={!!shippingErrors.fullName}
                      helperText={shippingErrors.fullName?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="addressLine1"
                  control={shippingControl}
                  rules={{ required: 'Address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1"
                      error={!!shippingErrors.addressLine1}
                      helperText={shippingErrors.addressLine1?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="addressLine2"
                  control={shippingControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 2 (Optional)"
                      placeholder="Apartment, suite, unit, etc."
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="city"
                  control={shippingControl}
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!shippingErrors.city}
                      helperText={shippingErrors.city?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="state"
                  control={shippingControl}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="State"
                      error={!!shippingErrors.state}
                      helperText={shippingErrors.state?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="zipCode"
                  control={shippingControl}
                  rules={{ 
                    required: 'ZIP code is required',
                    pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ZIP Code"
                      error={!!shippingErrors.zipCode}
                      helperText={shippingErrors.zipCode?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="country"
                  control={shippingControl}
                  defaultValue="United States"
                  render={({ field }) => (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Country</InputLabel>
                      <Select {...field} label="Country">
                        <MenuItem value="United States">United States</MenuItem>
                        <MenuItem value="Canada">Canada</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phoneNumber"
                  control={shippingControl}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      error={!!shippingErrors.phoneNumber}
                      helperText={shippingErrors.phoneNumber?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="deliveryInstructions"
                  control={shippingControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Delivery Instructions (Optional)"
                      multiline
                      rows={3}
                      placeholder="Special delivery instructions, gate codes, etc."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowShippingForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShippingSubmit(handleSubmitShipping)}
              variant="contained"
            >
              Save Shipping Address
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Form Dialog */}
        <Dialog 
          open={showPaymentForm} 
          onClose={() => setShowPaymentForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Payment Information - {selectedMember?.name}
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This is a preview of the payment form. 
                Actual payment processing will be implemented with a secure payment gateway.
                For now, this will save your information for manual processing.
              </Typography>
            </Alert>

            <Typography variant="h6" sx={{ mb: 2 }}>Card Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="cardholderName"
                  control={paymentControl}
                  rules={{ required: 'Cardholder name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cardholder Name"
                      error={!!paymentErrors.cardholderName}
                      helperText={paymentErrors.cardholderName?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="cardNumber"
                  control={paymentControl}
                  rules={{ 
                    required: 'Card number is required',
                    pattern: { value: /^\d{16}$/, message: 'Card number must be 16 digits' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      error={!!paymentErrors.cardNumber}
                      helperText={paymentErrors.cardNumber?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="expiryDate"
                  control={paymentControl}
                  rules={{ 
                    required: 'Expiry date is required',
                    pattern: { value: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Format: MM/YY' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Expiry Date"
                      placeholder="MM/YY"
                      error={!!paymentErrors.expiryDate}
                      helperText={paymentErrors.expiryDate?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cvv"
                  control={paymentControl}
                  rules={{ 
                    required: 'CVV is required',
                    pattern: { value: /^\d{3,4}$/, message: 'CVV must be 3-4 digits' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CVV"
                      placeholder="123"
                      error={!!paymentErrors.cvv}
                      helperText={paymentErrors.cvv?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Billing Address</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="billingAddress.addressLine1"
                  control={paymentControl}
                  rules={{ required: 'Billing address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Billing Address"
                      error={!!paymentErrors.billingAddress?.addressLine1}
                      helperText={paymentErrors.billingAddress?.addressLine1?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="billingAddress.city"
                  control={paymentControl}
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!paymentErrors.billingAddress?.city}
                      helperText={paymentErrors.billingAddress?.city?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="billingAddress.state"
                  control={paymentControl}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="State"
                      error={!!paymentErrors.billingAddress?.state}
                      helperText={paymentErrors.billingAddress?.state?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="billingAddress.zipCode"
                  control={paymentControl}
                  rules={{ 
                    required: 'ZIP code is required',
                    pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ZIP Code"
                      error={!!paymentErrors.billingAddress?.zipCode}
                      helperText={paymentErrors.billingAddress?.zipCode?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPaymentForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit(handleSubmitPayment)}
              variant="contained"
              color="success"
            >
              Submit Payment Info
            </Button>
          </DialogActions>
        </Dialog>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4, py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Questions? Contact the couple or KCT Menswear directly.
          </Typography>
          <Button
            variant="text"
            onClick={() => {
              setWedding(null);
              setWeddingCode('');
            }}
            sx={{ mt: 1 }}
          >
            Search Different Wedding
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WeddingPortal; 