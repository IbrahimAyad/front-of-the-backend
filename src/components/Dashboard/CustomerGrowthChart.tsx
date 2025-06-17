import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme, Chip } from '@mui/material';
import { PersonAdd, People, TrendingUp } from '@mui/icons-material';

interface GrowthData {
  month: string;
  newCustomers: number;
  totalCustomers: number;
  retainedCustomers: number;
}

const mockGrowthData: GrowthData[] = [
  { month: 'Jan', newCustomers: 12, totalCustomers: 145, retainedCustomers: 133 },
  { month: 'Feb', newCustomers: 18, totalCustomers: 163, retainedCustomers: 151 },
  { month: 'Mar', newCustomers: 15, totalCustomers: 178, retainedCustomers: 165 },
  { month: 'Apr', newCustomers: 22, totalCustomers: 200, retainedCustomers: 185 },
  { month: 'May', newCustomers: 19, totalCustomers: 219, retainedCustomers: 203 },
  { month: 'Jun', newCustomers: 25, totalCustomers: 244, retainedCustomers: 228 },
];

const CustomerGrowthChart: React.FC = () => {
  const theme = useTheme();

  const currentMonth = mockGrowthData[mockGrowthData.length - 1];
  const previousMonth = mockGrowthData[mockGrowthData.length - 2];
  const growthRate = ((currentMonth.newCustomers - previousMonth.newCustomers) / previousMonth.newCustomers * 100).toFixed(1);
  const retentionRate = ((currentMonth.retainedCustomers / currentMonth.totalCustomers) * 100).toFixed(1);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
          Customer Growth
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Track customer acquisition and retention trends
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            icon={<PersonAdd />}
            label={`+${currentMonth.newCustomers} New`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<People />}
            label={`${currentMonth.totalCustomers} Total`}
            color="secondary"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<TrendingUp />}
            label={`${retentionRate}% Retention`}
            color="success"
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={mockGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="newCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="month" 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value,
                  name === 'totalCustomers' ? 'Total Customers' : 
                  name === 'newCustomers' ? 'New Customers' : 'Retained Customers'
                ]}
                labelStyle={{ color: theme.palette.text.primary }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalCustomers"
                stackId="1"
                stroke={theme.palette.primary.main}
                fill="url(#totalCustomers)"
                strokeWidth={2}
                name="Total Customers"
              />
              <Area
                type="monotone"
                dataKey="newCustomers"
                stackId="2"
                stroke={theme.palette.secondary.main}
                fill="url(#newCustomers)"
                strokeWidth={2}
                name="New Customers"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Growth Rate
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              +{growthRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Retention Rate
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {retentionRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This Month
            </Typography>
            <Typography variant="h6" color="secondary.main" fontWeight="bold">
              +{currentMonth.newCustomers}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerGrowthChart; 