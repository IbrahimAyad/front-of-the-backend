import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Payment,
  Lock,
  CheckCircle,
  Smartphone,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

// Define payment method types
type PaymentMethod = 'credit_card' | 'bank_transfer' | 'mobile_payment';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'credit_card',
    label: 'Credit Card',
    icon: <CreditCard />,
    description: 'Pay with Visa, Mastercard, American Express, or Discover',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: <AccountBalance />,
    description: 'Direct transfer from your bank account',
  },
  {
    id: 'mobile_payment',
    label: 'Mobile Payment',
    icon: <Smartphone />,
    description: 'Apple Pay, Google Pay, or Samsung Pay',
  },
];

interface MobilePaymentProcessorProps {
  orderId: string;
  amount: number;
  currency?: string;
  onPaymentComplete?: (paymentInfo: any) => void;
  customerName?: string;
}

const MobilePaymentProcessor: React.FC<MobilePaymentProcessorProps> = ({
  orderId,
  amount,
  currency = 'USD',
  onPaymentComplete,
  customerName,
}) => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as PaymentMethod);
  };

  // Process payment
  const handlePayment = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuccess(true);
    setLoading(false);
    
    if (onPaymentComplete) {
      onPaymentComplete({
        orderId,
        amount,
        currency,
        paymentMethod,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <Card elevation={3} sx={{ mb: 2, borderRadius: isMobile ? 2 : 3 }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            Payment
          </Typography>
          <Chip 
            label={formatCurrency(amount)} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {success ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body2" paragraph>
              Your payment of {formatCurrency(amount)} has been processed successfully.
            </Typography>
          </Box>
        ) : (
          <>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>
                Select Payment Method
              </FormLabel>
              <RadioGroup
                aria-label="payment-method"
                name="payment-method"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                {paymentOptions.map((option) => (
                  <Paper
                    key={option.id}
                    elevation={paymentMethod === option.id ? 2 : 0}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: paymentMethod === option.id ? 'primary.main' : 'divider',
                      bgcolor: paymentMethod === option.id ? 
                        (theme.palette.mode === 'dark' ? 'rgba(66, 165, 245, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 
                        'background.paper',
                    }}
                  >
                    <FormControlLabel
                      value={option.id}
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                            {option.icon}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" component="span">
                              {option.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                              {option.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            {paymentMethod === 'credit_card' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Credit Card Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CreditCard color="action" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                      }}
                      inputProps={{ maxLength: 19 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cardholder Name"
                      placeholder="John Doe"
                      InputProps={{ sx: { borderRadius: 2 } }}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      placeholder="MM/YY"
                      InputProps={{ sx: { borderRadius: 2 } }}
                      inputProps={{ maxLength: 5 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      type="password"
                      placeholder="123"
                      InputProps={{ sx: { borderRadius: 2 } }}
                      inputProps={{ maxLength: 4 }}
                      required
                    />
                  </Grid>
                </Grid>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  p: 1.5,
                  borderRadius: 2,
                }}>
                  <Lock sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Your payment information is encrypted and secure
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handlePayment}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                sx={{ 
                  borderRadius: 2,
                  py: isMobile ? 1.2 : 1,
                  px: 3,
                }}
              >
                {loading ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MobilePaymentProcessor; 