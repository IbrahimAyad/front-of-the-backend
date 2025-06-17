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
import { weddingAPI } from '../../services/weddingAPI';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMember, setMenuMember] = useState<WeddingMember | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, member: WeddingMember) => {
    setAnchorEl(event.currentTarget);
    setMenuMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMember(null);
  };

  const handleOpenSuitMeasurements = (member: WeddingMember) => {
    setSelectedMember(member);
    setShowSuitMeasurements(true);
    handleMenuClose();
  };

  const handleOpenShippingAddress = (member: WeddingMember) => {
    setSelectedMember(member);
    setShowShippingAddress(true);
    handleMenuClose();
  };

  const handleMemberUpdate = (updatedMember: WeddingMember) => {
    // Update the local state and trigger parent update
    onUpdate();
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

  const getStatusColor = (status: WeddingMember['measurementStatus']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'completed': return 'success';
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
            Wedding Code: {wedding.weddingCode} • {format(wedding.weddingDate, 'MMMM dd, yyyy')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CopyIcon />}
          onClick={copyPortalLink}
          sx={{ mr: 2 }}
        >
          Copy Portal Link
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Days Until Wedding
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={daysUntilWedding < 30 ? 'error.main' : 'text.primary'}>
                    {daysUntilWedding}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: daysUntilWedding < 30 ? 'error.main' : 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
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
                  <Typography variant="caption" color="text.secondary">
                    of {wedding.estimatedPartySize} estimated
                  </Typography>
                </Box>
                <GroupsIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Measurements Progress
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(progressPercentage)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Measurements
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={pendingMeasurements > 0 ? 'warning.main' : 'success.main'}>
                    {pendingMeasurements}
                  </Typography>
                </Box>
                {pendingMeasurements > 0 ? (
                  <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                ) : (
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Wedding Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Wedding Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Style Preferences</Typography>
              <Typography>
                {wedding.stylePreferences.suitColor.replace('_', ' ').toUpperCase()} • {wedding.attireType.type.replace('_', ' ').toUpperCase()}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Accessories</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {wedding.accessories.map((accessory) => (
                  <Chip key={accessory} label={accessory.replace('_', ' ')} size="small" />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" />
                  <Typography>Groom: {wedding.groomInfo.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography>{wedding.groomInfo.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon fontSize="small" />
                  <Typography>{wedding.groomInfo.phone}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" />
                  <Typography>Bride: {wedding.brideInfo.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography>{wedding.brideInfo.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" />
                  <Typography>{wedding.brideInfo.phone}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Self-Service Portal Info */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Self-Service Portal
        </Typography>
        <Typography variant="body2">
          Share the wedding code <strong>{wedding.weddingCode}</strong> with your party members so they can access their portal and submit measurements.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={copyWeddingCode}
            sx={{ mr: 1 }}
          >
            Copy Code
          </Button>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={copyPortalLink}
          >
            Copy Portal Link
          </Button>
        </Box>
      </Alert>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Party Members" />
          <Tab label="Timeline" />
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
                <TableCell>Measurement Status</TableCell>
                <TableCell>Suit Measurements</TableCell>
                <TableCell>Order Status</TableCell>
                <TableCell>Added</TableCell>
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
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={member.measurementStatus}
                        onChange={(e) => handleUpdateMemberStatus(member.id, e.target.value as WeddingMember['measurementStatus'])}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="submitted">Submitted</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={member.suitMeasurementStatus}
                        onChange={(e) => handleUpdateMemberStatus(member.id, e.target.value as WeddingMember['measurementStatus'])}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="submitted">Submitted</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={member.orderStatus}
                        onChange={(e) => handleUpdateMemberStatus(member.id, e.target.value as WeddingMember['measurementStatus'])}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="submitted">Submitted</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {format(member.addedAt, 'MMM dd')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove member">
                      <IconButton
                        onClick={() => handleRemoveMember(member.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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
              Add members to start tracking measurements
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
            <ScheduleIcon color={completedMeasurements > 0 ? 'success' : 'disabled'} />
            <Box>
              <Typography fontWeight="bold">Measurements Collection</Typography>
              <Typography variant="body2" color="text.secondary">
                {completedMeasurements} of {wedding.members.length} completed
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
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingPartyDetail; 