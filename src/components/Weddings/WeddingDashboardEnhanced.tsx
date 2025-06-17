import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Psychology as AIIcon,
  Chat as ChatIcon,
  QualityControl as QualityIcon,
  PhoneAndroid as MobileIcon,
  Notifications as NotificationIcon,
  Add as AddIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  VideoCall as VideoCallIcon,
  Campaign as AnnouncementIcon,
  SmartToy as BotIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

import { WeddingParty, WeddingMember, WeddingAnalytics } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';
import WeddingRegistration from './WeddingRegistration';
import WeddingPartyDetail from './WeddingPartyDetail';
import WeddingAnalyticsCalendar from './WeddingAnalyticsCalendar';
import BusinessIntelligenceDashboard from './BusinessIntelligenceDashboard';
import WeddingCommunicationHub from './WeddingCommunicationHub';
import WeddingNotificationSystem from './WeddingNotificationSystem';
import WeddingCalendarIntegration from './WeddingCalendarIntegration';
import WeddingPDFReports from './WeddingPDFReports';
import WeddingBulkActions from './WeddingBulkActions';
import WeddingCustomFields from './WeddingCustomFields';
// import WeddingAIAssistant from './WeddingAIAssistant';
// import WeddingQualityControl from './WeddingQualityControl';
// import WeddingMobileApp from './WeddingMobileApp';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const WeddingDashboardEnhanced: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [weddings, setWeddings] = useState<WeddingParty[]>([]);
  const [analytics, setAnalytics] = useState<WeddingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedWedding, setSelectedWedding] = useState<WeddingParty | null>(null);
  const [showMobileView, setShowMobileView] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showQualityControl, setShowQualityControl] = useState(false);
  const [showCommunicationHub, setShowCommunicationHub] = useState(false);

  // Enhanced features state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'urgent' | 'warning' | 'info' | 'success';
    message: string;
    weddingId?: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const [aiInsights, setAiInsights] = useState<Array<{
    id: string;
    type: 'recommendation' | 'warning' | 'optimization';
    title: string;
    description: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>>([]);

  useEffect(() => {
    loadData();
    generateAIInsights();
    generateNotifications();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [weddingData, analyticsData] = await Promise.all([
        weddingAPI.getWeddingParties(),
        weddingAPI.getWeddingAnalytics(),
      ]);
      setWeddings(weddingData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading wedding data:', error);
      toast.error('Failed to load wedding data');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = () => {
    // Mock AI insights generation
    const insights = [
      {
        id: '1',
        type: 'warning' as const,
        title: 'Urgent Measurements Needed',
        description: '3 weddings have pending measurements with less than 30 days remaining',
        confidence: 95,
        priority: 'critical' as const,
      },
      {
        id: '2',
        type: 'optimization' as const,
        title: 'Batch Processing Opportunity',
        description: 'Group 5 similar orders for 20% efficiency improvement',
        confidence: 87,
        priority: 'medium' as const,
      },
      {
        id: '3',
        type: 'recommendation' as const,
        title: 'Quality Control Enhancement',
        description: 'Implement additional checkpoints for VIP orders',
        confidence: 92,
        priority: 'high' as const,
      },
    ];
    setAiInsights(insights);
  };

  const generateNotifications = () => {
    // Mock notifications
    const mockNotifications = [
      {
        id: '1',
        type: 'urgent' as const,
        message: 'Johnson Wedding: 2 measurements overdue',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
      },
      {
        id: '2',
        type: 'info' as const,
        message: 'Smith Wedding: All measurements completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        type: 'warning' as const,
        message: 'Brown Wedding: Shipping address needed',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRegistrationComplete = (weddingId: string) => {
    setShowRegistration(false);
    loadData();
    toast.success('Wedding party created successfully!');
  };

  const getStatusColor = (status: WeddingParty['status']) => {
    switch (status) {
      case 'planning': return 'info';
      case 'measurements': return 'warning';
      case 'fittings': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getDaysUntilWedding = (weddingDate: Date) => {
    return differenceInDays(weddingDate, new Date());
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'error';
    if (daysUntil < 30) return 'warning';
    if (daysUntil < 90) return 'info';
    return 'success';
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const criticalInsights = aiInsights.filter(i => i.priority === 'critical').length;
  const urgentWeddings = weddings.filter(w => getDaysUntilWedding(w.weddingDate) <= 14).length;

  const speedDialActions = [
    { 
      icon: <AddIcon />, 
      name: 'New Wedding', 
      action: () => setShowRegistration(true) 
    },
    { 
      icon: <ChatIcon />, 
      name: 'Communication Hub', 
      action: () => setShowCommunicationHub(true) 
    },
    { 
      icon: <BotIcon />, 
      name: 'AI Assistant', 
      action: () => setShowAIAssistant(true) 
    },
    { 
      icon: <QualityIcon />, 
      name: 'Quality Control', 
      action: () => setShowQualityControl(true) 
    },
    { 
      icon: <MobileIcon />, 
      name: 'Mobile View', 
      action: () => setShowMobileView(true) 
    },
  ];

  const renderEnhancedOverview = () => (
    <Box>
      {/* AI Insights Banner */}
      {criticalInsights > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowAIAssistant(true)}>
              View AI Insights
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>AI Alert:</strong> {criticalInsights} critical insights require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white', textAlign: 'center' }}>
              <Badge badgeContent={urgentWeddings} color="error">
                <EventIcon sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h4" fontWeight="bold">
                {weddings.length}
              </Typography>
              <Typography variant="body2">
                Active Weddings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent sx={{ color: 'white', textAlign: 'center' }}>
              <Badge badgeContent={unreadNotifications} color="warning">
                <NotificationIcon sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h4" fontWeight="bold">
                {notifications.length}
              </Typography>
              <Typography variant="body2">
                Notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent sx={{ color: 'white', textAlign: 'center' }}>
              <Badge badgeContent={criticalInsights} color="error">
                <AIIcon sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h4" fontWeight="bold">
                {aiInsights.length}
              </Typography>
              <Typography variant="body2">
                AI Insights
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent sx={{ color: 'white', textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {analytics?.completionRate || 0}%
              </Typography>
              <Typography variant="body2">
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={() => setShowCommunicationHub(true)}
                  >
                    Communication
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BotIcon />}
                    onClick={() => setShowAIAssistant(true)}
                  >
                    AI Assistant
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<QualityIcon />}
                    onClick={() => setShowQualityControl(true)}
                  >
                    Quality Control
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCallIcon />}
                  >
                    Video Call
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent AI Insights
              </Typography>
              <List dense>
                {aiInsights.slice(0, 3).map((insight) => (
                  <ListItem key={insight.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: insight.priority === 'critical' ? 'error.main' : 
                                insight.priority === 'high' ? 'warning.main' : 'info.main',
                        width: 32,
                        height: 32
                      }}>
                        <AIIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={insight.title}
                      secondary={`${insight.confidence}% confidence`}
                    />
                    <Chip
                      label={insight.priority}
                      size="small"
                      color={insight.priority === 'critical' ? 'error' : 'warning'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Wedding List with Enhanced Features */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Active Weddings
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowRegistration(true)}
              >
                New Wedding
              </Button>
            </Box>
          </Box>

          {loading ? (
            <LinearProgress />
          ) : (
            <Grid container spacing={2}>
              {weddings.map((wedding) => {
                const daysUntil = getDaysUntilWedding(wedding.weddingDate);
                const completedMeasurements = wedding.members.filter(m => m.measurementStatus === 'completed').length;
                const progressPercentage = (completedMeasurements / wedding.members.length) * 100;

                return (
                  <Grid item xs={12} md={6} lg={4} key={wedding.id}>
                    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setSelectedWedding(wedding)}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {wedding.groomInfo.name} & {wedding.brideInfo.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(wedding.weddingDate, 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${daysUntil} days`}
                            color={getUrgencyColor(daysUntil)}
                            size="small"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Progress: {completedMeasurements}/{wedding.members.length} members
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{ mb: 1 }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={wedding.status}
                            color={getStatusColor(wedding.status)}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {wedding.members.length} members
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Enhanced Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Wedding Management System
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Enhanced with AI, Communication, and Quality Control
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton sx={{ color: 'white' }}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="AI Insights">
              <IconButton sx={{ color: 'white' }} onClick={() => setShowAIAssistant(true)}>
                <Badge badgeContent={criticalInsights} color="error">
                  <AIIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton sx={{ color: 'white' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'fullWidth'}>
          <Tab 
            label={
              <Badge badgeContent={urgentWeddings} color="error">
                Dashboard
              </Badge>
            } 
            icon={<DashboardIcon />} 
          />
          <Tab label="Analytics Calendar" icon={<AnalyticsIcon />} />
          <Tab label="Business Intelligence" icon={<TrendingUpIcon />} />
          <Tab 
            label={
              <Badge badgeContent={unreadNotifications} color="error">
                Communication
              </Badge>
            } 
            icon={<ChatIcon />} 
          />
          <Tab label="Notifications" icon={<NotificationIcon />} />
          <Tab label="Calendar" icon={<EventIcon />} />
          <Tab label="Reports" icon={<AnalyticsIcon />} />
          <Tab label="Bulk Actions" icon={<GroupsIcon />} />
          <Tab label="Custom Fields" icon={<SettingsIcon />} />
          <Tab 
            label={
              <Badge badgeContent={criticalInsights} color="error">
                AI Assistant
              </Badge>
            } 
            icon={<AIIcon />} 
          />
          <Tab label="Quality Control" icon={<QualityIcon />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {renderEnhancedOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <WeddingAnalyticsCalendar weddings={weddings} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <BusinessIntelligenceDashboard weddings={weddings} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {weddings.length > 0 && (
          <WeddingCommunicationHub
            wedding={weddings[0]}
            currentUserId="coordinator-1"
            currentUserRole="coordinator"
            onUpdate={loadData}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {weddings.length > 0 && (
          <WeddingNotificationSystem
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {weddings.length > 0 && (
          <WeddingCalendarIntegration
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        {weddings.length > 0 && (
          <WeddingPDFReports
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        {weddings.length > 0 && (
          <WeddingBulkActions
            wedding={weddings[0]}
            onUpdate={(updatedWedding) => {
              setWeddings(weddings.map(w => w.id === updatedWedding.id ? updatedWedding : w));
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        {weddings.length > 0 && (
          <WeddingCustomFields
            wedding={weddings[0]}
            onUpdate={(updatedWedding) => {
              setWeddings(weddings.map(w => w.id === updatedWedding.id ? updatedWedding : w));
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <Alert severity="info">
          AI Assistant feature is being enhanced. Coming soon with advanced insights and recommendations!
        </Alert>
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <Alert severity="info">
          Quality Control dashboard is being developed. Coming soon with multi-stage approval workflows!
        </Alert>
      </TabPanel>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      {/* Dialogs */}
      <Dialog open={showRegistration} onClose={() => setShowRegistration(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Wedding Party</DialogTitle>
        <DialogContent>
          <WeddingRegistration
            onComplete={handleRegistrationComplete}
            onBack={() => setShowRegistration(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedWedding} onClose={() => setSelectedWedding(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Wedding Party Details
            <IconButton onClick={() => setSelectedWedding(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedWedding && (
            <WeddingPartyDetail
              wedding={selectedWedding}
              onBack={() => setSelectedWedding(null)}
              onUpdate={loadData}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCommunicationHub} onClose={() => setShowCommunicationHub(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Communication Hub
            <IconButton onClick={() => setShowCommunicationHub(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {weddings.length > 0 && (
            <WeddingCommunicationHub
              wedding={weddings[0]}
              currentUserId="coordinator-1"
              currentUserRole="coordinator"
              onUpdate={loadData}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WeddingDashboardEnhanced; 