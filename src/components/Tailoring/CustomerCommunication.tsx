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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
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
  Stack,
  Divider,
  Rating,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Message as MessageIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Photo as PhotoIcon,
  Star as StarIcon,
  Notifications as NotificationIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TailoringTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: 'dropped_off' | 'in_progress' | 'quality_check' | 'ready_pickup' | 'completed';
  dropOffDate: Date;
  scheduledPickupDate: Date;
  totalItems: number;
}

interface CommunicationLog {
  id: string;
  ticketId: string;
  type: 'sms' | 'whatsapp' | 'email' | 'phone' | 'in_person';
  direction: 'outbound' | 'inbound';
  message: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: string[];
}

interface CustomerFeedback {
  id: string;
  ticketId: string;
  customerName: string;
  rating: number;
  comment: string;
  timestamp: Date;
  responded: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'status_update' | 'reminder' | 'pickup_ready' | 'feedback_request';
  subject: string;
  message: string;
  channels: ('sms' | 'whatsapp' | 'email')[];
  autoSend: boolean;
}

interface CustomerCommunicationProps {
  tickets: TailoringTicket[];
}

const CustomerCommunication: React.FC<CustomerCommunicationProps> = ({ tickets }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<TailoringTicket | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | 'email'>('whatsapp');

  // Mock data
  const communicationLogs: CommunicationLog[] = [
    {
      id: 'LOG001',
      ticketId: 'TKT001',
      type: 'whatsapp',
      direction: 'outbound',
      message: 'Hi John! Your alterations are ready for pickup. Please visit us at your convenience.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'read',
      attachments: ['before_photo.jpg', 'after_photo.jpg'],
    },
    {
      id: 'LOG002',
      ticketId: 'TKT002',
      type: 'sms',
      direction: 'outbound',
      message: 'Your dress shirts are in progress. Expected completion: Tomorrow.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'delivered',
    },
    {
      id: 'LOG003',
      ticketId: 'TKT001',
      type: 'whatsapp',
      direction: 'inbound',
      message: 'Thank you! I\'ll pick them up this afternoon.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'read',
    },
  ];

  const customerFeedback: CustomerFeedback[] = [
    {
      id: 'FB001',
      ticketId: 'TKT001',
      customerName: 'John Smith',
      rating: 5,
      comment: 'Excellent work! The fit is perfect and the turnaround was faster than expected.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      responded: false,
    },
    {
      id: 'FB002',
      ticketId: 'TKT003',
      customerName: 'Mike Johnson',
      rating: 4,
      comment: 'Good quality work, but took a bit longer than promised.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      responded: true,
    },
  ];

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'TPL001',
      name: 'Order Received',
      type: 'status_update',
      subject: 'Order Confirmation',
      message: 'Hi {customerName}! We\'ve received your items for alteration. Ticket #{ticketNumber}. Expected pickup: {pickupDate}.',
      channels: ['whatsapp', 'sms'],
      autoSend: true,
    },
    {
      id: 'TPL002',
      name: 'Ready for Pickup',
      type: 'pickup_ready',
      subject: 'Items Ready',
      message: 'Great news! Your alterations are complete and ready for pickup. Ticket #{ticketNumber}. Location: {location}.',
      channels: ['whatsapp', 'sms', 'email'],
      autoSend: true,
    },
    {
      id: 'TPL003',
      name: 'Feedback Request',
      type: 'feedback_request',
      subject: 'How did we do?',
      message: 'Thank you for choosing us! Please rate your experience and help us improve our service.',
      channels: ['whatsapp', 'email'],
      autoSend: false,
    },
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <WhatsAppIcon />;
      case 'sms': return <MessageIcon />;
      case 'email': return <EmailIcon />;
      case 'phone': return <PhoneIcon />;
      default: return <MessageIcon />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return 'success';
      case 'sms': return 'info';
      case 'email': return 'primary';
      case 'phone': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read': return 'success';
      case 'delivered': return 'info';
      case 'sent': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;

    // Mock sending message
    toast.success(`Message sent via ${selectedChannel.toUpperCase()}`);
    setNewMessage('');
    setMessageDialogOpen(false);
  };

  const renderCommunicationHistory = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Communication History</Typography>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setMessageDialogOpen(true)}
        >
          Send Message
        </Button>
      </Box>

      <Grid container spacing={2}>
        {communicationLogs.map((log) => {
          const ticket = tickets.find(t => t.id === log.ticketId);
          return (
            <Grid item xs={12} key={log.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: getChannelColor(log.type) + '.main', mr: 2 }}>
                        {getChannelIcon(log.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {ticket?.customerName} • {ticket?.ticketNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(log.timestamp, 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={log.direction}
                        size="small"
                        color={log.direction === 'outbound' ? 'primary' : 'secondary'}
                      />
                      <Chip
                        label={log.status}
                        size="small"
                        color={getStatusColor(log.status) as any}
                      />
                    </Stack>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {log.message}
                  </Typography>
                  
                  {log.attachments && log.attachments.length > 0 && (
                    <Box display="flex" gap={1} mt={1}>
                      {log.attachments.map((attachment, index) => (
                        <Chip
                          key={index}
                          icon={<PhotoIcon />}
                          label={attachment}
                          size="small"
                          variant="outlined"
                          clickable
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderCustomerFeedback = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Customer Feedback</Typography>
        <Button
          variant="outlined"
          startIcon={<StarIcon />}
          onClick={() => setFeedbackDialogOpen(true)}
        >
          Request Feedback
        </Button>
      </Box>

      <Grid container spacing={2}>
        {customerFeedback.map((feedback) => (
          <Grid item xs={12} md={6} key={feedback.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="subtitle1">{feedback.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {format(feedback.timestamp, 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Rating value={feedback.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({feedback.rating}/5)
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {feedback.comment}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={feedback.responded ? 'Responded' : 'Pending Response'}
                    color={feedback.responded ? 'success' : 'warning'}
                    size="small"
                  />
                  {!feedback.responded && (
                    <Button size="small" variant="outlined">
                      Respond
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderNotificationTemplates = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Notification Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setTemplateDialogOpen(true)}
        >
          New Template
        </Button>
      </Box>

      <Grid container spacing={2}>
        {notificationTemplates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="subtitle1">{template.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {template.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch checked={template.autoSend} size="small" />}
                    label="Auto-send"
                    labelPlacement="start"
                  />
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Subject:</strong> {template.subject}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {template.message}
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  {template.channels.map((channel) => (
                    <Chip
                      key={channel}
                      icon={getChannelIcon(channel)}
                      label={channel.toUpperCase()}
                      size="small"
                      color={getChannelColor(channel) as any}
                    />
                  ))}
                </Box>
                
                <Box display="flex" gap={1}>
                  <Button size="small" variant="outlined">
                    Edit
                  </Button>
                  <Button size="small" variant="outlined">
                    Test Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderQuickActions = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Quick Actions</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            color="success"
          >
            Bulk WhatsApp
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MessageIcon />}
            color="info"
          >
            Bulk SMS
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<StarIcon />}
            color="warning"
          >
            Request Reviews
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<NotificationIcon />}
            color="primary"
          >
            Send Reminders
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box>
      {renderQuickActions()}

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label={
            <Badge badgeContent={communicationLogs.length} color="primary">
              Communication History
            </Badge>
          } 
        />
        <Tab 
          label={
            <Badge badgeContent={customerFeedback.filter(f => !f.responded).length} color="error">
              Customer Feedback
            </Badge>
          } 
        />
        <Tab label="Notification Templates" />
        <Tab label="Analytics" />
      </Tabs>

      {selectedTab === 0 && renderCommunicationHistory()}
      {selectedTab === 1 && renderCustomerFeedback()}
      {selectedTab === 2 && renderNotificationTemplates()}
      {selectedTab === 3 && (
        <Typography variant="h6" color="textSecondary" textAlign="center" py={4}>
          Communication analytics coming soon...
        </Typography>
      )}

      {/* Send Message Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Customer</InputLabel>
                <Select
                  value={selectedTicket?.id || ''}
                  onChange={(e) => {
                    const ticket = tickets.find(t => t.id === e.target.value);
                    setSelectedTicket(ticket || null);
                  }}
                  label="Select Customer"
                >
                  {tickets.map((ticket) => (
                    <MenuItem key={ticket.id} value={ticket.id}>
                      {ticket.customerName} - {ticket.ticketNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  label="Channel"
                >
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AttachIcon />}
                sx={{ mr: 1 }}
              >
                Attach Photos
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoIcon />}
              >
                Add Template
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCommunication; 