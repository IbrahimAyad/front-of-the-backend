import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Avatar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Favorite,
  Groups,
  ShoppingCart,
  Add,
  Remove,
  Delete,
  ExpandMore,
  PhotoCamera,
  Share,
  Download,
  CheckCircle,
  Star,
  Palette,
  Event,
  AttachMoney,
  Group,
  Person
} from '@mui/icons-material';
import tiesAPI from '../../services/tiesAPI';

// Interfaces
interface WeddingPartyMember {
  id: string;
  name: string;
  role: 'groom' | 'groomsman' | 'father-bride' | 'father-groom' | 'officiant' | 'guest';
  color: string;
  colorFamily: string;
  width: string;
  quantity: number;
  price: number;
}

interface BundlePricing {
  subtotal: number;
  discount: number;
  discountPercentage: number;
  total: number;
  savings: number;
}

interface WeddingTheme {
  name: string;
  colors: string[];
  description: string;
  season: string;
  style: 'classic' | 'modern' | 'rustic' | 'bohemian' | 'vintage';
}

// Styled Components
const ThemeCard = styled(Card)<{ selected?: boolean }>(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
  }
}));

const MemberCard = styled(Card)({
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  }
});

const PricingCard = styled(Card)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  '& .MuiTypography-root': {
    color: 'white'
  }
});

const ColorDot = styled(Box)<{ color: string }>(({ color }) => ({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: color,
  border: '2px solid white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  margin: '0 2px'
}));

// Wedding Themes Data
const weddingThemes: WeddingTheme[] = [
  {
    name: 'Classic Elegance',
    colors: ['Navy Blue', 'Charcoal', 'Silver'],
    description: 'Timeless sophistication with navy and silver accents',
    season: 'All Seasons',
    style: 'classic'
  },
  {
    name: 'Garden Romance',
    colors: ['Sage Green', 'Dusty Rose', 'Cream'],
    description: 'Soft, romantic colors perfect for outdoor ceremonies',
    season: 'Spring/Summer',
    style: 'bohemian'
  },
  {
    name: 'Autumn Harvest',
    colors: ['Burgundy', 'Gold', 'Chocolate Brown'],
    description: 'Rich, warm tones for fall celebrations',
    season: 'Fall',
    style: 'rustic'
  },
  {
    name: 'Modern Minimalist',
    colors: ['Black', 'White', 'Blush'],
    description: 'Clean, contemporary styling with subtle color accents',
    season: 'All Seasons',
    style: 'modern'
  },
  {
    name: 'Royal Luxury',
    colors: ['Deep Purple', 'Gold', 'Ivory'],
    description: 'Regal colors for grand, formal celebrations',
    season: 'Fall/Winter',
    style: 'vintage'
  },
  {
    name: 'Beach Bliss',
    colors: ['Aqua', 'Coral', 'Sand'],
    description: 'Fresh, coastal colors for seaside weddings',
    season: 'Summer',
    style: 'bohemian'
  }
];

const WeddingBundleBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<WeddingTheme | null>(null);
  const [partyMembers, setPartyMembers] = useState<WeddingPartyMember[]>([]);
  const [bundlePricing, setBundlePricing] = useState<BundlePricing | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [weddingDate, setWeddingDate] = useState<string>('');
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });

  const steps = ['Choose Theme', 'Add Party Members', 'Customize Colors', 'Review & Order'];

  useEffect(() => {
    calculateBundlePricing();
  }, [partyMembers]);

  const calculateBundlePricing = async () => {
    if (partyMembers.length === 0) {
      setBundlePricing(null);
      return;
    }

    try {
      const items = partyMembers.map(member => ({
        productId: `tie-${member.width}`,
        color: member.color,
        quantity: member.quantity,
        price: member.price
      }));

      // Use ties API bundle calculation
      const response = await tiesAPI.calculateBundlePricing(items, {
        bundleType: 'wedding',
        totalQuantity: partyMembers.reduce((sum, member) => sum + member.quantity, 0)
      });

      if (response.success) {
        setBundlePricing(response.data);
      } else {
        // Fallback calculation
        const subtotal = partyMembers.reduce((sum, member) => sum + (member.price * member.quantity), 0);
        const totalQuantity = partyMembers.reduce((sum, member) => sum + member.quantity, 0);
        
        let discountPercentage = 0;
        if (totalQuantity >= 10) discountPercentage = 20;
        else if (totalQuantity >= 6) discountPercentage = 15;
        else if (totalQuantity >= 4) discountPercentage = 10;
        else if (totalQuantity >= 2) discountPercentage = 5;

        const discount = subtotal * (discountPercentage / 100);
        const total = subtotal - discount;

        setBundlePricing({
          subtotal,
          discount,
          discountPercentage,
          total,
          savings: discount
        });
      }
    } catch (error) {
      console.error('Bundle pricing calculation error:', error);
    }
  };

  const addPartyMember = (role: WeddingPartyMember['role']) => {
    const newMember: WeddingPartyMember = {
      id: `member-${Date.now()}`,
      name: '',
      role,
      color: selectedTheme?.colors[0] || 'Navy Blue',
      colorFamily: 'blues',
      width: 'classic-width-tie',
      quantity: 1,
      price: 29.99
    };
    setPartyMembers([...partyMembers, newMember]);
  };

  const updatePartyMember = (id: string, updates: Partial<WeddingPartyMember>) => {
    setPartyMembers(members =>
      members.map(member =>
        member.id === id ? { ...member, ...updates } : member
      )
    );
  };

  const removePartyMember = (id: string) => {
    setPartyMembers(members => members.filter(member => member.id !== id));
  };

  const handleThemeSelect = (theme: WeddingTheme) => {
    setSelectedTheme(theme);
    setActiveStep(1);
  };

  const getRoleDisplayName = (role: WeddingPartyMember['role']): string => {
    const roleNames = {
      'groom': 'Groom',
      'groomsman': 'Groomsman',
      'father-bride': 'Father of Bride',
      'father-groom': 'Father of Groom',
      'officiant': 'Officiant',
      'guest': 'Special Guest'
    };
    return roleNames[role];
  };

  const getRoleIcon = (role: WeddingPartyMember['role']) => {
    switch (role) {
      case 'groom': return <Favorite />;
      case 'groomsman': return <Group />;
      default: return <Person />;
    }
  };

  const handleOrderBundle = () => {
    const orderData = {
      theme: selectedTheme,
      members: partyMembers,
      pricing: bundlePricing,
      weddingDate,
      contactInfo,
      orderType: 'wedding-bundle'
    };
    
    console.log('Wedding Bundle Order:', orderData);
    alert('Wedding bundle order submitted! Our team will contact you within 24 hours to finalize details.');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          💒 Wedding Bundle Builder
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Create the perfect coordinated look for your wedding party. Choose themes, colors, and quantities 
          with automatic bulk pricing and expert color coordination.
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Box mb={4}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step 1: Choose Theme */}
      {activeStep === 0 && (
        <Fade in timeout={300}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Choose Your Wedding Theme
            </Typography>
            <Grid container spacing={3}>
              {weddingThemes.map((theme) => (
                <Grid item xs={12} sm={6} md={4} key={theme.name}>
                  <ThemeCard 
                    selected={selectedTheme?.name === theme.name}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                          {theme.name}
                        </Typography>
                        <Chip label={theme.season} size="small" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {theme.description}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Colors:</Typography>
                        <Box display="flex">
                          {theme.colors.map((color, index) => (
                            <ColorDot key={index} color={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                          ))}
                        </Box>
                      </Box>
                      
                      <Chip label={theme.style} variant="outlined" size="small" />
                    </CardContent>
                  </ThemeCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Step 2: Add Party Members */}
      {activeStep === 1 && (
        <Fade in timeout={300}>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Add Wedding Party Members
              </Typography>
              <Box display="flex" gap={1}>
                <Button variant="outlined" onClick={() => addPartyMember('groom')} startIcon={<Favorite />}>
                  Add Groom
                </Button>
                <Button variant="outlined" onClick={() => addPartyMember('groomsman')} startIcon={<Group />}>
                  Add Groomsman
                </Button>
                <Button variant="outlined" onClick={() => addPartyMember('father-bride')} startIcon={<Person />}>
                  Add Family
                </Button>
              </Box>
            </Box>

            {partyMembers.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Start by adding wedding party members. Each member can have different colors and tie widths.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {partyMembers.map((member) => (
                  <Grid item xs={12} md={6} key={member.id}>
                    <MemberCard>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getRoleIcon(member.role)}
                          </Avatar>
                          <Box flex={1}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Name"
                              value={member.name}
                              onChange={(e) => updatePartyMember(member.id, { name: e.target.value })}
                            />
                          </Box>
                          <IconButton 
                            color="error" 
                            onClick={() => removePartyMember(member.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {getRoleDisplayName(member.role)}
                        </Typography>
                        
                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          <Chip 
                            label={member.color}
                            size="small"
                            onClick={() => {
                              // Navigate to color selection for this member
                              navigate(`/collections/${member.colorFamily}?member=${member.id}`);
                            }}
                          />
                          <Chip label={`$${member.price}`} size="small" variant="outlined" />
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body2">Quantity:</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton 
                              size="small" 
                              onClick={() => updatePartyMember(member.id, { 
                                quantity: Math.max(1, member.quantity - 1) 
                              })}
                            >
                              <Remove />
                            </IconButton>
                            <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                              {member.quantity}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => updatePartyMember(member.id, { 
                                quantity: member.quantity + 1 
                              })}
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </MemberCard>
                  </Grid>
                ))}
              </Grid>
            )}

            {partyMembers.length > 0 && (
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Back to Themes
                </Button>
                <Button variant="contained" onClick={() => setActiveStep(2)}>
                  Customize Colors
                </Button>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Step 3: Customize Colors */}
      {activeStep === 2 && (
        <Fade in timeout={300}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Customize Colors & Styles
            </Typography>
            
            {selectedTheme && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Selected Theme:</strong> {selectedTheme.name} - {selectedTheme.description}
                </Typography>
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Recommended color coordination based on your {selectedTheme?.name} theme:
            </Typography>

            <Box mb={4}>
              {/* Color coordination suggestions would go here */}
              <Alert severity="info">
                Our color experts have pre-selected coordinating colors for your theme. 
                You can customize individual member colors by clicking on their color chips above.
              </Alert>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={() => setActiveStep(1)}>
                Back to Members
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(3)}>
                Review Order
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Step 4: Review & Order */}
      {activeStep === 3 && (
        <Fade in timeout={300}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Review Your Wedding Bundle
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Wedding Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Wedding Date"
                          type="date"
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Contact Name"
                          value={contactInfo.name}
                          onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Order Summary</Typography>
                    {partyMembers.map((member) => (
                      <Box key={member.id} display="flex" justifyContent="space-between" py={1}>
                        <Box>
                          <Typography variant="body1">
                            {member.name || getRoleDisplayName(member.role)} - {member.color}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {member.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ${(member.price * member.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                {bundlePricing && (
                  <PricingCard>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Bundle Pricing</Typography>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Subtotal:</Typography>
                        <Typography>${bundlePricing.subtotal.toFixed(2)}</Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Bundle Discount ({bundlePricing.discountPercentage}%):</Typography>
                        <Typography>-${bundlePricing.discount.toFixed(2)}</Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
                      
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6">${bundlePricing.total.toFixed(2)}</Typography>
                      </Box>
                      
                      <Alert severity="success" sx={{ mb: 2, '& .MuiAlert-message': { color: 'inherit' } }}>
                        You save ${bundlePricing.savings.toFixed(2)} with bundle pricing!
                      </Alert>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handleOrderBundle}
                        sx={{ 
                          bgcolor: 'white', 
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'grey.100' }
                        }}
                      >
                        Order Wedding Bundle
                      </Button>
                    </CardContent>
                  </PricingCard>
                )}
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button variant="outlined" onClick={() => setActiveStep(2)}>
                Back to Customization
              </Button>
              <Button variant="text" onClick={() => setShowPricingDialog(true)}>
                View Pricing Details
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Pricing Details Dialog */}
      <Dialog open={showPricingDialog} onClose={() => setShowPricingDialog(false)} maxWidth="md">
        <DialogTitle>Bundle Pricing Details</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Volume Discounts:</Typography>
          <List>
            <ListItem>
              <ListItemText primary="2-3 ties: 5% discount" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4-5 ties: 10% discount" />
            </ListItem>
            <ListItem>
              <ListItemText primary="6-9 ties: 15% discount" />
            </ListItem>
            <ListItem>
              <ListItemText primary="10+ ties: 20% discount" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPricingDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WeddingBundleBuilder;