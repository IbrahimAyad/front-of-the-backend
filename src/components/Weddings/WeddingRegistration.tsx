import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Person,
  Groups,
  Style,
  ContactMail,
  Celebration,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { WeddingFormData } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';

const steps = [
  'Initial Information',
  'Contact Information', 
  'Style Preferences',
  'Party Members (Optional)',
  'Confirmation'
];

const suitColors = [
  { value: 'black', label: 'BLACK SUIT', color: '#000000' },
  { value: 'navy', label: 'NAVY', color: '#1e3a8a' },
  { value: 'light_grey', label: 'LIGHT GREY', color: '#d1d5db' },
  { value: 'dark_grey', label: 'DARK GREY', color: '#4b5563' },
  { value: 'tan', label: 'TAN', color: '#d2b48c' },
  { value: 'hunter_green', label: 'HUNTER GREEN', color: '#355e3b' },
  { value: 'midnight_blue', label: 'MIDNIGHT BLUE', color: '#191970' },
  { value: 'burgundy', label: 'BURGUNDY', color: '#800020' },
  { value: 'medium_grey', label: 'MEDIUM GREY', color: '#6b7280' },
];

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8, '9+'];

const userRoles = [
  { value: 'bride', label: 'BRIDE', icon: '👰', description: 'Planning the wedding' },
  { value: 'groom', label: 'GROOM', icon: '🤵', description: 'Getting married' },
  { value: 'groomsman', label: 'GROOMSMAN', icon: '👥', description: 'Part of wedding party' },
  { value: 'guest', label: 'GUEST', icon: '👥', description: 'Attending the wedding' },
];

const attireTypes = [
  { value: 'tuxedo', label: 'Tuxedo', description: 'Classic formal wear for black-tie events' },
  { value: 'suit', label: 'Suit', description: 'Traditional suit for semi-formal to formal occasions' },
  { value: 'modern_fit', label: 'Modern Fit', description: 'Contemporary style with a tailored silhouette' },
  { value: 'slim_fit', label: 'Slim Fit', description: 'Sleek and fitted for a more contemporary look' },
];

const accessories = [
  { value: 'tie', label: 'Tie', icon: '👔' },
  { value: 'bow_tie', label: 'Bow Tie', icon: '🎀' },
  { value: 'vest', label: 'Vest', icon: '🦺' },
  { value: 'pocket_square', label: 'Pocket Square', icon: '🔲' },
  { value: 'cufflinks', label: 'Cufflinks', icon: '✨' },
  { value: 'suspenders', label: 'Suspenders', icon: '🔗' },
];

const validationSchema = yup.object({
  suitColor: yup.string().required('Please select a suit color'),
  estimatedPartySize: yup.number().required('Please select party size'),
  weddingDate: yup.string().required('Please select wedding date'),
  userRole: yup.string().required('Please select your role'),
  groomName: yup.string().required('Groom name is required'),
  groomEmail: yup.string().email('Invalid email').required('Groom email is required'),
  groomPhone: yup.string().required('Groom phone is required'),
  brideName: yup.string().required('Bride name is required'),
  brideEmail: yup.string().email('Invalid email').required('Bride email is required'),
  bridePhone: yup.string().required('Bride phone is required'),
  attireType: yup.string().required('Please select attire type'),
});

interface WeddingRegistrationProps {
  onComplete: (weddingId: string) => void;
  onBack?: () => void;
}

