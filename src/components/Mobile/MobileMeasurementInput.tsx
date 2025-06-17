import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  CheckCircle,
  Error as ErrorIcon,
  Camera,
  TouchApp,
} from '@mui/icons-material';
import SwipeableViews from 'react-swipeable-views';
import { useCustomTheme } from '../../contexts/ThemeContext';

// Define measurement field types
interface MeasurementField {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  helper?: string;
}

// Group measurements into logical steps
const measurementSteps: { title: string; fields: MeasurementField[] }[] = [
  {
    title: 'Upper Body',
    fields: [
      { id: 'chest', label: 'Chest', unit: 'in', min: 30, max: 60, step: 0.25, helper: 'Measure around the fullest part of the chest' },
      { id: 'shoulders', label: 'Shoulders', unit: 'in', min: 14, max: 30, step: 0.25, helper: 'Measure across the back from shoulder to shoulder' },
      { id: 'armLength', label: 'Arm Length', unit: 'in', min: 20, max: 40, step: 0.25, helper: 'Measure from shoulder to wrist' },
      { id: 'neck', label: 'Neck', unit: 'in', min: 12, max: 24, step: 0.25, helper: 'Measure around the base of the neck' },
    ],
  },
  {
    title: 'Lower Body',
    fields: [
      { id: 'waist', label: 'Waist', unit: 'in', min: 26, max: 60, step: 0.25, helper: 'Measure around the natural waistline' },
      { id: 'hips', label: 'Hips', unit: 'in', min: 30, max: 60, step: 0.25, helper: 'Measure around the fullest part of the hips' },
      { id: 'inseam', label: 'Inseam', unit: 'in', min: 25, max: 40, step: 0.25, helper: 'Measure from crotch to ankle' },
    ],
  },
  {
    title: 'General',
    fields: [
      { id: 'height', label: 'Height', unit: 'in', min: 48, max: 84, step: 0.5, helper: 'Total height' },
      { id: 'weight', label: 'Weight', unit: 'lbs', min: 80, max: 400, step: 1, helper: 'Weight in pounds' },
    ],
  },
];

interface MobileMeasurementInputProps {
  customerId?: number;
  onSave?: (measurements: Record<string, number>) => void;
  initialValues?: Record<string, number>;
}

