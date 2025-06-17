import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Paper,
  Typography,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Autocomplete,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { customerAPI, orderAPI, leadAPI, appointmentAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
// Simple debounce implementation
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

interface SearchResult {
  id: string | number;
  type: 'customer' | 'order' | 'lead' | 'appointment';
  title: string;
  subtitle: string;
  url: string;
  avatar?: string;
}

interface SearchFilters {
  type: string[];
  dateRange: [number, number];
  status: string[];
  amount: [number, number];
  includeArchived: boolean;
}

const AdvancedSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [resultsAnchorEl, setResultsAnchorEl] = useState<HTMLElement | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    dateRange: [0, 365], // days
    status: [],
    amount: [0, 10000],
    includeArchived: false,
  });

  const navigate = useNavigate();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.length >= 2) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Search queries
  const { data: customersData } = useQuery({
    queryKey: ['search-customers', searchTerm],
    queryFn: () => customerAPI.getCustomers({ search: searchTerm, limit: 5 }),
    enabled: searchTerm.length >= 2,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['search-orders', searchTerm],
    queryFn: () => orderAPI.getOrders({ search: searchTerm, limit: 5 }),
    enabled: searchTerm.length >= 2,
  });

  const { data: leadsData } = useQuery({
    queryKey: ['search-leads', searchTerm],
    queryFn: () => leadAPI.getLeads({ search: searchTerm, limit: 5 }),
    enabled: searchTerm.length >= 2,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['search-appointments', searchTerm],
    queryFn: () => appointmentAPI.getAppointments({ search: searchTerm, limit: 5 }),
    enabled: searchTerm.length >= 2,
  });

  // Combine and format search results
  const searchResults: SearchResult[] = React.useMemo(() => {
    const results: SearchResult[] = [];

    // Add customers
    if (customersData?.data?.customers && (filters.type.length === 0 || filters.type.includes('customer'))) {
      customersData.data.customers.forEach(customer => {
        results.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.email,
          url: `/customers/${customer.id}`,
        });
      });
    }

    // Add orders
    if (ordersData?.data?.orders && (filters.type.length === 0 || filters.type.includes('order'))) {
      ordersData.data.orders.forEach(order => {
        results.push({
          id: order.id,
          type: 'order',
          title: `Order ${order.id}`,
          subtitle: `${order.customer?.name} - $${Number(order.total).toFixed(2)}`,
          url: `/orders/${order.id}`,
        });
      });
    }

    // Add leads
    if (leadsData?.data?.leads && (filters.type.length === 0 || filters.type.includes('lead'))) {
      leadsData.data.leads.forEach(lead => {
        results.push({
          id: lead.id,
          type: 'lead',
          title: `Lead: ${lead.customer?.name}`,
          subtitle: `${lead.status} - Score: ${lead.score}`,
          url: `/leads/${lead.id}`,
        });
      });
    }

    // Add appointments
    if (appointmentsData?.data?.appointments && (filters.type.length === 0 || filters.type.includes('appointment'))) {
      appointmentsData.data.appointments.forEach(appointment => {
        results.push({
          id: appointment.id,
          type: 'appointment',
          title: `${appointment.service} - ${appointment.customer?.name}`,
          subtitle: `${appointment.date} at ${appointment.time}`,
          url: `/appointments`,
        });
      });
    }

    return results;
  }, [customersData, ordersData, leadsData, appointmentsData, filters.type]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      setResultsAnchorEl(event.currentTarget);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setShowResults(false);
    setSearchTerm('');
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <PersonIcon />;
      case 'order':
        return <ShoppingCartIcon />;
      case 'lead':
        return <TrendingUpIcon />;
      case 'appointment':
        return <ScheduleIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'primary.main';
      case 'order':
        return 'success.main';
      case 'lead':
        return 'warning.main';
      case 'appointment':
        return 'info.main';
      default:
        return 'grey.500';
    }
  };

  const activeFiltersCount = filters.type.length + filters.status.length + (filters.includeArchived ? 1 : 0);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        fullWidth
        placeholder="Search customers, orders, leads, appointments..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box display="flex" alignItems="center">
                {searchTerm && (
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleFilterClick}>
                  <FilterIcon />
                  {activeFiltersCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: 'error.main',
                        color: 'white',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {activeFiltersCount}
                    </Box>
                  )}
                </IconButton>
                <IconButton size="small" onClick={handleSortClick}>
                  <SortIcon />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      {/* Search Results Popover */}
      <Popover
        open={showResults && searchResults.length > 0}
        anchorEl={resultsAnchorEl}
        onClose={() => setShowResults(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: resultsAnchorEl?.clientWidth || 400, maxHeight: 400 },
        }}
      >
        <Box p={1}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            Search Results ({searchResults.length})
          </Typography>
          <List dense>
            {searchResults.map((result) => (
              <ListItem
                key={`${result.type}-${result.id}`}
                button
                onClick={() => handleResultClick(result)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getResultColor(result.type), width: 32, height: 32 }}>
                    {getResultIcon(result.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {result.title}
                      </Typography>
                      <Chip
                        label={result.type}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  }
                  secondary={result.subtitle}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      {/* Filters Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 3, width: 350 }}>
          <Typography variant="h6" gutterBottom>
            Search Filters
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['customer', 'order', 'lead', 'appointment']}
                value={filters.type}
                onChange={(_, value) => handleFilterChange('type', value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Content Type"
                    placeholder="Select types..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Date Range (days ago)
              </Typography>
              <Slider
                value={filters.dateRange}
                onChange={(_, value) => handleFilterChange('dateRange', value)}
                valueLabelDisplay="auto"
                min={0}
                max={365}
                marks={[
                  { value: 0, label: 'Today' },
                  { value: 30, label: '30d' },
                  { value: 90, label: '90d' },
                  { value: 365, label: '1y' },
                ]}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['new', 'in_progress', 'completed', 'cancelled', 'hot', 'warm', 'cold', 'converted']}
                value={filters.status}
                onChange={(_, value) => handleFilterChange('status', value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Status"
                    placeholder="Select statuses..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Amount Range ($)
              </Typography>
              <Slider
                value={filters.amount}
                onChange={(_, value) => handleFilterChange('amount', value)}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 2500, label: '$2.5K' },
                  { value: 5000, label: '$5K' },
                  { value: 10000, label: '$10K' },
                ]}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.includeArchived}
                    onChange={(e) => handleFilterChange('includeArchived', e.target.checked)}
                  />
                }
                label="Include archived items"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFilters({
                type: [],
                dateRange: [0, 365],
                status: [],
                amount: [0, 10000],
                includeArchived: false,
              })}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setFilterAnchorEl(null)}
            >
              Apply Filters
            </Button>
          </Box>
        </Paper>
      </Popover>

      {/* Sort Popover */}
      <Popover
        open={Boolean(sortAnchorEl)}
        anchorEl={sortAnchorEl}
        onClose={() => setSortAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 2, width: 200 }}>
          <Typography variant="h6" gutterBottom>
            Sort Results
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="relevance">Relevance</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="amount">Amount</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              label="Order"
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Popover>
    </Box>
  );
};

export default AdvancedSearch; 