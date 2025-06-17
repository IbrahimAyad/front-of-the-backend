import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Download,
  Person,
  Straighten,
  Palette,
  TrendingUp,
  Close,
} from '@mui/icons-material';

interface LeadMagnetGeneratorProps {
  open: boolean;
  onClose: () => void;
}

const LeadMagnetGenerator: React.FC<LeadMagnetGeneratorProps> = ({ open, onClose }) => {
  const [selectedMagnet, setSelectedMagnet] = useState('fit-guide');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    style: '',
    size: '',
    budget: ''
  });

  const leadMagnets = {
    'fit-guide': {
      title: 'Perfect Fit Guide',
      description: 'Learn how to measure yourself and find clothes that fit perfectly',
      icon: <Straighten sx={{ color: '#1976d2' }} />,
      preview: [
        'How to measure chest, waist, shoulders',
        'Size conversion charts (US, EU, UK)',
        'Common fit mistakes to avoid',
        'When to size up vs size down',
        'Tailoring basics'
      ]
    },
    'style-quiz': {
      title: 'Style Personality Quiz',
      description: 'Discover your personal style and get curated recommendations',
      icon: <Person sx={{ color: '#1976d2' }} />,
      preview: [
        'Lifestyle assessment questionnaire',
        'Body type and preference analysis',
        'Personal color palette',
        'Curated product recommendations',
        'Style inspiration board'
      ]
    },
    'color-guide': {
      title: 'Color Coordination Masterclass',
      description: 'Master the art of color matching and coordination',
      icon: <Palette sx={{ color: '#1976d2' }} />,
      preview: [
        'Color wheel basics for menswear',
        'Seasonal color analysis',
        'Pattern mixing guidelines',
        'Neutral foundation building',
        'Accent color strategies'
      ]
    },
    'trend-report': {
      title: 'Spring 2025 Trend Report',
      description: 'Stay ahead with the latest menswear trends and how to wear them',
      icon: <TrendingUp sx={{ color: '#1976d2' }} />,
      preview: [
        'Top 10 trends for Spring 2025',
        'How to incorporate trends affordably',
        'Timeless vs trendy pieces',
        'Celebrity style breakdown',
        'Shopping guide with price points'
      ]
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateLeadMagnet = () => {
    // This would integrate with your backend to generate the actual PDF/content
    alert(`Generating ${leadMagnets[selectedMagnet as keyof typeof leadMagnets].title} for ${formData.name}...`);
    onClose();
    // Reset form
    setFormData({
      name: '',
      email: '',
      style: '',
      size: '',
      budget: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            KCT Menswear Lead Magnet Generator
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Create high-converting lead magnets for your menswear customers
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Lead Magnet Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Choose Your Lead Magnet
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {Object.entries(leadMagnets).map(([key, magnet]) => (
                <Card
                  key={key}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedMagnet === key ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: selectedMagnet === key ? '#f3f7ff' : 'white',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: '#f8faff'
                    }
                  }}
                  onClick={() => setSelectedMagnet(key)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="start" gap={2}>
                      {magnet.icon}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {magnet.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mt={0.5}>
                          {magnet.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Preview and Form */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Preview & Generate
            </Typography>
            
            {/* Preview */}
            <Card sx={{ bgcolor: '#f5f5f5', mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {leadMagnets[selectedMagnet as keyof typeof leadMagnets].icon}
                  <Typography variant="h6" fontWeight="medium">
                    {leadMagnets[selectedMagnet as keyof typeof leadMagnets].title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {leadMagnets[selectedMagnet as keyof typeof leadMagnets].description}
                </Typography>
                <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                  What's included:
                </Typography>
                <List dense>
                  {leadMagnets[selectedMagnet as keyof typeof leadMagnets].preview.map((item, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#1976d2'
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Form */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Customer Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    size="small"
                  />

                  {selectedMagnet === 'style-quiz' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Style Preference</InputLabel>
                      <Select
                        name="style"
                        value={formData.style}
                        onChange={(e) => setFormData({...formData, style: e.target.value})}
                        label="Style Preference"
                      >
                        <MenuItem value="">Select style</MenuItem>
                        <MenuItem value="business">Business Professional</MenuItem>
                        <MenuItem value="casual">Smart Casual</MenuItem>
                        <MenuItem value="trendy">Fashion Forward</MenuItem>
                        <MenuItem value="classic">Classic Traditional</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <FormControl fullWidth size="small">
                    <InputLabel>Budget Range</InputLabel>
                    <Select
                      name="budget"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      label="Budget Range"
                    >
                      <MenuItem value="">Select budget</MenuItem>
                      <MenuItem value="under-500">Under $500</MenuItem>
                      <MenuItem value="500-1000">$500 - $1,000</MenuItem>
                      <MenuItem value="1000-2000">$1,000 - $2,000</MenuItem>
                      <MenuItem value="2000-plus">$2,000+</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Expected Performance
                </Typography>
                <Grid container spacing={3} textAlign="center">
                  <Grid item xs={4}>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      25-35%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Conversion Rate
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      $45
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Avg. Customer Value
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                      72%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Email Open Rate
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={generateLeadMagnet}
          disabled={!formData.name || !formData.email}
          variant="contained"
          startIcon={<Download />}
          sx={{ bgcolor: '#1976d2' }}
        >
          Generate {leadMagnets[selectedMagnet as keyof typeof leadMagnets].title}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadMagnetGenerator; 