import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  AvatarGroup,
  Badge,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Fab,
  Collapse,
  Alert,
  AlertTitle,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ShoppingCart as CartIcon,
  Visibility as PreviewIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  Launch as LaunchIcon,
  DragIndicator as DragIcon,
  Category as CategoryIcon,
  Checkroom as SuitIcon,
  BusinessCenter as BusinessIcon,
  Celebration as WeddingIcon,
  WbSunny as CasualIcon,
  Stars as FormalIcon,
  AcUnit as SeasonalIcon,
  LocalOffer as PriceIcon,
  Inventory2 as InventoryIcon,
  Groups as GroupIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AIIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface OutfitComponent {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  componentType: 'JACKET' | 'PANTS' | 'SHIRT' | 'TIE' | 'VEST' | 'ACCESSORY';
  quantity: number;
  isRequired: boolean;
  alternatives: string[];
  price: number;
}

interface OutfitTemplate {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: 'BUSINESS' | 'WEDDING' | 'CASUAL' | 'FORMAL' | 'SEASONAL';
  components: OutfitComponent[];
  bundlePrice: number;
  originalPrice: number;
  discount: number;
  images: string[];
  isActive: boolean;
  tags: string[];
  minStock: number;
  popularityScore: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

const OutfitBuilderSection: React.FC = () => {
  const [outfitTemplates, setOutfitTemplates] = useState<OutfitTemplate[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Component type configuration
  const componentTypes = [
    { type: 'JACKET', label: 'Jacket', icon: <SuitIcon />, color: '#1976d2' },
    { type: 'PANTS', label: 'Pants', icon: <BusinessIcon />, color: '#388e3c' },
    { type: 'SHIRT', label: 'Shirt', icon: <CheckroomOutlined />, color: '#7b1fa2' },
    { type: 'TIE', label: 'Tie', icon: <BusinessIcon />, color: '#d32f2f' },
    { type: 'VEST', label: 'Vest', icon: <SuitIcon />, color: '#f57c00' },
    { type: 'ACCESSORY', label: 'Accessory', icon: <CategoryIcon />, color: '#0288d1' },
  ];

  // Category configuration
  const categoryConfig = {
    BUSINESS: { icon: <BusinessIcon />, color: 'primary' },
    WEDDING: { icon: <WeddingIcon />, color: 'secondary' },
    CASUAL: { icon: <CasualIcon />, color: 'info' },
    FORMAL: { icon: <FormalIcon />, color: 'warning' },
    SEASONAL: { icon: <SeasonalIcon />, color: 'success' },
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !selectedOutfit) return;

    const items = Array.from(selectedOutfit.components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedOutfit({
      ...selectedOutfit,
      components: items,
    });
  };

  const addComponentToOutfit = (product: Product, componentType: string) => {
    if (!selectedOutfit) return;

    const newComponent: OutfitComponent = {
      id: `component-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      componentType: componentType as any,
      quantity: 1,
      isRequired: true,
      alternatives: [],
      price: product.price,
    };

    setSelectedOutfit({
      ...selectedOutfit,
      components: [...selectedOutfit.components, newComponent],
      originalPrice: selectedOutfit.originalPrice + product.price,
    });
  };

  const removeComponentFromOutfit = (componentId: string) => {
    if (!selectedOutfit) return;

    const component = selectedOutfit.components.find(c => c.id === componentId);
    if (!component) return;

    setSelectedOutfit({
      ...selectedOutfit,
      components: selectedOutfit.components.filter(c => c.id !== componentId),
      originalPrice: selectedOutfit.originalPrice - component.price,
    });
  };

  const calculateBundleDiscount = () => {
    if (!selectedOutfit) return 0;
    return ((selectedOutfit.originalPrice - selectedOutfit.bundlePrice) / selectedOutfit.originalPrice * 100).toFixed(0);
  };

  const getComponentTypeStats = () => {
    if (!selectedOutfit) return [];
    
    const stats = componentTypes.map(type => {
      const count = selectedOutfit.components.filter(c => c.componentType === type.type).length;
      return { ...type, count };
    });
    
    return stats.filter(s => s.count > 0);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SuitIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Outfit Builder
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage custom outfit bundles
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={() => setShowAISuggestions(!showAISuggestions)}
            >
              AI Suggestions
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedOutfit({
                  id: `outfit-${Date.now()}`,
                  sku: `OUTFIT-${Date.now()}`,
                  name: 'New Outfit Bundle',
                  description: '',
                  category: 'BUSINESS',
                  components: [],
                  bundlePrice: 0,
                  originalPrice: 0,
                  discount: 0,
                  images: [],
                  isActive: true,
                  tags: [],
                  minStock: 1,
                  popularityScore: 0,
                });
                setIsEditing(true);
                setTabValue(1);
              }}
            >
              Create New Outfit
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Templates List */}
        <Paper sx={{ width: 360, borderRadius: 0, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search outfits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <ToggleButtonGroup
              value={categoryFilter}
              exclusive
              onChange={(e, value) => setCategoryFilter(value || 'ALL')}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="ALL">
                All
              </ToggleButton>
              <ToggleButton value="BUSINESS">
                <BusinessIcon sx={{ mr: 0.5 }} />
                Business
              </ToggleButton>
              <ToggleButton value="WEDDING">
                <WeddingIcon sx={{ mr: 0.5 }} />
                Wedding
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          <List>
            {[1, 2, 3, 4, 5].map((index) => (
              <ListItem
                key={index}
                button
                selected={selectedOutfit?.id === `outfit-${index}`}
                onClick={() => {
                  // Mock outfit selection
                  setSelectedOutfit({
                    id: `outfit-${index}`,
                    sku: `OUTFIT-00${index}`,
                    name: `Premium ${index === 1 ? 'Business' : index === 2 ? 'Wedding' : 'Formal'} Outfit ${index}`,
                    description: 'A sophisticated ensemble perfect for any occasion',
                    category: index === 1 ? 'BUSINESS' : index === 2 ? 'WEDDING' : 'FORMAL',
                    components: [
                      {
                        id: 'comp-1',
                        productId: 'prod-1',
                        productName: 'Classic Navy Blazer',
                        productImage: '/api/placeholder/150/150',
                        componentType: 'JACKET',
                        quantity: 1,
                        isRequired: true,
                        alternatives: [],
                        price: 299,
                      },
                      {
                        id: 'comp-2',
                        productId: 'prod-2',
                        productName: 'Wool Dress Pants',
                        productImage: '/api/placeholder/150/150',
                        componentType: 'PANTS',
                        quantity: 1,
                        isRequired: true,
                        alternatives: [],
                        price: 149,
                      },
                    ],
                    bundlePrice: 399,
                    originalPrice: 448,
                    discount: 11,
                    images: ['/api/placeholder/400/400'],
                    isActive: true,
                    tags: ['premium', 'bestseller'],
                    minStock: 5,
                    popularityScore: 85 + index * 5,
                  });
                  setTabValue(0);
                }}
                sx={{ py: 2 }}
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: index === 1 ? 'primary.main' : index === 2 ? 'secondary.main' : 'warning.main' }}>
                    {index === 1 ? <BusinessIcon /> : index === 2 ? <WeddingIcon /> : <FormalIcon />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={`Premium ${index === 1 ? 'Business' : index === 2 ? 'Wedding' : 'Formal'} Outfit ${index}`}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip label="2 items" size="small" />
                      <Chip label="$399" size="small" color="primary" />
                      <Chip label="-11%" size="small" color="success" />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <MoreVertIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedOutfit ? (
            <>
              <Paper sx={{ borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
                  <Tab label="Builder" icon={<SuitIcon />} iconPosition="start" />
                  <Tab label="Pricing" icon={<PriceIcon />} iconPosition="start" />
                  <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
                </Tabs>
              </Paper>

              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {/* Overview Tab */}
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                            <Box>
                              <Typography variant="h4" gutterBottom>
                                {selectedOutfit.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                  icon={categoryConfig[selectedOutfit.category].icon}
                                  label={selectedOutfit.category}
                                  color={categoryConfig[selectedOutfit.category].color as any}
                                />
                                <Chip label={selectedOutfit.sku} variant="outlined" />
                                {selectedOutfit.isActive ? (
                                  <Chip label="Active" color="success" />
                                ) : (
                                  <Chip label="Inactive" color="default" />
                                )}
                              </Box>
                              <Typography variant="body1" color="text.secondary" paragraph>
                                {selectedOutfit.description}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton onClick={() => setIsEditing(true)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton>
                                <DuplicateIcon />
                              </IconButton>
                              <IconButton>
                                <ArchiveIcon />
                              </IconButton>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 3 }} />

                          <Typography variant="h6" gutterBottom>
                            Outfit Components ({selectedOutfit.components.length})
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {selectedOutfit.components.map((component) => {
                              const typeConfig = componentTypes.find(t => t.type === component.componentType);
                              return (
                                <Grid item xs={12} sm={6} md={4} key={component.id}>
                                  <Card variant="outlined">
                                    <CardMedia
                                      component="img"
                                      height="200"
                                      image={component.productImage}
                                      alt={component.productName}
                                    />
                                    <CardContent>
                                      <Chip
                                        icon={typeConfig?.icon}
                                        label={typeConfig?.label}
                                        size="small"
                                        sx={{ mb: 1, bgcolor: typeConfig?.color, color: 'white' }}
                                      />
                                      <Typography variant="subtitle1" gutterBottom>
                                        {component.productName}
                                      </Typography>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                          ${component.price}
                                        </Typography>
                                        {component.isRequired && (
                                          <Chip label="Required" size="small" color="error" />
                                        )}
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Pricing Summary
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography color="text.secondary">Original Price</Typography>
                              <Typography sx={{ textDecoration: 'line-through' }}>
                                ${selectedOutfit.originalPrice}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography color="text.secondary">Bundle Discount</Typography>
                              <Typography color="success.main">-{calculateBundleDiscount()}%</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="h6">Bundle Price</Typography>
                              <Typography variant="h6" color="primary">
                                ${selectedOutfit.bundlePrice}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      <Card sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Component Distribution
                          </Typography>
                          <List dense>
                            {getComponentTypeStats().map((stat) => (
                              <ListItem key={stat.type}>
                                <ListItemIcon>
                                  <Avatar sx={{ bgcolor: stat.color, width: 32, height: 32 }}>
                                    {stat.icon}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                  primary={stat.label}
                                  secondary={`${stat.count} item${stat.count > 1 ? 's' : ''}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Performance
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ flex: 1 }}>Popularity Score</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={selectedOutfit.popularityScore}
                                  size={40}
                                  thickness={4}
                                  color="primary"
                                />
                                <Typography variant="h6">{selectedOutfit.popularityScore}%</Typography>
                              </Box>
                            </Box>
                            <Chip
                              icon={<GroupIcon />}
                              label="243 sold this month"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              icon={<TrendingUpIcon />}
                              label="12% conversion rate"
                              size="small"
                              color="success"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Builder Tab */}
                {tabValue === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Outfit Components
                          </Typography>
                          
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="outfit-components">
                              {(provided) => (
                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                  {selectedOutfit.components.map((component, index) => {
                                    const typeConfig = componentTypes.find(t => t.type === component.componentType);
                                    return (
                                      <Draggable key={component.id} draggableId={component.id} index={index}>
                                        {(provided, snapshot) => (
                                          <ListItem
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            sx={{
                                              mb: 1,
                                              bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                              borderRadius: 1,
                                              border: 1,
                                              borderColor: 'divider',
                                            }}
                                          >
                                            <ListItemIcon {...provided.dragHandleProps}>
                                              <DragIcon />
                                            </ListItemIcon>
                                            <Avatar
                                              src={component.productImage}
                                              variant="rounded"
                                              sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                            <ListItemText
                                              primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Typography variant="subtitle1">
                                                    {component.productName}
                                                  </Typography>
                                                  <Chip
                                                    icon={typeConfig?.icon}
                                                    label={typeConfig?.label}
                                                    size="small"
                                                    sx={{ bgcolor: typeConfig?.color, color: 'white' }}
                                                  />
                                                </Box>
                                              }
                                              secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                                  <Typography variant="body2">
                                                    ${component.price}
                                                  </Typography>
                                                  <FormControlLabel
                                                    control={
                                                      <Switch
                                                        size="small"
                                                        checked={component.isRequired}
                                                        onChange={(e) => {
                                                          // Update component required status
                                                        }}
                                                      />
                                                    }
                                                    label="Required"
                                                  />
                                                </Box>
                                              }
                                            />
                                            <ListItemSecondaryAction>
                                              <IconButton
                                                edge="end"
                                                onClick={() => removeComponentFromOutfit(component.id)}
                                              >
                                                <DeleteIcon />
                                              </IconButton>
                                            </ListItemSecondaryAction>
                                          </ListItem>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </List>
                              )}
                            </Droppable>
                          </DragDropContext>

                          <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => setProductDrawerOpen(true)}
                              fullWidth
                            >
                              Add Products to Outfit
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card sx={{ position: 'sticky', top: 0 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Outfit Settings
                          </Typography>
                          
                          <TextField
                            fullWidth
                            label="Outfit Name"
                            value={selectedOutfit.name}
                            onChange={(e) => setSelectedOutfit({ ...selectedOutfit, name: e.target.value })}
                            sx={{ mb: 2 }}
                          />
                          
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={selectedOutfit.description}
                            onChange={(e) => setSelectedOutfit({ ...selectedOutfit, description: e.target.value })}
                            sx={{ mb: 2 }}
                          />
                          
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={selectedOutfit.category}
                              onChange={(e) => setSelectedOutfit({ ...selectedOutfit, category: e.target.value as any })}
                            >
                              {Object.entries(categoryConfig).map(([key, config]) => (
                                <MenuItem key={key} value={key}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {config.icon}
                                    {key}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <TextField
                            fullWidth
                            type="number"
                            label="Bundle Price"
                            value={selectedOutfit.bundlePrice}
                            onChange={(e) => setSelectedOutfit({ ...selectedOutfit, bundlePrice: Number(e.target.value) })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{ mb: 2 }}
                          />
                          
                          <TextField
                            fullWidth
                            type="number"
                            label="Minimum Stock"
                            value={selectedOutfit.minStock}
                            onChange={(e) => setSelectedOutfit({ ...selectedOutfit, minStock: Number(e.target.value) })}
                            sx={{ mb: 3 }}
                          />
                          
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<SaveIcon />}
                            onClick={() => {
                              // Save outfit
                              setIsEditing(false);
                            }}
                          >
                            Save Outfit
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <SuitIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select an outfit to view details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from existing outfits or create a new one
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Product Drawer */}
      <Drawer
        anchor="right"
        open={productDrawerOpen}
        onClose={() => setProductDrawerOpen(false)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Add Products</Typography>
            <IconButton onClick={() => setProductDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Search products..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select component type:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {componentTypes.map((type) => (
              <Chip
                key={type.type}
                icon={type.icon}
                label={type.label}
                onClick={() => {}}
                sx={{ m: 0.5, bgcolor: type.color, color: 'white' }}
              />
            ))}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {[1, 2, 3, 4, 5].map((index) => (
              <ListItem
                key={index}
                button
                onClick={() => {
                  addComponentToOutfit(
                    {
                      id: `prod-${index}`,
                      name: `Premium Product ${index}`,
                      sku: `SKU-00${index}`,
                      price: 100 + index * 50,
                      image: '/api/placeholder/150/150',
                      category: 'Suits',
                      stock: 50,
                    },
                    'JACKET'
                  );
                }}
              >
                <Avatar
                  src="/api/placeholder/60/60"
                  variant="rounded"
                  sx={{ mr: 2 }}
                />
                <ListItemText
                  primary={`Premium Product ${index}`}
                  secondary={
                    <Box>
                      <Typography variant="body2">SKU-00{index}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="primary">
                          ${100 + index * 50}
                        </Typography>
                        <Chip
                          label={`${50 - index * 5} in stock`}
                          size="small"
                          color={50 - index * 5 > 20 ? 'success' : 'warning'}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* AI Suggestions Collapse */}
      <Collapse in={showAISuggestions}>
        <Paper sx={{ position: 'fixed', bottom: 20, right: 20, p: 2, maxWidth: 400, zIndex: 1000 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              <Typography variant="h6">AI Suggestions</Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowAISuggestions(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Trending Combination</AlertTitle>
            Navy blazer + white shirt + khaki pants is trending up 23% this month
          </Alert>
          <Alert severity="success">
            <AlertTitle>Cross-sell Opportunity</AlertTitle>
            Customers who buy this outfit also purchase pocket squares (67% attach rate)
          </Alert>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default OutfitBuilderSection;