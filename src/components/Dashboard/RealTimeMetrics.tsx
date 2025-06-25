import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { websocketService } from '../../services/websocket';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  isLive?: boolean;
}

const AnimatedCounter: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <Typography variant="h4" fontWeight="bold" color="inherit">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </Typography>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  prefix,
  suffix,
  icon,
  color,
  isLive = false,
}) => {
  const [isUpdated, setIsUpdated] = useState(false);
  const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  useEffect(() => {
    if (value !== previousValue) {
      setIsUpdated(true);
      const timer = setTimeout(() => setIsUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  return (
    <Zoom in timeout={500}>
      <Card 
        sx={{ 
          position: 'relative',
          transition: 'all 0.3s ease',
          transform: isUpdated ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isUpdated ? 4 : 1,
          border: isUpdated ? `2px solid ${color}` : 'none',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {title}
                </Typography>
                {isLive && (
                  <Chip 
                    label="LIVE" 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: 16 }}
                  />
                )}
              </Box>
              
              <AnimatedCounter 
                value={value} 
                prefix={prefix} 
                suffix={suffix}
              />
              
              <Box display="flex" alignItems="center" mt={1}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography 
                  variant="caption" 
                  color={isPositive ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary" ml={0.5}>
                  vs last period
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ color, opacity: 0.3, fontSize: 40 }}>
              {icon}
            </Box>
          </Box>
          
          {/* Live indicator */}
          {isLive && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
};

const RealTimeMetrics: React.FC = () => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState({
    revenue: { current: 0, previous: 0 },
    orders: { current: 0, previous: 0 },
    customers: { current: 0, previous: 0 },
    leads: { current: 0, previous: 0 },
  });

  // Set up real-time updates
  useEffect(() => {
    const handleRealtimeUpdate = (data: any) => {
      setMetrics(prev => ({
        ...prev,
        [data.metric]: {
          current: data.value,
          previous: prev[data.metric as keyof typeof prev]?.current || 0,
        },
      }));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };

    websocketService.on('metrics_update', handleRealtimeUpdate);
    
    return () => {
      websocketService.off('metrics_update', handleRealtimeUpdate);
    };
  }, [queryClient]);

  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Real-Time Metrics
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={refreshMetrics} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
        <MetricCard
          title="Revenue"
          value={metrics.revenue.current}
          previousValue={metrics.revenue.previous}
          prefix="$"
          icon={<TrendingUpIcon />}
                        color="#8B1538"
          isLive
        />
        <MetricCard
          title="Orders"
          value={metrics.orders.current}
          previousValue={metrics.orders.previous}
          icon={<VisibilityIcon />}
          color="#2e7d32"
          isLive
        />
        <MetricCard
          title="Customers"
          value={metrics.customers.current}
          previousValue={metrics.customers.previous}
          icon={<VisibilityIcon />}
          color="#ed6c02"
        />
        <MetricCard
          title="Active Leads"
          value={metrics.leads.current}
          previousValue={metrics.leads.previous}
          icon={<VisibilityIcon />}
          color="#9c27b0"
          isLive
        />
      </Box>
    </Box>
  );
};

export default RealTimeMetrics; 