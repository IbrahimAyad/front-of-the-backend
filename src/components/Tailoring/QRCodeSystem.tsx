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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  LinearProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  QrCode as QRIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  ContentCut as TailoringIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Assignment as TicketIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

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
  notes?: string;
}

interface AlterationService {
  id: string;
  type: string;
  description: string;
  quantity: number;
  notes?: string;
}

interface QRCodeSystemProps {
  tickets: TailoringTicket[];
}

const QRCodeSystem: React.FC<QRCodeSystemProps> = ({ tickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<TailoringTicket | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [customerPortalOpen, setCustomerPortalOpen] = useState(false);
  const [lookupTicket, setLookupTicket] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [foundTicket, setFoundTicket] = useState<TailoringTicket | null>(null);

  // Mock QR code URL - in real implementation, this would generate actual QR codes
  const generateQRCodeURL = (ticket: TailoringTicket) => {
    const trackingURL = `https://kct-menswear.com/track/${ticket.ticketNumber}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingURL)}`;
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

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'dropped_off': return 25;
      case 'in_progress': return 50;
      case 'quality_check': return 75;
      case 'ready_pickup': return 100;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'shop_1': return 'Tailor Shop 1';
      case 'shop_2': return 'Tailor Shop 2';
      default: return location;
    }
  };

  const handleTicketLookup = () => {
    const ticket = tickets.find(t => 
      (t.ticketNumber.toLowerCase().includes(lookupTicket.toLowerCase()) || 
       t.physicalTicketNumber?.toLowerCase().includes(lookupTicket.toLowerCase())) &&
      t.customerPhone.includes(lookupPhone.replace(/\D/g, ''))
    );
    
    setFoundTicket(ticket || null);
    if (!ticket) {
      // Show error message
    }
  };

  const handlePrintQR = (ticket: TailoringTicket) => {
    // In real implementation, this would trigger printing
    console.log('Printing QR code for ticket:', ticket.ticketNumber);
  };

  const handleDownloadQR = (ticket: TailoringTicket) => {
    // In real implementation, this would download the QR code
    const link = document.createElement('a');
    link.href = generateQRCodeURL(ticket);
    link.download = `qr-${ticket.ticketNumber}.png`;
    link.click();
  };

  const renderQRCodeGenerator = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <QRIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        QR Code Generator
      </Typography>
      
      <Grid container spacing={2}>
        {tickets.filter(t => t.status !== 'completed').map((ticket) => (
          <Grid item xs={12} md={6} lg={4} key={ticket.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="subtitle1">{ticket.ticketNumber}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {ticket.customerName}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(ticket.status)}
                    color={getStatusColor(ticket.status) as any}
                    size="small"
                  />
                </Box>
                
                <Box display="flex" justifyContent="center" mb={2}>
                  <img
                    src={generateQRCodeURL(ticket)}
                    alt={`QR Code for ${ticket.ticketNumber}`}
                    style={{ width: 120, height: 120 }}
                  />
                </Box>
                
                <Typography variant="caption" display="block" textAlign="center" mb={2}>
                  Scan to track status
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrintQR(ticket)}
                  >
                    Print
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadQR(ticket)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setQrDialogOpen(true);
                    }}
                  >
                    Preview
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCustomerPortal = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Customer Self-Service Portal
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Track Your Order</Typography>
        <Grid container spacing={2} alignItems="end">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ticket Number"
              value={lookupTicket}
              onChange={(e) => setLookupTicket(e.target.value)}
              placeholder="T-2024-001 or P-001"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone Number"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleTicketLookup}
              sx={{ height: 56 }}
            >
              Track Order
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {foundTicket && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h5">{foundTicket.ticketNumber}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {foundTicket.customerName}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(foundTicket.status)}
                color={getStatusColor(foundTicket.status) as any}
                size="large"
              />
            </Box>

            <Box mb={3}>
              <Typography variant="body2" gutterBottom>
                Order Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getStatusProgress(foundTicket.status)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption">Dropped Off</Typography>
                <Typography variant="caption">Ready for Pickup</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Order Details</Typography>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center">
                    <TicketIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Ticket:</strong> {foundTicket.ticketNumber}
                      {foundTicket.physicalTicketNumber && ` (${foundTicket.physicalTicketNumber})`}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Location:</strong> {getLocationLabel(foundTicket.location)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Dropped Off:</strong> {format(foundTicket.dropOffDate, 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Expected Pickup:</strong> {format(foundTicket.scheduledPickupDate, 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Services</Typography>
                <Stack spacing={1}>
                  {foundTicket.services.map((service, index) => (
                    <Box key={index} display="flex" justifyContent="space-between">
                      <Typography variant="body2">{service.description}</Typography>
                      <Typography variant="body2">Qty: {service.quantity}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Status Timeline</Typography>
                <Timeline>
                  <TimelineItem>
                    <TimelineOppositeContent color="text.secondary">
                      {format(foundTicket.dropOffDate, 'MMM dd, HH:mm')}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        <TicketIcon />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="h6">Order Received</Typography>
                      <Typography>Items dropped off for alteration</Typography>
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineOppositeContent color="text.secondary">
                      {foundTicket.status !== 'dropped_off' ? 'In Progress' : 'Pending'}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={foundTicket.status !== 'dropped_off' ? 'warning' : 'grey'}>
                        <TailoringIcon />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="h6">Alteration in Progress</Typography>
                      <Typography>Our skilled tailors are working on your items</Typography>
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineOppositeContent color="text.secondary">
                      {['quality_check', 'ready_pickup', 'completed'].includes(foundTicket.status) ? 'Completed' : 'Pending'}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={['quality_check', 'ready_pickup', 'completed'].includes(foundTicket.status) ? 'success' : 'grey'}>
                        <CompleteIcon />
                      </TimelineDot>
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="h6">Ready for Pickup</Typography>
                      <Typography>Your items are ready! Please visit us to collect them.</Typography>
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </Grid>

              {foundTicket.status === 'ready_pickup' && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h6" gutterBottom>
                      🎉 Your items are ready for pickup!
                    </Typography>
                    <Typography>
                      Please visit {getLocationLabel(foundTicket.location)} to collect your items.
                      Don't forget to bring your ticket!
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {foundTicket.notes && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Typography variant="body2">{foundTicket.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderQRCodeGenerator()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderCustomerPortal()}
        </Grid>
      </Grid>

      {/* QR Code Preview Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>QR Code Preview</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                {selectedTicket.ticketNumber}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedTicket.customerName}
              </Typography>
              
              <Box display="flex" justifyContent="center" my={3}>
                <img
                  src={generateQRCodeURL(selectedTicket)}
                  alt={`QR Code for ${selectedTicket.ticketNumber}`}
                  style={{ width: 200, height: 200 }}
                />
              </Box>
              
              <Typography variant="body2" gutterBottom>
                Customers can scan this QR code to track their order status
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                Tracking URL: https://kct-menswear.com/track/{selectedTicket.ticketNumber}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => selectedTicket && handlePrintQR(selectedTicket)}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeSystem; 