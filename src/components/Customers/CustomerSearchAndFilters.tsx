import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Drawer,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Chip,
  IconButton,
  Grid,
  Divider,
  Badge,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Close,
  PersonSearch,
  TuneOutlined,
  CheckCircle,
} from '@mui/icons-material';

interface CustomerSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  customers: any[];
}

interface CustomerFilters {
  tiers: string[];
  vipStatus: boolean | null;
  engagementRange: [number, number];
  totalSpentRange: [number, number];
  orderCountRange: [number, number];
  dateRange: {
    from: string | null;
    to: string | null;
  };
  hasProfile: boolean | null;
}

const CustomerSearchAndFilters: React.FC<CustomerSearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  customers,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  // Generate search suggestions
  useEffect(() => {
    if (searchTerm.length > 1) {
      const suggestions = customers
        .filter(customer => 
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
        )
        .slice(0, 5)
        .map(customer => customer.name || customer.email)
        .filter(Boolean);
      
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchTerm, customers]);

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.tiers.length > 0) count++;
    if (filters.vipStatus !== null) count++;
    if (filters.engagementRange[0] > 0 || filters.engagementRange[1] < 100) count++;
    if (filters.totalSpentRange[0] > 0 || filters.totalSpentRange[1] < 10000) count++;
    if (filters.orderCountRange[0] > 0 || filters.orderCountRange[1] < 100) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.hasProfile !== null) count++;
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tiers: [],
      vipStatus: null,
      engagementRange: [0, 100],
      totalSpentRange: [0, 10000],
      orderCountRange: [0, 100],
      dateRange: { from: null, to: null },
      hasProfile: null,
    });
  };

  const handleTierToggle = (tier: string) => {
    const newTiers = filters.tiers.includes(tier)
      ? filters.tiers.filter(t => t !== tier)
      : [...filters.tiers, tier];
    
    onFiltersChange({ ...filters, tiers: newTiers });
  };

  return (
    <Box>
      {/* Enhanced Search Bar */}
      <Grid container spacing={2} alignItems="center" mb={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            freeSolo
            options={searchSuggestions}
            inputValue={debouncedSearch}
            onInputChange={(event, newValue) => {
              setDebouncedSearch(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                placeholder="Search customers by name, email, phone, or ID..."
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonSearch color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {searchTerm && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDebouncedSearch('');
                            onSearchChange('');
                          }}
                        >
                          <Clear />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <PersonSearch sx={{ mr: 1, fontSize: 16 }} />
                {option}
              </Box>
            )}
          />
        </Grid>

        <Grid item xs={6} md={3}>
          <Badge badgeContent={activeFiltersCount()} color="primary">
            <Button
              variant="outlined"
              startIcon={<TuneOutlined />}
              onClick={() => setFiltersOpen(true)}
              fullWidth
              sx={{ height: '56px' }}
            >
              Advanced Filters
            </Button>
          </Badge>
        </Grid>

        <Grid item xs={6} md={3}>
          {activeFiltersCount() > 0 && (
            <Button
              variant="text"
              startIcon={<Clear />}
              onClick={clearAllFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      {activeFiltersCount() > 0 && (
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Active Filters:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {filters.tiers.map(tier => (
              <Chip
                key={tier}
                label={`${tier} Tier`}
                onDelete={() => handleTierToggle(tier)}
                color="primary"
                size="small"
              />
            ))}
            {filters.vipStatus !== null && (
              <Chip
                label={filters.vipStatus ? 'VIP Only' : 'Non-VIP Only'}
                onDelete={() => onFiltersChange({ ...filters, vipStatus: null })}
                color="secondary"
                size="small"
              />
            )}
            {(filters.engagementRange[0] > 0 || filters.engagementRange[1] < 100) && (
              <Chip
                label={`Engagement: ${filters.engagementRange[0]}%-${filters.engagementRange[1]}%`}
                onDelete={() => onFiltersChange({ ...filters, engagementRange: [0, 100] })}
                color="info"
                size="small"
              />
            )}
            {(filters.totalSpentRange[0] > 0 || filters.totalSpentRange[1] < 10000) && (
              <Chip
                label={`Spent: $${filters.totalSpentRange[0]}-$${filters.totalSpentRange[1]}`}
                onDelete={() => onFiltersChange({ ...filters, totalSpentRange: [0, 10000] })}
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Advanced Filters Drawer */}
      <Drawer
        anchor="right"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{
          sx: { width: 400, p: 3 }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Advanced Filters</Typography>
          <IconButton onClick={() => setFiltersOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          {/* Customer Tiers */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Customer Tiers
            </Typography>
            <FormGroup>
              {['Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => (
                <FormControlLabel
                  key={tier}
                  control={
                    <Checkbox
                      checked={filters.tiers.includes(tier)}
                      onChange={() => handleTierToggle(tier)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: tier === 'Platinum' ? '#E5E4E2' : 
                                  tier === 'Gold' ? '#FFD700' :
                                  tier === 'Silver' ? '#C0C0C0' : '#CD7F32',
                        }}
                      />
                      {tier}
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* VIP Status */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              VIP Status
            </Typography>
            <FormControl fullWidth>
              <Select
                value={filters.vipStatus ?? ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  vipStatus: e.target.value === '' ? null : e.target.value === 'true'
                })}
              >
                <MenuItem value="">All Customers</MenuItem>
                <MenuItem value="true">VIP Only</MenuItem>
                <MenuItem value="false">Non-VIP Only</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider />

          {/* Engagement Score Range */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Engagement Score: {filters.engagementRange[0]}% - {filters.engagementRange[1]}%
            </Typography>
            <Slider
              value={filters.engagementRange}
              onChange={(_, newValue) => 
                onFiltersChange({ ...filters, engagementRange: newValue as [number, number] })
              }
              valueLabelDisplay="auto"
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
            />
          </Box>

          <Divider />

          {/* Total Spent Range */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Total Spent: ${filters.totalSpentRange[0]} - ${filters.totalSpentRange[1]}
            </Typography>
            <Slider
              value={filters.totalSpentRange}
              onChange={(_, newValue) => 
                onFiltersChange({ ...filters, totalSpentRange: newValue as [number, number] })
              }
              valueLabelDisplay="auto"
              min={0}
              max={10000}
              step={100}
              marks={[
                { value: 0, label: '$0' },
                { value: 2500, label: '$2.5K' },
                { value: 5000, label: '$5K' },
                { value: 7500, label: '$7.5K' },
                { value: 10000, label: '$10K+' },
              ]}
            />
          </Box>

          <Divider />

          {/* Order Count Range */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Order Count: {filters.orderCountRange[0]} - {filters.orderCountRange[1]}
            </Typography>
            <Slider
              value={filters.orderCountRange}
              onChange={(_, newValue) => 
                onFiltersChange({ ...filters, orderCountRange: newValue as [number, number] })
              }
              valueLabelDisplay="auto"
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 75, label: '75' },
                { value: 100, label: '100+' },
              ]}
            />
          </Box>

          <Divider />

          {/* Profile Completeness */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Profile Status
            </Typography>
            <FormControl fullWidth>
              <Select
                value={filters.hasProfile ?? ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  hasProfile: e.target.value === '' ? null : e.target.value === 'true'
                })}
              >
                <MenuItem value="">All Customers</MenuItem>
                <MenuItem value="true">With Complete Profile</MenuItem>
                <MenuItem value="false">Incomplete Profile</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        <Box mt={4} display="flex" gap={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={clearAllFilters}
            startIcon={<Clear />}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setFiltersOpen(false)}
            startIcon={<CheckCircle />}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CustomerSearchAndFilters; 