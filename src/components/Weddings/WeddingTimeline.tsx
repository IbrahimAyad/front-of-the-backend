import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Groups as GroupsIcon,
  Straighten as MeasureIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { WeddingParty } from '../../types';

interface WeddingTimelineProps {
  wedding: WeddingParty;
}

const WeddingTimeline: React.FC<WeddingTimelineProps> = ({ wedding }) => {
  const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
  
  // Calculate progress for each stage
  const getStageProgress = () => {
    const totalMembers = wedding.members.length;
    if (totalMembers === 0) return { measurements: 0, shipping: 0, payments: 0 };

    const measurementsComplete = wedding.members.filter(m => m.measurements).length;
    const shippingComplete = wedding.members.filter(m => m.shippingAddress).length;
    const paymentsComplete = wedding.members.filter(m => 
      m.orderStatus === 'delivered' || m.orderStatus === 'shipped'
    ).length;

    return {
      measurements: Math.round((measurementsComplete / totalMembers) * 100),
      shipping: Math.round((shippingComplete / totalMembers) * 100),
      payments: Math.round((paymentsComplete / totalMembers) * 100),
    };
  };

  const progress = getStageProgress();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Wedding Timeline
            </Typography>
            <Chip
              label={daysUntilWedding >= 0 ? `${daysUntilWedding} days to go` : 'Wedding completed'}
              color={daysUntilWedding < 30 ? 'error' : daysUntilWedding < 60 ? 'warning' : 'success'}
              size="medium"
            />
          </Box>
          
          <Typography variant="h6" gutterBottom>
            {wedding.groomInfo.name} & {wedding.brideInfo.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Wedding Code: {wedding.weddingCode} • {format(wedding.weddingDate, 'MMMM dd, yyyy')}
          </Typography>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Measurements</Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress.measurements} 
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                color={progress.measurements === 100 ? 'success' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {progress.measurements}% Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Shipping</Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress.shipping} 
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                color={progress.shipping === 100 ? 'success' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {progress.shipping}% Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Payments</Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress.payments} 
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                color={progress.payments === 100 ? 'success' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {progress.payments}% Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Member Status Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Member Status Summary
          </Typography>
          
          <Grid container spacing={2}>
            {wedding.members.map((member) => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {member.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {member.role}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      <Chip
                        label="Measurements"
                        size="small"
                        color={member.measurements ? 'success' : 'default'}
                        icon={member.measurements ? <CheckCircleIcon /> : <ScheduleIcon />}
                      />
                      <Chip
                        label="Shipping"
                        size="small"
                        color={member.shippingAddress ? 'success' : 'default'}
                        icon={member.shippingAddress ? <CheckCircleIcon /> : <ScheduleIcon />}
                      />
                      <Chip
                        label="Payment"
                        size="small"
                        color={member.orderStatus === 'delivered' || member.orderStatus === 'shipped' ? 'success' : 'default'}
                        icon={member.orderStatus === 'delivered' || member.orderStatus === 'shipped' ? <CheckCircleIcon /> : <ScheduleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WeddingTimeline; 