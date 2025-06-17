import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
  Tabs,
  Tab,
  Badge,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  ContentCut as TailoringIcon,
  Person as CustomerIcon,
  CheckCircle as CompleteIcon,
  Warning as AlertIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  LocationOn as LocationIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Today as TodayIcon,
  Assignment as TicketIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { format, addDays, differenceInDays, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { sendSMS, formatPickupMessage } from '../../services/smsService';
import TailoringCalendar from './TailoringCalendar';
import TailoringAnalytics from './TailoringAnalytics';

interface TailoringTicket {
  id: string;
  ticketNumber: string;
  physicalTicketNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: AlterationService[];
  status: 'dropped_off' | 'in_progress' | 'quality_check' | 'ready_pickup' | 'completed';
  priority: 'normal' | 'rush';
  location: 'shop_1' | 'shop_2';
  dropOffDate: Date;
  estimatedPickupDate: Date;
  scheduledPickupDate: Date;
  actualPickupDate?: Date;
  notes?: string;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AlterationService {
  id: string;
  type: string;
  description: string;
  garmentType: 'shirt' | 'pants' | 'jacket' | 'other';
  quantity: number;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const ALTERATION_SERVICES = {
  shirt: [
    { type: 'dress_shirt_take_in', name: 'Dress Shirt Take In' },
    { type: 'sleeves', name: 'Sleeves' },
  ],
  pants: [
    { type: 'regular_hem', name: 'Regular Hem' },
    { type: 'take_in_waist', name: 'Take In Waist' },
    { type: 'hem_tapper_pants', name: 'Hem + Tapper Pants' },
    { type: 'cuff_pants', name: 'Cuff Pants' },
  ],
  jacket: [
    { type: 'jacket_take_in_sides', name: 'Jacket Take In Sides' },
    { type: 'waist_seat_crotch', name: 'Waist Seat Crotch' },
  ],
  repairs: [
    { type: 'zipper_replacement', name: 'Zipper Replacement' },
    { type: 'full_zipper_replacement', name: 'Full Zipper Replacement' },
  ],
};

const TailoringDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tickets, setTickets] = useState<TailoringTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TailoringTicket | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    physicalTicketNumber: '',
    services: [] as AlterationService[],
    priority: 'normal' as 'normal' | 'rush',
    location: 'shop_1' as 'shop_1' | 'shop_2',
    scheduledPickupDate: addDays(new Date(), 7), // Default to 7 days from now
    notes: '',
  });

  // Mock data initialization
  useEffect(() => {
    // Load tickets from localStorage first
    const savedTickets = localStorage.getItem('tailoring-tickets');
    const savedCustomers = localStorage.getItem('tailoring-customers');
    
    if (savedTickets) {
      try {
        const parsedTickets = JSON.parse(savedTickets).map((ticket: any) => ({
          ...ticket,
          dropOffDate: new Date(ticket.dropOffDate),
          estimatedPickupDate: new Date(ticket.estimatedPickupDate),
          scheduledPickupDate: new Date(ticket.scheduledPickupDate),
          actualPickupDate: ticket.actualPickupDate ? new Date(ticket.actualPickupDate) : undefined,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
        }));
        setTickets(parsedTickets);
      } catch (error) {
        console.error('Error loading tickets from localStorage:', error);
      }
    }
    
    if (savedCustomers) {
      try {
        const parsedCustomers = JSON.parse(savedCustomers);
        setCustomers(parsedCustomers);
      } catch (error) {
        console.error('Error loading customers from localStorage:', error);
      }
    }
    
    // If no saved data, initialize with mock data
    if (!savedTickets || !savedCustomers) {
      const mockCustomers: Customer[] = [
        { id: 'CUST001', name: 'John Smith', phone: '(555) 123-4567', email: 'john@email.com' },
        { id: 'CUST002', name: 'Sarah Johnson', phone: '(555) 234-5678', email: 'sarah@email.com' },
        { id: 'CUST003', name: 'Michael Brown', phone: '(555) 345-6789' },
        { id: 'CUST004', name: 'Emily Davis', phone: '(555) 456-7890', email: 'emily@email.com' },
      ];

      const mockTickets: TailoringTicket[] = [
        {
          id: 'TKT001',
          ticketNumber: 'T-2024-001',
          physicalTicketNumber: 'P-001',
          customerId: 'CUST001',
          customerName: 'John Smith',
          customerPhone: '(555) 123-4567',
          customerEmail: 'john@email.com',
          services: [
            {
              id: 'SRV001',
              type: 'regular_hem',
              description: 'Regular Hem',
              garmentType: 'pants',
              quantity: 2,
              notes: 'Navy suit pants and gray dress pants',
            },
            {
              id: 'SRV002',
              type: 'sleeves',
              description: 'Sleeves',
              garmentType: 'jacket',
              quantity: 1,
              notes: 'Navy suit jacket',
            },
          ],
          status: 'in_progress',
          priority: 'normal',
          location: 'shop_1',
          dropOffDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          estimatedPickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          scheduledPickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          totalItems: 3,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: 'TKT002',
          ticketNumber: 'T-2024-002',
          physicalTicketNumber: 'P-002',
          customerId: 'CUST002',
          customerName: 'Sarah Johnson',
          customerPhone: '(555) 234-5678',
          customerEmail: 'sarah@email.com',
          services: [
            {
              id: 'SRV003',
              type: 'dress_shirt_take_in',
              description: 'Dress Shirt Take In',
              garmentType: 'shirt',
              quantity: 3,
              notes: 'White, blue, and striped dress shirts',
            },
          ],
          status: 'ready_pickup',
          priority: 'normal',
          location: 'shop_2',
          dropOffDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          estimatedPickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          scheduledPickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          totalItems: 3,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'TKT003',
          ticketNumber: 'T-2024-003',
          physicalTicketNumber: 'P-003',
          customerId: 'CUST003',
          customerName: 'Michael Brown',
          customerPhone: '(555) 345-6789',
          services: [
            {
              id: 'SRV004',
              type: 'zipper_replacement',
              description: 'Zipper Replacement',
              garmentType: 'jacket',
              quantity: 1,
              notes: 'Black leather jacket zipper',
            },
          ],
          status: 'dropped_off',
          priority: 'rush',
          location: 'shop_1',
          dropOffDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          estimatedPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          scheduledPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          totalItems: 1,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];

      if (!savedCustomers) {
        setCustomers(mockCustomers);
        localStorage.setItem('tailoring-customers', JSON.stringify(mockCustomers));
      }
      
      if (!savedTickets) {
        setTickets(mockTickets);
        localStorage.setItem('tailoring-tickets', JSON.stringify(mockTickets));
      }
    }
  }, []);

  // Save tickets to localStorage whenever tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      localStorage.setItem('tailoring-tickets', JSON.stringify(tickets));
    }
  }, [tickets]);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('tailoring-customers', JSON.stringify(customers));
    }
  }, [customers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'info';
      case 'in_progress': return 'warning';
      case 'quality_check': return 'secondary';
      case 'ready_pickup': return 'success';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'Dropped Off';
      case 'in_progress': return 'In Progress';
      case 'quality_check': return 'Quality Check';
      case 'ready_pickup': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'shop_1': return 'Tailor Shop 1';
      case 'shop_2': return 'Tailor Shop 2';
      default: return location;
    }
  };

  const getDaysUntilPickup = (scheduledDate: Date) => {
    return differenceInDays(scheduledDate, new Date());
  };

  const isOverdue = (ticket: TailoringTicket) => {
    return ticket.status !== 'completed' && isAfter(new Date(), ticket.scheduledPickupDate);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || ticket.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getTodaysPickups = () => {
    const today = new Date();
    return tickets.filter(ticket => 
      ticket.status === 'ready_pickup' &&
      format(ticket.scheduledPickupDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );
  };

  const getOverdueTickets = () => {
    return tickets.filter(isOverdue);
  };

  // SMS notification function
  const sendPickupNotification = async (ticket: TailoringTicket) => {
    try {
      const message = formatPickupMessage(ticket);
      
      await sendSMS(ticket.customerPhone, message);
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
      toast.error('Failed to send SMS notification');
    }
  };

  const handleCreateTicket = () => {
    if (!newTicket.customerName || !newTicket.customerPhone || newTicket.services.length === 0) {
      toast.error('Please fill in all required fields and add at least one service');
      return;
    }

    const ticket: TailoringTicket = {
      id: `TKT${String(tickets.length + 1).padStart(3, '0')}`,
      ticketNumber: `T-2024-${String(tickets.length + 1).padStart(3, '0')}`,
      physicalTicketNumber: newTicket.physicalTicketNumber || undefined,
      customerId: newTicket.customerId || `CUST${String(customers.length + 1).padStart(3, '0')}`,
      customerName: newTicket.customerName,
      customerPhone: newTicket.customerPhone,
      customerEmail: newTicket.customerEmail,
      services: newTicket.services,
      status: 'dropped_off',
      priority: newTicket.priority,
      location: newTicket.location,
      dropOffDate: new Date(),
      estimatedPickupDate: newTicket.scheduledPickupDate,
      scheduledPickupDate: newTicket.scheduledPickupDate,
      totalItems: newTicket.services.reduce((sum, service) => sum + service.quantity, 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTickets([...tickets, ticket]);
    
    // Add new customer if not existing
    if (!newTicket.customerId) {
      const customer: Customer = {
        id: ticket.customerId,
        name: newTicket.customerName,
        phone: newTicket.customerPhone,
        email: newTicket.customerEmail,
      };
      setCustomers([...customers, customer]);
    }

    setNewTicketDialogOpen(false);
    setNewTicket({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      physicalTicketNumber: '',
      services: [],
      priority: 'normal',
      location: 'shop_1',
      scheduledPickupDate: addDays(new Date(), 7),
      notes: '',
    });

    toast.success(`Ticket ${ticket.ticketNumber} created successfully!`);
  };

  const handleAddService = () => {
    const service: AlterationService = {
      id: `SRV${String(Date.now())}`,
      type: '',
      description: '',
      garmentType: 'other',
      quantity: 1,
      notes: '',
    };
    setNewTicket({
      ...newTicket,
      services: [...newTicket.services, service],
    });
  };

  const handleUpdateService = (index: number, field: string, value: any) => {
    const updatedServices = [...newTicket.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    // Auto-fill description when type is selected
    if (field === 'type' && value) {
      const allServices = [
        ...ALTERATION_SERVICES.shirt,
        ...ALTERATION_SERVICES.pants,
        ...ALTERATION_SERVICES.jacket,
        ...ALTERATION_SERVICES.repairs,
      ];
      const serviceInfo = allServices.find(s => s.type === value);
      if (serviceInfo) {
        updatedServices[index].description = serviceInfo.name;
      }
    }
    
    setNewTicket({ ...newTicket, services: updatedServices });
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = newTicket.services.filter((_, i) => i !== index);
    setNewTicket({ ...newTicket, services: updatedServices });
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as any, updatedAt: new Date() }
        : ticket
    );
    setTickets(updatedTickets);
    
    // Send SMS notification when status changes to ready_pickup
    if (newStatus === 'ready_pickup') {
      const updatedTicket = updatedTickets.find(t => t.id === ticketId);
      if (updatedTicket) {
        sendPickupNotification(updatedTicket);
      }
    }
    
    toast.success(`Ticket status updated to ${getStatusLabel(newStatus)}`);
  };

  // Debug function to clear all data (for testing)
  const clearAllData = () => {
    localStorage.removeItem('tailoring-tickets');
    localStorage.removeItem('tailoring-customers');
    setTickets([]);
    setCustomers([]);
    toast.success('All data cleared!');
  };

  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <TicketIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{getTicketsByStatus('dropped_off').length}</Typography>
                <Typography color="textSecondary">Dropped Off</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <TailoringIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{getTicketsByStatus('in_progress').length}</Typography>
                <Typography color="textSecondary">In Progress</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <CompleteIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{getTicketsByStatus('ready_pickup').length}</Typography>
                <Typography color="textSecondary">Ready for Pickup</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                <AlertIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{getOverdueTickets().length}</Typography>
                <Typography color="textSecondary">Overdue</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Today's Pickups */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Today's Pickups ({getTodaysPickups().length})
            </Typography>
            <List>
              {getTodaysPickups().slice(0, 5).map((ticket) => (
                <ListItem key={ticket.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <CustomerIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={ticket.customerName}
                    secondary={`${ticket.ticketNumber} • ${ticket.totalItems} items`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => window.open(`tel:${ticket.customerPhone}`)}>
                      <PhoneIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Overdue Items */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              <AlertIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Overdue Items ({getOverdueTickets().length})
            </Typography>
            <List>
              {getOverdueTickets().slice(0, 5).map((ticket) => (
                <ListItem key={ticket.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <AlertIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={ticket.customerName}
                    secondary={`${ticket.ticketNumber} • ${Math.abs(getDaysUntilPickup(ticket.scheduledPickupDate))} days overdue`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => window.open(`tel:${ticket.customerPhone}`)}>
                      <PhoneIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderActiveTickets = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by customer, ticket number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="dropped_off">Dropped Off</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="quality_check">Quality Check</MenuItem>
                <MenuItem value="ready_pickup">Ready for Pickup</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                label="Location"
              >
                <MenuItem value="all">All Locations</MenuItem>
                <MenuItem value="shop_1">Tailor Shop 1</MenuItem>
                <MenuItem value="shop_2">Tailor Shop 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewTicketDialogOpen(true)}
            >
              New Ticket
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Pickup Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {ticket.ticketNumber}
                    </Typography>
                    {ticket.priority === 'rush' && (
                      <Chip size="small" label="RUSH" color="error" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{ticket.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {ticket.customerPhone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {ticket.totalItems} item{ticket.totalItems !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {ticket.services.map(s => s.description).join(', ')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(ticket.status)}
                    color={getStatusColor(ticket.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getLocationLabel(ticket.location)}
                    variant="outlined"
                    size="small"
                    icon={<LocationIcon />}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {format(ticket.scheduledPickupDate, 'MMM dd, yyyy')}
                    </Typography>
                    {isOverdue(ticket) ? (
                      <Typography variant="caption" color="error">
                        {Math.abs(getDaysUntilPickup(ticket.scheduledPickupDate))} days overdue
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        {getDaysUntilPickup(ticket.scheduledPickupDate)} days remaining
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketDialogOpen(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Ticket">
                      <IconButton size="small">
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Call Customer">
                      <IconButton
                        size="small"
                        onClick={() => window.open(`tel:${ticket.customerPhone}`)}
                      >
                        <PhoneIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderNewTicketDialog = () => (
    <Dialog
      open={newTicketDialogOpen}
      onClose={() => setNewTicketDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Create New Tailoring Ticket</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} - ${option.phone}`}
              value={customers.find(c => c.id === newTicket.customerId) || null}
              onChange={(_, value) => {
                if (value) {
                  setNewTicket({
                    ...newTicket,
                    customerId: value.id,
                    customerName: value.name,
                    customerPhone: value.phone,
                    customerEmail: value.email || '',
                  });
                } else {
                  setNewTicket({
                    ...newTicket,
                    customerId: '',
                    customerName: '',
                    customerPhone: '',
                    customerEmail: '',
                  });
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Existing Customer" />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer Name *"
              value={newTicket.customerName}
              onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={newTicket.customerPhone}
              onChange={(e) => setNewTicket({ ...newTicket, customerPhone: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email (Optional)"
              value={newTicket.customerEmail}
              onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Physical Ticket Number (Optional)"
              value={newTicket.physicalTicketNumber}
              onChange={(e) => setNewTicket({ ...newTicket, physicalTicketNumber: e.target.value })}
              placeholder="e.g., P-001, 12345"
              helperText="Enter your store's physical ticket number for reference"
            />
          </Grid>

          {/* Services */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="h6">Services</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddService}>
                Add Service
              </Button>
            </Box>
          </Grid>

          {newTicket.services.map((service, index) => (
            <Grid item xs={12} key={service.id}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={service.type}
                        onChange={(e) => handleUpdateService(index, 'type', e.target.value)}
                        label="Service Type"
                      >
                        <MenuItem disabled>
                          <Typography variant="subtitle2" color="primary">Shirt Alterations</Typography>
                        </MenuItem>
                        {ALTERATION_SERVICES.shirt.map((alt) => (
                          <MenuItem key={alt.type} value={alt.type}>
                            {alt.name}
                          </MenuItem>
                        ))}
                        <MenuItem disabled>
                          <Typography variant="subtitle2" color="primary">Pants Alterations</Typography>
                        </MenuItem>
                        {ALTERATION_SERVICES.pants.map((alt) => (
                          <MenuItem key={alt.type} value={alt.type}>
                            {alt.name}
                          </MenuItem>
                        ))}
                        <MenuItem disabled>
                          <Typography variant="subtitle2" color="primary">Jacket Alterations</Typography>
                        </MenuItem>
                        {ALTERATION_SERVICES.jacket.map((alt) => (
                          <MenuItem key={alt.type} value={alt.type}>
                            {alt.name}
                          </MenuItem>
                        ))}
                        <MenuItem disabled>
                          <Typography variant="subtitle2" color="primary">Repairs</Typography>
                        </MenuItem>
                        {ALTERATION_SERVICES.repairs.map((alt) => (
                          <MenuItem key={alt.type} value={alt.type}>
                            {alt.name}
                          </MenuItem>
                        ))}
                        <MenuItem value="custom">Custom Alteration</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={service.description}
                      onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={service.quantity}
                      onChange={(e) => handleUpdateService(index, 'quantity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={service.notes}
                      onChange={(e) => handleUpdateService(index, 'notes', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveService(index)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}

          {/* Ticket Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Ticket Details</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                label="Priority"
              >
                <MenuItem value="normal">Normal (7-10 days)</MenuItem>
                <MenuItem value="rush">Rush (3-5 days)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={newTicket.location}
                onChange={(e) => setNewTicket({ ...newTicket, location: e.target.value as any })}
                label="Location"
              >
                <MenuItem value="shop_1">Tailor Shop 1</MenuItem>
                <MenuItem value="shop_2">Tailor Shop 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <DatePicker
              label="Scheduled Pickup Date"
              value={newTicket.scheduledPickupDate}
              onChange={(newValue) => {
                if (newValue) {
                  setNewTicket({ ...newTicket, scheduledPickupDate: newValue });
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newTicket.notes}
              onChange={(e) => setNewTicket({ ...newTicket, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setNewTicketDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateTicket}>
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderTicketDetailDialog = () => (
    <Dialog
      open={ticketDialogOpen}
      onClose={() => setTicketDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedTicket && (
        <>
          <DialogTitle>
            Ticket Details - {selectedTicket.ticketNumber}
            {selectedTicket.priority === 'rush' && (
              <Chip label="RUSH" color="error" size="small" sx={{ ml: 1 }} />
            )}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <Typography><strong>Name:</strong> {selectedTicket.customerName}</Typography>
                <Typography><strong>Phone:</strong> {selectedTicket.customerPhone}</Typography>
                {selectedTicket.customerEmail && (
                  <Typography><strong>Email:</strong> {selectedTicket.customerEmail}</Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Ticket Information</Typography>
                <Typography><strong>Digital Ticket:</strong> {selectedTicket.ticketNumber}</Typography>
                {selectedTicket.physicalTicketNumber && (
                  <Typography><strong>Physical Ticket:</strong> {selectedTicket.physicalTicketNumber}</Typography>
                )}
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={getStatusLabel(selectedTicket.status)}
                    color={getStatusColor(selectedTicket.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Location:</strong> {getLocationLabel(selectedTicket.location)}</Typography>
                <Typography><strong>Drop Off:</strong> {format(selectedTicket.dropOffDate, 'MMM dd, yyyy')}</Typography>
                <Typography><strong>Scheduled Pickup:</strong> {format(selectedTicket.scheduledPickupDate, 'MMM dd, yyyy')}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Services</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTicket.services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{service.description}</TableCell>
                          <TableCell>{service.quantity}</TableCell>
                          <TableCell>{service.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Update Status</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant={selectedTicket.status === 'dropped_off' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'dropped_off')}
                    disabled={selectedTicket.status === 'dropped_off'}
                  >
                    Dropped Off
                  </Button>
                  <Button
                    variant={selectedTicket.status === 'in_progress' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                    disabled={selectedTicket.status === 'in_progress'}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={selectedTicket.status === 'quality_check' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'quality_check')}
                    disabled={selectedTicket.status === 'quality_check'}
                  >
                    Quality Check
                  </Button>
                  <Button
                    variant={selectedTicket.status === 'ready_pickup' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'ready_pickup')}
                    disabled={selectedTicket.status === 'ready_pickup'}
                  >
                    Ready for Pickup
                  </Button>
                  <Button
                    variant={selectedTicket.status === 'completed' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'completed')}
                    disabled={selectedTicket.status === 'completed'}
                  >
                    Completed
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTicketDialogOpen(false)}>Close</Button>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print Ticket
            </Button>
            <Button variant="contained" startIcon={<PhoneIcon />} onClick={() => window.open(`tel:${selectedTicket.customerPhone}`)}>
              Call Customer
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            Tailoring Journey
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {tickets.length} tickets saved in localStorage
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={clearAllData}
            size="small"
          >
            Clear All Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewTicketDialogOpen(true)}
          >
            New Ticket
          </Button>
        </Stack>
      </Box>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab 
          label={
            <Badge badgeContent={getOverdueTickets().length} color="error">
              Active Tickets
            </Badge>
          } 
        />
        <Tab label="Completed" />
        <Tab label="Calendar" />
        <Tab label="Analytics" />
      </Tabs>

      {selectedTab === 0 && renderDashboardOverview()}
      {selectedTab === 1 && renderActiveTickets()}
      {selectedTab === 2 && (
        <Typography variant="h6" color="textSecondary" textAlign="center" py={4}>
          Completed tickets view coming soon...
        </Typography>
      )}
      {selectedTab === 3 && <TailoringCalendar tickets={tickets} />}
      {selectedTab === 4 && <TailoringAnalytics tickets={tickets} />}

      {renderNewTicketDialog()}
      {renderTicketDetailDialog()}
    </Box>
  );
};

export default TailoringDashboard; 