const WeddingRegistration: React.FC<WeddingRegistrationProps> = ({ onComplete, onBack }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WeddingFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      accessories: [],
    },
  });

  const watchedValues = watch();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAccessoryToggle = (accessory: string) => {
    const newAccessories = selectedAccessories.includes(accessory)
      ? selectedAccessories.filter(a => a !== accessory)
      : [...selectedAccessories, accessory];
    
    setSelectedAccessories(newAccessories);
    setValue('accessories', newAccessories);
  };

  const onSubmit = async (data: WeddingFormData) => {
    try {
      const wedding = await weddingAPI.createWeddingParty({
        ...data,
        accessories: selectedAccessories,
      });
      
      toast.success('Wedding party created successfully!');
      onComplete(wedding.id);
    } catch (error) {
      console.error('Error creating wedding party:', error);
      toast.error('Failed to create wedding party. Please try again.');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
            <Typography variant="h3" align="center" fontWeight="bold" mb={2}>
              FIRST THINGS FIRST
            </Typography>
            
            <Typography variant="h5" align="center" mb={4}>
              What type of style are you looking for?
            </Typography>

            <Grid container spacing={2} mb={4}>
              {suitColors.map((color) => (
                <Grid item xs={4} key={color.value}>
                  <Controller
                    name="suitColor"
                    control={control}
                    render={({ field }) => (
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: field.value === color.value ? `3px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: 3 },
                        }}
                        onClick={() => field.onChange(color.value)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              backgroundColor: color.color,
                              borderRadius: 1,
                              mx: 'auto',
                              mb: 2,
                              border: '1px solid #ccc',
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {color.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" mb={2}>
              How many people do you think will need suits?
            </Typography>

            <Grid container spacing={2} mb={4}>
              {partySizes.map((size) => (
                <Grid item xs={4} key={size}>
                  <Controller
                    name="estimatedPartySize"
                    control={control}
                    render={({ field }) => (
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: field.value === size ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: 2 },
                        }}
                        onClick={() => field.onChange(size === '9+' ? 9 : size)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {size}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" mb={2}>
              When is the Event?
            </Typography>

            <Controller
              name="weddingDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Wedding Date"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.weddingDate,
                      helperText: errors.weddingDate?.message,
                    },
                  }}
                />
              )}
            />

            <Typography variant="h6" mt={4} mb={2}>
              What is your role in the wedding?
            </Typography>

            <Grid container spacing={2}>
              {userRoles.map((role) => (
                <Grid item xs={6} key={role.value}>
                  <Controller
                    name="userRole"
                    control={control}
                    render={({ field }) => (
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: field.value === role.value ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: 2 },
                        }}
                        onClick={() => field.onChange(role.value)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="h4" mb={1}>
                            {role.icon}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {role.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {role.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h4" align="center" fontWeight="bold" mb={2}>
              Contact Information
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" mb={4}>
              Please provide contact information for both the bride and groom.
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" mb={2}>Groom</Typography>
                
                <Controller
                  name="groomName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      placeholder="John Doe"
                      error={!!errors.groomName}
                      helperText={errors.groomName?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="groomEmail"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      placeholder="john@example.com"
                      error={!!errors.groomEmail}
                      helperText={errors.groomEmail?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="groomPhone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="(123) 456-7890"
                      error={!!errors.groomPhone}
                      helperText={errors.groomPhone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" mb={2}>Bride</Typography>
                
                <Controller
                  name="brideName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      placeholder="Jane Doe"
                      error={!!errors.brideName}
                      helperText={errors.brideName?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="brideEmail"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      placeholder="jane@example.com"
                      error={!!errors.brideEmail}
                      helperText={errors.brideEmail?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="bridePhone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="(123) 456-7890"
                      error={!!errors.bridePhone}
                      helperText={errors.bridePhone?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h5" fontWeight="bold" mb={1}>
              👔 Attire Type
            </Typography>

            <Grid container spacing={2} mb={4}>
              {attireTypes.map((attire) => (
                <Grid item xs={12} md={6} key={attire.value}>
                  <Controller
                    name="attireType"
                    control={control}
                    render={({ field }) => (
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: field.value === attire.value ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: 2 },
                          height: '100%',
                        }}
                        onClick={() => field.onChange(attire.value)}
                      >
                        <CardContent>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {attire.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {attire.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h5" fontWeight="bold" mb={2}>
              ✨ Accessories
            </Typography>

            <Grid container spacing={2} mb={4}>
              {accessories.map((accessory) => (
                <Grid item xs={4} key={accessory.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedAccessories.includes(accessory.value) 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : '1px solid #e0e0e0',
                      '&:hover': { boxShadow: 2 },
                    }}
                    onClick={() => handleAccessoryToggle(accessory.value)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" mb={1}>
                        {accessory.icon}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {accessory.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" mb={2}>
              Special Requests or Notes
            </Typography>
            <Controller
              name="specialRequests"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Any special requirements or preferences..."
                />
              )}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h4" align="center" fontWeight="bold" mb={2}>
              Wedding Party Members
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" mb={4}>
              Add details for each member of your wedding party (optional)
            </Typography>

            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>Note:</strong> You can skip this step and add party members later through your wedding dashboard.
                Each member will receive their own link to submit measurements.
              </Typography>
            </Paper>

            <Button
              variant="outlined"
              startIcon={<Groups />}
              fullWidth
              sx={{ py: 2 }}
              onClick={() => {
                // This will be handled in the main dashboard
                toast.info('Party members can be added after registration!');
              }}
            >
              + Add Party Member
            </Button>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h4" align="center" fontWeight="bold" mb={4}>
              Confirmation
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" mb={2}>Wedding Details</Typography>
              <Typography><strong>Date:</strong> {watchedValues.weddingDate}</Typography>
              <Typography><strong>Style:</strong> {suitColors.find(c => c.value === watchedValues.suitColor)?.label}</Typography>
              <Typography><strong>Party Size:</strong> {watchedValues.estimatedPartySize} people</Typography>
              <Typography><strong>Attire:</strong> {attireTypes.find(a => a.value === watchedValues.attireType)?.label}</Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" mb={2}>Contact Information</Typography>
              <Typography><strong>Groom:</strong> {watchedValues.groomName} ({watchedValues.groomEmail})</Typography>
              <Typography><strong>Bride:</strong> {watchedValues.brideName} ({watchedValues.brideEmail})</Typography>
            </Paper>

            {selectedAccessories.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" mb={2}>Selected Accessories</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedAccessories.map((accessory) => (
                    <Chip
                      key={accessory}
                      label={accessories.find(a => a.value === accessory)?.label}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 1200, mx: 'auto' }}>
          {onBack && (
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight="bold">
            Wedding Registration
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: completed ? theme.palette.primary.main : active ? theme.palette.primary.light : '#e0e0e0',
                      color: completed || active ? 'white' : 'text.secondary',
                    }}
                  >
                    {completed ? <CheckCircle /> : index + 1}
                  </Box>
                )}
              >
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 600, mx: 'auto' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
            startIcon={<ArrowBack />}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={isSubmitting}
              endIcon={<Celebration />}
            >
              {isSubmitting ? 'Creating...' : 'Create Wedding Party'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default WeddingRegistration; 