import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
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
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Paper,
  Avatar,
  Badge,
  Tooltip,
  LinearProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Camera as CameraIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoIcon,
  AttachFile as AttachFileIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  QualityControl as QualityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { WeddingParty, WeddingMember } from '../../types';

interface QualityCheckpoint {
  id: string;
  name: string;
  description: string;
  stage: 'measurement' | 'cutting' | 'sewing' | 'fitting' | 'finishing' | 'packaging';
  required: boolean;
  criteria: QualityCriteria[];
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'requires_attention';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  photos?: string[];
  rating?: number;
}

interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  type: 'measurement' | 'visual' | 'functional' | 'material';
  passed: boolean;
  notes?: string;
  photos?: string[];
}

interface QualityInspection {
  id: string;
  memberId: string;
  memberName: string;
  orderNumber: string;
  currentStage: QualityCheckpoint['stage'];
  checkpoints: QualityCheckpoint[];
  overallStatus: 'pending' | 'in_progress' | 'passed' | 'failed' | 'requires_rework';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedInspector?: string;
  startedAt: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  qualityScore?: number;
  customerSatisfaction?: number;
}

interface WeddingQualityControlProps {
  wedding: WeddingParty;
  onUpdate?: () => void;
}

const WeddingQualityControl: React.FC<WeddingQualityControlProps> = ({ wedding, onUpdate }) => {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Initialize quality inspections for wedding members
  useEffect(() => {
    initializeInspections();
  }, [wedding]);

  const initializeInspections = () => {
    const mockInspections: QualityInspection[] = wedding.members.map((member, index) => ({
      id: `inspection-${member.id}`,
      memberId: member.id,
      memberName: member.name,
      orderNumber: `WO-${wedding.weddingCode}-${String(index + 1).padStart(3, '0')}`,
      currentStage: 'measurement',
      checkpoints: generateQualityCheckpoints(),
      overallStatus: 'pending',
      priority: member.role === 'groom' ? 'high' : 'normal',
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
    setInspections(mockInspections);
  };

  const generateQualityCheckpoints = (): QualityCheckpoint[] => [
    {
      id: 'measurement-check',
      name: 'Measurement Verification',
      description: 'Verify all measurements are accurate and complete',
      stage: 'measurement',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'chest-measurement',
          name: 'Chest Measurement',
          description: 'Chest measurement within tolerance',
          type: 'measurement',
          passed: false,
        },
        {
          id: 'waist-measurement',
          name: 'Waist Measurement',
          description: 'Waist measurement within tolerance',
          type: 'measurement',
          passed: false,
        },
        {
          id: 'sleeve-length',
          name: 'Sleeve Length',
          description: 'Sleeve length accurate',
          type: 'measurement',
          passed: false,
        },
      ],
    },
    {
      id: 'cutting-check',
      name: 'Fabric Cutting Quality',
      description: 'Ensure precise cutting and pattern matching',
      stage: 'cutting',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'pattern-alignment',
          name: 'Pattern Alignment',
          description: 'Patterns properly aligned',
          type: 'visual',
          passed: false,
        },
        {
          id: 'cutting-precision',
          name: 'Cutting Precision',
          description: 'Clean, precise cuts',
          type: 'visual',
          passed: false,
        },
      ],
    },
    {
      id: 'sewing-check',
      name: 'Sewing Quality',
      description: 'Check stitching quality and construction',
      stage: 'sewing',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'stitch-quality',
          name: 'Stitch Quality',
          description: 'Even, secure stitching',
          type: 'visual',
          passed: false,
        },
        {
          id: 'seam-finishing',
          name: 'Seam Finishing',
          description: 'Proper seam finishing',
          type: 'visual',
          passed: false,
        },
      ],
    },
    {
      id: 'fitting-check',
      name: 'Fit Verification',
      description: 'Verify proper fit and comfort',
      stage: 'fitting',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'overall-fit',
          name: 'Overall Fit',
          description: 'Proper fit across all areas',
          type: 'functional',
          passed: false,
        },
        {
          id: 'comfort-check',
          name: 'Comfort Check',
          description: 'Comfortable movement',
          type: 'functional',
          passed: false,
        },
      ],
    },
    {
      id: 'finishing-check',
      name: 'Final Finishing',
      description: 'Final quality check and finishing touches',
      stage: 'finishing',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'button-attachment',
          name: 'Button Attachment',
          description: 'Buttons securely attached',
          type: 'functional',
          passed: false,
        },
        {
          id: 'pressing-quality',
          name: 'Pressing Quality',
          description: 'Professional pressing',
          type: 'visual',
          passed: false,
        },
      ],
    },
    {
      id: 'packaging-check',
      name: 'Packaging & Delivery Prep',
      description: 'Final packaging and delivery preparation',
      stage: 'packaging',
      required: true,
      status: 'pending',
      criteria: [
        {
          id: 'packaging-quality',
          name: 'Packaging Quality',
          description: 'Proper protective packaging',
          type: 'visual',
          passed: false,
        },
        {
          id: 'accessories-included',
          name: 'Accessories Included',
          description: 'All accessories included',
          type: 'functional',
          passed: false,
        },
      ],
    },
  ];

  const handleStartInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setActiveStep(0);
    setShowInspectionDialog(true);
  };

  const handleCompleteCheckpoint = (checkpointId: string, passed: boolean, notes: string) => {
    if (!selectedInspection) return;

    const updatedInspection = {
      ...selectedInspection,
      checkpoints: selectedInspection.checkpoints.map(checkpoint => {
        if (checkpoint.id === checkpointId) {
          return {
            ...checkpoint,
            status: passed ? 'passed' : 'failed',
            completedAt: new Date(),
            completedBy: 'Current Inspector',
            notes,
          };
        }
        return checkpoint;
      }),
    };

    setSelectedInspection(updatedInspection);
    
    // Update inspections list
    setInspections(prev => prev.map(insp => 
      insp.id === updatedInspection.id ? updatedInspection : insp
    ));
  };

  const calculateQualityScore = (inspection: QualityInspection): number => {
    const completedCheckpoints = inspection.checkpoints.filter(cp => cp.status === 'passed' || cp.status === 'failed');
    const passedCheckpoints = inspection.checkpoints.filter(cp => cp.status === 'passed');
    
    if (completedCheckpoints.length === 0) return 0;
    return Math.round((passedCheckpoints.length / completedCheckpoints.length) * 100);
  };

  const getStatusColor = (status: QualityCheckpoint['status']) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'requires_attention': return 'warning';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getStageIcon = (stage: QualityCheckpoint['stage']) => {
    switch (stage) {
      case 'measurement': return <AssignmentIcon />;
      case 'cutting': return <EditIcon />;
      case 'sewing': return <QualityIcon />;
      case 'fitting': return <PersonIcon />;
      case 'finishing': return <StarIcon />;
      case 'packaging': return <AttachFileIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const stageMatch = filterStage === 'all' || inspection.currentStage === filterStage;
    const statusMatch = filterStatus === 'all' || inspection.overallStatus === filterStatus;
    return stageMatch && statusMatch;
  });

  const overallStats = {
    total: inspections.length,
    pending: inspections.filter(i => i.overallStatus === 'pending').length,
    inProgress: inspections.filter(i => i.overallStatus === 'in_progress').length,
    passed: inspections.filter(i => i.overallStatus === 'passed').length,
    failed: inspections.filter(i => i.overallStatus === 'failed').length,
    avgQualityScore: inspections.length > 0 
      ? Math.round(inspections.reduce((sum, i) => sum + calculateQualityScore(i), 0) / inspections.length)
      : 0,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <QualityIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                Quality Control Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Multi-stage quality assurance for {wedding.groomInfo.name} & {wedding.brideInfo.name}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {overallStats.avgQualityScore}%
              </Typography>
              <Typography variant="caption">
                Quality Score
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {overallStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={overallStats.pending} color="warning">
                <ScheduleIcon sx={{ fontSize: 30, color: 'warning.main' }} />
              </Badge>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={overallStats.inProgress} color="info">
                <AssignmentIcon sx={{ fontSize: 30, color: 'info.main' }} />
              </Badge>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={overallStats.passed} color="success">
                <CheckCircleIcon sx={{ fontSize: 30, color: 'success.main' }} />
              </Badge>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Passed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={overallStats.failed} color="error">
                <CancelIcon sx={{ fontSize: 30, color: 'error.main' }} />
              </Badge>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Rating value={overallStats.avgQualityScore / 20} readOnly size="small" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Avg Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Stage</InputLabel>
          <Select
            value={filterStage}
            label="Stage"
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <MenuItem value="all">All Stages</MenuItem>
            <MenuItem value="measurement">Measurement</MenuItem>
            <MenuItem value="cutting">Cutting</MenuItem>
            <MenuItem value="sewing">Sewing</MenuItem>
            <MenuItem value="fitting">Fitting</MenuItem>
            <MenuItem value="finishing">Finishing</MenuItem>
            <MenuItem value="packaging">Packaging</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="passed">Passed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Inspections List */}
      <Grid container spacing={3}>
        {filteredInspections.map((inspection) => (
          <Grid item xs={12} md={6} lg={4} key={inspection.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {inspection.memberName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {inspection.orderNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={inspection.priority}
                    size="small"
                    color={inspection.priority === 'high' ? 'error' : 'default'}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Current Stage: {inspection.currentStage.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(inspection.checkpoints.filter(cp => cp.status === 'passed').length / inspection.checkpoints.length) * 100}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {inspection.checkpoints.filter(cp => cp.status === 'passed').length} / {inspection.checkpoints.length} checkpoints completed
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={inspection.overallStatus.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(inspection.overallStatus as any)}
                    size="small"
                  />
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {calculateQualityScore(inspection)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quality Score
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStartInspection(inspection)}
                    startIcon={<ViewIcon />}
                  >
                    Inspect
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryIcon />}
                  >
                    History
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Inspection Dialog */}
      <Dialog open={showInspectionDialog} onClose={() => setShowInspectionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Quality Inspection: {selectedInspection?.memberName}
        </DialogTitle>
        <DialogContent>
          {selectedInspection && (
            <Box>
              <Stepper activeStep={activeStep} orientation="vertical">
                {selectedInspection.checkpoints.map((checkpoint, index) => (
                  <Step key={checkpoint.id}>
                    <StepLabel
                      icon={getStageIcon(checkpoint.stage)}
                      optional={
                        <Typography variant="caption">
                          {checkpoint.required ? 'Required' : 'Optional'}
                        </Typography>
                      }
                    >
                      {checkpoint.name}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        {checkpoint.description}
                      </Typography>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2">
                            Quality Criteria ({checkpoint.criteria.filter(c => c.passed).length}/{checkpoint.criteria.length} passed)
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {checkpoint.criteria.map((criteria) => (
                              <ListItem key={criteria.id}>
                                <ListItemIcon>
                                  <Checkbox
                                    checked={criteria.passed}
                                    onChange={(e) => {
                                      // Update criteria status
                                      const updatedCheckpoint = {
                                        ...checkpoint,
                                        criteria: checkpoint.criteria.map(c =>
                                          c.id === criteria.id ? { ...c, passed: e.target.checked } : c
                                        )
                                      };
                                      // Update selected inspection
                                      setSelectedInspection({
                                        ...selectedInspection,
                                        checkpoints: selectedInspection.checkpoints.map(cp =>
                                          cp.id === checkpoint.id ? updatedCheckpoint : cp
                                        )
                                      });
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={criteria.name}
                                  secondary={criteria.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Inspection Notes"
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        sx={{ mt: 2, mb: 2 }}
                      />

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => {
                            handleCompleteCheckpoint(checkpoint.id, true, inspectionNotes);
                            setActiveStep(activeStep + 1);
                            setInspectionNotes('');
                          }}
                        >
                          Pass
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => {
                            handleCompleteCheckpoint(checkpoint.id, false, inspectionNotes);
                            setInspectionNotes('');
                          }}
                        >
                          Fail
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PhotoIcon />}
                        >
                          Add Photos
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInspectionDialog(false)}>Close</Button>
          <Button variant="contained">Save Progress</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingQualityControl; 