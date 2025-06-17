import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Fab,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Speed as PerformanceIcon,
  FilterList as FilterIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Import our enhanced components
import RealTimeMetrics from '../../components/Dashboard/RealTimeMetrics';
import AdvancedCharts from '../../components/Dashboard/AdvancedCharts';
import SmartFilters from '../../components/Dashboard/SmartFilters';
import ActivityTimeline from '../../components/Dashboard/ActivityTimeline';
import PerformanceMonitor from '../../components/Dashboard/PerformanceMonitor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const EnhancedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const tabs = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RealTimeMetrics />
          </Grid>
          <Grid item xs={12} lg={8}>
            <AdvancedCharts />
          </Grid>
          <Grid item xs={12} lg={4}>
            <ActivityTimeline />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SmartFilters />
          </Grid>
          <Grid item xs={12}>
            <AdvancedCharts />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Activity',
      icon: <TimelineIcon />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ActivityTimeline />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Performance',
      icon: <PerformanceIcon />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PerformanceMonitor />
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        p: 3,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        sx={{
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 3,
          boxShadow: theme.shadows[4],
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            KCT Menswear Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Advanced Business Intelligence & Real-Time Analytics
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Filters">
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton onClick={toggleFullscreen}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Card
        sx={{
          mb: 3,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          <Box
            sx={{
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {tab.component}
          </Box>
        </TabPanel>
      ))}

      {/* Floating Action Button */}
      <Zoom in timeout={1000}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Quick Stats Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000,
        }}
      >
        {[
          { label: 'Active Users', value: '24', color: 'success.main' },
          { label: 'System Load', value: '67%', color: 'warning.main' },
          { label: 'Revenue Today', value: '$12.5K', color: 'primary.main' },
        ].map((stat, index) => (
          <Card
            key={index}
            sx={{
              minWidth: 120,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {stat.label}
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: stat.color }}
              >
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default EnhancedDashboard; 