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
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Assessment as ReportIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Receipt as InvoiceIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { WeddingParty, WeddingMember } from '../../types';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'progress' | 'analytics' | 'member_list' | 'timeline' | 'invoice' | 'custom';
  sections: string[];
  isDefault: boolean;
  createdAt: Date;
}

interface ReportConfig {
  template: ReportTemplate;
  includePhotos: boolean;
  includeCharts: boolean;
  includeTimeline: boolean;
  includeMeasurements: boolean;
  includePayments: boolean;
  includeNotes: boolean;
  format: 'pdf' | 'html' | 'excel';
  orientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
  branding: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: Date;
  fileSize: string;
  downloadUrl: string;
  emailSent: boolean;
}

interface WeddingPDFReportsProps {
  wedding: WeddingParty;
  onUpdate?: () => void;
}

const WeddingPDFReports: React.FC<WeddingPDFReportsProps> = ({ 
  wedding, 
  onUpdate 
}) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'Wedding Summary Report',
      description: 'Complete overview of wedding party, progress, and timeline',
      type: 'summary',
      sections: ['overview', 'members', 'progress', 'timeline', 'payments'],
      isDefault: true,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Progress Report',
      description: 'Current status of measurements, fittings, and deliveries',
      type: 'progress',
      sections: ['progress', 'pending_items', 'timeline', 'alerts'],
      isDefault: true,
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Member Directory',
      description: 'Contact information and details for all wedding party members',
      type: 'member_list',
      sections: ['members', 'contact_info', 'measurements', 'notes'],
      isDefault: true,
      createdAt: new Date(),
    },
    {
      id: '4',
      name: 'Analytics Dashboard',
      description: 'Charts and metrics for wedding planning insights',
      type: 'analytics',
      sections: ['charts', 'metrics', 'trends', 'comparisons'],
      isDefault: true,
      createdAt: new Date(),
    },
    {
      id: '5',
      name: 'Invoice & Payments',
      description: 'Financial summary and payment tracking',
      type: 'invoice',
      sections: ['payments', 'invoices', 'outstanding', 'totals'],
      isDefault: true,
      createdAt: new Date(),
    },
  ]);

  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    template: templates[0],
    includePhotos: true,
    includeCharts: true,
    includeTimeline: true,
    includeMeasurements: true,
    includePayments: true,
    includeNotes: false,
    format: 'pdf',
    orientation: 'portrait',
    fontSize: 'medium',
    branding: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a report template');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `${selectedTemplate.name} - ${wedding.weddingCode}`,
        type: selectedTemplate.type,
        generatedAt: new Date(),
        fileSize: '2.4 MB',
        downloadUrl: '#', // In real app, this would be the actual file URL
        emailSent: false,
      };

      setGeneratedReports([newReport, ...generatedReports]);
      setShowGenerateDialog(false);
      setIsGenerating(false);
      
      // Auto-download the report
      downloadReport(newReport);
      
      toast.success('Report generated successfully!');
    } catch (error) {
      setIsGenerating(false);
      toast.error('Failed to generate report');
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    // Generate mock PDF content
    const pdfContent = generatePDFContent(report);
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded!');
  };

  const generatePDFContent = (report: GeneratedReport): string => {
    // This is a simplified mock. In a real app, you'd use a PDF library like jsPDF or PDFKit
    const content = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(${report.name}) Tj
0 -20 Td
(Generated: ${format(report.generatedAt, 'MMM dd, yyyy HH:mm')}) Tj
0 -20 Td
(Wedding: ${wedding.groomInfo.name} & ${wedding.brideInfo.name}) Tj
0 -20 Td
(Wedding Code: ${wedding.weddingCode}) Tj
0 -20 Td
(Wedding Date: ${format(wedding.weddingDate, 'MMMM dd, yyyy')}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;
    
    return content;
  };

  const previewReport = (template: ReportTemplate) => {
    const htmlContent = generateHTMLPreview(template);
    setPreviewContent(htmlContent);
    setShowPreviewDialog(true);
  };

  const generateHTMLPreview = (template: ReportTemplate): string => {
    const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
    const completedMeasurements = wedding.members.filter(m => m.measurementStatus === 'completed').length;
    const pendingMeasurements = wedding.members.filter(m => m.measurementStatus === 'pending').length;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <header style="text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">${template.name}</h1>
          <h2 style="color: #666; margin: 10px 0;">${wedding.groomInfo.name} & ${wedding.brideInfo.name}</h2>
          <p style="color: #888; margin: 5px 0;">Wedding Code: ${wedding.weddingCode}</p>
          <p style="color: #888; margin: 5px 0;">Wedding Date: ${format(wedding.weddingDate, 'MMMM dd, yyyy')}</p>
          <p style="color: #888; margin: 5px 0;">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        </header>

        ${template.sections.includes('overview') ? `
        <section style="margin-bottom: 30px;">
          <h3 style="color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Wedding Overview</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Timeline</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${daysUntilWedding <= 7 ? '#d32f2f' : '#1976d2'};">
                ${daysUntilWedding} days
              </p>
              <p style="margin: 5px 0 0 0; color: #666;">until wedding</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Party Size</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1976d2;">
                ${wedding.members.length}
              </p>
              <p style="margin: 5px 0 0 0; color: #666;">members</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Progress</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${completedMeasurements === wedding.members.length ? '#2e7d32' : '#ed6c02'};">
                ${Math.round((completedMeasurements / wedding.members.length) * 100)}%
              </p>
              <p style="margin: 5px 0 0 0; color: #666;">complete</p>
            </div>
          </div>
        </section>
        ` : ''}

        ${template.sections.includes('members') ? `
        <section style="margin-bottom: 30px;">
          <h3 style="color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Wedding Party Members</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Name</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Role</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Contact</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${wedding.members.map(member => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${member.name}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${member.role.replace('_', ' ')}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${member.email || member.phone || 'N/A'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${
                      member.measurementStatus === 'completed' ? '#e8f5e8' : 
                      member.measurementStatus === 'submitted' ? '#fff3cd' : '#ffebee'
                    }; color: ${
                      member.measurementStatus === 'completed' ? '#2e7d32' : 
                      member.measurementStatus === 'submitted' ? '#ed6c02' : '#d32f2f'
                    };">
                      ${member.measurementStatus}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
        ` : ''}

        ${template.sections.includes('progress') ? `
        <section style="margin-bottom: 30px;">
          <h3 style="color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Progress Summary</h3>
          <div style="margin-top: 20px;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #333; margin-bottom: 10px;">Measurements Status</h4>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Completed: ${completedMeasurements}</span>
                  <span>Pending: ${pendingMeasurements}</span>
                </div>
                <div style="background: #ddd; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background: #2e7d32; height: 100%; width: ${(completedMeasurements / wedding.members.length) * 100}%; transition: width 0.3s ease;"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888;">
          <p>Generated by KCT Menswear Wedding Management System</p>
          <p>${format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
        </footer>
      </div>
    `;
  };

  const emailReport = async (report: GeneratedReport) => {
    try {
      // Mock email sending
      console.log(`Emailing report: ${report.name}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update report status
      const updatedReports = generatedReports.map(r => 
        r.id === report.id ? { ...r, emailSent: true } : r
      );
      setGeneratedReports(updatedReports);
      
      toast.success('Report emailed successfully!');
    } catch (error) {
      toast.error('Failed to email report');
    }
  };

  const deleteReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      setGeneratedReports(generatedReports.filter(r => r.id !== reportId));
      toast.success('Report deleted successfully!');
    }
  };

  const getTemplateIcon = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'summary': return <ReportIcon />;
      case 'progress': return <TimelineIcon />;
      case 'analytics': return <AnalyticsIcon />;
      case 'member_list': return <GroupIcon />;
      case 'timeline': return <ScheduleIcon />;
      case 'invoice': return <InvoiceIcon />;
      default: return <PdfIcon />;
    }
  };

  const getTemplateColor = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'summary': return 'primary';
      case 'progress': return 'info';
      case 'analytics': return 'success';
      case 'member_list': return 'warning';
      case 'timeline': return 'secondary';
      case 'invoice': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="primary" />
          PDF Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => setShowGenerateDialog(true)}
        >
          Generate Report
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Reports Generated
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {generatedReports.length}
                  </Typography>
                </Box>
                <PdfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Templates Available
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {templates.length}
                  </Typography>
                </Box>
                <ReportIcon sx={{ fontSize: 40, color: 'info.main' }} />
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
                    Emailed Reports
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {generatedReports.filter(r => r.emailSent).length}
                  </Typography>
                </Box>
                <EmailIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Days to Wedding
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={
                    differenceInDays(wedding.weddingDate, new Date()) <= 7 ? 'error.main' : 'primary.main'
                  }>
                    {differenceInDays(wedding.weddingDate, new Date())}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Templates */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Report Templates
          </Typography>
          
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid xs={12} md={6} key={template.id}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: `${getTemplateColor(template.type)}.light`,
                      color: `${getTemplateColor(template.type)}.main`
                    }}>
                      {getTemplateIcon(template.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Stack direction="row" spacing={1} mb={2}>
                        <Chip 
                          label={template.type.replace('_', ' ')} 
                          size="small" 
                          color={getTemplateColor(template.type) as any}
                        />
                        {template.isDefault && (
                          <Chip label="Default" size="small" variant="outlined" />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PreviewIcon />}
                          onClick={() => previewReport(template)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setReportConfig({ ...reportConfig, template });
                            setShowGenerateDialog(true);
                          }}
                        >
                          Generate
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Generated Reports ({generatedReports.length})
          </Typography>
          
          {generatedReports.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PdfIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No reports generated yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ mt: 2 }}
                onClick={() => setShowGenerateDialog(true)}
              >
                Generate Your First Report
              </Button>
            </Box>
          ) : (
            <List>
              {generatedReports.map((report) => (
                <ListItem key={report.id} divider>
                  <ListItemIcon>
                    <PdfIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {report.name}
                        </Typography>
                        <Chip
                          label={report.type.replace('_', ' ')}
                          size="small"
                          color="primary"
                        />
                        {report.emailSent && (
                          <Chip
                            label="Emailed"
                            size="small"
                            color="success"
                            icon={<CheckIcon />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          Generated: {format(report.generatedAt, 'MMM dd, yyyy HH:mm')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Size: {report.fileSize}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => downloadReport(report)}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => emailReport(report)}>
                      <EmailIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteReport(report.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  label="Report Template"
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                    if (template) {
                      setReportConfig({ ...reportConfig, template });
                    }
                  }}
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={reportConfig.format}
                  label="Format"
                  onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value as any })}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={reportConfig.orientation}
                  label="Orientation"
                  onChange={(e) => setReportConfig({ ...reportConfig, orientation: e.target.value as any })}
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Include Sections:
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includePhotos}
                      onChange={(e) => setReportConfig({ ...reportConfig, includePhotos: e.target.checked })}
                    />
                  }
                  label="Photos & Images"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeCharts}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeCharts: e.target.checked })}
                    />
                  }
                  label="Charts & Analytics"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeTimeline}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeTimeline: e.target.checked })}
                    />
                  }
                  label="Timeline & Progress"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeMeasurements}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeMeasurements: e.target.checked })}
                    />
                  }
                  label="Measurements & Sizing"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includePayments}
                      onChange={(e) => setReportConfig({ ...reportConfig, includePayments: e.target.checked })}
                    />
                  }
                  label="Payments & Invoices"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.branding}
                      onChange={(e) => setReportConfig({ ...reportConfig, branding: e.target.checked })}
                    />
                  }
                  label="Company Branding"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateReport}
            variant="contained"
            disabled={!selectedTemplate || isGenerating}
            startIcon={isGenerating ? <SettingsIcon /> : <DownloadIcon />}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          <Box 
            sx={{ 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: 1, 
              p: 2, 
              bgcolor: 'background.paper',
              maxHeight: '70vh',
              overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          <Button 
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              setShowPreviewDialog(false);
              setShowGenerateDialog(true);
            }}
          >
            Generate This Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeddingPDFReports; 