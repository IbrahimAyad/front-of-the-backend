import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Alert,
  Divider,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Notifications as NotificationIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Straighten as MeasureIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

import { WeddingParty, WeddingMember, WeddingAnalytics } from '../../types';
import { weddingAPI } from '../../services/weddingAPI';
import WeddingRegistration from './WeddingRegistration';
import WeddingPartyDetail from './WeddingPartyDetail';
import WeddingAnalyticsCalendar from './WeddingAnalyticsCalendar';
import BusinessIntelligenceDashboard from './BusinessIntelligenceDashboard';
import WeddingCommunicationHub from './WeddingCommunicationHub';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wedding-tabpanel-${index}`}
      aria-labelledby={`wedding-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WeddingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [weddings, setWeddings] = useState<WeddingParty[]>([]);
  const [analytics, setAnalytics] = useState<WeddingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedWedding, setSelectedWedding] = useState<WeddingParty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced features
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'urgent' | 'warning' | 'info';
    message: string;
    weddingId?: string;
    timestamp: Date;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadData();
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

  const getStatusLabel = (status: WeddingParty['status']) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'measurements': return 'Measurements';
      case 'fittings': return 'Fittings';
      case 'completed': return 'Completed';
      default: return status;
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

  const filteredWeddings = weddings.filter(wedding =>
    wedding.groomInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.brideInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.weddingCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingWeddings = filteredWeddings.filter(w => isAfter(w.weddingDate, new Date()));
  const pastWeddings = filteredWeddings.filter(w => isBefore(w.weddingDate, new Date()));

  // Enhanced analytics calculations
  const getEnhancedAnalytics = () => {
    if (!weddings.length) return null;

    const now = new Date();
    const urgentWeddings = weddings.filter(w => {
      const daysUntil = getDaysUntilWedding(w.weddingDate);
      return daysUntil <= 14 && daysUntil >= 0;
    }).length;

    const totalPendingMeasurements = weddings.reduce((sum, w) => 
      sum + w.members.filter(m => m.measurementStatus === 'pending').length, 0
    );

    const totalPendingShipping = weddings.reduce((sum, w) => 
      sum + w.members.filter(m => !m.shippingAddress).length, 0
    );

    const totalPendingPayments = weddings.reduce((sum, w) => 
      sum + w.members.filter(m => !m.orderStatus || m.orderStatus === 'pending').length, 0
    );

    const completionRate = weddings.length > 0 ? 
      weddings.reduce((sum, w) => {
        const totalSteps = w.members.length * 3;
        const completedSteps = w.members.reduce((memberSum, m) => {
          let completed = 0;
          if (m.measurements) completed++;
          if (m.shippingAddress) completed++;
          if (m.orderStatus === 'delivered' || m.orderStatus === 'shipped') completed++;
          return memberSum + completed;
        }, 0);
        return sum + (totalSteps > 0 ? (completedSteps / totalSteps) : 0);
      }, 0) / weddings.length * 100 : 0;

    return {
      urgentWeddings,
      totalPendingMeasurements,
      totalPendingShipping,
      totalPendingPayments,
      completionRate: Math.round(completionRate),
      averageDaysUntilWedding: weddings.length > 0 ? 
        Math.round(weddings.reduce((sum, w) => sum + getDaysUntilWedding(w.weddingDate), 0) / weddings.length) : 0
    };
  };

  // Generate notifications
  const generateNotifications = () => {
    const newNotifications: typeof notifications = [];
    const now = new Date();

    weddings.forEach(wedding => {
      const daysUntil = getDaysUntilWedding(wedding.weddingDate);
      const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;

      // Urgent deadline notifications
      if (daysUntil <= 7 && daysUntil >= 0 && pendingMeasurements > 0) {
        newNotifications.push({
          id: `urgent-${wedding.id}`,
          type: 'urgent',
          message: `🚨 ${wedding.groomInfo.name} & ${wedding.brideInfo.name}: ${pendingMeasurements} measurements needed in ${daysUntil} days!`,
          weddingId: wedding.id,
          timestamp: now
        });
      }
      // Warning notifications
      else if (daysUntil <= 21 && daysUntil > 7 && pendingMeasurements > 0) {
        newNotifications.push({
          id: `warning-${wedding.id}`,
          type: 'warning',
          message: `⚠️ ${wedding.groomInfo.name} & ${wedding.brideInfo.name}: ${pendingMeasurements} measurements pending (${daysUntil} days left)`,
          weddingId: wedding.id,
          timestamp: now
        });
      }
    });

    setNotifications(newNotifications);
  };

  // Calculate enhanced analytics at component level
  const enhancedAnalytics = getEnhancedAnalytics();

  if (showRegistration) {
    return (
      <WeddingRegistration
        onComplete={handleRegistrationComplete}
        onBack={() => setShowRegistration(false)}
      />
    );
  }

  if (selectedWedding) {
    return (
      <WeddingPartyDetail
        wedding={selectedWedding}
        onBack={() => setSelectedWedding(null)}
        onUpdate={loadData}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading wedding data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          💍 Wedding Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Notification Bell */}
          <Tooltip title="Notifications">
            <IconButton 
              onClick={() => {
                generateNotifications();
                setShowNotifications(true);
              }}
              color={notifications.length > 0 ? 'error' : 'default'}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Refresh Button */}
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => {
              loadData();
              setLastRefresh(new Date());
              toast.success('Data refreshed!');
            }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowRegistration(true)}
            size="large"
          >
            New Wedding Party
          </Button>
        </Box>
      </Box>

      {/* Enhanced Analytics Cards */}
      {enhancedAnalytics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Weddings
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {analytics?.totalWeddings || 0}
                    </Typography>
                  </Box>
                  <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: enhancedAnalytics.urgentWeddings > 0 ? 'error.light' : 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Urgent (≤14 days)
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={enhancedAnalytics.urgentWeddings > 0 ? 'error.main' : 'text.primary'}>
                      {enhancedAnalytics.urgentWeddings}
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Measurements
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {enhancedAnalytics.totalPendingMeasurements}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      pending
                    </Typography>
                  </Box>
                  <MeasureIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Shipping
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {enhancedAnalytics.totalPendingShipping}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      pending
                    </Typography>
                  </Box>
                  <ShippingIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Payments
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {enhancedAnalytics.totalPendingPayments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      pending
                    </Typography>
                  </Box>
                  <PaymentIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completion
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={enhancedAnalytics.completionRate >= 80 ? 'success.main' : 'warning.main'}>
                      {enhancedAnalytics.completionRate}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={enhancedAnalytics.completionRate} 
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </Box>
                  <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by couple names or wedding code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab 
            label={
              <Badge badgeContent={enhancedAnalytics?.urgentWeddings} color="error">
                Dashboard
              </Badge>
            } 
            icon={<DashboardIcon />} 
          />
          <Tab label="Analytics Calendar" icon={<CalendarTodayIcon />} />
          <Tab label="Business Intelligence" icon={<AnalyticsIcon />} />
          <Tab 
            label={
              <Badge badgeContent={notifications.length} color="error">
                Communication
              </Badge>
            } 
            icon={<ChatIcon />} 
          />
        </Tabs>
      </Box>

      {/* Wedding Lists */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Wedding Code</TableCell>
                <TableCell>Couple</TableCell>
                <TableCell>Wedding Date</TableCell>
                <TableCell>Days Until</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Party Size</TableCell>
                <TableCell>Pending Measurements</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingWeddings.map((wedding) => {
                const daysUntil = getDaysUntilWedding(wedding.weddingDate);
                const pendingCount = wedding.members.filter(m => m.measurementStatus === 'pending').length;
                
                return (
                  <TableRow key={wedding.id} hover>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary">
                        {wedding.weddingCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {wedding.groomInfo.name} & {wedding.brideInfo.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {wedding.groomInfo.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(wedding.weddingDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${daysUntil} days`}
                        color={getUrgencyColor(daysUntil)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(wedding.status)}
                        color={getStatusColor(wedding.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupsIcon fontSize="small" />
                        {wedding.members.length} / {wedding.estimatedPartySize}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {pendingCount > 0 ? (
                        <Chip
                          label={`${pendingCount} pending`}
                          color="warning"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      ) : (
                        <Chip
                          label="All complete"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedWedding(wedding)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {upcomingWeddings.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No upcoming weddings found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Create your first wedding party to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowRegistration(true)}
            >
              Create Wedding Party
            </Button>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Wedding Code</TableCell>
                <TableCell>Couple</TableCell>
                <TableCell>Wedding Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Party Size</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pastWeddings.map((wedding) => (
                <TableRow key={wedding.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold" color="primary">
                      {wedding.weddingCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {wedding.groomInfo.name} & {wedding.brideInfo.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {wedding.groomInfo.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(wedding.weddingDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(wedding.status)}
                      color={getStatusColor(wedding.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupsIcon fontSize="small" />
                      {wedding.members.length}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => setSelectedWedding(wedding)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {pastWeddings.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No past weddings found
            </Typography>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <WeddingAnalyticsCalendar
          weddings={weddings}
        />
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

      {/* Notifications Dialog */}
      <Dialog 
        open={showNotifications} 
        onClose={() => setShowNotifications(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationIcon color="primary" />
            <Typography variant="h6">
              Notifications ({notifications.length})
            </Typography>
          </Box>
          <IconButton onClick={() => setShowNotifications(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {notifications.length > 0 ? (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id}
                  sx={{ 
                    border: 1, 
                    borderColor: notification.type === 'urgent' ? 'error.main' : 'warning.main',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: notification.type === 'urgent' ? 'error.light' : 'warning.light'
                  }}
                >
                  <ListItemIcon>
                    {notification.type === 'urgent' ? (
                      <WarningIcon color="error" />
                    ) : (
                      <ScheduleIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={`${format(notification.timestamp, 'MMM dd, yyyy HH:mm')}`}
                  />
                  {notification.weddingId && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const wedding = weddings.find(w => w.id === notification.weddingId);
                        if (wedding) {
                          setSelectedWedding(wedding);
                          setShowNotifications(false);
                        }
                      }}
                    >
                      View Wedding
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                All caught up! 🎉
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No urgent notifications at this time.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotifications(false)}>
            Close
          </Button>
          {notifications.length > 0 && (
            <Button 
              variant="contained" 
              onClick={() => {
                setNotifications([]);
                setShowNotifications(false);
                toast.success('All notifications cleared');
              }}
            >
              Clear All
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingDashboard; 