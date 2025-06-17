import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme, Chip } from '@mui/material';
import { 
  CheckCircle, 
  Schedule, 
  Build, 
  Cancel,
  LocalShipping 
} from '@mui/icons-material';

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

const OrderStatusChart: React.FC = () => {
  const theme = useTheme();

  const orderStatusData: OrderStatusData[] = [
    { 
      status: 'Completed', 
      count: 45, 
      percentage: 45, 
      color: theme.palette.success.main,
      icon: <CheckCircle />
    },
    { 
      status: 'In Progress', 
      count: 28, 
      percentage: 28, 
      color: theme.palette.warning.main,
      icon: <Build />
    },
    { 
      status: 'Pending', 
      count: 18, 
      percentage: 18, 
      color: theme.palette.info.main,
      icon: <Schedule />
    },
    { 
      status: 'Shipped', 
      count: 7, 
      percentage: 7, 
      color: theme.palette.primary.main,
      icon: <LocalShipping />
    },
    { 
      status: 'Cancelled', 
      count: 2, 
      percentage: 2, 
      color: theme.palette.error.main,
      icon: <Cancel />
    },
  ];

  const totalOrders = orderStatusData.reduce((sum, item) => sum + item.count, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
          Order Status Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current status breakdown of all orders
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: '60%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Orders']}
                  labelStyle={{ color: theme.palette.text.primary }}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ width: '40%' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Order Breakdown
            </Typography>
            {orderStatusData.map((item) => (
              <Box key={item.status} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: item.color, 
                    borderRadius: '50%', 
                    mr: 1.5 
                  }} 
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.primary">
                    {item.status}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.count} orders ({item.percentage}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {orderStatusData.map((item) => (
            <Chip
              key={item.status}
              icon={React.cloneElement(item.icon as React.ReactElement, { 
                sx: { fontSize: 16, color: item.color } 
              })}
              label={`${item.count} ${item.status}`}
              variant="outlined"
              size="small"
              sx={{ 
                borderColor: item.color,
                color: item.color,
                '& .MuiChip-icon': {
                  color: item.color
                }
              }}
            />
          ))}
        </Box>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50], 
          borderRadius: 2 
        }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Active Orders
          </Typography>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            {totalOrders}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderStatusChart; 