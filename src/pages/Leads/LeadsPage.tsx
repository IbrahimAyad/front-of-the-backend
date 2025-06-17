import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,

  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';

import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { leadAPI, customerAPI } from '../../services/api';
import type { LeadFormData } from '../../types';



const LeadsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    defaultValues: {
      customerId: 0,
      source: 'website' as const,
      status: 'new' as const,
      score: 50,
      occasion: undefined,
      budgetRange: '',
      notes: '',
      nextFollowUp: '',
    },
  });

  // Fetch leads
  const {
    data: leadsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['leads', { search: searchTerm, status: statusFilter, source: sourceFilter }],
    queryFn: () => leadAPI.getLeads({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
    }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getCustomers({ limit: 100 }),
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: leadAPI.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully!');
      setIsAddDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      console.error('Lead creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create lead';
      toast.error(errorMessage);
    },
  });

  const leads = leadsData?.data?.leads || [];
  const customers = customersData?.data?.customers || [];

  const handleAddLead = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    reset();
  };

  const handleEditLead = (leadId: number) => {
    console.log('Edit lead:', leadId);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Lead status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'error';
      case 'warm': return 'warning';
      case 'qualified': return 'info';
      case 'converted': return 'success';
      case 'lost': return 'default';
      default: return 'default';
    }
  };

  // Lead source colors
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'website': return 'primary';
      case 'referral': return 'success';
      case 'social_media': return 'info';
      case 'walk_in': return 'warning';
      default: return 'default';
    }
  };

  // Filter leads by status for pipeline view
  const leadsByStatus = {
    new: leads.filter(lead => lead.status === 'new'),
    contacted: leads.filter(lead => lead.status === 'contacted'),
    qualified: leads.filter(lead => lead.status === 'qualified'),
    hot: leads.filter(lead => lead.status === 'hot'),
    warm: leads.filter(lead => lead.status === 'warm'),
    cold: leads.filter(lead => lead.status === 'cold'),
    converted: leads.filter(lead => lead.status === 'converted'),
    lost: leads.filter(lead => lead.status === 'lost'),
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load leads. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Leads Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage sales leads through your pipeline
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Lead
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leads.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Leads
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leadsByStatus.hot.length + leadsByStatus.qualified.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hot & Qualified
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leads.filter(lead => lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date()).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Follow-ups Due
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leadsByStatus.converted.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Converted
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Leads" />
            <Tab label="Pipeline View" />
          </Tabs>
        </Box>

        {/* All Leads Tab */}
        {tabValue === 0 && (
          <CardContent>
            {/* Filters */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="qualified">Qualified</MenuItem>
                    <MenuItem value="hot">Hot</MenuItem>
                    <MenuItem value="warm">Warm</MenuItem>
                    <MenuItem value="cold">Cold</MenuItem>
                    <MenuItem value="converted">Converted</MenuItem>
                    <MenuItem value="lost">Lost</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={sourceFilter}
                    label="Source"
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <MenuItem value="">All Sources</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                    <MenuItem value="referral">Referral</MenuItem>
                    <MenuItem value="social_media">Social Media</MenuItem>
                    <MenuItem value="walk_in">Walk-in</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Leads Table */}
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Occasion</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Next Follow-up</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leads.map((lead: any) => (
                      <TableRow key={lead.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {lead.customer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {lead.customer.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={lead.source} 
                            size="small" 
                            color={getSourceColor(lead.source) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={lead.status} 
                            size="small" 
                            color={getStatusColor(lead.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Typography variant="body2" fontWeight="medium">
                              {lead.score}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {lead.occasion ? (
                            <Chip label={lead.occasion} size="small" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lead.budgetRange || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {lead.nextFollowUp ? (
                            <Typography variant="body2">
                              {format(new Date(lead.nextFollowUp), 'MMM dd, yyyy')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              title="View lead details"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditLead(lead.id)}
                              title="Edit lead"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* Pipeline View Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Grid container spacing={2}>
              {Object.entries(leadsByStatus).map(([status, statusLeads]) => (
                <Grid item xs={12} md={3} key={status}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom textTransform="capitalize">
                        {status} ({statusLeads.length})
                      </Typography>
                      <Box>
                        {statusLeads.map((lead: any) => (
                          <Card key={lead.id} sx={{ mb: 1, p: 1 }} variant="outlined">
                            <Typography variant="body2" fontWeight="medium">
                              {lead.customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Score: {lead.score}%
                            </Typography>
                            {lead.occasion && (
                              <Typography variant="caption" display="block">
                                {lead.occasion}
                              </Typography>
                            )}
                          </Card>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Add Lead Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={createLeadMutation.isPending}
      >
        <form onSubmit={handleSubmit(handleAddLead)}>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.customerId}>
                      <InputLabel>Customer *</InputLabel>
                      <Select
                        {...field}
                        label="Customer *"
                      >
                        {customers.map((customer: any) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.source}>
                      <InputLabel>Source *</InputLabel>
                      <Select
                        {...field}
                        label="Source *"
                      >
                        <MenuItem value="website">Website</MenuItem>
                        <MenuItem value="referral">Referral</MenuItem>
                        <MenuItem value="social_media">Social Media</MenuItem>
                        <MenuItem value="walk_in">Walk-in</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Status *</InputLabel>
                      <Select
                        {...field}
                        label="Status *"
                      >
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="contacted">Contacted</MenuItem>
                        <MenuItem value="qualified">Qualified</MenuItem>
                        <MenuItem value="hot">Hot</MenuItem>
                        <MenuItem value="warm">Warm</MenuItem>
                        <MenuItem value="cold">Cold</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="score"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lead Score (0-100) *"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      error={!!errors.score}
                      helperText={errors.score?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="occasion"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Occasion</InputLabel>
                      <Select
                        {...field}
                        label="Occasion"
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="wedding">Wedding</MenuItem>
                        <MenuItem value="business">Business</MenuItem>
                        <MenuItem value="prom">Prom</MenuItem>
                        <MenuItem value="general">General</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="budgetRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Budget Range"
                      placeholder="e.g., $1000-2000"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      placeholder="Additional notes about this lead..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              disabled={createLeadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || createLeadMutation.isPending}
              startIcon={createLeadMutation.isPending ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LeadsPage; 