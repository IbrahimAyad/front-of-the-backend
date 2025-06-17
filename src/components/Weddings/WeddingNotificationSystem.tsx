import React, { useState, useEffect } from 'react';
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
  Autocomplete,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { WeddingParty, WeddingMember } from '../../types';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  trigger: 'manual' | 'deadline' | 'status_change' | 'scheduled';
  subject: string;
  message: string;
  daysBeforeWedding?: number;
  isActive: boolean;
  createdAt: Date;
}

interface NotificationLog {
  id: string;
  templateId: string;
  templateName: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: 'email' | 'sms';
  status: 'sent' | 'failed' | 'pending';
  sentAt: Date;
  errorMessage?: string;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderDays: number[];
  autoReminders: boolean;
  urgentOnly: boolean;
}

interface WeddingNotificationSystemProps {
  wedding: WeddingParty;
  onUpdate?: () => void;
}

const WeddingNotificationSystem: React.FC<WeddingNotificationSystemProps> = ({ 
  wedding, 
  onUpdate 
}) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: true,
    reminderDays: [30, 14, 7, 3, 1],
    autoReminders: true,
    urgentOnly: false,
  });

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<WeddingMember[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'both' as 'email' | 'sms' | 'both',
    trigger: 'manual' as 'manual' | 'deadline' | 'status_change' | 'scheduled',
    subject: '',
    message: '',
    daysBeforeWedding: 7,
  });

  // Initialize default templates
  useEffect(() => {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: '1',
        name: 'Measurement Reminder',
        type: 'both',
        trigger: 'deadline',
        subject: 'Measurement Deadline Approaching - {{weddingCode}}',
        message: 'Hi {{memberName}}, your measurements for {{groomName}} & {{brideName}}\'s wedding are due in {{daysLeft}} days. Please submit them as soon as possible.',
        daysBeforeWedding: 14,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Urgent Measurement Alert',
        type: 'both',
        trigger: 'deadline',
        subject: 'URGENT: Measurements Needed - {{weddingCode}}',
        message: '🚨 URGENT: {{memberName}}, your measurements for {{groomName}} & {{brideName}}\'s wedding are critically overdue. Wedding is in {{daysLeft}} days!',
        daysBeforeWedding: 7,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '3',
        name: 'Fitting Scheduled',
        type: 'email',
        trigger: 'manual',
        subject: 'Fitting Appointment Scheduled - {{weddingCode}}',
        message: 'Dear {{memberName}}, your fitting appointment has been scheduled. Please arrive 15 minutes early.',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '4',
        name: 'Order Ready for Pickup',
        type: 'both',
        trigger: 'status_change',
        subject: 'Your Order is Ready - {{weddingCode}}',
        message: 'Great news {{memberName}}! Your suit for {{groomName}} & {{brideName}}\'s wedding is ready for pickup. Please contact us to schedule.',
        isActive: true,
        createdAt: new Date(),
      },
    ];
    setTemplates(defaultTemplates);
  }, []);

  const handleCreateTemplate = () => {
    const newTemplate: NotificationTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      type: templateForm.type,
      trigger: templateForm.trigger,
      subject: templateForm.subject,
      message: templateForm.message,
      daysBeforeWedding: templateForm.daysBeforeWedding,
      isActive: true,
      createdAt: new Date(),
    };

    setTemplates([...templates, newTemplate]);
    setShowTemplateDialog(false);
    resetTemplateForm();
    toast.success('Notification template created!');
  };

  const handleSendNotification = async () => {
    if (!selectedTemplate || selectedRecipients.length === 0) {
      toast.error('Please select a template and recipients');
      return;
    }

    const notifications: NotificationLog[] = [];

    for (const recipient of selectedRecipients) {
      const message = interpolateTemplate(selectedTemplate.message, recipient);
      const subject = interpolateTemplate(selectedTemplate.subject, recipient);

      // Send email if enabled and recipient has email
      if ((selectedTemplate.type === 'email' || selectedTemplate.type === 'both') && 
          recipient.email && preferences.emailEnabled) {
        try {
          await sendEmail(recipient.email, subject, message);
          notifications.push({
            id: Date.now().toString() + Math.random(),
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            type: 'email',
            status: 'sent',
            sentAt: new Date(),
          });
        } catch (error) {
          notifications.push({
            id: Date.now().toString() + Math.random(),
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            type: 'email',
            status: 'failed',
            sentAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send SMS if enabled and recipient has phone
      if ((selectedTemplate.type === 'sms' || selectedTemplate.type === 'both') && 
          recipient.phone && preferences.smsEnabled) {
        try {
          await sendSMS(recipient.phone, message);
          notifications.push({
            id: Date.now().toString() + Math.random(),
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientPhone: recipient.phone,
            type: 'sms',
            status: 'sent',
            sentAt: new Date(),
          });
        } catch (error) {
          notifications.push({
            id: Date.now().toString() + Math.random(),
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientPhone: recipient.phone,
            type: 'sms',
            status: 'failed',
            sentAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    setNotificationLogs([...notificationLogs, ...notifications]);
    setShowSendDialog(false);
    setSelectedRecipients([]);
    setSelectedTemplate(null);

    const successCount = notifications.filter(n => n.status === 'sent').length;
    const failCount = notifications.filter(n => n.status === 'failed').length;

    if (successCount > 0) {
      toast.success(`${successCount} notifications sent successfully!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} notifications failed to send`);
    }
  };

  const interpolateTemplate = (template: string, member: WeddingMember): string => {
    const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
    
    return template
      .replace(/{{memberName}}/g, member.name)
      .replace(/{{groomName}}/g, wedding.groomInfo.name)
      .replace(/{{brideName}}/g, wedding.brideInfo.name)
      .replace(/{{weddingCode}}/g, wedding.weddingCode)
      .replace(/{{weddingDate}}/g, format(wedding.weddingDate, 'MMMM dd, yyyy'))
      .replace(/{{daysLeft}}/g, daysUntilWedding.toString())
      .replace(/{{memberRole}}/g, member.role.replace('_', ' '));
  };

  const sendEmail = async (email: string, subject: string, message: string): Promise<void> => {
    // Mock email sending - replace with actual email service
    console.log(`📧 Email to ${email}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Email service temporarily unavailable');
    }
  };

  const sendSMS = async (phone: string, message: string): Promise<void> => {
    // Mock SMS sending - replace with actual SMS service
    console.log(`📱 SMS to ${phone}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('SMS service temporarily unavailable');
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'both',
      trigger: 'manual',
      subject: '',
      message: '',
      daysBeforeWedding: 7,
    });
  };

  const getNotificationStats = () => {
    const total = notificationLogs.length;
    const sent = notificationLogs.filter(n => n.status === 'sent').length;
    const failed = notificationLogs.filter(n => n.status === 'failed').length;
    const pending = notificationLogs.filter(n => n.status === 'pending').length;

    return { total, sent, failed, pending };
  };

  const stats = getNotificationStats();
  const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
  const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationIcon color="primary" />
          Wedding Notifications
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowPreferencesDialog(true)}
          >
            Preferences
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setShowSendDialog(true)}
          >
            Send Notification
          </Button>
        </Stack>
      </Box>

      {/* Alert for urgent notifications */}
      {daysUntilWedding <= 7 && pendingMeasurements > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography fontWeight="bold">
            🚨 Urgent: {pendingMeasurements} measurements still pending with only {daysUntilWedding} days until wedding!
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="error"
            sx={{ mt: 1 }}
            onClick={() => {
              const pendingMembers = wedding.members.filter(m => m.measurementStatus === 'pending');
              setSelectedRecipients(pendingMembers);
              setSelectedTemplate(templates.find(t => t.id === '2') || null);
              setShowSendDialog(true);
            }}
          >
            Send Urgent Reminders
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Sent
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.sent}
                  </Typography>
                </Box>
                <SuccessIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Failed
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.failed}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />
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
                    Templates
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {templates.filter(t => t.isActive).length}
                  </Typography>
                </Box>
                <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Pending Actions
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {pendingMeasurements}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Templates Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Notification Templates
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowTemplateDialog(true)}
            >
              Create Template
            </Button>
          </Box>

          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {template.name}
                    </Typography>
                    <Box>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip 
                      label={template.type.toUpperCase()} 
                      size="small" 
                      color={template.type === 'both' ? 'primary' : template.type === 'email' ? 'info' : 'warning'}
                    />
                    <Chip 
                      label={template.trigger.replace('_', ' ').toUpperCase()} 
                      size="small" 
                      variant="outlined"
                    />
                    {template.daysBeforeWedding && (
                      <Chip 
                        label={`${template.daysBeforeWedding} days before`} 
                        size="small" 
                        color="secondary"
                      />
                    )}
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.subject}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {template.message}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Recent Notifications
          </Typography>
          
          {notificationLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No notifications sent yet
              </Typography>
            </Box>
          ) : (
            <List>
              {notificationLogs
                .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
                .slice(0, 10)
                .map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemIcon>
                      {log.type === 'email' ? <EmailIcon /> : <SmsIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {log.templateName} → {log.recipientName}
                          </Typography>
                          <Chip
                            label={log.status}
                            size="small"
                            color={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            {log.type === 'email' ? log.recipientEmail : log.recipientPhone}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {format(log.sentAt, 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          {log.errorMessage && (
                            <Typography variant="caption" color="error.main" component="span" sx={{ display: 'block' }}>
                              Error: {log.errorMessage}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Notification Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={templateForm.type}
                  label="Type"
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                >
                  <MenuItem value="email">Email Only</MenuItem>
                  <MenuItem value="sms">SMS Only</MenuItem>
                  <MenuItem value="both">Email & SMS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject (Email only)"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                helperText="Use {{memberName}}, {{groomName}}, {{brideName}}, {{weddingCode}}, {{daysLeft}} for dynamic content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={templateForm.message}
                onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                helperText="Use {{memberName}}, {{groomName}}, {{brideName}}, {{weddingCode}}, {{daysLeft}} for dynamic content"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={!templateForm.name || !templateForm.message}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onClose={() => setShowSendDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  label="Select Template"
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  {templates.filter(t => t.isActive).map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={wedding.members}
                getOptionLabel={(member) => `${member.name} (${member.role})`}
                value={selectedRecipients}
                onChange={(_, newValue) => setSelectedRecipients(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Recipients"
                    placeholder="Choose wedding party members"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
            </Grid>
            {selectedTemplate && selectedRecipients.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview (for {selectedRecipients[0].name}):
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Subject:</strong> {interpolateTemplate(selectedTemplate.subject, selectedRecipients[0])}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Message:</strong> {interpolateTemplate(selectedTemplate.message, selectedRecipients[0])}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendNotification}
            variant="contained"
            disabled={!selectedTemplate || selectedRecipients.length === 0}
          >
            Send Notifications
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog open={showPreferencesDialog} onClose={() => setShowPreferencesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailEnabled}
                  onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                />
              }
              label="Enable Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.smsEnabled}
                  onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
                />
              }
              label="Enable SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoReminders}
                  onChange={(e) => setPreferences({ ...preferences, autoReminders: e.target.checked })}
                />
              }
              label="Automatic Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.urgentOnly}
                  onChange={(e) => setPreferences({ ...preferences, urgentOnly: e.target.checked })}
                />
              }
              label="Urgent Notifications Only"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreferencesDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setShowPreferencesDialog(false);
              toast.success('Preferences saved!');
            }}
            variant="contained"
          >
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingNotificationSystem; 