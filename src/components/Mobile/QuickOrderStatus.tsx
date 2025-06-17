import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  TextField,
  IconButton,
  Chip,
  Divider,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  LocalShipping,
  Inventory,
  CheckCircle,
  Schedule,
  Send,
  Edit,
  Camera,
  ArrowForward,
  Message,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

// Define order status types
type OrderStatus = 'pending' | 'processing' | 'ready' | 'shipped' | 'delivered';

interface OrderStatusStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const orderStatusSteps: OrderStatusStep[] = [
  {
    status: 'pending',
    label: 'Order Received',
    description: 'Your order has been received and is being reviewed.',
    icon: <Inventory />,
    color: 'info.main',
  },
  {
    status: 'processing',
    label: 'In Production',
    description: 'Your order is being tailored to your specifications.',
    icon: <Edit />,
    color: 'warning.main',
  },
  {
    status: 'ready',
    label: 'Ready for Pickup/Shipping',
    description: 'Your order is complete and ready for pickup or shipping.',
    icon: <CheckCircle />,
    color: 'success.main',
  },
  {
    status: 'shipped',
    label: 'Shipped',
    description: 'Your order has been shipped and is on its way.',
    icon: <LocalShipping />,
    color: 'primary.main',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered.',
    icon: <CheckCircle />,
    color: 'success.dark',
  },
];

interface QuickOrderStatusProps {
  orderId: string;
  customerName?: string;
  initialStatus?: OrderStatus;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus, note: string) => void;
  isStaff?: boolean;
}

const QuickOrderStatus: React.FC<QuickOrderStatusProps> = ({
  orderId,
  customerName,
  initialStatus = 'pending',
  onStatusUpdate,
  isStaff = true,
}) => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(initialStatus);
  const [note, setNote] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  // Find the current step index
  const currentStepIndex = orderStatusSteps.findIndex(step => step.status === currentStatus);

  // Get current status icon
  const getCurrentStatusIcon = () => {
    const step = orderStatusSteps.find(step => step.status === currentStatus);
    if (step) {
      if (step.status === 'pending') return <Inventory />;
      if (step.status === 'processing') return <Edit />;
      if (step.status === 'ready') return <CheckCircle />;
      if (step.status === 'shipped') return <LocalShipping />;
      if (step.status === 'delivered') return <CheckCircle />;
    }
    return <Inventory />;
  };

  // Handle status update
  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (isStaff && onStatusUpdate) {
      onStatusUpdate(orderId, newStatus, note);
      setCurrentStatus(newStatus);
      setNote('');
      setSnackbar({
        open: true,
        message: `Order status updated to ${orderStatusSteps.find(step => step.status === newStatus)?.label}`,
        severity: 'success',
      });
    }
  };

  // Get next status
  const getNextStatus = (): OrderStatus | null => {
    const nextIndex = currentStepIndex + 1;
    return nextIndex < orderStatusSteps.length ? orderStatusSteps[nextIndex].status : null;
  };

  return (
    <Card elevation={2} sx={{ mb: 2, borderRadius: isMobile ? 2 : 3 }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        {/* Order Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h2">
              Order #{orderId}
            </Typography>
            {customerName && (
              <Typography variant="body2" color="text.secondary">
                Customer: {customerName}
              </Typography>
            )}
          </Box>
          <Chip
            label={orderStatusSteps.find(step => step.status === currentStatus)?.label}
            color={
              currentStatus === 'pending'
                ? 'info'
                : currentStatus === 'processing'
                ? 'warning'
                : currentStatus === 'ready' || currentStatus === 'delivered'
                ? 'success'
                : 'primary'
            }
            sx={{ fontWeight: 'medium' }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Status Stepper */}
        <Stepper 
          activeStep={currentStepIndex} 
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{ mb: 3 }}
        >
          {orderStatusSteps.map((step, index) => (
            <Step key={step.status} completed={index <= currentStepIndex}>
              <StepLabel
                StepIconProps={{
                  icon: step.icon,
                  sx: {
                    color: index <= currentStepIndex ? step.color : 'grey.500',
                  },
                }}
              >
                {!isMobile && step.label}
              </StepLabel>
              {isMobile && (
                <StepContent>
                  <Typography variant="body2">{step.description}</Typography>
                  {index === currentStepIndex && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Current Status
                    </Typography>
                  )}
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        {/* Staff Controls - Only visible to staff */}
        {isStaff && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Update Order Status
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Add a note about this status update (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                size="small"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              <IconButton 
                color="primary"
                sx={{ mt: 0.5 }}
                onClick={() => {
                  setSnackbar({
                    open: true,
                    message: 'Photo capture feature will be integrated with this component',
                    severity: 'info',
                  });
                }}
              >
                <Camera />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Message />}
                sx={{ borderRadius: 2 }}
                onClick={() => {
                  setSnackbar({
                    open: true,
                    message: 'Send notification feature will be integrated',
                    severity: 'info',
                  });
                }}
              >
                Notify Customer
              </Button>
              
              {getNextStatus() && (
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForward />}
                  onClick={() => handleUpdateStatus(getNextStatus() as OrderStatus)}
                  disabled={!getNextStatus()}
                  sx={{ 
                    borderRadius: 2,
                    py: isMobile ? 1 : 0.5,
                    px: 2,
                  }}
                >
                  Mark as {orderStatusSteps.find(step => step.status === getNextStatus())?.label}
                </Button>
              )}
            </Box>
          </Paper>
        )}

        {/* Customer View - Timeline */}
        {!isStaff && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Estimated Timeline
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Order Placed
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                June 10, 2024
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Estimated Completion
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                June 24, 2024
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Estimated Delivery
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                June 26, 2024
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<Schedule />}
              sx={{ mt: 2, borderRadius: 2 }}
              onClick={() => {
                setSnackbar({
                  open: true,
                  message: 'Schedule appointment feature will be integrated',
                  severity: 'info',
                });
              }}
            >
              Schedule Fitting Appointment
            </Button>
          </Box>
        )}
      </CardContent>

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
    </Card>
  );
};

export default QuickOrderStatus; 