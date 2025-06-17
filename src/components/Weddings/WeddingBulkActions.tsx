import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Alert,
  IconButton,
  Paper,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Badge,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  SelectAll as SelectAllIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Assignment as AssignIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Note as NoteIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { WeddingParty, WeddingMember } from '../../types';

interface BulkAction {
  id: string;
  name: string;
  description: string;
  type: 'status_update' | 'notification' | 'assignment' | 'payment' | 'note' | 'delete';
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  requiresInput: boolean;
  confirmationRequired: boolean;
}

interface BulkOperation {
  id: string;
  action: BulkAction;
  targetMembers: WeddingMember[];
  parameters: Record<string, any>;
  executedAt: Date;
  executedBy: string;
  status: 'pending' | 'completed' | 'failed';
  results: string[];
}

interface WeddingBulkActionsProps {
  wedding: WeddingParty;
  onUpdate?: (updatedWedding: WeddingParty) => void;
}

const WeddingBulkActions: React.FC<WeddingBulkActionsProps> = ({ 
  wedding, 
  onUpdate 
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [actionParameters, setActionParameters] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const bulkActions: BulkAction[] = [
    {
      id: 'update_status',
      name: 'Update Status',
      description: 'Change measurement status for selected members',
      type: 'status_update',
      icon: <UpdateIcon />,
      color: 'primary',
      requiresInput: true,
      confirmationRequired: false,
    },
    {
      id: 'send_notification',
      name: 'Send Notification',
      description: 'Send email/SMS to selected members',
      type: 'notification',
      icon: <SendIcon />,
      color: 'info',
      requiresInput: true,
      confirmationRequired: false,
    },
    {
      id: 'assign_fitting',
      name: 'Schedule Fitting',
      description: 'Assign fitting appointments to selected members',
      type: 'assignment',
      icon: <ScheduleIcon />,
      color: 'secondary',
      requiresInput: true,
      confirmationRequired: false,
    },
    {
      id: 'update_payment',
      name: 'Update Payment Status',
      description: 'Change payment status for selected members',
      type: 'payment',
      icon: <PaymentIcon />,
      color: 'success',
      requiresInput: true,
      confirmationRequired: false,
    },
    {
      id: 'add_note',
      name: 'Add Note',
      description: 'Add a note to selected members',
      type: 'note',
      icon: <NoteIcon />,
      color: 'warning',
      requiresInput: true,
      confirmationRequired: false,
    },
    {
      id: 'remove_members',
      name: 'Remove Members',
      description: 'Remove selected members from wedding party',
      type: 'delete',
      icon: <DeleteIcon />,
      color: 'error',
      requiresInput: false,
      confirmationRequired: true,
    },
  ];

  const handleSelectAll = () => {
    if (selectedMembers.length === wedding.members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(wedding.members.map(m => m.id));
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleExecuteAction = async () => {
    if (!selectedAction || selectedMembers.length === 0) {
      toast.error('Please select an action and members');
      return;
    }

    if (selectedAction.confirmationRequired) {
      const confirmed = window.confirm(
        `Are you sure you want to ${selectedAction.name.toLowerCase()} for ${selectedMembers.length} member(s)?`
      );
      if (!confirmed) return;
    }

    setIsExecuting(true);

    try {
      const targetMembers = wedding.members.filter(m => selectedMembers.includes(m.id));
      const operation: BulkOperation = {
        id: Date.now().toString(),
        action: selectedAction,
        targetMembers,
        parameters: actionParameters,
        executedAt: new Date(),
        executedBy: 'Current User', // In real app, get from auth context
        status: 'pending',
        results: [],
      };

      // Execute the bulk action
      const results = await executeBulkAction(operation);
      
      const completedOperation: BulkOperation = {
        ...operation,
        status: 'completed',
        results,
      };

      setBulkOperations([completedOperation, ...bulkOperations]);
      
      // Update wedding data based on action
      if (onUpdate) {
        const updatedWedding = applyBulkActionToWedding(wedding, completedOperation);
        onUpdate(updatedWedding);
      }

      setShowActionDialog(false);
      setSelectedMembers([]);
      setActionParameters({});
      setSelectedAction(null);
      
      toast.success(`${selectedAction.name} completed for ${selectedMembers.length} member(s)!`);
    } catch (error) {
      toast.error('Failed to execute bulk action');
    } finally {
      setIsExecuting(false);
    }
  };

  const executeBulkAction = async (operation: BulkOperation): Promise<string[]> => {
    const results: string[] = [];
    
    // Simulate API calls for each member
    for (const member of operation.targetMembers) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
      
      switch (operation.action.type) {
        case 'status_update':
          results.push(`Updated ${member.name} status to ${operation.parameters.status}`);
          break;
        case 'notification':
          results.push(`Sent ${operation.parameters.type} to ${member.name}`);
          break;
        case 'assignment':
          results.push(`Scheduled fitting for ${member.name} on ${operation.parameters.date}`);
          break;
        case 'payment':
          results.push(`Updated payment status for ${member.name} to ${operation.parameters.paymentStatus}`);
          break;
        case 'note':
          results.push(`Added note to ${member.name}: "${operation.parameters.note}"`);
          break;
        case 'delete':
          results.push(`Removed ${member.name} from wedding party`);
          break;
        default:
          results.push(`Processed ${member.name}`);
      }
    }
    
    return results;
  };

  const applyBulkActionToWedding = (wedding: WeddingParty, operation: BulkOperation): WeddingParty => {
    const updatedMembers = wedding.members.map(member => {
      if (!operation.targetMembers.find(tm => tm.id === member.id)) {
        return member;
      }

      switch (operation.action.type) {
        case 'status_update':
          return { ...member, measurementStatus: operation.parameters.status };
        case 'payment':
          return { ...member, paymentStatus: operation.parameters.paymentStatus };
        case 'note':
          return { 
            ...member, 
            notes: [...(member.notes || []), {
              id: Date.now().toString(),
              content: operation.parameters.note,
              createdAt: new Date(),
              createdBy: operation.executedBy,
            }]
          };
        default:
          return member;
      }
    });

    // Handle member removal
    if (operation.action.type === 'delete') {
      const memberIdsToRemove = operation.targetMembers.map(m => m.id);
      return {
        ...wedding,
        members: wedding.members.filter(m => !memberIdsToRemove.includes(m.id))
      };
    }

    return { ...wedding, members: updatedMembers };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'submitted': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const renderActionInputs = () => {
    if (!selectedAction) return null;

    switch (selectedAction.type) {
      case 'status_update':
        return (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={actionParameters.status || ''}
              label="New Status"
              onChange={(e) => setActionParameters({ ...actionParameters, status: e.target.value })}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        );

      case 'notification':
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Notification Type</InputLabel>
              <Select
                value={actionParameters.type || ''}
                label="Notification Type"
                onChange={(e) => setActionParameters({ ...actionParameters, type: e.target.value })}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Email & SMS</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Subject"
              value={actionParameters.subject || ''}
              onChange={(e) => setActionParameters({ ...actionParameters, subject: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Message"
              value={actionParameters.message || ''}
              onChange={(e) => setActionParameters({ ...actionParameters, message: e.target.value })}
            />
          </Box>
        );

      case 'assignment':
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Fitting Date & Time"
              value={actionParameters.date || ''}
              onChange={(e) => setActionParameters({ ...actionParameters, date: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Location"
              value={actionParameters.location || ''}
              onChange={(e) => setActionParameters({ ...actionParameters, location: e.target.value })}
              placeholder="KCT Menswear Store"
            />
          </Box>
        );

      case 'payment':
        return (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={actionParameters.paymentStatus || ''}
              label="Payment Status"
              onChange={(e) => setActionParameters({ ...actionParameters, paymentStatus: e.target.value })}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        );

      case 'note':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Note"
            value={actionParameters.note || ''}
            onChange={(e) => setActionParameters({ ...actionParameters, note: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="Add a note for selected members..."
          />
        );

      default:
        return null;
    }
  };

  const selectedMemberObjects = wedding.members.filter(m => selectedMembers.includes(m.id));
  const paginatedMembers = wedding.members.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="primary" />
          Bulk Actions
        </Typography>
        <Badge badgeContent={selectedMembers.length} color="primary">
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setShowActionDialog(true)}
            disabled={selectedMembers.length === 0}
          >
            Actions ({selectedMembers.length})
          </Button>
        </Badge>
      </Box>

      {/* Selection Summary */}
      {selectedMembers.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography fontWeight="bold">
            {selectedMembers.length} member(s) selected
          </Typography>
          <Typography variant="body2">
            {selectedMemberObjects.map(m => m.name).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {bulkActions.map((action) => (
              <Grid xs={12} sm={6} md={4} key={action.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider',
                    cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedMembers.length > 0 ? 1 : 0.5,
                    '&:hover': {
                      bgcolor: selectedMembers.length > 0 ? 'action.hover' : 'transparent',
                    }
                  }}
                  onClick={() => {
                    if (selectedMembers.length > 0) {
                      setSelectedAction(action);
                      setShowActionDialog(true);
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: `${action.color}.light`,
                      color: `${action.color}.main`
                    }}>
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {action.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Wedding Party Members
            </Typography>
            <Button
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAll}
            >
              {selectedMembers.length === wedding.members.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedMembers.length > 0 && selectedMembers.length < wedding.members.length}
                      checked={selectedMembers.length === wedding.members.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Measurement Status</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {member.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.role.replace('_', ' ')} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {member.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" />
                            {member.email}
                          </Typography>
                        )}
                        {member.phone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SmsIcon fontSize="small" />
                            {member.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.measurementStatus} 
                        size="small" 
                        color={getStatusColor(member.measurementStatus) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.paymentStatus || 'pending'} 
                        size="small" 
                        color={getPaymentStatusColor(member.paymentStatus || 'pending') as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Quick Actions">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedMembers([member.id]);
                            setShowActionDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={wedding.members.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Recent Bulk Operations
          </Typography>
          
          {bulkOperations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No bulk operations performed yet
              </Typography>
            </Box>
          ) : (
            <List>
              {bulkOperations.slice(0, 5).map((operation) => (
                <ListItem key={operation.id} divider>
                  <ListItemIcon>
                    {operation.action.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {operation.action.name}
                        </Typography>
                        <Chip
                          label={operation.status}
                          size="small"
                          color={operation.status === 'completed' ? 'success' : operation.status === 'failed' ? 'error' : 'warning'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          Executed by {operation.executedBy} on {format(operation.executedAt, 'MMM dd, yyyy HH:mm')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          Affected {operation.targetMembers.length} member(s)
                        </Typography>
                        {operation.results.length > 0 && (
                          <Typography variant="caption" color="text.secondary" component="span">
                            {operation.results[0]}{operation.results.length > 1 && ` and ${operation.results.length - 1} more...`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onClose={() => setShowActionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAction ? selectedAction.name : 'Select Action'}
        </DialogTitle>
        <DialogContent>
          {!selectedAction ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Select an action to perform on {selectedMembers.length} member(s):
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {bulkActions.map((action) => (
                  <Grid xs={12} sm={6} key={action.id}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => setSelectedAction(action)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 1, 
                          bgcolor: `${action.color}.light`,
                          color: `${action.color}.main`
                        }}>
                          {action.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {action.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography fontWeight="bold">
                  {selectedAction.name} for {selectedMembers.length} member(s)
                </Typography>
                <Typography variant="body2">
                  {selectedMemberObjects.map(m => m.name).join(', ')}
                </Typography>
              </Alert>

              {selectedAction.requiresInput && renderActionInputs()}

              {selectedAction.confirmationRequired && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography fontWeight="bold">
                    ⚠️ This action cannot be undone
                  </Typography>
                  <Typography variant="body2">
                    Please confirm that you want to {selectedAction.name.toLowerCase()} for the selected members.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowActionDialog(false);
            setSelectedAction(null);
            setActionParameters({});
          }}>
            Cancel
          </Button>
          {selectedAction && (
            <Button 
              onClick={handleExecuteAction}
              variant="contained"
              color={selectedAction.color}
              disabled={isExecuting || (selectedAction.requiresInput && Object.keys(actionParameters).length === 0)}
              startIcon={isExecuting ? <UpdateIcon /> : selectedAction.icon}
            >
              {isExecuting ? 'Executing...' : `Execute ${selectedAction.name}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingBulkActions; 