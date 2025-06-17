import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

interface ChartData {
  name: string;
  revenue: number;
  orders: number;
  customers: number;
  leads: number;
  conversion: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card sx={{ p: 2, boxShadow: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Box key={index} display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: entry.color,
              }}
            />
            <Typography variant="body2">
              {entry.dataKey}: {entry.value.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Card>
    );
  }
  return null;
};

const AdvancedCharts: React.FC = () => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'composed'>('line');
  const [timeRange] = useState('30d');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Sample data - replace with real data
  const data: ChartData[] = [
    { name: 'Jan', revenue: 4000, orders: 24, customers: 18, leads: 45, conversion: 53 },
    { name: 'Feb', revenue: 3000, orders: 18, customers: 22, leads: 38, conversion: 58 },
    { name: 'Mar', revenue: 5000, orders: 32, customers: 28, leads: 52, conversion: 62 },
    { name: 'Apr', revenue: 4500, orders: 28, customers: 25, leads: 48, conversion: 58 },
    { name: 'May', revenue: 6000, orders: 38, customers: 32, leads: 65, conversion: 65 },
    { name: 'Jun', revenue: 5500, orders: 35, customers: 30, leads: 58, conversion: 62 },
  ];

  const pieData = [
    { name: 'Suits', value: 400, color: '#0088FE' },
    { name: 'Shirts', value: 300, color: '#00C49F' },
    { name: 'Accessories', value: 200, color: '#FFBB28' },
    { name: 'Tuxedos', value: 150, color: '#FF8042' },
  ];

  const handleChartTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'line' | 'bar' | 'area' | 'composed' | null,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const exportChart = (format: 'png' | 'pdf' | 'csv') => {
    // Implementation for chart export
    console.log(`Exporting chart as ${format}`);
    handleMenuClose();
  };

  const renderChart = (): React.ReactElement => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8884d8" 
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#82ca9d" 
              strokeWidth={3}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="orders" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stackId="1" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#ff7300" strokeWidth={3} />
            <ReferenceLine yAxisId="right" y={60} stroke="red" strokeDasharray="5 5" />
          </ComposedChart>
        );
    }
  };

  return (
    <Box>
      {/* Revenue & Orders Trend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Revenue & Orders Trend
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip label={`Last ${timeRange}`} size="small" />
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                <Typography variant="caption" color="success.main">
                  +15.3% vs previous period
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                size="small"
              >
                <ToggleButton value="line">Line</ToggleButton>
                <ToggleButton value="bar">Bar</ToggleButton>
                <ToggleButton value="area">Area</ToggleButton>
                <ToggleButton value="composed">Mixed</ToggleButton>
              </ToggleButtonGroup>
              
              <Tooltip title="Chart Options">
                <IconButton onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Product Distribution */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Product Category Distribution
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Lead Conversion Funnel
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { stage: 'Leads', count: 1000, color: '#8884d8' },
                    { stage: 'Qualified', count: 600, color: '#82ca9d' },
                    { stage: 'Proposals', count: 300, color: '#ffc658' },
                    { stage: 'Closed', count: 150, color: '#ff7c7c' },
                  ]}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Chart Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => exportChart('png')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as PNG
        </MenuItem>
        <MenuItem onClick={() => exportChart('pdf')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={() => exportChart('csv')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export Data as CSV
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <FullscreenIcon sx={{ mr: 1 }} />
          View Fullscreen
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdvancedCharts; 