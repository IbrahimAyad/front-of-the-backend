import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { differenceInDays } from 'date-fns';
import { WeddingParty } from '../../types';

interface SmartRecommendationsProps {
  weddings: WeddingParty[];
}

interface Recommendation {
  id: string;
  type: 'urgent' | 'warning' | 'suggestion' | 'success';
  title: string;
  description: string;
  action?: string;
  weddingId?: string;
  priority: number;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ weddings }) => {
  
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    weddings.forEach(wedding => {
      const daysUntil = differenceInDays(wedding.weddingDate, new Date());
      const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
      const missingShipping = wedding.members.filter(m => !m.shippingAddress && m.needsShipping).length;
      const pendingPayments = wedding.members.filter(m => !m.orderStatus || m.orderStatus === 'pending').length;
      
      // Urgent deadline recommendations
      if (daysUntil <= 7 && daysUntil >= 0 && pendingMeasurements > 0) {
        recommendations.push({
          id: `urgent-measurements-${wedding.id}`,
          type: 'urgent',
          title: '🚨 Critical: Measurements Needed ASAP',
          description: `${wedding.groomInfo.name} & ${wedding.brideInfo.name} wedding in ${daysUntil} days with ${pendingMeasurements} pending measurements`,
          action: 'Contact members immediately',
          weddingId: wedding.id,
          priority: 10
        });
      }
      
      // Production timeline warnings
      if (daysUntil <= 21 && daysUntil > 7 && pendingMeasurements > 0) {
        recommendations.push({
          id: `warning-measurements-${wedding.id}`,
          type: 'warning',
          title: '⚠️ Measurements Deadline Approaching',
          description: `${pendingMeasurements} measurements still needed for ${wedding.groomInfo.name} & ${wedding.brideInfo.name}`,
          action: 'Send reminder emails',
          weddingId: wedding.id,
          priority: 8
        });
      }
      
      // Shipping address recommendations
      if (missingShipping > 0 && daysUntil <= 30) {
        recommendations.push({
          id: `shipping-${wedding.id}`,
          type: 'warning',
          title: '📦 Shipping Addresses Missing',
          description: `${missingShipping} members need shipping addresses for ${wedding.groomInfo.name} & ${wedding.brideInfo.name}`,
          action: 'Collect shipping info',
          weddingId: wedding.id,
          priority: 7
        });
      }
      
      // Payment processing suggestions
      if (pendingPayments > 0 && pendingMeasurements === 0) {
        recommendations.push({
          id: `payment-${wedding.id}`,
          type: 'suggestion',
          title: '💳 Ready for Payment Processing',
          description: `All measurements complete for ${wedding.groomInfo.name} & ${wedding.brideInfo.name}. ${pendingPayments} payments pending`,
          action: 'Process payments',
          weddingId: wedding.id,
          priority: 6
        });
      }
      
      // Success celebrations
      if (pendingMeasurements === 0 && missingShipping === 0 && pendingPayments === 0) {
        recommendations.push({
          id: `success-${wedding.id}`,
          type: 'success',
          title: '🎉 Wedding Fully Processed!',
          description: `${wedding.groomInfo.name} & ${wedding.brideInfo.name} - All measurements, shipping, and payments complete`,
          action: 'Monitor production',
          weddingId: wedding.id,
          priority: 5
        });
      }
    });
    
    // General business insights
    const totalPendingMeasurements = weddings.reduce((sum, w) => 
      sum + w.members.filter(m => m.measurementStatus === 'pending').length, 0
    );
    
    const urgentWeddings = weddings.filter(w => {
      const days = differenceInDays(w.weddingDate, new Date());
      return days <= 14 && days >= 0;
    }).length;
    
    if (totalPendingMeasurements > 10) {
      recommendations.push({
        id: 'bulk-measurements',
        type: 'suggestion',
        title: '📊 High Volume Alert',
        description: `${totalPendingMeasurements} total pending measurements across all weddings`,
        action: 'Consider bulk reminder campaign',
        priority: 4
      });
    }
    
    if (urgentWeddings > 3) {
      recommendations.push({
        id: 'urgent-weddings',
        type: 'warning',
        title: '⏰ Multiple Urgent Weddings',
        description: `${urgentWeddings} weddings within 2 weeks need attention`,
        action: 'Prioritize urgent cases',
        priority: 9
      });
    }
    
    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  };
  
  const recommendations = generateRecommendations();
  
  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'urgent': return <WarningIcon color="error" />;
      case 'warning': return <ScheduleIcon color="warning" />;
      case 'suggestion': return <LightbulbIcon color="info" />;
      case 'success': return <CheckCircleIcon color="success" />;
      default: return <LightbulbIcon />;
    }
  };
  
  const getRecommendationColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'urgent': return 'error';
      case 'warning': return 'warning';
      case 'suggestion': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };
  
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              All Caught Up! 🎉
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No urgent recommendations at this time. Great job managing your weddings!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Smart Recommendations
          </Typography>
          <Chip 
            label={`${recommendations.length} insights`} 
            color="primary" 
            size="small" 
          />
        </Box>
        
        <List>
          {recommendations.map((rec, index) => (
            <React.Fragment key={rec.id}>
              <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {getRecommendationIcon(rec.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {rec.title}
                      </Typography>
                      <Chip 
                        label={rec.type.toUpperCase()} 
                        color={getRecommendationColor(rec.type)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 1, display: 'block' }}>
                        {rec.description}
                      </Typography>
                      {rec.action && (
                        <Button
                          variant="outlined"
                          size="small"
                          color={getRecommendationColor(rec.type)}
                          startIcon={
                            rec.action.includes('email') ? <EmailIcon /> :
                            rec.action.includes('Contact') ? <PhoneIcon /> :
                            rec.action.includes('shipping') ? <ShippingIcon /> :
                            rec.action.includes('payment') ? <PaymentIcon /> :
                            <TrendingUpIcon />
                          }
                        >
                          {rec.action}
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < recommendations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
        {/* Quick Stats */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Quick Stats:</strong> {weddings.length} total weddings • {' '}
            {weddings.filter(w => differenceInDays(w.weddingDate, new Date()) <= 30 && differenceInDays(w.weddingDate, new Date()) >= 0).length} upcoming in 30 days • {' '}
            {weddings.reduce((sum, w) => sum + w.members.filter(m => m.measurementStatus === 'pending').length, 0)} pending measurements
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations; 