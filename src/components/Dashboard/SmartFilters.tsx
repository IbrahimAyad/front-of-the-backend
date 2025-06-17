import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Autocomplete,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TuneOutlined as TuneIcon,
  SearchOutlined as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  isDefault: boolean;
  isFavorite: boolean;
}

interface FilterState {
  search: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: string[];
  category: string[];
  priceRange: [number, number];
  customFields: Record<string, any>;
}

const SmartFilters: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: { start: null, end: null },
    status: [],
    category: [],
    priceRange: [0, 10000],
    customFields: {},
  });

  const [presets, setPresets] = useState<FilterPreset[]>([
    {
      id: '1',
      name: 'High Value Orders',
      filters: {
        search: '',
        dateRange: { start: null, end: null },
        status: ['completed'],
        category: ['suits', 'tuxedos'],
        priceRange: [2000, 10000],
        customFields: {},
      },
      isDefault: false,
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Recent Activity',
      filters: {
        search: '',
        dateRange: { 
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          end: new Date() 
        },
        status: [],
        category: [],
        priceRange: [0, 10000],
        customFields: {},
      },
      isDefault: true,
      isFavorite: false,
    },
  ]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // AI-powered suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const statusOptions = ['new', 'in_progress', 'completed', 'cancelled'];
  const categoryOptions = ['suits', 'tuxedos', 'shirts', 'accessories'];

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.status.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    // Simulate AI suggestions based on search input
    if (filters.search.length > 2) {
      const mockSuggestions = [
        'High-value customers',
        'Recent orders',
        'Pending measurements',
        'Overdue appointments',
        'VIP clients',
      ].filter(s => s.toLowerCase().includes(filters.search.toLowerCase()));
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [filters.search]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setAnchorEl(null);
  };

  const saveCurrentAsPreset = () => {
    if (newPresetName.trim()) {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name: newPresetName,
        filters: { ...filters },
        isDefault: false,
        isFavorite: false,
      };
      setPresets(prev => [...prev, newPreset]);
      setNewPresetName('');
      setSaveDialogOpen(false);
    }
  };

  const togglePresetFavorite = (presetId: string) => {
    setPresets(prev => prev.map(preset => 
      preset.id === presetId 
        ? { ...preset, isFavorite: !preset.isFavorite }
        : preset
    ));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      dateRange: { start: null, end: null },
      status: [],
      category: [],
      priceRange: [0, 10000],
      customFields: {},
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Smart Filters
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={activeFiltersCount} color="primary">
              <IconButton onClick={handleMenuClick}>
                <FilterIcon />
              </IconButton>
            </Badge>
            <IconButton onClick={() => setSaveDialogOpen(true)} disabled={activeFiltersCount === 0}>
              <SaveIcon />
            </IconButton>
            <IconButton onClick={clearAllFilters} disabled={activeFiltersCount === 0}>
              <ClearIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Search with AI Suggestions */}
        <Box mb={3}>
          <Autocomplete
            freeSolo
            options={suggestions}
            value={filters.search}
            onInputChange={(event, newValue) => {
              handleFilterChange('search', newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search with AI suggestions"
                placeholder="Try 'high value customers' or 'recent orders'"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <TuneIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                {option}
              </Box>
            )}
          />
        </Box>

        {/* Quick Filter Chips */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {presets.filter(p => p.isFavorite).map(preset => (
            <Chip
              key={preset.id}
              label={preset.name}
              onClick={() => applyPreset(preset)}
              icon={<StarIcon />}
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>

        {/* Advanced Filters */}
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Date Range
            </Typography>
            <Box display="flex" gap={1}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.start}
                onChange={(date) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: date,
                })}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.end}
                onChange={(date) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: date,
                })}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </Box>

          {/* Status Filter */}
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {statusOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category Filter */}
          <FormControl size="small">
            <InputLabel>Category</InputLabel>
            <Select
              multiple
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {categoryOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Price Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </Typography>
            <Slider
              value={filters.priceRange}
              onChange={(event, newValue) => handleFilterChange('priceRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={10000}
              step={100}
              valueLabelFormat={(value) => `$${value}`}
            />
          </Box>
        </Box>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Active Filters ({activeFiltersCount})
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {filters.search && (
                <Chip
                  label={`Search: "${filters.search}"`}
                  onDelete={() => handleFilterChange('search', '')}
                  size="small"
                />
              )}
              {filters.status.map(status => (
                <Chip
                  key={status}
                  label={`Status: ${status}`}
                  onDelete={() => handleFilterChange('status', 
                    filters.status.filter(s => s !== status)
                  )}
                  size="small"
                />
              ))}
              {filters.category.map(category => (
                <Chip
                  key={category}
                  label={`Category: ${category}`}
                  onDelete={() => handleFilterChange('category', 
                    filters.category.filter(c => c !== category)
                  )}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Presets Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filter Presets</Typography>
          </MenuItem>
          <Divider />
          {presets.map(preset => (
            <MenuItem key={preset.id} onClick={() => applyPreset(preset)}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Typography>{preset.name}</Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePresetFavorite(preset.id);
                  }}
                >
                  {preset.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Save Preset Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Preset Name"
              fullWidth
              variant="outlined"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCurrentAsPreset} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SmartFilters; 