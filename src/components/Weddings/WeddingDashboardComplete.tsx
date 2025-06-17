import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Psychology as AIIcon,
  Chat as ChatIcon,
  QualityControl as QualityIcon,
  Notifications as NotificationIcon,
  Event as EventIcon,
  PictureAsPdf as ReportIcon,
  Group as BulkIcon,
  Settings as FieldsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Add as AddIcon,
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

const WeddingDashboardComplete: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [weddings, setWeddings] = useState<WeddingParty[]>([]);
  const [analytics, setAnalytics] = useState<WeddingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedWedding, setSelectedWedding] = useState<WeddingParty | null>(null);

  // Enhanced features state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'urgent' | 'warning' | 'info' | 'success';
    message: string;
    weddingId?: string;
    timestamp: Date;
    read: boolean;
  }>>([]);

  useEffect(() => {
    loadData();
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
    toast.success('Wedding party registered successfully!');
  };

  const getStatusColor = (status: WeddingParty['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getDaysUntilWedding = (weddingDate: Date) => {
    return differenceInDays(weddingDate, new Date());
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 7) return 'error';
    if (daysUntil <= 21) return 'warning';
    return 'success';
  };

  // Calculate dashboard metrics
  const urgentWeddings = weddings.filter(w => getDaysUntilWedding(w.weddingDate) <= 7).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const totalMembers = weddings.reduce((sum, w) => sum + w.members.length, 0);
  const completedMeasurements = weddings.reduce((sum, w) => 
    sum + w.members.filter(m => m.measurementStatus === 'completed').length, 0
  );
  const pendingMeasurements = weddings.reduce((sum, w) => 
    sum + w.members.filter(m => m.measurementStatus === 'pending').length, 0
  );

  const renderDashboardOverview = () => (
    <Box>
      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Weddings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {weddings.filter(w => w.status === 'active').length}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Urgent Deadlines
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {urgentWeddings}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Members
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalMembers}
                  </Typography>
                </Box>
                <BulkIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {totalMembers > 0 ? Math.round((completedMeasurements / totalMembers) * 100) : 0}%
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity & Alerts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Weddings
              </Typography>
              {weddings.slice(0, 5).map((wedding) => {
                const daysUntil = getDaysUntilWedding(wedding.weddingDate);
                const completedCount = wedding.members.filter(m => m.measurementStatus === 'completed').length;
                const progressPercentage = (completedCount / wedding.members.length) * 100;

                return (
                  <Box key={wedding.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {wedding.groomInfo.name} & {wedding.brideInfo.name}
                      </Typography>
                      <Chip
                        label={`${daysUntil} days`}
                        size="small"
                        color={getUrgencyColor(daysUntil) as any}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {wedding.weddingCode} • {format(wedding.weddingDate, 'MMM dd, yyyy')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress: {completedCount}/{wedding.members.length}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(progressPercentage)}%
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => setShowRegistration(true)}
                sx={{ mt: 2 }}
              >
                Add New Wedding
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<NotificationIcon />}
                  onClick={() => setTabValue(4)}
                  fullWidth
                >
                  Send Notifications
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EventIcon />}
                  onClick={() => setTabValue(5)}
                  fullWidth
                >
                  Calendar Integration
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={() => setTabValue(6)}
                  fullWidth
                >
                  Generate Reports
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BulkIcon />}
                  onClick={() => setTabValue(7)}
                  fullWidth
                >
                  Bulk Actions
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FieldsIcon />}
                  onClick={() => setTabValue(8)}
                  fullWidth
                >
                  Custom Fields
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Urgent Alerts */}
      {urgentWeddings > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography fontWeight="bold">
            🚨 {urgentWeddings} wedding(s) have deadlines within 7 days!
          </Typography>
          <Typography variant="body2">
            {pendingMeasurements} measurements are still pending. Consider sending urgent reminders.
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="error"
            sx={{ mt: 1 }}
            onClick={() => setTabValue(4)}
          >
            Send Urgent Notifications
          </Button>
        </Alert>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Enhanced Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              KCT Wedding Management System
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Complete solution with notifications, calendar, reports, bulk actions & custom fields
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton sx={{ color: 'white' }} onClick={() => setTabValue(4)}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Urgent Weddings">
              <IconButton sx={{ color: 'white' }} onClick={() => setTabValue(0)}>
                <Badge badgeContent={urgentWeddings} color="error">
                  <WarningIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Badge badgeContent={urgentWeddings} color="error">
                Dashboard
              </Badge>
            } 
            icon={<DashboardIcon />} 
          />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
          <Tab label="Business Intel" icon={<TrendingUpIcon />} />
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
          <Tab label="Reports" icon={<ReportIcon />} />
          <Tab label="Bulk Actions" icon={<BulkIcon />} />
          <Tab label="Custom Fields" icon={<FieldsIcon />} />
          <Tab label="AI Assistant" icon={<AIIcon />} />
          <Tab label="Quality Control" icon={<QualityIcon />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {renderDashboardOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <WeddingAnalyticsCalendar weddings={weddings} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <BusinessIntelligenceDashboard weddings={weddings} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {weddings.length > 0 ? (
          <WeddingCommunicationHub
            wedding={weddings[0]}
            currentUserId="coordinator-1"
            currentUserRole="coordinator"
            onUpdate={loadData}
          />
        ) : (
          <Alert severity="info">No weddings available for communication.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {weddings.length > 0 ? (
          <WeddingNotificationSystem
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        ) : (
          <Alert severity="info">No weddings available for notifications.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {weddings.length > 0 ? (
          <WeddingCalendarIntegration
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        ) : (
          <Alert severity="info">No weddings available for calendar integration.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        {weddings.length > 0 ? (
          <WeddingPDFReports
            wedding={weddings[0]}
            onUpdate={loadData}
          />
        ) : (
          <Alert severity="info">No weddings available for report generation.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        {weddings.length > 0 ? (
          <WeddingBulkActions
            wedding={weddings[0]}
            onUpdate={(updatedWedding) => {
              setWeddings(weddings.map(w => w.id === updatedWedding.id ? updatedWedding : w));
            }}
          />
        ) : (
          <Alert severity="info">No weddings available for bulk actions.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        {weddings.length > 0 ? (
          <WeddingCustomFields
            wedding={weddings[0]}
            onUpdate={(updatedWedding) => {
              setWeddings(weddings.map(w => w.id === updatedWedding.id ? updatedWedding : w));
            }}
          />
        ) : (
          <Alert severity="info">No weddings available for custom fields.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <Alert severity="info" sx={{ mb: 2 }}>
          AI Assistant feature is being enhanced with advanced insights and recommendations!
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Coming Soon: AI-Powered Features</Typography>
            <ul>
              <li>Smart sizing recommendations based on historical data</li>
              <li>Predictive analytics for delivery timelines</li>
              <li>Automated quality checks and alerts</li>
              <li>Intelligent workflow optimization</li>
              <li>Customer behavior insights</li>
            </ul>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Quality Control dashboard is being developed with multi-stage approval workflows!
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Coming Soon: Quality Control Features</Typography>
            <ul>
              <li>Multi-stage quality checkpoints</li>
              <li>Photo documentation and approval</li>
              <li>Inspector assignment and workflows</li>
              <li>Quality scoring and metrics</li>
              <li>Defect tracking and resolution</li>
            </ul>
          </CardContent>
        </Card>
      </TabPanel>

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
    </Box>
  );
};

export default WeddingDashboardComplete; 