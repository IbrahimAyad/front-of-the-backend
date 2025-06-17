import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Tabs,
  Tab,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material';
import { format, addDays, addHours, isBefore, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

interface FollowUpTemplate {
  id: string;
  name: string;
  type: 'appointment_reminder' | 'order_update' | 'maintenance_schedule' | 'feedback_request' | 'custom';
  channel: 'email' | 'sms' | 'both';
  subject: string;
  content: string;
  triggerCondition: string;
  triggerDelay: number; // in hours
  isActive: boolean;
  variables: string[]; // Available template variables
}

interface FollowUpSchedule {
  id: string;
  templateId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  scheduledDate: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  triggerEvent: string;
  relatedId?: string; // Order ID, Appointment ID, etc.
  attempts: number;
  lastAttempt?: Date;
  errorMessage?: string;
}

interface FollowUpSystemProps {
  customerId?: string | number;
  showAllCustomers?: boolean;
}

const defaultTemplates: FollowUpTemplate[] = [
  {
    id: 'appointment_reminder_24h',
    name: 'Appointment Reminder (24h)',
    type: 'appointment_reminder',
    channel: 'both',
    subject: 'Appointment Reminder - {{customerName}}',
    content: `Dear {{customerName}},

This is a friendly reminder about your upcoming appointment:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
📍 Location: KCT Menswear Studio
👔 Service: {{serviceType}}

Please arrive 10 minutes early. If you need to reschedule, please call us at (555) 123-4567.

Looking forward to seeing you!

Best regards,
KCT Menswear Team`,
    triggerCondition: 'appointment_scheduled',
    triggerDelay: -24, // 24 hours before
    isActive: true,
    variables: ['customerName', 'appointmentDate', 'appointmentTime', 'serviceType'],
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    type: 'order_update',
    channel: 'email',
    subject: 'Order Confirmation - {{orderNumber}}',
    content: `Dear \{\{customerName\}\},

Thank you for your order! We're excited to create your custom garments.

📋 Order Details:
Order Number: \{\{orderNumber\}\}
Items: \{\{orderItems\}\}
Total: $\{\{orderTotal\}\}
Expected Completion: \{\{expectedDate\}\}

We'll keep you updated on the progress. You can track your order status in your customer portal.

Best regards,
KCT Menswear Team`,
    triggerCondition: 'order_placed',
    triggerDelay: 0,
    isActive: true,
    variables: ['customerName', 'orderNumber', 'orderItems', 'orderTotal', 'expectedDate'],
  },
  {
    id: 'order_ready',
    name: 'Order Ready for Pickup',
    type: 'order_update',
    channel: 'both',
    subject: 'Your Order is Ready! - {{orderNumber}}',
    content: `Dear \{\{customerName\}\},

Great news! Your custom order is ready for pickup.

📋 Order: \{\{orderNumber\}\}
📍 Pickup Location: KCT Menswear Studio
🕐 Hours: Monday-Saturday 9AM-7PM

Please bring your order confirmation. Final payment of $\{\{remainingBalance\}\} is due upon pickup.

We can't wait for you to see your beautiful new garments!

Best regards,
KCT Menswear Team`,
    triggerCondition: 'order_completed',
    triggerDelay: 0,
    isActive: true,
    variables: ['customerName', 'orderNumber', 'remainingBalance'],
  },
  {
    id: 'maintenance_reminder',
    name: 'Garment Maintenance Reminder',
    type: 'maintenance_schedule',
    channel: 'email',
    subject: 'Time for Garment Maintenance - {{customerName}}',
    content: `Dear {{customerName}},

It's been {{monthsSincePurchase}} months since your last purchase. To keep your garments looking their best, we recommend:

🧽 Professional cleaning every 6 months
✂️ Minor alterations if needed
🔧 Button and zipper maintenance

Schedule your maintenance appointment today and receive 15% off all services.

Best regards,
KCT Menswear Team`,
    triggerCondition: 'purchase_anniversary',
    triggerDelay: 4320, // 6 months in hours
    isActive: true,
    variables: ['customerName', 'monthsSincePurchase'],
  },
  {
    id: 'feedback_request',
    name: 'Feedback Request',
    type: 'feedback_request',
    channel: 'email',
    subject: 'How was your experience? - {{customerName}}',
    content: `Dear {{customerName}},

We hope you're loving your new garments from KCT Menswear!

Your feedback is incredibly valuable to us. Could you take 2 minutes to share your experience?

⭐ Leave a review: {{reviewLink}}
📝 Complete our survey: {{surveyLink}}

As a thank you, you'll receive 100 loyalty points and a 10% discount on your next purchase.

Best regards,
KCT Menswear Team`,
    triggerCondition: 'order_delivered',
    triggerDelay: 168, // 1 week
    isActive: true,
    variables: ['customerName', 'reviewLink', 'surveyLink'],
  },
];

const FollowUpSystem: React.FC<FollowUpSystemProps> = ({
  customerId,
  showAllCustomers = false,
}) => {
  const [templates, setTemplates] = useState<FollowUpTemplate[]>(defaultTemplates);
  const [schedules, setSchedules] = useState<FollowUpSchedule[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FollowUpTemplate | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<FollowUpSchedule>>({});

  // Mock data for schedules
  useEffect(() => {
    const mockSchedules: FollowUpSchedule[] = [
      {
        id: '1',
        templateId: 'appointment_reminder_24h',
        customerId: '1',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        customerPhone: '+1-555-0101',
        scheduledDate: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
        status: 'pending',
        triggerEvent: 'Consultation appointment scheduled',
        relatedId: 'APT-001',
        attempts: 0,
      },
      {
        id: '2',
        templateId: 'order_ready',
        customerId: '2',
        customerName: 'Michael Smith',
        customerEmail: 'michael.smith@example.com',
        customerPhone: '+1-555-0102',
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'pending',
        triggerEvent: 'Order completed',
        relatedId: 'ORD-002',
        attempts: 0,
      },
      {
        id: '3',
        templateId: 'feedback_request',
        customerId: '3',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@example.com',
        scheduledDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'sent',
        triggerEvent: 'Order delivered',
        relatedId: 'ORD-003',
        attempts: 1,
        lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    setSchedules(mockSchedules);
  }, []);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: FollowUpTemplate) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (template: FollowUpTemplate) => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      toast.success('Template updated successfully');
    } else {
      const newTemplate = { ...template, id: Date.now().toString() };
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template created successfully');
    }
    setTemplateDialogOpen(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted successfully');
  };

  const handleToggleTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handleSendNow = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { 
            ...s, 
            status: 'sent', 
            attempts: s.attempts + 1,
            lastAttempt: new Date()
          }
        : s
    ));
    toast.success('Follow-up sent successfully');
  };

  const handleCancelSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, status: 'cancelled' } : s
    ));
    toast.success('Follow-up cancelled');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return <EventIcon />;
      case 'order_update':
        return <OrderIcon />;
      case 'maintenance_schedule':
        return <MaintenanceIcon />;
      case 'feedback_request':
        return <PersonIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <SmsIcon />;
      case 'both':
        return <NotificationIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const filteredSchedules = customerId 
    ? schedules.filter(s => s.customerId === customerId.toString())
    : schedules;

  const pendingSchedules = filteredSchedules.filter(s => s.status === 'pending');
  const overdueSchedules = pendingSchedules.filter(s => isBefore(s.scheduledDate, new Date()));

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Follow-up System
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
            >
              Create Template
            </Button>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {pendingSchedules.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {overdueSchedules.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overdue
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {filteredSchedules.filter(s => s.status === 'sent').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sent Today
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {templates.filter(t => t.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Templates
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Overdue Alerts */}
      {overdueSchedules.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            {overdueSchedules.length} follow-up{overdueSchedules.length > 1 ? 's' : ''} overdue
          </Typography>
          <Typography variant="body2">
            Please review and send the pending follow-ups below.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Scheduled Follow-ups" />
          <Tab label="Templates" />
          <Tab label="Analytics" />
        </Tabs>

        <CardContent>
          {/* Scheduled Follow-ups Tab */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Scheduled Follow-ups
              </Typography>
              
              <List>
                {filteredSchedules.map((schedule, index) => {
                  const template = templates.find(t => t.id === schedule.templateId);
                  const isOverdue = schedule.status === 'pending' && isBefore(schedule.scheduledDate, new Date());
                  
                  return (
                    <React.Fragment key={schedule.id}>
                      <ListItem>
                        <ListItemIcon>
                          {template && getTypeIcon(template.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {template?.name} - {schedule.customerName}
                              </Typography>
                              <Chip
                                label={schedule.status}
                                color={getStatusColor(schedule.status)}
                                size="small"
                              />
                              {isOverdue && (
                                <Chip
                                  label="OVERDUE"
                                  color="error"
                                  size="small"
                                  icon={<WarningIcon />}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Scheduled: {format(schedule.scheduledDate, 'MMM dd, yyyy - HH:mm')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Trigger: {schedule.triggerEvent}
                              </Typography>
                              {schedule.relatedId && (
                                <Typography variant="body2" color="text.secondary">
                                  Related: {schedule.relatedId}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {schedule.status === 'pending' && (
                              <>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleSendNow(schedule.id)}
                                >
                                  <SendIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelSchedule(schedule.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < filteredSchedules.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Templates Tab */}
          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow-up Templates
              </Typography>
              
              {templates.map(template => (
                <Accordion key={template.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getTypeIcon(template.type)}
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {getChannelIcon(template.channel)}
                        <Chip
                          label={template.isActive ? 'Active' : 'Inactive'}
                          color={template.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Subject:
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {template.subject}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Content:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {template.content}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Settings:
                        </Typography>
                        <Typography variant="body2">
                          Type: {template.type.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2">
                          Channel: {template.channel}
                        </Typography>
                        <Typography variant="body2">
                          Trigger: {template.triggerCondition}
                        </Typography>
                        <Typography variant="body2">
                          Delay: {template.triggerDelay} hours
                        </Typography>
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditTemplate(template)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color={template.isActive ? 'warning' : 'success'}
                            startIcon={template.isActive ? <PauseIcon /> : <PlayIcon />}
                            onClick={() => handleToggleTemplate(template.id)}
                          >
                            {template.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Analytics Tab */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow-up Analytics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Delivery Success Rate
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      94.2%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last 30 days
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Average Response Rate
                    </Typography>
                    <Typography variant="h3" color="primary.main">
                      23.8%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer engagement
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Most Effective Templates
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Appointment Reminder (24h)"
                          secondary="98% delivery rate, 45% response rate"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Order Ready for Pickup"
                          secondary="96% delivery rate, 78% pickup within 24h"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Feedback Request"
                          secondary="92% delivery rate, 18% response rate"
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          {/* Template form would go here */}
          <Typography variant="body2" color="text.secondary">
            Template creation form would be implemented here with all the necessary fields.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save Template</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FollowUpSystem; 