import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  LinearProgress,
  Divider,
  Paper,
  Badge,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  differenceInDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { WeddingParty } from '../../types';

interface WeddingAnalyticsCalendarProps {
  weddings: WeddingParty[];
}

interface MonthlyStats {
  totalWeddings: number;
  totalRevenue: number;
  totalMembers: number;
  avgPartySize: number;
  completionRate: number;
  urgentWeddings: number;
}

const WeddingAnalyticsCalendar: React.FC<WeddingAnalyticsCalendarProps> = ({ weddings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calculate monthly statistics
  const getMonthlyStats = (date: Date): MonthlyStats => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthWeddings = weddings.filter(wedding => {
      const weddingDate = new Date(wedding.weddingDate);
      return weddingDate >= monthStart && weddingDate <= monthEnd;
    });
    
    const totalMembers = monthWeddings.reduce((sum, w) => sum + w.members.length, 0);
    const totalCompleted = monthWeddings.reduce((sum, w) => {
      const completed = w.members.filter(m => 
        m.measurements && m.shippingAddress && 
        (m.orderStatus === 'delivered' || m.orderStatus === 'shipped')
      ).length;
      return sum + completed;
    }, 0);
    
    const urgentWeddings = monthWeddings.filter(w => {
      const daysUntil = differenceInDays(new Date(w.weddingDate), new Date());
      return daysUntil <= 14 && daysUntil >= 0;
    }).length;
    
    // Estimate revenue (assuming $500 per member average)
    const estimatedRevenue = totalMembers * 500;
    
    return {
      totalWeddings: monthWeddings.length,
      totalRevenue: estimatedRevenue,
      totalMembers,
      avgPartySize: monthWeddings.length > 0 ? Math.round(totalMembers / monthWeddings.length) : 0,
      completionRate: totalMembers > 0 ? Math.round((totalCompleted / totalMembers) * 100) : 0,
      urgentWeddings
    };
  };
  
  const monthlyStats = getMonthlyStats(currentDate);
  
  // Get weddings for current month
  const monthWeddings = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return weddings.filter(wedding => {
      const weddingDate = new Date(wedding.weddingDate);
      return weddingDate >= monthStart && weddingDate <= monthEnd;
    });
  }, [weddings, currentDate]);
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);
  
  // Get weddings for a specific day
  const getWeddingsForDay = (day: Date) => {
    return monthWeddings.filter(wedding => 
      isSameDay(new Date(wedding.weddingDate), day)
    );
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get status color for wedding
  const getWeddingStatusColor = (wedding: WeddingParty) => {
    const daysUntil = differenceInDays(new Date(wedding.weddingDate), new Date());
    const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
    
    if (daysUntil < 0) return 'default'; // Past wedding
    if (daysUntil <= 7 && pendingMeasurements > 0) return 'error'; // Urgent
    if (daysUntil <= 21 && pendingMeasurements > 0) return 'warning'; // Warning
    if (pendingMeasurements === 0) return 'success'; // Complete
    return 'info'; // Normal
  };
  
  // Calculate year-over-year comparison
  const getYearOverYearStats = () => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const currentYearWeddings = weddings.filter(w => {
      const date = new Date(w.weddingDate);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }).length;
    
    const lastYearWeddings = weddings.filter(w => {
      const date = new Date(w.weddingDate);
      return date.getFullYear() === currentYear - 1 && date.getMonth() === currentMonth;
    }).length;
    
    const growth = lastYearWeddings > 0 
      ? Math.round(((currentYearWeddings - lastYearWeddings) / lastYearWeddings) * 100)
      : 0;
    
    return { currentYearWeddings, lastYearWeddings, growth };
  };
  
  const yearStats = getYearOverYearStats();
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon color="primary" />
          Wedding Analytics Calendar
        </Typography>
        <Button variant="outlined" onClick={goToToday}>
          Today
        </Button>
      </Box>
      
      {/* Monthly KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Weddings This Month
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {monthlyStats.totalWeddings}
                  </Typography>
                  {yearStats.growth !== 0 && (
                    <Chip
                      label={`${yearStats.growth > 0 ? '+' : ''}${yearStats.growth}% YoY`}
                      color={yearStats.growth > 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Est. Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ${(monthlyStats.totalRevenue / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${monthlyStats.totalMembers} × $500 avg
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Total Members
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {monthlyStats.totalMembers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg {monthlyStats.avgPartySize} per wedding
                  </Typography>
                </Box>
                <GroupsIcon sx={{ fontSize: 40, color: 'info.main' }} />
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
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={monthlyStats.completionRate >= 80 ? 'success.main' : 'warning.main'}>
                    {monthlyStats.completionRate}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={monthlyStats.completionRate} 
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    color={monthlyStats.completionRate >= 80 ? 'success' : 'warning'}
                  />
                </Box>
                <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: monthlyStats.urgentWeddings > 0 ? 'error.light' : 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Urgent Weddings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={monthlyStats.urgentWeddings > 0 ? 'error.main' : 'text.primary'}>
                    {monthlyStats.urgentWeddings}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ≤14 days away
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
                    Performance
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={
                    monthlyStats.completionRate >= 90 ? 'success.main' :
                    monthlyStats.completionRate >= 70 ? 'warning.main' : 'error.main'
                  }>
                    {monthlyStats.completionRate >= 90 ? 'Excellent' :
                     monthlyStats.completionRate >= 70 ? 'Good' : 'Needs Work'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Overall rating
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Calendar Navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={goToPreviousMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={goToNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          {/* Calendar Grid */}
          <Grid container spacing={1}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                  {day}
                </Typography>
              </Grid>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayWeddings = getWeddingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <Grid item xs key={index}>
                  <Paper
                    sx={{
                      p: 1,
                      minHeight: 80,
                      bgcolor: isToday ? 'primary.light' : isCurrentMonth ? 'background.paper' : 'grey.50',
                      opacity: isCurrentMonth ? 1 : 0.5,
                      border: isToday ? 2 : 1,
                      borderColor: isToday ? 'primary.main' : 'divider',
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'primary.main' : 'text.primary'}
                      sx={{ mb: 1 }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    {dayWeddings.map((wedding, wIndex) => (
                      <Tooltip
                        key={wedding.id}
                        title={`${wedding.groomInfo.name} & ${wedding.brideInfo.name} - ${wedding.members.length} members`}
                      >
                        <Chip
                          label={wedding.weddingCode}
                          size="small"
                          color={getWeddingStatusColor(wedding)}
                          sx={{ 
                            mb: 0.5, 
                            fontSize: '0.7rem',
                            height: 20,
                            display: 'block',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      </Tooltip>
                    ))}
                    
                    {dayWeddings.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayWeddings.length - 2} more
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Monthly Wedding List */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Weddings in {format(currentDate, 'MMMM yyyy')} ({monthWeddings.length})
          </Typography>
          
          {monthWeddings.length > 0 ? (
            <List>
              {monthWeddings
                .sort((a, b) => new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime())
                .map((wedding, index) => {
                  const daysUntil = differenceInDays(new Date(wedding.weddingDate), new Date());
                  const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
                  
                  return (
                    <React.Fragment key={wedding.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Badge badgeContent={wedding.members.length} color="primary">
                            <EventIcon color={getWeddingStatusColor(wedding)} />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {wedding.groomInfo.name} & {wedding.brideInfo.name}
                              </Typography>
                              <Chip
                                label={wedding.weddingCode}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              {daysUntil <= 14 && daysUntil >= 0 && pendingMeasurements > 0 && (
                                <Chip
                                  label="URGENT"
                                  size="small"
                                  color="error"
                                  icon={<WarningIcon />}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                {format(new Date(wedding.weddingDate), 'EEEE, MMMM dd, yyyy')} • {wedding.members.length} members
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {daysUntil >= 0 ? `${daysUntil} days away` : `${Math.abs(daysUntil)} days ago`} • 
                                {pendingMeasurements > 0 ? ` ${pendingMeasurements} pending measurements` : ' All measurements complete'}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`$${(wedding.members.length * 500).toLocaleString()}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          {pendingMeasurements === 0 ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ScheduleIcon color="warning" />
                          )}
                        </Box>
                      </ListItem>
                      {index < monthWeddings.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No weddings scheduled for {format(currentDate, 'MMMM yyyy')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WeddingAnalyticsCalendar; 