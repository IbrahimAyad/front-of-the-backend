import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Badge,
  Divider,
  Rating,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CheckCircle as PassedIcon,
  Cancel as FailedIcon,
  Warning as ReworkIcon,
  Schedule as PendingIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as InspectionIcon,
  Build as AlterationIcon,
  TrendingUp as MetricsIcon,
  PhotoCamera as CameraIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface QualityInspection {
  id: string;
  orderId: string;
  orderNumber: string;
  itemId: string;
  itemDescription: string;
  customerName: string;
  checkpoint: string;
  status: 'pending' | 'passed' | 'failed' | 'rework_needed';
  inspector: string;
  inspectorId: string;
  inspectionDate: Date;
  scheduledDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  defects: QualityDefect[];
  notes?: string;
  images?: string[];
  rating?: number;
  timeSpent?: number; // in minutes
}

interface QualityDefect {
  id: string;
  type: 'measurement' | 'stitching' | 'fabric' | 'finishing' | 'fit' | 'other';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  location: string;
  actionRequired: 'rework' | 'replace' | 'adjust' | 'acceptable';
  estimatedFixTime?: number; // in hours
  assignedTo?: string;
  fixedDate?: Date;
  notes?: string;
}

interface Alteration {
  id: string;
  orderId: string;
  orderNumber: string;
  itemId: string;
  itemDescription: string;
  customerName: string;
  type: 'adjustment' | 'repair' | 'modification' | 'rework';
  reason: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTailor: string;
  requestedBy: string;
  requestDate: Date;
  scheduledDate?: Date;
  completionDate?: Date;
  estimatedTime: number; // in hours
  actualTime?: number;
  cost?: number;
  notes?: string;
  beforeImages?: string[];
  afterImages?: string[];
}

interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  failRate: number;
  reworkRate: number;
  averageInspectionTime: number;
  defectsByType: Record<string, number>;
  defectsBySeverity: Record<string, number>;
  inspectorPerformance: Record<string, { inspections: number; passRate: number }>;
  alterationsThisMonth: number;
  averageAlterationTime: number;
}

