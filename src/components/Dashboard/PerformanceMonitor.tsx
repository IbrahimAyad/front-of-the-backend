import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: number[];
  icon: React.ReactNode;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

const PerformanceMonitor: React.FC = () => {
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      name: 'API Response Time',
      value: 245,
      threshold: 500,
      unit: 'ms',
      status: 'good',
      trend: [220, 235, 245, 250, 245, 240, 245],
      icon: <SpeedIcon />,
    },
    {
      name: 'Database Queries',
      value: 1250,
      threshold: 2000,
      unit: '/min',
      status: 'good',
      trend: [1100, 1150, 1200, 1250, 1300, 1280, 1250],
      icon: <StorageIcon />,
    },
    {
      name: 'Memory Usage',
      value: 78,
      threshold: 85,
      unit: '%',
      status: 'warning',
      trend: [65, 70, 72, 75, 78, 80, 78],
      icon: <MemoryIcon />,
    },
    {
      name: 'Network Latency',
      value: 45,
      threshold: 100,
      unit: 'ms',
      status: 'good',
      trend: [40, 42, 45, 48, 45, 43, 45],
      icon: <NetworkIcon />,
    },
  ]);

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'Memory usage approaching threshold (78%)',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      resolved: false,
    },
    {
      id: '2',
      type: 'info',
      message: 'Database backup completed successfully',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      resolved: true,
    },
  ]);

  const [uptime, setUptime] = useState({
    days: 15,
    hours: 8,
    minutes: 42,
  });

  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        setMetrics(prev => prev.map(metric => ({
          ...metric,
          value: Math.max(0, metric.value + (Math.random() - 0.5) * 20),
          trend: [...metric.trend.slice(1), metric.value],
          status: metric.value > metric.threshold * 0.9 
            ? 'critical' 
            : metric.value > metric.threshold * 0.7 
            ? 'warning' 
            : 'good',
        })));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [realTimeMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <CheckIcon />;
    }
  };

  const refreshMetrics = () => {
    // Simulate refresh
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: Math.random() * metric.threshold,
    })));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          System Performance Monitor
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeMode}
                onChange={(e) => setRealTimeMode(e.target.checked)}
              />
            }
            label="Real-time"
          />
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={refreshMetrics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Grid container spacing={2}>
                {metrics.map((metric) => (
                  <Grid item xs={12} sm={6} key={metric.name}>
                    <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {metric.icon}
                          <Typography variant="subtitle2">
                            {metric.name}
                          </Typography>
                        </Box>
                        {getStatusIcon(metric.status)}
                      </Box>
                      
                      <Typography variant="h5" fontWeight="bold" mb={1}>
                        {metric.value.toFixed(0)}{metric.unit}
                      </Typography>
                      
                      <LinearProgress
                        variant="determinate"
                        value={(metric.value / metric.threshold) * 100}
                        color={getStatusColor(metric.status) as any}
                        sx={{ mb: 1 }}
                      />
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Threshold: {metric.threshold}{metric.unit}
                        </Typography>
                        <Chip
                          label={metric.status.toUpperCase()}
                          size="small"
                          color={getStatusColor(metric.status) as any}
                          variant="outlined"
                        />
                      </Box>
                      
                      {/* Mini trend chart */}
                      <Box height={40} mt={1}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metric.trend.map((value, index) => ({ value, index }))}>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={
                                metric.status === 'good' ? '#4caf50' :
                                metric.status === 'warning' ? '#ff9800' : '#f44336'
                              }
                              fill={
                                metric.status === 'good' ? '#4caf50' :
                                metric.status === 'warning' ? '#ff9800' : '#f44336'
                              }
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Uptime
              </Typography>
              
              <Box textAlign="center" py={2}>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {uptime.days}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Days
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={2} mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold">
                      {uptime.hours}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hours
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold">
                      {uptime.minutes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Minutes
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last restart: March 1, 2024
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={99.8}
                  color="success"
                />
                <Typography variant="caption" color="text.secondary">
                  99.8% uptime this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Alerts ({activeAlerts.length})
            </Typography>
            {activeAlerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                sx={{ mb: 1 }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckIcon />
                  </IconButton>
                }
              >
                <Box>
                  <Typography variant="body2">
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Trends (Last 24 Hours)
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Array.from({ length: 24 }, (_, i) => ({
                  hour: `${i}:00`,
                  responseTime: 200 + Math.random() * 100,
                  memoryUsage: 60 + Math.random() * 30,
                  cpuUsage: 40 + Math.random() * 40,
                }))}
              >
                <XAxis dataKey="hour" />
                <YAxis />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
                <Line
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Memory Usage (%)"
                />
                <Line
                  type="monotone"
                  dataKey="cpuUsage"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="CPU Usage (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceMonitor; 