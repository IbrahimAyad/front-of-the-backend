import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  Sync as SyncIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { format, addDays, addHours } from 'date-fns';
import toast from 'react-hot-toast';
import { WeddingParty, WeddingMember } from '../../types';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees: string[];
  type: 'wedding' | 'fitting' | 'measurement' | 'pickup' | 'reminder' | 'deadline';
  weddingId: string;
  isRecurring: boolean;
  reminderMinutes: number[];
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  isConnected: boolean;
  lastSync: Date | null;
  autoSync: boolean;
  syncEvents: string[];
}

interface WeddingCalendarIntegrationProps {
  wedding: WeddingParty;
  onUpdate?: () => void;
}

const WeddingCalendarIntegration: React.FC<WeddingCalendarIntegrationProps> = ({ 
  wedding, 
  onUpdate 
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([
    {
      id: '1',
      provider: 'google',
      isConnected: false,
      lastSync: null,
      autoSync: true,
      syncEvents: ['wedding', 'fitting', 'measurement'],
    },
    {
      id: '2',
      provider: 'outlook',
      isConnected: false,
      lastSync: null,
      autoSync: false,
      syncEvents: ['wedding', 'fitting'],
    },
  ]);

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<CalendarIntegration | null>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: addHours(new Date(), 1),
    location: '',
    type: 'fitting' as CalendarEvent['type'],
    attendees: [] as string[],
    reminderMinutes: [15, 60] as number[],
  });

  // Initialize default events based on wedding timeline
  React.useEffect(() => {
    generateDefaultEvents();
  }, [wedding]);

  const generateDefaultEvents = () => {
    const weddingDate = new Date(wedding.weddingDate);
    const defaultEvents: CalendarEvent[] = [
      {
        id: '1',
        title: `${wedding.groomInfo.name} & ${wedding.brideInfo.name} Wedding`,
        description: `Wedding ceremony and reception for ${wedding.weddingCode}`,
        startDate: weddingDate,
        endDate: addHours(weddingDate, 6),
        location: wedding.venue || 'TBD',
        attendees: wedding.members.map(m => m.email).filter(Boolean) as string[],
        type: 'wedding',
        weddingId: wedding.id,
        isRecurring: false,
        reminderMinutes: [60, 1440], // 1 hour and 1 day before
        status: 'scheduled',
      },
      {
        id: '2',
        title: 'Final Measurements Deadline',
        description: `All measurements must be submitted for ${wedding.weddingCode}`,
        startDate: addDays(weddingDate, -21),
        endDate: addDays(weddingDate, -21),
        attendees: wedding.members.filter(m => m.measurementStatus === 'pending').map(m => m.email).filter(Boolean) as string[],
        type: 'deadline',
        weddingId: wedding.id,
        isRecurring: false,
        reminderMinutes: [60, 1440, 10080], // 1 hour, 1 day, 1 week before
        status: 'scheduled',
      },
      {
        id: '3',
        title: 'Group Fitting Session',
        description: `Group fitting for ${wedding.weddingCode} wedding party`,
        startDate: addDays(weddingDate, -14),
        endDate: addHours(addDays(weddingDate, -14), 3),
        location: 'KCT Menswear Store',
        attendees: wedding.members.map(m => m.email).filter(Boolean) as string[],
        type: 'fitting',
        weddingId: wedding.id,
        isRecurring: false,
        reminderMinutes: [60, 1440],
        status: 'scheduled',
      },
      {
        id: '4',
        title: 'Final Pickup Reminder',
        description: `Reminder to pick up suits for ${wedding.weddingCode}`,
        startDate: addDays(weddingDate, -3),
        endDate: addDays(weddingDate, -3),
        attendees: wedding.members.map(m => m.email).filter(Boolean) as string[],
        type: 'reminder',
        weddingId: wedding.id,
        isRecurring: false,
        reminderMinutes: [60],
        status: 'scheduled',
      },
    ];
    setEvents(defaultEvents);
  };

  const handleConnectCalendar = async (provider: 'google' | 'outlook' | 'apple') => {
    try {
      // Mock calendar connection - replace with actual OAuth flow
      console.log(`Connecting to ${provider} calendar...`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedIntegrations = integrations.map(integration => 
        integration.provider === provider 
          ? { ...integration, isConnected: true, lastSync: new Date() }
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar connected successfully!`);
    } catch (error) {
      toast.error(`Failed to connect ${provider} calendar`);
    }
  };

  const handleSyncEvents = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration || !integration.isConnected) {
      toast.error('Calendar not connected');
      return;
    }

    try {
      console.log(`Syncing events to ${integration.provider}...`);
      
      // Filter events based on integration settings
      const eventsToSync = events.filter(event => 
        integration.syncEvents.includes(event.type)
      );

      // Mock sync process
      for (const event of eventsToSync) {
        await syncEventToCalendar(event, integration.provider);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      }

      // Update last sync time
      const updatedIntegrations = integrations.map(i => 
        i.id === integrationId 
          ? { ...i, lastSync: new Date() }
          : i
      );
      setIntegrations(updatedIntegrations);

      toast.success(`${eventsToSync.length} events synced to ${integration.provider}!`);
    } catch (error) {
      toast.error('Failed to sync events');
    }
  };

  const syncEventToCalendar = async (event: CalendarEvent, provider: string): Promise<void> => {
    // Mock calendar API call
    console.log(`Syncing "${event.title}" to ${provider}`);
    
    // In a real implementation, this would call the calendar API
    // Google Calendar API: https://developers.google.com/calendar/api
    // Microsoft Graph API: https://docs.microsoft.com/en-us/graph/api/calendar-post-events
  };

  const handleCreateEvent = () => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: eventForm.title,
      description: eventForm.description,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      location: eventForm.location,
      attendees: eventForm.attendees,
      type: eventForm.type,
      weddingId: wedding.id,
      isRecurring: false,
      reminderMinutes: eventForm.reminderMinutes,
      status: 'scheduled',
    };

    setEvents([...events, newEvent]);
    setShowEventDialog(false);
    resetEventForm();
    toast.success('Event created successfully!');
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    const updatedEvents = events.map(event => 
      event.id === editingEvent.id 
        ? { ...editingEvent, ...eventForm }
        : event
    );
    setEvents(updatedEvents);
    setShowEventDialog(false);
    setEditingEvent(null);
    resetEventForm();
    toast.success('Event updated successfully!');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully!');
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: new Date(),
      endDate: addHours(new Date(), 1),
      location: '',
      type: 'fitting',
      attendees: [],
      reminderMinutes: [15, 60],
    });
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || '',
      type: event.type,
      attendees: event.attendees,
      reminderMinutes: event.reminderMinutes,
    });
    setShowEventDialog(true);
  };

  const generateICSFile = (event: CalendarEvent) => {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KCT Menswear//Wedding Calendar//EN
BEGIN:VEVENT
UID:${event.id}@kctmenswear.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar file downloaded!');
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'wedding': return <EventIcon />;
      case 'fitting': return <ScheduleIcon />;
      case 'measurement': return <GroupIcon />;
      case 'pickup': return <DownloadIcon />;
      case 'reminder': return <NotificationIcon />;
      case 'deadline': return <NotificationIcon />;
      default: return <CalendarIcon />;
    }
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'wedding': return 'primary';
      case 'fitting': return 'info';
      case 'measurement': return 'warning';
      case 'pickup': return 'success';
      case 'reminder': return 'secondary';
      case 'deadline': return 'error';
      default: return 'default';
    }
  };

  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const upcomingEvents = events
    .filter(e => e.startDate > new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 5);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon color="primary" />
          Calendar Integration
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => setShowSyncDialog(true)}
            disabled={connectedIntegrations.length === 0}
          >
            Sync All
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowEventDialog(true)}
          >
            Add Event
          </Button>
        </Stack>
      </Box>

      {/* Calendar Integrations */}
      <Grid container spacing={3} mb={4}>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GoogleIcon sx={{ color: '#4285f4' }} />
                  <Typography variant="h6">Google Calendar</Typography>
                </Box>
                <Chip 
                  label={integrations.find(i => i.provider === 'google')?.isConnected ? 'Connected' : 'Not Connected'}
                  color={integrations.find(i => i.provider === 'google')?.isConnected ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {integrations.find(i => i.provider === 'google')?.isConnected ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last sync: {integrations.find(i => i.provider === 'google')?.lastSync 
                      ? format(integrations.find(i => i.provider === 'google')!.lastSync!, 'MMM dd, HH:mm')
                      : 'Never'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={() => handleSyncEvents('1')}
                    sx={{ mt: 1 }}
                  >
                    Sync Now
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handleConnectCalendar('google')}
                  sx={{ mt: 1 }}
                >
                  Connect Google
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MicrosoftIcon sx={{ color: '#0078d4' }} />
                  <Typography variant="h6">Outlook</Typography>
                </Box>
                <Chip 
                  label={integrations.find(i => i.provider === 'outlook')?.isConnected ? 'Connected' : 'Not Connected'}
                  color={integrations.find(i => i.provider === 'outlook')?.isConnected ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {integrations.find(i => i.provider === 'outlook')?.isConnected ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last sync: {integrations.find(i => i.provider === 'outlook')?.lastSync 
                      ? format(integrations.find(i => i.provider === 'outlook')!.lastSync!, 'MMM dd, HH:mm')
                      : 'Never'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={() => handleSyncEvents('2')}
                    sx={{ mt: 1 }}
                  >
                    Sync Now
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handleConnectCalendar('outlook')}
                  sx={{ mt: 1 }}
                >
                  Connect Outlook
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    events.forEach(event => generateICSFile(event));
                  }}
                >
                  Download All Events
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() => {
                    const calendarUrl = `${window.location.origin}/wedding-calendar/${wedding.weddingCode}`;
                    navigator.clipboard.writeText(calendarUrl);
                    toast.success('Calendar URL copied to clipboard!');
                  }}
                >
                  Share Calendar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Events */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Upcoming Events
          </Typography>
          
          {upcomingEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No upcoming events scheduled
              </Typography>
            </Box>
          ) : (
            <List>
              {upcomingEvents.map((event) => (
                <ListItem key={event.id} divider>
                  <ListItemIcon>
                    {getEventTypeIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {event.title}
                        </Typography>
                        <Chip
                          label={event.type}
                          size="small"
                          color={getEventTypeColor(event.type) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {format(event.startDate, 'MMM dd, yyyy HH:mm')} - {format(event.endDate, 'HH:mm')}
                        </Typography>
                        {event.location && (
                          <Typography variant="body2" color="text.secondary">
                            📍 {event.location}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          👥 {event.attendees.length} attendees
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => openEditEvent(event)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => generateICSFile(event)}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteEvent(event.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* All Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            All Events ({events.length})
          </Typography>
          
          <Grid container spacing={2}>
            {events.map((event) => (
              <Grid xs={12} md={6} key={event.id}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEditEvent(event)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => generateICSFile(event)}>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteEvent(event.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip 
                      label={event.type} 
                      size="small" 
                      color={getEventTypeColor(event.type) as any}
                    />
                    <Chip 
                      label={event.status} 
                      size="small" 
                      variant="outlined"
                    />
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {format(event.startDate, 'MMM dd, yyyy HH:mm')} - {format(event.endDate, 'HH:mm')}
                  </Typography>
                  
                  {event.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📍 {event.location}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    👥 {event.attendees.length} attendees
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onClose={() => setShowEventDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Event Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={eventForm.type}
                  label="Event Type"
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                >
                  <MenuItem value="wedding">Wedding</MenuItem>
                  <MenuItem value="fitting">Fitting</MenuItem>
                  <MenuItem value="measurement">Measurement</MenuItem>
                  <MenuItem value="pickup">Pickup</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                  <MenuItem value="deadline">Deadline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <DateTimePicker
                label="Start Date & Time"
                value={eventForm.startDate}
                onChange={(newValue) => newValue && setEventForm({ ...eventForm, startDate: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <DateTimePicker
                label="End Date & Time"
                value={eventForm.endDate}
                onChange={(newValue) => newValue && setEventForm({ ...eventForm, endDate: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Location (Optional)"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
            variant="contained"
            disabled={!eventForm.title || !eventForm.description}
          >
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onClose={() => setShowSyncDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sync Events to Calendars</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Select which calendars to sync your wedding events to:
          </Typography>
          
          <List>
            {integrations.filter(i => i.isConnected).map((integration) => (
              <ListItem key={integration.id}>
                <ListItemIcon>
                  {integration.provider === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                  secondary={`Last sync: ${integration.lastSync ? format(integration.lastSync, 'MMM dd, HH:mm') : 'Never'}`}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleSyncEvents(integration.id)}
                >
                  Sync
                </Button>
              </ListItem>
            ))}
          </List>
          
          {connectedIntegrations.length === 0 && (
            <Alert severity="info">
              No calendars connected. Please connect a calendar first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)}>Close</Button>
          {connectedIntegrations.length > 0 && (
            <Button 
              variant="contained"
              onClick={() => {
                connectedIntegrations.forEach(integration => {
                  handleSyncEvents(integration.id);
                });
                setShowSyncDialog(false);
              }}
            >
              Sync All
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingCalendarIntegration; 