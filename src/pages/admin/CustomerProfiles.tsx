import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Email,
  Phone,
  LocationOn,
  ShoppingBag,
  CalendarMonth,
  Edit,
  Delete,
  PersonAdd,
  Download,
  Upload,
  CheckCircle,
  Cancel,
  Star,
  WorkspacePremium,
  TrendingUp,
  Checkroom,
  AttachMoney,
  Timeline,
  Send,
  History,
} from '@mui/icons-material';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profile?: CustomerProfile;
  createdAt: string;
  updatedAt: string;
}

interface CustomerProfile {
  id: string;
  customerTier: string;
  engagementScore: number;
  vipStatus: boolean;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  repeatCustomer: boolean;
  jacketSize?: string;
  pantsSize?: string;
  shirtSize?: string;
  vestSize?: string;
  shoeSize?: string;
  sizeProfileCompleteness: number;
  primaryOccasion?: string;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
  daysSinceLastPurchase?: number;
  marketingTags: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const CustomerProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    tier: '',
    vipOnly: false,
    hasCompleteProfile: false,
    occasion: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchQuery, selectedFilters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        search: searchQuery,
        ...selectedFilters,
      });

      const response = await api.get(`/api/customers?${params}`);
      setCustomers(response.data.data);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Use mock data for development
      setMockCustomers();
    } finally {
      setLoading(false);
    }
  };

  const setMockCustomers = () => {
    const mockData: Customer[] = [
      {
        id: '1',
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        profile: {
          id: 'p1',
          customerTier: 'Platinum',
          engagementScore: 95,
          vipStatus: true,
          totalSpent: 18500,
          totalOrders: 12,
          averageOrderValue: 1541.67,
          repeatCustomer: true,
          jacketSize: '42R',
          pantsSize: '34x32',
          shirtSize: '16.5',
          vestSize: 'L',
          shoeSize: '10.5',
          sizeProfileCompleteness: 1,
          primaryOccasion: 'wedding',
          firstPurchaseDate: '2022-03-15',
          lastPurchaseDate: '2024-01-15',
          daysSinceLastPurchase: 9,
          marketingTags: ['high-value', 'wedding', 'repeat-buyer'],
        },
        createdAt: '2022-03-15T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '(555) 234-5678',
        address: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        profile: {
          id: 'p2',
          customerTier: 'Gold',
          engagementScore: 78,
          vipStatus: false,
          totalSpent: 8200,
          totalOrders: 5,
          averageOrderValue: 1640,
          repeatCustomer: true,
          jacketSize: '40R',
          pantsSize: '32x30',
          shirtSize: '15.5',
          sizeProfileCompleteness: 0.6,
          primaryOccasion: 'business',
          firstPurchaseDate: '2023-01-10',
          lastPurchaseDate: '2023-12-20',
          daysSinceLastPurchase: 35,
          marketingTags: ['business', 'repeat-buyer'],
        },
        createdAt: '2023-01-10T09:00:00Z',
        updatedAt: '2023-12-20T16:45:00Z',
      },
    ];
    setCustomers(mockData);
    setTotalCount(mockData.length);
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
    setTabValue(0);
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return <WorkspacePremium sx={{ color: '#E5E4E2' }} />;
      case 'gold':
        return <Star sx={{ color: '#FFD700' }} />;
      case 'silver':
        return <Star sx={{ color: '#C0C0C0' }} />;
      default:
        return <TrendingUp sx={{ color: '#CD7F32' }} />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  const handleSendEmail = (customerId: string) => {
    // Implement email sending
    toast.success('Email composer opened');
  };

  const handleExportCustomer = (customerId: string) => {
    // Implement export
    toast.success('Customer data exported');
  };

  const handleEditCustomer = (customerId: string) => {
    navigate(`/admin/customers/${customerId}/edit`);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/api/customers/${customerId}`);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const renderCustomerDetails = () => {
    if (!selectedCustomer) return null;

    return (
      <>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: getTierColor(selectedCustomer.profile?.customerTier || 'Prospect') }}>
                {selectedCustomer.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedCustomer.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={getTierIcon(selectedCustomer.profile?.customerTier || 'Prospect')}
                    label={selectedCustomer.profile?.customerTier || 'Prospect'}
                    size="small"
                    sx={{
                      bgcolor: getTierColor(selectedCustomer.profile?.customerTier || 'Prospect'),
                      color: selectedCustomer.profile?.customerTier === 'Silver' ? 'black' : 'white',
                    }}
                  />
                  {selectedCustomer.profile?.vipStatus && (
                    <Chip label="VIP" size="small" color="warning" />
                  )}
                </Box>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Overview" />
            <Tab label="Profile & Sizes" />
            <Tab label="Purchase History" />
            <Tab label="Marketing" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText primary={selectedCustomer.email} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Phone />
                        </ListItemIcon>
                        <ListItemText primary={selectedCustomer.phone || 'Not provided'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationOn />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${selectedCustomer.address || ''} ${selectedCustomer.city || ''} ${selectedCustomer.state || ''} ${selectedCustomer.zipCode || ''}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Engagement Metrics
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Engagement Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedCustomer.profile?.engagementScore || 0}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">
                          {selectedCustomer.profile?.engagementScore || 0}%
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Spent
                        </Typography>
                        <Typography variant="h6">
                          ${selectedCustomer.profile?.totalSpent.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Orders
                        </Typography>
                        <Typography variant="h6">
                          {selectedCustomer.profile?.totalOrders || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Order Value
                        </Typography>
                        <Typography variant="h6">
                          ${selectedCustomer.profile?.averageOrderValue.toFixed(2) || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Days Since Last Order
                        </Typography>
                        <Typography variant="h6">
                          {selectedCustomer.profile?.daysSinceLastPurchase || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Size Profile
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Profile Completeness
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(selectedCustomer.profile?.sizeProfileCompleteness || 0) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Jacket Size"
                          value={selectedCustomer.profile?.jacketSize || ''}
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Pants Size"
                          value={selectedCustomer.profile?.pantsSize || ''}
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Shirt Size"
                          value={selectedCustomer.profile?.shirtSize || ''}
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Vest Size"
                          value={selectedCustomer.profile?.vestSize || ''}
                          fullWidth
                          disabled
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Shoe Size"
                          value={selectedCustomer.profile?.shoeSize || ''}
                          fullWidth
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Purchase History
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarMonth />
                    </ListItemIcon>
                    <ListItemText
                      primary="First Purchase"
                      secondary={
                        selectedCustomer.profile?.firstPurchaseDate
                          ? format(parseISO(selectedCustomer.profile.firstPurchaseDate), 'MMM d, yyyy')
                          : 'No purchases yet'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <History />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Purchase"
                      secondary={
                        selectedCustomer.profile?.lastPurchaseDate
                          ? format(parseISO(selectedCustomer.profile.lastPurchaseDate), 'MMM d, yyyy')
                          : 'No recent purchases'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ShoppingBag />
                    </ListItemIcon>
                    <ListItemText
                      primary="Primary Shopping Occasion"
                      secondary={selectedCustomer.profile?.primaryOccasion || 'Not specified'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Marketing Preferences
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Checkbox checked={true} disabled />}
                    label="Email Marketing"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={false} disabled />}
                    label="SMS Marketing"
                  />
                </Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedCustomer.profile?.marketingTags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => handleEditCustomer(selectedCustomer.id)}
          >
            Edit Customer
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Customer Profiles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer information and profiles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<Upload />} variant="outlined">
            Import
          </Button>
          <Button startIcon={<Download />} variant="outlined">
            Export
          </Button>
          <Button
            startIcon={<PersonAdd />}
            variant="contained"
            onClick={() => navigate('/admin/customers/new')}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
              <FilterList />
            </IconButton>
          </Box>
          {Object.values(selectedFilters).some(Boolean) && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {selectedFilters.tier && (
                <Chip
                  label={`Tier: ${selectedFilters.tier}`}
                  onDelete={() => setSelectedFilters({ ...selectedFilters, tier: '' })}
                />
              )}
              {selectedFilters.vipOnly && (
                <Chip
                  label="VIP Only"
                  onDelete={() => setSelectedFilters({ ...selectedFilters, vipOnly: false })}
                />
              )}
              {selectedFilters.hasCompleteProfile && (
                <Chip
                  label="Complete Profile"
                  onDelete={() => setSelectedFilters({ ...selectedFilters, hasCompleteProfile: false })}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Customer Tier</InputLabel>
            <Select
              value={selectedFilters.tier}
              onChange={(e) => setSelectedFilters({ ...selectedFilters, tier: e.target.value })}
              label="Customer Tier"
            >
              <MenuItem value="">All Tiers</MenuItem>
              <MenuItem value="Platinum">Platinum</MenuItem>
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
              <MenuItem value="Prospect">Prospect</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.vipOnly}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, vipOnly: e.target.checked })}
              />
            }
            label="VIP Only"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.hasCompleteProfile}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, hasCompleteProfile: e.target.checked })}
              />
            }
            label="Complete Profile Only"
          />
        </Box>
      </Menu>

      {/* Customers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell align="right">Total Spent</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="center">Profile</TableCell>
              <TableCell>Last Activity</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleCustomerClick(customer)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getTierColor(customer.profile?.customerTier || 'Prospect') }}>
                        {customer.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{customer.name}</Typography>
                        {customer.profile?.vipStatus && (
                          <Chip label="VIP" size="small" color="warning" />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{customer.email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.phone || 'No phone'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getTierIcon(customer.profile?.customerTier || 'Prospect')}
                      label={customer.profile?.customerTier || 'Prospect'}
                      size="small"
                      sx={{
                        bgcolor: getTierColor(customer.profile?.customerTier || 'Prospect'),
                        color: customer.profile?.customerTier === 'Silver' ? 'black' : 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${customer.profile?.totalSpent.toLocaleString() || 0}
                  </TableCell>
                  <TableCell align="right">
                    {customer.profile?.totalOrders || 0}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`${((customer.profile?.sizeProfileCompleteness || 0) * 100).toFixed(0)}% complete`}>
                      <LinearProgress
                        variant="determinate"
                        value={(customer.profile?.sizeProfileCompleteness || 0) * 100}
                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDistanceToNow(parseISO(customer.updatedAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuAnchor(e.currentTarget);
                        setSelectedCustomerId(customer.id);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            handleEditCustomer(selectedCustomerId!);
            setActionMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleSendEmail(selectedCustomerId!);
            setActionMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Send fontSize="small" />
          </ListItemIcon>
          Send Email
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleExportCustomer(selectedCustomerId!);
            setActionMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          Export
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDeleteCustomer(selectedCustomerId!);
            setActionMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Customer Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {renderCustomerDetails()}
      </Dialog>
    </Box>
  );
};

export default CustomerProfiles;