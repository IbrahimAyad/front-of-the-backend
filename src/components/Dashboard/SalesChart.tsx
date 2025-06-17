import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

interface SalesData {
  month: string;
  revenue: number;
  orders: number;
  target: number;
}

const mockSalesData: SalesData[] = [
  { month: 'Jan', revenue: 45000, orders: 28, target: 40000 },
  { month: 'Feb', revenue: 52000, orders: 32, target: 45000 },
  { month: 'Mar', revenue: 48000, orders: 30, target: 50000 },
  { month: 'Apr', revenue: 61000, orders: 38, target: 55000 },
  { month: 'May', revenue: 58000, orders: 36, target: 60000 },
  { month: 'Jun', revenue: 67000, orders: 42, target: 65000 },
];

const SalesChart: React.FC = () => {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
          Sales Performance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Revenue trends and order volume over time
        </Typography>
        
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={mockSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="month" 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' || name === 'target' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : name === 'target' ? 'Target' : 'Orders'
                ]}
                labelStyle={{ color: theme.palette.text.primary }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 2 }}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 3 }}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Month
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {formatCurrency(67000)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              vs Target
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              +3.1%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesChart; 