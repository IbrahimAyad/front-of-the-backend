import React, { useState } from 'react';
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
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  Straighten as MeasureIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { WeddingParty, WeddingMember } from '../../types';
import { WeddingAPI } from '../../services/weddingAPI';
import SuitMeasurementsForm from './SuitMeasurementsForm';
import ShippingAddressForm from './ShippingAddressForm';

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
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface WeddingPartyDetailProps {
  wedding: WeddingParty;
  onBack: () => void;
  onUpdate: () => void;
}

interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  role: WeddingMember['role'];
  specialNotes: string;
}

const memberRoles = [
  { value: 'groom', label: 'Groom' },
  { value: 'groomsman', label: 'Groomsman' },
  { value: 'best_man', label: 'Best Man' },
  { value: 'father_groom', label: 'Father of Groom' },
  { value: 'father_bride', label: 'Father of Bride' },
  { value: 'guest', label: 'Guest' },
];

const WeddingPartyDetail: React.FC<WeddingPartyDetailProps> = ({ wedding, onBack, onUpdate }) => {
  const [tabValue, setTabValue] = useState(0);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<WeddingMember | null>(null);
  const [showSuitMeasurements, setShowSuitMeasurements] = useState(false);
  const [showShippingAddress, setShowShippingAddress] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WeddingMember | null>(null);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);

  const weddingAPI = WeddingAPI.getInstance();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddMember = async (data: MemberFormData) => {
    try {
      await weddingAPI.addWeddingMember(wedding.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        measurementStatus: 'pending',
        specialNotes: data.specialNotes,
      });
      
      toast.success('Member added successfully!');
      setShowAddMember(false);
      reset();
      onUpdate();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, status: WeddingMember['measurementStatus']) => {
    try {
      await weddingAPI.updateWeddingMember(wedding.id, memberId, { measurementStatus: status });
      toast.success('Member status updated!');
      onUpdate();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member status');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await weddingAPI.removeWeddingMember(wedding.id, memberId);
        toast.success('Member removed successfully!');
        onUpdate();
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      }
    }
  };

  const handleMemberMenuClick = (event: React.MouseEvent<HTMLElement>, member: WeddingMember) => {
    setMemberMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const handleOpenSuitMeasurements = () => {
    setShowSuitMeasurements(true);
    handleMemberMenuClose();
  };

  const handleOpenShippingAddress = () => {
    setShowShippingAddress(true);
    handleMemberMenuClose();
  };

  const handleUpdateOrderStatus = async (status: WeddingMember['orderStatus']) => {
    if (!selectedMember) return;
    
    try {
      const updatedMember = weddingAPI.updateMemberOrderStatus(wedding.id, selectedMember.id, status);
      if (updatedMember) {
        toast.success('Order status updated!');
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
    handleMemberMenuClose();
  };

  const handleMemberUpdate = (updatedMember: WeddingMember) => {
    onUpdate();
  };

  const copyWeddingCode = () => {
    navigator.clipboard.writeText(wedding.weddingCode);
    toast.success('Wedding code copied to clipboard!');
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/wedding-portal/${wedding.weddingCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Portal link copied to clipboard!');
  };

  const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
  const completedMeasurements = wedding.members.filter(m => m.measurementStatus === 'completed').length;
  const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
  const progressPercentage = wedding.members.length > 0 ? (completedMeasurements / wedding.members.length) * 100 : 0;

  // Get measurement stats
  const measurementStats = weddingAPI.getMeasurementStats(wedding.id);
  const membersNeedingShipping = weddingAPI.getMembersNeedingShipping(wedding.id);

  const getStatusColor = (status: WeddingMember['measurementStatus']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getOrderStatusColor = (status: WeddingMember['orderStatus']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'ordered': return 'info';
      case 'in_production': return 'primary';
      case 'ready': return 'success';
      case 'shipped': return 'info';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: WeddingMember['role']) => {
    switch (role) {
      case 'groom': return '🤵';
      case 'best_man': return '👨‍💼';
      case 'groomsman': return '👥';
      case 'father_groom': return '👨‍🦳';
      case 'father_bride': return '👨‍🦳';
      case 'guest': return '👤';
      default: return '👤';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {wedding.groomInfo.name} & {wedding.brideInfo.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Wedding: {format(wedding.weddingDate, 'MMMM dd, yyyy')}
          </Typography>
        </Box>
        <Chip 
          label={wedding.status.toUpperCase()} 
          color={wedding.status === 'completed' ? 'success' : 'primary'}
          sx={{ mr: 2 }}
        />
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Days Until Wedding
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {daysUntilWedding}
                  </Typography>
                </Box>
                <EventIcon color="primary" sx={{ fontSize: 40 }} />
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
                    Party Members
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {wedding.members.length}
                  </Typography>
                </Box>
                <GroupsIcon color="primary" sx={{ fontSize: 40 }} />
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
                    Suit Measurements
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {measurementStats?.suitMeasurements || 0}/{wedding.members.length}
                  </Typography>
                </Box>
                <MeasureIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={measurementStats?.suitMeasurementsPercent || 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Shipping Addresses
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {measurementStats?.shippingAddresses || 0}/{wedding.members.length}
                  </Typography>
                </Box>
                <ShippingIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={measurementStats?.shippingAddressesPercent || 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Wedding Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Wedding Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Style Preferences
                </Typography>
                <Typography>
                  {wedding.stylePreferences.suitColor.replace('_', ' ').toUpperCase()} • {wedding.attireType.type.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Accessories
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {wedding.accessories.map((accessory, index) => (
                    <Chip key={index} label={accessory} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Self-Service Portal
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography fontFamily="monospace" fontWeight="bold">
                    {wedding.weddingCode}
                  </Typography>
                  <IconButton size="small" onClick={copyWeddingCode}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={copyPortalLink}
                  sx={{ mt: 1 }}
                >
                  Copy Portal Link
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Party Members" />
          <Tab label="Timeline" />
          <Tab label="Shipping & Orders" />
        </Tabs>
      </Box>

      {/* Party Members Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Party Members ({wedding.members.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddMember(true)}
          >
            Add Member
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Basic Measurements</TableCell>
                <TableCell>Suit Measurements</TableCell>
                <TableCell>Order Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wedding.members.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{getRoleIcon(member.role)}</Typography>
                      <Box>
                        <Typography fontWeight="bold">{member.name}</Typography>
                        {member.specialNotes && (
                          <Typography variant="caption" color="text.secondary">
                            {member.specialNotes}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={memberRoles.find(r => r.value === member.role)?.label || member.role}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {member.email && (
                        <Typography variant="body2">{member.email}</Typography>
                      )}
                      {member.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {member.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.measurementStatus}
                      color={getStatusColor(member.measurementStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={member.suitMeasurements?.finalizedAt ? 'Complete' : 'Pending'}
                        color={member.suitMeasurements?.finalizedAt ? 'success' : 'warning'}
                        size="small"
                      />
                      {member.shippingAddress && (
                        <Tooltip title="Shipping address on file">
                          <ShippingIcon fontSize="small" color="success" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.orderStatus || 'pending'}
                      color={getOrderStatusColor(member.orderStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMemberMenuClick(e, member)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveMember(member.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {wedding.members.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <GroupsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No party members added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add members to start tracking measurements and orders
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddMember(true)}
            >
              Add First Member
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* Timeline Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Wedding Timeline
        </Typography>
        
        <Box sx={{ pl: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Box>
              <Typography fontWeight="bold">Wedding Party Created</Typography>
              <Typography variant="body2" color="text.secondary">
                {format(wedding.createdAt, 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ScheduleIcon color={wedding.members.length > 0 ? 'success' : 'disabled'} />
            <Box>
              <Typography fontWeight="bold">Party Members Added</Typography>
              <Typography variant="body2" color="text.secondary">
                {wedding.members.length} members added
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MeasureIcon color={measurementStats?.suitMeasurements ? 'success' : 'disabled'} />
            <Box>
              <Typography fontWeight="bold">Suit Measurements Collection</Typography>
              <Typography variant="body2" color="text.secondary">
                {measurementStats?.suitMeasurements || 0} of {wedding.members.length} completed
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <EventIcon color="primary" />
            <Box>
              <Typography fontWeight="bold">Wedding Day</Typography>
              <Typography variant="body2" color="text.secondary">
                {format(wedding.weddingDate, 'MMMM dd, yyyy')} ({daysUntilWedding} days)
              </Typography>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Shipping & Orders Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Shipping & Order Management
        </Typography>

        {membersNeedingShipping.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {membersNeedingShipping.length} members need shipping arrangements
          </Alert>
        )}

        <Grid container spacing={3}>
          {wedding.members.map((member) => (
            <Grid item xs={12} md={6} key={member.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography fontWeight="bold">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {memberRoles.find(r => r.value === member.role)?.label}
                      </Typography>
                    </Box>
                    <Chip
                      label={member.orderStatus || 'pending'}
                      color={getOrderStatusColor(member.orderStatus)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Measurements: {member.suitMeasurements?.finalizedAt ? '✅ Complete' : '⏳ Pending'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Shipping: {member.shippingAddress ? '✅ Address on file' : '⏳ No address'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<MeasureIcon />}
                      onClick={() => {
                        setSelectedMember(member);
                        setShowSuitMeasurements(true);
                      }}
                    >
                      Measurements
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ShippingIcon />}
                      onClick={() => {
                        setSelectedMember(member);
                        setShowShippingAddress(true);
                      }}
                    >
                      Shipping
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleMemberMenuClose}
      >
        <MenuItem onClick={handleOpenSuitMeasurements}>
          <ListItemIcon>
            <MeasureIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Suit Measurements</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenShippingAddress}>
          <ListItemIcon>
            <ShippingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Shipping Address</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUpdateOrderStatus('ordered')}>
          <ListItemIcon>
            <OrderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Ordered</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateOrderStatus('ready')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Ready</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateOrderStatus('shipped')}>
          <ListItemIcon>
            <ShippingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Shipped</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onClose={() => setShowAddMember(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Party Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Full Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email (Optional)"
                    type="email"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone (Optional)"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                rules={{ required: 'Role is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role">
                      {memberRoles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="specialNotes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Special Notes (Optional)"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMember(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit(handleAddMember)} 
            variant="contained"
            disabled={isSubmitting}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suit Measurements Form */}
      {selectedMember && (
        <SuitMeasurementsForm
          open={showSuitMeasurements}
          onClose={() => {
            setShowSuitMeasurements(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          weddingId={wedding.id}
          onUpdate={handleMemberUpdate}
        />
      )}

      {/* Shipping Address Form */}
      {selectedMember && (
        <ShippingAddressForm
          open={showShippingAddress}
          onClose={() => {
            setShowShippingAddress(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          weddingId={wedding.id}
          onUpdate={handleMemberUpdate}
        />
      )}
    </Box>
  );
};

export default WeddingPartyDetail; 