const MobileMeasurementInput: React.FC<MobileMeasurementInputProps> = ({
  customerId,
  onSave,
  initialValues = {},
}) => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [measurements, setMeasurements] = useState<Record<string, number | null>>(() => {
    // Initialize with provided values or null
    const initialMeasurements: Record<string, number | null> = {};
    measurementSteps.forEach((step) => {
      step.fields.forEach((field) => {
        initialMeasurements[field.id] = initialValues[field.id] || null;
      });
    });
    return initialMeasurements;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  // Handle measurement input change
  const handleMeasurementChange = (id: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const field = measurementSteps.flatMap(step => step.fields).find(f => f.id === id);
    
    if (field && numValue !== null) {
      // Validate the input
      if (numValue < field.min) {
        setErrors(prev => ({ ...prev, [id]: `Value must be at least ${field.min}` }));
      } else if (numValue > field.max) {
        setErrors(prev => ({ ...prev, [id]: `Value must be at most ${field.max}` }));
      } else {
        // Clear error if valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    }
    
    setMeasurements(prev => ({ ...prev, [id]: numValue }));
  };

  // Handle step navigation
  const handleNext = () => {
    const currentStepFields = measurementSteps[activeStep].fields;
    const hasErrors = currentStepFields.some(field => !!errors[field.id]);
    
    if (!hasErrors) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, measurementSteps.length - 1));
    } else {
      setSnackbar({
        open: true,
        message: 'Please correct the errors before proceeding',
        severity: 'error',
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  // Handle swipe between steps
  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  // Handle save measurements
  const handleSave = () => {
    // Filter out null values
    const validMeasurements: Record<string, number> = {};
    Object.entries(measurements).forEach(([key, value]) => {
      if (value !== null) {
        validMeasurements[key] = value;
      }
    });
    
    if (Object.keys(errors).length === 0) {
      if (onSave) {
        onSave(validMeasurements);
      }
      setSnackbar({
        open: true,
        message: 'Measurements saved successfully',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Please correct all errors before saving',
        severity: 'error',
      });
    }
  };

  // Check if all required fields in the current step are filled
  const isStepComplete = (stepIndex: number) => {
    const stepFields = measurementSteps[stepIndex].fields;
    return stepFields.every(field => 
      measurements[field.id] !== null && !errors[field.id]
    );
  };

  return (
    <Card elevation={3} sx={{ 
      maxWidth: '100%', 
      mb: 2,
      borderRadius: isMobile ? 0 : 2,
      boxShadow: isMobile ? 'none' : undefined,
    }}>
      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
        <Typography variant="h6" component="h2" gutterBottom align="center">
          Client Measurements
          {customerId && <Chip 
            label={`Customer #${customerId}`} 
            size="small" 
            color="primary" 
            sx={{ ml: 1 }} 
          />}
        </Typography>

        {/* Stepper for navigation */}
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{ 
            mb: 2,
            display: { xs: 'none', sm: 'flex' } // Hide on very small screens
          }}
        >
          {measurementSteps.map((step, index) => (
            <Step key={step.title} completed={isStepComplete(index)}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Mobile step indicator */}
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'center',
          mb: 2 
        }}>
          {measurementSteps.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                mx: 0.5,
                bgcolor: index === activeStep ? 'primary.main' : 'grey.300',
              }}
            />
          ))}
        </Box>

        {/* Swipeable views for measurement steps */}
        <SwipeableViews
          index={activeStep}
          onChangeIndex={handleStepChange}
          enableMouseEvents
        >
          {measurementSteps.map((step, stepIndex) => (
            <Box key={step.title} sx={{ px: isMobile ? 1 : 2 }}>
              <Typography 
                variant="subtitle1" 
                component="h3" 
                sx={{ mb: 2, fontWeight: 'bold' }}
              >
                {step.title}
              </Typography>
              
              <Grid container spacing={2}>
                {step.fields.map((field) => (
                  <Grid item xs={12} key={field.id}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: errors[field.id] 
                          ? `1px solid ${theme.palette.error.main}` 
                          : measurements[field.id] !== null
                          ? `1px solid ${theme.palette.success.main}`
                          : `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <TextField
                        fullWidth
                        id={field.id}
                        label={field.label}
                        type="number"
                        value={measurements[field.id] === null ? '' : measurements[field.id]}
                        onChange={(e) => handleMeasurementChange(field.id, e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {field.unit}
                              {errors[field.id] ? (
                                <ErrorIcon color="error" sx={{ ml: 1 }} />
                              ) : measurements[field.id] !== null ? (
                                <CheckCircle color="success" sx={{ ml: 1 }} />
                              ) : null}
                            </InputAdornment>
                          ),
                          inputProps: {
                            min: field.min,
                            max: field.max,
                            step: field.step,
                            style: { 
                              fontSize: isMobile ? '1.2rem' : '1rem',
                              padding: isMobile ? '16px 14px' : undefined,
                            }
                          },
                          sx: {
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                              '-webkit-appearance': 'none',
                            },
                          }
                        }}
                        error={!!errors[field.id]}
                        helperText={errors[field.id] || field.helper}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </SwipeableViews>

        {/* Navigation and action buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 3,
          gap: 1,
        }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
            sx={{ 
              borderRadius: 2,
              py: isMobile ? 1.5 : 1,
              flex: 1,
            }}
          >
            Back
          </Button>
          
          {activeStep < measurementSteps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              sx={{ 
                borderRadius: 2,
                py: isMobile ? 1.5 : 1,
                flex: 1,
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={<Save />}
              sx={{ 
                borderRadius: 2,
                py: isMobile ? 1.5 : 1,
                flex: 1,
              }}
            >
              Save
            </Button>
          )}
        </Box>

        {/* Camera button for photo capture integration */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Camera />}
            sx={{ borderRadius: 2 }}
            onClick={() => {
              // This would integrate with PhotoCaptureModal
              setSnackbar({
                open: true,
                message: 'Photo capture feature will be integrated next',
                severity: 'info',
              });
            }}
          >
            Add Reference Photo
          </Button>
        </Box>

        {/* Touch indicator for swipe hint (mobile only) */}
        {isMobile && activeStep < measurementSteps.length - 1 && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              mt: 2,
              color: 'text.secondary',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 },
              },
            }}
          >
            <TouchApp fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">Swipe to navigate</Typography>
          </Box>
        )}

        {/* Feedback snackbar */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default MobileMeasurementInput; 