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
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Paper,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  Checkbox,
  Radio,
  RadioGroup,
  Slider,
  Rating,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  CheckBox as CheckboxIcon,
  RadioButtonChecked as RadioIcon,
  List as ListIcon,
  DateRange as DateIcon,
  Star as RatingIcon,
  Tune as SliderIcon,
  AttachFile as FileIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { WeddingParty, WeddingMember } from '../../types';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'rating' | 'slider' | 'file';
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  placeholder?: string;
  isVisible: boolean;
  order: number;
  category: 'personal' | 'preferences' | 'measurements' | 'logistics' | 'special';
  createdAt: Date;
}

interface FieldValue {
  fieldId: string;
  memberId: string;
  value: any;
  updatedAt: Date;
}

interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  fields: CustomField[];
  isDefault: boolean;
}

interface WeddingCustomFieldsProps {
  wedding: WeddingParty;
  onUpdate?: (updatedWedding: WeddingParty) => void;
}

const WeddingCustomFields: React.FC<WeddingCustomFieldsProps> = ({ 
  wedding, 
  onUpdate 
}) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([]);
  const [fieldTemplates, setFieldTemplates] = useState<FieldTemplate[]>([
    {
      id: '1',
      name: 'Basic Wedding Info',
      description: 'Essential information for wedding party members',
      isDefault: true,
      fields: [
        {
          id: 'dietary_restrictions',
          name: 'dietary_restrictions',
          label: 'Dietary Restrictions',
          type: 'textarea',
          description: 'Any dietary restrictions or allergies',
          required: false,
          placeholder: 'e.g., Vegetarian, Gluten-free, Nut allergy...',
          isVisible: true,
          order: 1,
          category: 'personal',
          createdAt: new Date(),
        },
        {
          id: 'plus_one',
          name: 'plus_one',
          label: 'Plus One',
          type: 'checkbox',
          description: 'Will you be bringing a plus one?',
          required: false,
          isVisible: true,
          order: 2,
          category: 'logistics',
          createdAt: new Date(),
        },
        {
          id: 'accommodation_needed',
          name: 'accommodation_needed',
          label: 'Accommodation Needed',
          type: 'radio',
          description: 'Do you need accommodation assistance?',
          required: false,
          options: ['Yes, please help', 'No, I have arrangements', 'Not sure yet'],
          isVisible: true,
          order: 3,
          category: 'logistics',
          createdAt: new Date(),
        },
      ],
    },
    {
      id: '2',
      name: 'Style Preferences',
      description: 'Styling and fit preferences',
      isDefault: true,
      fields: [
        {
          id: 'style_preference',
          name: 'style_preference',
          label: 'Style Preference',
          type: 'select',
          description: 'Preferred suit style',
          required: true,
          options: ['Classic Fit', 'Slim Fit', 'Modern Fit', 'Tailored Fit'],
          isVisible: true,
          order: 1,
          category: 'preferences',
          createdAt: new Date(),
        },
        {
          id: 'color_preference',
          name: 'color_preference',
          label: 'Color Preference',
          type: 'multiselect',
          description: 'Preferred colors (select multiple)',
          required: false,
          options: ['Navy', 'Charcoal', 'Black', 'Light Gray', 'Dark Gray', 'Brown'],
          isVisible: true,
          order: 2,
          category: 'preferences',
          createdAt: new Date(),
        },
        {
          id: 'comfort_rating',
          name: 'comfort_rating',
          label: 'Comfort Priority',
          type: 'rating',
          description: 'How important is comfort vs. style? (1=Style, 5=Comfort)',
          required: false,
          isVisible: true,
          order: 3,
          category: 'preferences',
          createdAt: new Date(),
        },
      ],
    },
  ]);

  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FieldTemplate | null>(null);
  const [previewMember, setPreviewMember] = useState<WeddingMember | null>(null);

  const [fieldForm, setFieldForm] = useState({
    name: '',
    label: '',
    type: 'text' as CustomField['type'],
    description: '',
    required: false,
    options: [] as string[],
    placeholder: '',
    category: 'personal' as CustomField['category'],
    validation: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
      pattern: '',
      message: '',
    },
  });

  // Initialize with default templates
  React.useEffect(() => {
    if (customFields.length === 0) {
      const defaultFields = fieldTemplates.flatMap(template => template.fields);
      setCustomFields(defaultFields);
    }
  }, [fieldTemplates, customFields.length]);

  const handleCreateField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: fieldForm.name.toLowerCase().replace(/\s+/g, '_'),
      label: fieldForm.label,
      type: fieldForm.type,
      description: fieldForm.description,
      required: fieldForm.required,
      options: fieldForm.options.length > 0 ? fieldForm.options : undefined,
      placeholder: fieldForm.placeholder,
      validation: fieldForm.validation.min || fieldForm.validation.max || fieldForm.validation.pattern 
        ? fieldForm.validation 
        : undefined,
      isVisible: true,
      order: customFields.length + 1,
      category: fieldForm.category,
      createdAt: new Date(),
    };

    setCustomFields([...customFields, newField]);
    setShowFieldDialog(false);
    resetFieldForm();
    toast.success('Custom field created!');
  };

  const handleUpdateField = () => {
    if (!editingField) return;

    const updatedFields = customFields.map(field => 
      field.id === editingField.id 
        ? { 
            ...editingField, 
            name: fieldForm.name.toLowerCase().replace(/\s+/g, '_'),
            label: fieldForm.label,
            type: fieldForm.type,
            description: fieldForm.description,
            required: fieldForm.required,
            options: fieldForm.options.length > 0 ? fieldForm.options : undefined,
            placeholder: fieldForm.placeholder,
            category: fieldForm.category,
            validation: fieldForm.validation.min || fieldForm.validation.max || fieldForm.validation.pattern 
              ? fieldForm.validation 
              : undefined,
          }
        : field
    );
    setCustomFields(updatedFields);
    setShowFieldDialog(false);
    setEditingField(null);
    resetFieldForm();
    toast.success('Field updated!');
  };

  const handleDeleteField = (fieldId: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      setCustomFields(customFields.filter(f => f.id !== fieldId));
      setFieldValues(fieldValues.filter(fv => fv.fieldId !== fieldId));
      toast.success('Field deleted!');
    }
  };

  const handleToggleFieldVisibility = (fieldId: string) => {
    const updatedFields = customFields.map(field => 
      field.id === fieldId 
        ? { ...field, isVisible: !field.isVisible }
        : field
    );
    setCustomFields(updatedFields);
  };

  const handleFieldValueChange = (fieldId: string, memberId: string, value: any) => {
    const existingValueIndex = fieldValues.findIndex(
      fv => fv.fieldId === fieldId && fv.memberId === memberId
    );

    if (existingValueIndex >= 0) {
      const updatedValues = [...fieldValues];
      updatedValues[existingValueIndex] = {
        ...updatedValues[existingValueIndex],
        value,
        updatedAt: new Date(),
      };
      setFieldValues(updatedValues);
    } else {
      const newValue: FieldValue = {
        fieldId,
        memberId,
        value,
        updatedAt: new Date(),
      };
      setFieldValues([...fieldValues, newValue]);
    }
  };

  const getFieldValue = (fieldId: string, memberId: string): any => {
    const fieldValue = fieldValues.find(
      fv => fv.fieldId === fieldId && fv.memberId === memberId
    );
    return fieldValue?.value;
  };

  const resetFieldForm = () => {
    setFieldForm({
      name: '',
      label: '',
      type: 'text',
      description: '',
      required: false,
      options: [],
      placeholder: '',
      category: 'personal',
      validation: {
        min: undefined,
        max: undefined,
        pattern: '',
        message: '',
      },
    });
  };

  const openEditField = (field: CustomField) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      label: field.label,
      type: field.type,
      description: field.description || '',
      required: field.required,
      options: field.options || [],
      placeholder: field.placeholder || '',
      category: field.category,
      validation: field.validation || {
        min: undefined,
        max: undefined,
        pattern: '',
        message: '',
      },
    });
    setShowFieldDialog(true);
  };

  const applyTemplate = (template: FieldTemplate) => {
    const newFields = template.fields.map(field => ({
      ...field,
      id: Date.now().toString() + Math.random(),
      order: customFields.length + field.order,
    }));
    setCustomFields([...customFields, ...newFields]);
    setShowTemplateDialog(false);
    toast.success(`Applied template: ${template.name}`);
  };

  const renderFieldInput = (field: CustomField, member: WeddingMember) => {
    const value = getFieldValue(field.id, member.id);

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextField
            fullWidth
            type={field.type}
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            helperText={field.description}
            size="small"
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldValueChange(field.id, member.id, parseFloat(e.target.value) || '')}
            placeholder={field.placeholder}
            required={field.required}
            helperText={field.description}
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max,
            }}
            size="small"
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            helperText={field.description}
            size="small"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value || ''}
              label={field.label}
              onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.value)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              multiple
              value={value || []}
              label={field.label}
              onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.value)}
              required={field.required}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((val) => (
                    <Chip key={val} label={val} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.checked)}
              />
            }
            label={field.label}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFieldValueChange(field.id, member.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'rating':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            <Rating
              value={value || 0}
              onChange={(_, newValue) => handleFieldValueChange(field.id, member.id, newValue)}
            />
            {field.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {field.description}
              </Typography>
            )}
          </Box>
        );

      case 'slider':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {field.label}: {value || field.validation?.min || 0}
            </Typography>
            <Slider
              value={value || field.validation?.min || 0}
              onChange={(_, newValue) => handleFieldValueChange(field.id, member.id, newValue)}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
            {field.description && (
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            )}
          </Box>
        );

      case 'date':
        return (
          <DatePicker
            label={field.label}
            value={value ? new Date(value) : null}
            onChange={(newValue) => handleFieldValueChange(field.id, member.id, newValue)}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'small',
                helperText: field.description,
                required: field.required,
              } 
            }}
          />
        );

      case 'file':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileIcon />}
              size="small"
            >
              Upload File
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFieldValueChange(field.id, member.id, file.name);
                  }
                }}
              />
            </Button>
            {value && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Uploaded: {value}
              </Typography>
            )}
            {field.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {field.description}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const getFieldIcon = (type: CustomField['type']) => {
    switch (type) {
      case 'text': case 'email': case 'phone': case 'textarea': return <TextIcon />;
      case 'number': return <NumberIcon />;
      case 'checkbox': return <CheckboxIcon />;
      case 'radio': return <RadioIcon />;
      case 'select': case 'multiselect': return <ListIcon />;
      case 'date': return <DateIcon />;
      case 'rating': return <RatingIcon />;
      case 'slider': return <SliderIcon />;
      case 'file': return <FileIcon />;
      default: return <TextIcon />;
    }
  };

  const getCategoryColor = (category: CustomField['category']) => {
    switch (category) {
      case 'personal': return 'primary';
      case 'preferences': return 'secondary';
      case 'measurements': return 'info';
      case 'logistics': return 'warning';
      case 'special': return 'success';
      default: return 'default';
    }
  };

  const groupedFields = customFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  const visibleFields = customFields.filter(f => f.isVisible);
  const completedFields = wedding.members.reduce((acc, member) => {
    const memberValues = fieldValues.filter(fv => fv.memberId === member.id);
    const requiredFields = visibleFields.filter(f => f.required);
    const completedRequired = requiredFields.filter(rf => 
      memberValues.some(mv => mv.fieldId === rf.id && mv.value)
    );
    acc[member.id] = {
      total: requiredFields.length,
      completed: completedRequired.length,
      percentage: requiredFields.length > 0 ? Math.round((completedRequired.length / requiredFields.length) * 100) : 100,
    };
    return acc;
  }, {} as Record<string, { total: number; completed: number; percentage: number }>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          Custom Fields
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => setShowTemplateDialog(true)}
          >
            Templates
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowFieldDialog(true)}
          >
            Add Field
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Fields
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {customFields.length}
                  </Typography>
                </Box>
                <SettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Visible Fields
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {visibleFields.length}
                  </Typography>
                </Box>
                <VisibilityIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Required Fields
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {visibleFields.filter(f => f.required).length}
                  </Typography>
                </Box>
                <CheckboxIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Completion
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(
                      Object.values(completedFields).reduce((sum, cf) => sum + cf.percentage, 0) / 
                      Math.max(Object.values(completedFields).length, 1)
                    )}%
                  </Typography>
                </Box>
                <SaveIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Field Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Field Management
          </Typography>
          
          {Object.entries(groupedFields).map(([category, fields]) => (
            <Accordion key={category} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {category.charAt(0).toUpperCase() + category.slice(1)} Fields
                  </Typography>
                  <Chip 
                    label={fields.length} 
                    size="small" 
                    color={getCategoryColor(category) as any}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid xs={12} md={6} key={field.id}>
                      <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFieldIcon(field.type)}
                            <Typography variant="subtitle2" fontWeight="bold">
                              {field.label}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => handleToggleFieldVisibility(field.id)}>
                              {field.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                            <IconButton size="small" onClick={() => openEditField(field)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteField(field.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip 
                            label={field.type} 
                            size="small" 
                            variant="outlined"
                          />
                          {field.required && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="error"
                            />
                          )}
                          {!field.isVisible && (
                            <Chip 
                              label="Hidden" 
                              size="small" 
                              color="default"
                            />
                          )}
                        </Stack>
                        
                        {field.description && (
                          <Typography variant="body2" color="text.secondary">
                            {field.description}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Member Data Collection */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Member Data Collection
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => {
                setPreviewMember(wedding.members[0]);
                setShowPreviewDialog(true);
              }}
              disabled={wedding.members.length === 0}
            >
              Preview Form
            </Button>
          </Box>

          {wedding.members.map((member) => (
            <Accordion key={member.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {member.name}
                  </Typography>
                  <Chip 
                    label={member.role.replace('_', ' ')} 
                    size="small" 
                    variant="outlined"
                  />
                  <Box sx={{ ml: 'auto', mr: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {completedFields[member.id]?.completed || 0} / {completedFields[member.id]?.total || 0} required fields
                    </Typography>
                    <Box sx={{ 
                      width: 100, 
                      height: 4, 
                      bgcolor: 'grey.300', 
                      borderRadius: 2,
                      overflow: 'hidden',
                      mt: 0.5,
                    }}>
                      <Box sx={{ 
                        width: `${completedFields[member.id]?.percentage || 0}%`, 
                        height: '100%', 
                        bgcolor: completedFields[member.id]?.percentage === 100 ? 'success.main' : 'warning.main',
                        transition: 'width 0.3s ease',
                      }} />
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {visibleFields.map((field) => (
                    <Grid xs={12} sm={6} md={4} key={field.id}>
                      {renderFieldInput(field, member)}
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {wedding.members.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SettingsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No wedding party members to collect data from
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Field Creation Dialog */}
      <Dialog open={showFieldDialog} onClose={() => setShowFieldDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingField ? 'Edit Field' : 'Create Custom Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                helperText="Internal name (will be converted to snake_case)"
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Label"
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                helperText="Label shown to users"
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={fieldForm.type}
                  label="Field Type"
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as any })}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="textarea">Text Area</MenuItem>
                  <MenuItem value="select">Dropdown</MenuItem>
                  <MenuItem value="multiselect">Multi-Select</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="radio">Radio Buttons</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="slider">Slider</MenuItem>
                  <MenuItem value="file">File Upload</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={fieldForm.category}
                  label="Category"
                  onChange={(e) => setFieldForm({ ...fieldForm, category: e.target.value as any })}
                >
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="preferences">Preferences</MenuItem>
                  <MenuItem value="measurements">Measurements</MenuItem>
                  <MenuItem value="logistics">Logistics</MenuItem>
                  <MenuItem value="special">Special</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={fieldForm.description}
                onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                helperText="Help text shown to users"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Placeholder"
                value={fieldForm.placeholder}
                onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                helperText="Placeholder text for input fields"
              />
            </Grid>
            
            {(fieldForm.type === 'select' || fieldForm.type === 'multiselect' || fieldForm.type === 'radio') && (
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Options (one per line)"
                  multiline
                  rows={4}
                  value={fieldForm.options.join('\n')}
                  onChange={(e) => setFieldForm({ 
                    ...fieldForm, 
                    options: e.target.value.split('\n').filter(o => o.trim()) 
                  })}
                  helperText="Enter each option on a new line"
                />
              </Grid>
            )}

            <Grid xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  />
                }
                label="Required Field"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFieldDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingField ? handleUpdateField : handleCreateField}
            variant="contained"
            disabled={!fieldForm.name || !fieldForm.label}
          >
            {editingField ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Field Templates</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Apply pre-built field templates to quickly add common fields:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {fieldTemplates.map((template) => (
              <Grid xs={12} key={template.id}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.fields.length} fields
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => applyTemplate(template)}
                    >
                      Apply Template
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Form Preview</DialogTitle>
        <DialogContent>
          {previewMember && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Custom Fields for {previewMember.name}
              </Typography>
              <Grid container spacing={3}>
                {visibleFields.map((field) => (
                  <Grid xs={12} sm={6} key={field.id}>
                    {renderFieldInput(field, previewMember)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingCustomFields; 