import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as RevenueIcon,
  Speed as PerformanceIcon,
  People as CustomersIcon,
  ContentCut as TailoringIcon,
  Star as RatingIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  Assignment as TicketIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface TailoringTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  services: AlterationService[];
  status: 'dropped_off' | 'in_progress' | 'quality_check' | 'ready_pickup' | 'completed';
  priority: 'normal' | 'rush';
  location: 'shop_1' | 'shop_2';
  dropOffDate: Date;
  scheduledPickupDate: Date;
  actualPickupDate?: Date;
  totalItems: number;
  revenue?: number;
  customerSatisfaction?: number;
}

interface AlterationService {
  id: string;
  type: string;
  description: string;
  quantity: number;
  price?: number;
}

interface TailoringAnalyticsProps {
  tickets: TailoringTicket[];
}

const TailoringAnalytics: React.FC<TailoringAnalyticsProps> = ({ tickets }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Mock data for demonstration
  const revenueData = [
    { name: 'Mon', revenue: 1200, orders: 8 },
    { name: 'Tue', revenue: 1800, orders: 12 },
    { name: 'Wed', revenue: 2200, orders: 15 },
    { name: 'Thu', revenue: 1600, orders: 10 },
    { name: 'Fri', revenue: 2800, orders: 18 },
    { name: 'Sat', revenue: 3200, orders: 22 },
    { name: 'Sun', revenue: 1000, orders: 6 },
  ];

  const servicePopularity = [
    { name: 'Pants Hem', value: 35, color: '#8884d8' },
    { name: 'Shirt Take In', value: 25, color: '#82ca9d' },
    { name: 'Jacket Alterations', value: 20, color: '#ffc658' },
    { name: 'Zipper Replacement', value: 12, color: '#ff7300' },
    { name: 'Other', value: 8, color: '#00ff88' },
  ];

  const performanceMetrics = [
    { metric: 'Average Turnaround', value: '6.2 days', target: '7 days', progress: 88 },
    { metric: 'Customer Satisfaction', value: '4.7/5', target: '4.5/5', progress: 94 },
    { metric: 'On-Time Delivery', value: '92%', target: '90%', progress: 92 },
    { metric: 'Rush Order Success', value: '96%', target: '95%', progress: 96 },
  ];

  const topServices = [
    { service: 'Regular Hem', count: 45, revenue: 1350, avgTime: '3 days' },
    { service: 'Dress Shirt Take In', count: 32, revenue: 1280, avgTime: '4 days' },
    { service: 'Jacket Take In Sides', count: 28, revenue: 1680, avgTime: '7 days' },
    { service: 'Zipper Replacement', count: 18, revenue: 900, avgTime: '5 days' },
    { service: 'Cuff Pants', count: 15, revenue: 600, avgTime: '4 days' },
  ];

  const locationPerformance = [
    {
      location: 'Tailor Shop 1',
      tickets: 85,
      revenue: 4250,
      avgTurnaround: '5.8 days',
      satisfaction: 4.8,
      onTime: 94,
    },
    {
      location: 'Tailor Shop 2',
      tickets: 67,
      revenue: 3350,
      avgTurnaround: '6.5 days',
      satisfaction: 4.6,
      onTime: 89,
    },
  ];

  const getFilteredTickets = () => {
    let filtered = tickets;
    
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(ticket => ticket.location === selectedLocation);
    }
    
    // Apply time range filter
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(now, daysBack);
    
    filtered = filtered.filter(ticket => ticket.dropOffDate >= startDate);
    
    return filtered;
  };

  const calculateKPIs = () => {
    const filtered = getFilteredTickets();
    const completed = filtered.filter(t => t.status === 'completed');
    
    const totalRevenue = completed.reduce((sum, ticket) => sum + (ticket.revenue || 0), 0);
    const avgSatisfaction = completed.reduce((sum, ticket) => sum + (ticket.customerSatisfaction || 4.5), 0) / completed.length;
    const totalTickets = filtered.length;
    const completedTickets = completed.length;
    
    return {
      totalRevenue,
      avgSatisfaction: avgSatisfaction || 4.5,
      totalTickets,
      completedTickets,
      completionRate: totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0,
    };
  };

  const kpis = calculateKPIs();

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                label="Location"
              >
                <MenuItem value="all">All Locations</MenuItem>
                <MenuItem value="shop_1">Tailor Shop 1</MenuItem>
                <MenuItem value="shop_2">Tailor Shop 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <RevenueIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">${kpis.totalRevenue.toLocaleString()}</Typography>
                  <Typography color="textSecondary">Total Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TicketIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{kpis.totalTickets}</Typography>
                  <Typography color="textSecondary">Total Orders</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <RatingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{kpis.avgSatisfaction.toFixed(1)}/5</Typography>
                  <Typography color="textSecondary">Avg Satisfaction</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PerformanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{kpis.completionRate.toFixed(0)}%</Typography>
                  <Typography color="textSecondary">Completion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Revenue & Orders Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    strokeWidth={3}
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Popularity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TailoringIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Service Popularity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={servicePopularity}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {servicePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PerformanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance Metrics
              </Typography>
              <Stack spacing={3}>
                {performanceMetrics.map((metric, index) => (
                  <Box key={index}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{metric.metric}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.value}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: metric.progress >= 90 ? 'success.main' : 
                                         metric.progress >= 70 ? 'warning.main' : 'error.main',
                        },
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Target: {metric.target}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Services */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TailoringIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Services
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topServices.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>{service.service}</TableCell>
                        <TableCell align="right">{service.count}</TableCell>
                        <TableCell align="right">${service.revenue}</TableCell>
                        <TableCell align="right">{service.avgTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location Performance Comparison
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Location</TableCell>
                      <TableCell align="right">Tickets</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg Turnaround</TableCell>
                      <TableCell align="right">Satisfaction</TableCell>
                      <TableCell align="right">On-Time %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locationPerformance.map((location, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                              <LocationIcon fontSize="small" />
                            </Avatar>
                            {location.location}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{location.tickets}</TableCell>
                        <TableCell align="right">${location.revenue.toLocaleString()}</TableCell>
                        <TableCell align="right">{location.avgTurnaround}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <RatingIcon sx={{ color: 'gold', mr: 0.5, fontSize: 16 }} />
                            {location.satisfaction}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${location.onTime}%`}
                            color={location.onTime >= 90 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TailoringAnalytics; 