import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
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
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  TrendingUp as LeadIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
  Straighten as MeasurementIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface CustomerInteraction {
  id: string;
  type: 'lead' | 'consultation' | 'measurement' | 'order' | 'payment' | 'follow_up' | 'note';
  title: string;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  relatedId?: string; // ID of related order, appointment, etc.
  metadata?: Record<string, any>;
}

interface CustomerJourneyProps {
  customerId: string | number;
  customerName: string;
  customerEmail: string;
  onInteractionAdd?: (interaction: Omit<CustomerInteraction, 'id'>) => void;
}

const CustomerJourney: React.FC<CustomerJourneyProps> = ({
  customerId,
  customerName,
  customerEmail,
  onInteractionAdd,
}) => {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newInteraction, setNewInteraction] = useState<Partial<CustomerInteraction>>({
    type: 'note',
    title: '',
    description: '',
    date: new Date(),
    status: 'pending',
    priority: 'medium',
  });

  const queryClient = useQueryClient();

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    const mockInteractions: CustomerInteraction[] = [
      {
        id: '1',
        type: 'lead',
        title: 'Initial Inquiry',
        description: 'Customer inquired about custom suits via website contact form',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Sales Team',
      },
      {
        id: '2',
        type: 'consultation',
        title: 'First Consultation',
        description: 'Initial consultation to discuss style preferences and requirements',
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        status: 'completed',
        priority: 'high',
        assignedTo: 'John Smith',
        metadata: { duration: '60 minutes', outcome: 'Interested in 2-piece suit' },
      },
      {
        id: '3',
        type: 'measurement',
        title: 'Measurements Taken',
        description: 'Complete body measurements recorded for custom suit',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        status: 'completed',
        priority: 'high',
        assignedTo: 'Master Tailor',
        relatedId: 'MEAS-001',
      },
      {
        id: '4',
        type: 'order',
        title: 'Order Placed',
        description: 'Custom navy suit order confirmed - $1,299',
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        status: 'completed',
        priority: 'high',
        assignedTo: 'Sales Team',
        relatedId: 'ORD-001',
        metadata: { amount: 1299, items: ['Navy Suit', 'White Shirt'] },
      },
      {
        id: '5',
        type: 'payment',
        title: 'Deposit Received',
        description: '50% deposit payment received - $649.50',
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Finance Team',
        metadata: { amount: 649.50, method: 'Credit Card' },
      },
      {
        id: '6',
        type: 'follow_up',
        title: 'Production Update',
        description: 'Called customer to update on production progress',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Customer Service',
      },
      {
        id: '7',
        type: 'consultation',
        title: 'First Fitting',
        description: 'First fitting appointment scheduled',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
        priority: 'high',
        assignedTo: 'Master Tailor',
      },
      {
        id: '8',
        type: 'follow_up',
        title: 'Satisfaction Survey',
        description: 'Send satisfaction survey after delivery',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'pending',
        priority: 'low',
        assignedTo: 'Customer Service',
      },
    ];

    setInteractions(mockInteractions.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, [customerId]);

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <LeadIcon />;
      case 'consultation':
        return <EventIcon />;
      case 'measurement':
        return <MeasurementIcon />;
      case 'order':
        return <OrderIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'follow_up':
        return <PhoneIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTimelineDotColor = (type: string, status: string) => {
    if (status === 'completed') return 'success';
    if (status === 'overdue') return 'error';
    
    switch (type) {
      case 'lead':
        return 'info';
      case 'consultation':
        return 'primary';
      case 'order':
        return 'secondary';
      case 'payment':
        return 'success';
      default:
        return 'grey';
    }
  };

  const handleAddInteraction = () => {
    if (!newInteraction.title || !newInteraction.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const interaction: CustomerInteraction = {
      id: Date.now().toString(),
      type: newInteraction.type as any,
      title: newInteraction.title,
      description: newInteraction.description,
      date: newInteraction.date || new Date(),
      status: newInteraction.status as any,
      priority: newInteraction.priority as any,
      assignedTo: newInteraction.assignedTo,
    };

    setInteractions(prev => [interaction, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
    
    if (onInteractionAdd) {
      onInteractionAdd(interaction);
    }

    setAddDialogOpen(false);
    setNewInteraction({
      type: 'note',
      title: '',
      description: '',
      date: new Date(),
      status: 'pending',
      priority: 'medium',
    });

    toast.success('Interaction added successfully');
  };

  const getNextActions = () => {
    const now = new Date();
    const upcoming = interactions.filter(i => 
      i.status === 'pending' && isAfter(i.date, now)
    ).slice(0, 3);

    const overdue = interactions.filter(i => 
      i.status === 'pending' && isBefore(i.date, now)
    );

    return { upcoming, overdue };
  };

  const { upcoming, overdue } = getNextActions();

  return (
    <Box>
      {/* Customer Journey Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Customer Journey: {customerName}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Interaction
            </Button>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {interactions.filter(i => i.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {upcoming.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {overdue.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overdue
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {interactions.filter(i => i.type === 'order').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Next Actions */}
      {(upcoming.length > 0 || overdue.length > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Next Actions Required
            </Typography>
            
            {overdue.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Overdue ({overdue.length})
                </Typography>
                {overdue.map(interaction => (
                  <Chip
                    key={interaction.id}
                    label={`${interaction.title} - ${format(interaction.date, 'MMM dd')}`}
                    color="error"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}

            {upcoming.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  Upcoming ({upcoming.length})
                </Typography>
                {upcoming.map(interaction => (
                  <Chip
                    key={interaction.id}
                    label={`${interaction.title} - ${format(interaction.date, 'MMM dd')}`}
                    color="warning"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Interaction Timeline
          </Typography>
          
          <Timeline>
            {interactions.map((interaction, index) => (
              <TimelineItem key={interaction.id}>
                <TimelineSeparator>
                  <TimelineDot 
                    color={getTimelineDotColor(interaction.type, interaction.status)}
                    variant={interaction.status === 'completed' ? 'filled' : 'outlined'}
                  >
                    {getInteractionIcon(interaction.type)}
                  </TimelineDot>
                  {index < interactions.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6">
                        {interaction.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={interaction.status}
                          color={getStatusColor(interaction.status)}
                          size="small"
                        />
                        <Chip
                          label={interaction.priority}
                          color={getPriorityColor(interaction.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {interaction.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {format(interaction.date, 'MMM dd, yyyy - HH:mm')}
                      </Typography>
                      
                      {interaction.assignedTo && (
                        <Chip
                          label={interaction.assignedTo}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {interaction.metadata && (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(interaction.metadata).map(([key, value]) => (
                          <Typography key={key} variant="caption" display="block" color="text.secondary">
                            {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>

      {/* Add Interaction Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Interaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newInteraction.type || 'note'}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="measurement">Measurement</MenuItem>
                  <MenuItem value="order">Order</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="follow_up">Follow-up</MenuItem>
                  <MenuItem value="note">Note</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newInteraction.status || 'pending'}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newInteraction.title || ''}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newInteraction.description || ''}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date & Time"
                type="datetime-local"
                value={newInteraction.date ? format(newInteraction.date, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, date: new Date(e.target.value) }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newInteraction.priority || 'medium'}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned To"
                value={newInteraction.assignedTo || ''}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, assignedTo: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddInteraction} variant="contained">
            Add Interaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerJourney; 