const QualityControl: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [selectedAlteration, setSelectedAlteration] = useState<Alteration | null>(null);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [alterationDialogOpen, setAlterationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data initialization
  useEffect(() => {
    const mockInspections: QualityInspection[] = [
      {
        id: 'QI001',
        orderId: 'PO001',
        orderNumber: 'ORD-2024-001',
        itemId: 'ITEM001',
        itemDescription: 'Navy Blue Business Suit',
        customerName: 'John Smith',
        checkpoint: 'Initial Fitting',
        status: 'passed',
        inspector: 'Master Giovanni',
        inspectorId: 'T001',
        inspectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'high',
        defects: [],
        notes: 'Perfect fit, excellent craftsmanship',
        rating: 5,
        timeSpent: 15,
      },
      {
        id: 'QI002',
        orderId: 'PO002',
        orderNumber: 'ORD-2024-002',
        itemId: 'ITEM002',
        itemDescription: 'White Cotton Dress Shirt',
        customerName: 'Michael Johnson',
        checkpoint: 'Pre-delivery Check',
        status: 'rework_needed',
        inspector: 'Sarah Chen',
        inspectorId: 'T002',
        inspectionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        defects: [
          {
            id: 'DEF001',
            type: 'stitching',
            severity: 'minor',
            description: 'Loose button on left cuff',
            location: 'Left sleeve cuff',
            actionRequired: 'rework',
            estimatedFixTime: 0.5,
            assignedTo: 'Sarah Chen',
            notes: 'Easy fix, just needs button reinforcement',
          },
        ],
        notes: 'Minor issue with button attachment',
        rating: 4,
        timeSpent: 20,
      },
      {
        id: 'QI003',
        orderId: 'PO003',
        orderNumber: 'ORD-2024-003',
        itemId: 'ITEM004',
        itemDescription: 'Charcoal Dress Pants',
        customerName: 'David Wilson',
        checkpoint: 'Final Quality Check',
        status: 'pending',
        inspector: 'Master Giovanni',
        inspectorId: 'T001',
        inspectionDate: new Date(),
        scheduledDate: new Date(),
        priority: 'low',
        defects: [],
        notes: '',
      },
    ];

    const mockAlterations: Alteration[] = [
      {
        id: 'ALT001',
        orderId: 'PO001',
        orderNumber: 'ORD-2024-001',
        itemId: 'ITEM001',
        itemDescription: 'Navy Blue Business Suit',
        customerName: 'John Smith',
        type: 'adjustment',
        reason: 'Customer requested sleeve shortening',
        description: 'Shorten jacket sleeves by 1 inch',
        status: 'completed',
        priority: 'medium',
        assignedTailor: 'Marco Rodriguez',
        requestedBy: 'Sales Associate',
        requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estimatedTime: 1,
        actualTime: 0.8,
        cost: 25,
        notes: 'Completed successfully, customer satisfied',
      },
      {
        id: 'ALT002',
        orderId: 'PO002',
        orderNumber: 'ORD-2024-002',
        itemId: 'ITEM002',
        itemDescription: 'White Cotton Dress Shirt',
        customerName: 'Michael Johnson',
        type: 'rework',
        reason: 'Quality inspection failure',
        description: 'Reinforce loose button on left cuff',
        status: 'in_progress',
        priority: 'high',
        assignedTailor: 'Sarah Chen',
        requestedBy: 'Quality Inspector',
        requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(),
        estimatedTime: 0.5,
        notes: 'From quality inspection QI002',
      },
      {
        id: 'ALT003',
        orderId: 'PO004',
        orderNumber: 'ORD-2024-004',
        itemId: 'ITEM005',
        itemDescription: 'Gray Wool Jacket',
        customerName: 'Robert Brown',
        type: 'modification',
        reason: 'Customer change request',
        description: 'Add functional buttonholes to sleeves',
        status: 'pending',
        priority: 'low',
        assignedTailor: 'Emma Thompson',
        requestedBy: 'Customer',
        requestDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        estimatedTime: 2,
        cost: 50,
        notes: 'Customer willing to pay extra for functional buttons',
      },
    ];

    const mockMetrics: QualityMetrics = {
      totalInspections: mockInspections.length,
      passRate: 67,
      failRate: 0,
      reworkRate: 33,
      averageInspectionTime: 18,
      defectsByType: {
        stitching: 1,
        measurement: 0,
        fabric: 0,
        finishing: 0,
        fit: 0,
        other: 0,
      },
      defectsBySeverity: {
        minor: 1,
        major: 0,
        critical: 0,
      },
      inspectorPerformance: {
        'Master Giovanni': { inspections: 2, passRate: 100 },
        'Sarah Chen': { inspections: 1, passRate: 0 },
      },
      alterationsThisMonth: mockAlterations.length,
      averageAlterationTime: 1.1,
    };

    setInspections(mockInspections);
    setAlterations(mockAlterations);
    setMetrics(mockMetrics);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'rework_needed': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <PassedIcon color="success" />;
      case 'failed': return <FailedIcon color="error" />;
      case 'rework_needed': return <ReworkIcon color="warning" />;
      case 'pending': return <PendingIcon color="info" />;
      default: return <PendingIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.itemDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAlterations = alterations.filter(alteration => {
    const matchesSearch = alteration.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alteration.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alteration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alteration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Quality Control
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<AddIcon />}>
                New Inspection
              </Button>
              <Button variant="contained" startIcon={<AlterationIcon />}>
                Request Alteration
              </Button>
            </Box>
          </Box>

          {/* Quick Stats */}
          {metrics && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {metrics.totalInspections}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Inspections
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {metrics.passRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pass Rate
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {metrics.reworkRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rework Rate
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {metrics.alterationsThisMonth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alterations This Month
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Inspections" icon={<InspectionIcon />} iconPosition="start" />
          <Tab label="Alterations" icon={<AlterationIcon />} iconPosition="start" />
          <Tab label="Quality Metrics" icon={<MetricsIcon />} iconPosition="start" />
        </Tabs>

        <CardContent>
          {/* Inspections Tab */}
          {selectedTab === 0 && (
            <Box>
              {/* Search and Filter */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  placeholder="Search inspections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="passed">Passed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="rework_needed">Rework Needed</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Inspections Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Details</TableCell>
                      <TableCell>Checkpoint</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Inspector</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Defects</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {inspection.orderNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {inspection.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {inspection.itemDescription}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {inspection.checkpoint}
                          </Typography>
                          <Chip 
                            label={inspection.priority} 
                            color={getPriorityColor(inspection.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(inspection.status)}
                            <Chip 
                              label={inspection.status.replace('_', ' ')} 
                              color={getStatusColor(inspection.status) as any}
                              size="small"
                            />
                          </Box>
                          {inspection.rating && (
                            <Rating value={inspection.rating} size="small" readOnly />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {inspection.inspector}
                          </Typography>
                          {inspection.timeSpent && (
                            <Typography variant="caption" color="text.secondary">
                              {inspection.timeSpent} min
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(inspection.inspectionDate, 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(inspection.inspectionDate, 'HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {inspection.defects.length > 0 ? (
                            <Badge badgeContent={inspection.defects.length} color="error">
                              <Chip 
                                label={`${inspection.defects.length} defect(s)`}
                                color="error"
                                size="small"
                              />
                            </Badge>
                          ) : (
                            <Chip label="No defects" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedInspection(inspection);
                                  setInspectionDialogOpen(true);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Inspection">
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Alterations Tab */}
          {selectedTab === 1 && (
            <Box>
              {/* Search and Filter */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  placeholder="Search alterations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Alterations Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Details</TableCell>
                      <TableCell>Alteration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned Tailor</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAlterations.map((alteration) => (
                      <TableRow key={alteration.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {alteration.orderNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {alteration.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {alteration.itemDescription}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {alteration.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {alteration.reason}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip 
                                label={alteration.type} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={alteration.priority} 
                                color={getPriorityColor(alteration.priority) as any}
                                size="small"
                                sx={{ ml: 0.5 }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={alteration.status.replace('_', ' ')} 
                            color={getStatusColor(alteration.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {alteration.assignedTailor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            Est: {alteration.estimatedTime}h
                          </Typography>
                          {alteration.actualTime && (
                            <Typography variant="body2" color="text.secondary">
                              Actual: {alteration.actualTime}h
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Requested: {format(alteration.requestDate, 'MMM dd')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {alteration.cost ? (
                            <Typography variant="body2" fontWeight="bold">
                              ${alteration.cost}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No charge
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedAlteration(alteration);
                                  setAlterationDialogOpen(true);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Alteration">
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Quality Metrics Tab */}
          {selectedTab === 2 && (
            <Box>
              {metrics && (
                <Grid container spacing={3}>
                  {/* Defects by Type */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Defects by Type
                        </Typography>
                        <List>
                          {Object.entries(metrics.defectsByType).map(([type, count]) => (
                            <ListItem key={type}>
                              <ListItemText 
                                primary={type.charAt(0).toUpperCase() + type.slice(1)}
                                secondary={`${count} defect(s)`}
                              />
                              <ListItemSecondaryAction>
                                <Chip label={count} size="small" />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Inspector Performance */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Inspector Performance
                        </Typography>
                        <List>
                          {Object.entries(metrics.inspectorPerformance).map(([inspector, performance]) => (
                            <ListItem key={inspector}>
                              <ListItemIcon>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {inspector.charAt(0)}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={inspector}
                                secondary={`${performance.inspections} inspections • ${performance.passRate}% pass rate`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Additional Metrics */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Performance Summary
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              Average Inspection Time
                            </Typography>
                            <Typography variant="h6">
                              {metrics.averageInspectionTime} min
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              Average Alteration Time
                            </Typography>
                            <Typography variant="h6">
                              {metrics.averageAlterationTime} hours
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              Quality Score
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {metrics.passRate}%
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              Rework Rate
                            </Typography>
                            <Typography variant="h6" color="warning.main">
                              {metrics.reworkRate}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Inspection Detail Dialog */}
      <Dialog 
        open={inspectionDialogOpen} 
        onClose={() => setInspectionDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Inspection Details - {selectedInspection?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInspection && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInspection.checkpoint}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedInspection.itemDescription}
              </Typography>
              
              {selectedInspection.defects.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Defects Found
                  </Typography>
                  {selectedInspection.defects.map((defect) => (
                    <Card key={defect.id} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {defect.description}
                          </Typography>
                          <Chip 
                            label={defect.severity} 
                            color={getSeverityColor(defect.severity) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Location: {defect.location} • Action: {defect.actionRequired}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              
              {selectedInspection.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Notes:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInspection.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInspectionDialogOpen(false)}>Close</Button>
          <Button variant="contained">Update Inspection</Button>
        </DialogActions>
      </Dialog>

      {/* Alteration Detail Dialog */}
      <Dialog 
        open={alterationDialogOpen} 
        onClose={() => setAlterationDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Alteration Details - {selectedAlteration?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedAlteration && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlteration.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reason: {selectedAlteration.reason}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedAlteration.type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Priority:</strong> {selectedAlteration.priority}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Assigned to:</strong> {selectedAlteration.assignedTailor}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Estimated time:</strong> {selectedAlteration.estimatedTime} hours
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedAlteration.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Notes:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAlteration.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlterationDialogOpen(false)}>Close</Button>
          <Button variant="contained">Update Alteration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityControl; 