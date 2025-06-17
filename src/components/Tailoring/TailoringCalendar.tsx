import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  ContentCut as TailoringIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, isAfter } from 'date-fns';

interface TailoringTicket {
  id: string;
  ticketNumber: string;
  physicalTicketNumber?: string;
  customerName: string;
  customerPhone: string;
  services: AlterationService[];
  status: 'dropped_off' | 'in_progress' | 'quality_check' | 'ready_pickup' | 'completed';
  priority: 'normal' | 'rush';
  location: 'shop_1' | 'shop_2';
  dropOffDate: Date;
  scheduledPickupDate: Date;
  totalItems: number;
}

interface AlterationService {
  id: string;
  type: string;
  description: string;
  garmentType: 'shirt' | 'pants' | 'jacket' | 'other';
  quantity: number;
  notes?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  dropOffs: TailoringTicket[];
  pickups: TailoringTicket[];
  workload: number;
}

interface TailoringCalendarProps {
  tickets: TailoringTicket[];
}

const TailoringCalendar: React.FC<TailoringCalendarProps> = ({ tickets }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCalendarData = (): CalendarDay[] => {
    return calendarDays.map(date => {
      const dropOffs = tickets.filter(ticket => 
        isSameDay(ticket.dropOffDate, date)
      );
      
      const pickups = tickets.filter(ticket => 
        isSameDay(ticket.scheduledPickupDate, date) && 
        ticket.status !== 'completed'
      );

      const workload = tickets
        .filter(ticket => 
          !isAfter(ticket.dropOffDate, date) && 
          !isBefore(ticket.scheduledPickupDate, date) &&
          ticket.status !== 'completed'
        )
        .reduce((total, ticket) => total + ticket.totalItems, 0);

      return {
        date,
        isCurrentMonth: true,
        dropOffs,
        pickups,
        workload,
      };
    });
  };

  const calendarData = getCalendarData();

  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return '#f5f5f5';
    if (workload <= 5) return '#e8f5e8';
    if (workload <= 10) return '#fff3cd';
    if (workload <= 15) return '#ffeaa7';
    return '#fab1a0';
  };

  const getWorkloadLevel = (workload: number) => {
    if (workload === 0) return 'Free';
    if (workload <= 5) return 'Light';
    if (workload <= 10) return 'Moderate';
    if (workload <= 15) return 'Busy';
    return 'Very Busy';
  };

  const getEstimatedWaitTime = (workload: number) => {
    if (workload === 0) return '1-2 days';
    if (workload <= 5) return '3-5 days';
    if (workload <= 10) return '7-10 days';
    if (workload <= 15) return '10-14 days';
    return '14+ days';
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setDayDetailOpen(true);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              Today
            </Button>
            <IconButton onClick={handlePrevMonth}>
              <PrevIcon />
            </IconButton>
            <IconButton onClick={handleNextMonth}>
              <NextIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Box key={day}>
              <Typography variant="subtitle2" textAlign="center" fontWeight="bold" color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
          
          {calendarData.map((day, index) => (
            <Box key={index}>
              <Card
                sx={{
                  minHeight: 120,
                  cursor: 'pointer',
                  backgroundColor: getWorkloadColor(day.workload),
                  border: isToday(day.date) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleDayClick(day)}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="body2" fontWeight={isToday(day.date) ? 'bold' : 'normal'}>
                      {format(day.date, 'd')}
                    </Typography>
                    {day.workload > 0 && (
                      <Chip
                        label={day.workload}
                        size="small"
                        color={day.workload > 10 ? 'error' : day.workload > 5 ? 'warning' : 'success'}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                  
                  <Stack spacing={0.5}>
                    {day.dropOffs.length > 0 && (
                      <Tooltip title={`${day.dropOffs.length} drop-offs`}>
                        <Chip
                          icon={<TailoringIcon />}
                          label={day.dropOffs.length}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      </Tooltip>
                    )}
                    
                    {day.pickups.length > 0 && (
                      <Tooltip title={`${day.pickups.length} pickups`}>
                        <Chip
                          icon={<CompleteIcon />}
                          label={day.pickups.length}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Workload Legend</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }} />
              <Typography variant="body2">Free (0 items) - 1-2 days wait</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#e8f5e8', border: '1px solid #ddd' }} />
              <Typography variant="body2">Light (1-5 items) - 3-5 days wait</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#fff3cd', border: '1px solid #ddd' }} />
              <Typography variant="body2">Moderate (6-10 items) - 7-10 days wait</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#ffeaa7', border: '1px solid #ddd' }} />
              <Typography variant="body2">Busy (11-15 items) - 10-14 days wait</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#fab1a0', border: '1px solid #ddd' }} />
              <Typography variant="body2">Very Busy (15+ items) - 14+ days wait</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedDay && format(selectedDay.date, 'EEEE, MMMM d, yyyy')}
            </Typography>
            {selectedDay && (
              <Chip
                label={`${getWorkloadLevel(selectedDay.workload)} - ${getEstimatedWaitTime(selectedDay.workload)}`}
                color={selectedDay.workload > 10 ? 'error' : selectedDay.workload > 5 ? 'warning' : 'success'}
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedDay && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="info.main">
                  Drop-offs ({selectedDay.dropOffs.length})
                </Typography>
                <List dense>
                  {selectedDay.dropOffs.map(ticket => (
                    <ListItem key={ticket.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <TailoringIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={ticket.customerName}
                        secondary={`${ticket.ticketNumber} - ${ticket.totalItems} items`}
                      />
                    </ListItem>
                  ))}
                  {selectedDay.dropOffs.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No drop-offs scheduled</Typography>
                  )}
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="success.main">
                  Pickups ({selectedDay.pickups.length})
                </Typography>
                <List dense>
                  {selectedDay.pickups.map(ticket => (
                    <ListItem key={ticket.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CompleteIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={ticket.customerName}
                        secondary={`${ticket.ticketNumber} - ${ticket.totalItems} items`}
                      />
                    </ListItem>
                  ))}
                  {selectedDay.pickups.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No pickups scheduled</Typography>
                  )}
                </List>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Workload Summary
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Items in Progress:</strong> {selectedDay.workload}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Workload Level:</strong> {getWorkloadLevel(selectedDay.workload)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Estimated Wait Time for New Customers:</strong> {getEstimatedWaitTime(selectedDay.workload)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDayDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TailoringCalendar; 