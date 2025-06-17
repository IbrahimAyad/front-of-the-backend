import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

const mockFunnelData: FunnelData[] = [
  { stage: 'New Leads', count: 150, percentage: 100, color: '#e3f2fd' },
  { stage: 'Contacted', count: 120, percentage: 80, color: '#bbdefb' },
  { stage: 'Qualified', count: 85, percentage: 57, color: '#90caf9' },
  { stage: 'Hot Leads', count: 45, percentage: 30, color: '#64b5f6' },
  { stage: 'Converted', count: 18, percentage: 12, color: '#42a5f5' },
];

const LeadFunnelChart: React.FC = () => {
  const theme = useTheme();

  const conversionRate = 12; // 18/150 * 100
  const previousRate = 10;
  const isImproving = conversionRate > previousRate;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
              Lead Conversion Funnel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track leads through the sales pipeline
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isImproving ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
            )}
            <Typography 
              variant="h6" 
              color={isImproving ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              {conversionRate}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: 250, mb: 3 }}>
          <ResponsiveContainer>
            <BarChart 
              data={mockFunnelData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                type="number"
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="stage"
                stroke={theme.palette.text.secondary}
                fontSize={12}
                width={80}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [value, 'Leads']}
                labelStyle={{ color: theme.palette.text.primary }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {mockFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ space: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Conversion Rates by Stage
          </Typography>
          {mockFunnelData.map((stage, index) => (
            <Box key={stage.stage} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.primary">
                  {stage.stage}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stage.count} ({stage.percentage}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stage.percentage} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.primary.main,
                  }
                }}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[50], 
          borderRadius: 2 
        }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overall Conversion Rate
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {conversionRate}%
            </Typography>
            <Typography 
              variant="body2" 
              color={isImproving ? 'success.main' : 'error.main'}
            >
              {isImproving ? '+' : ''}{(conversionRate - previousRate).toFixed(1)}% vs last month
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeadFunnelChart; 