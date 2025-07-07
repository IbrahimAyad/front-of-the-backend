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
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Skeleton,
  Fade,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Favorite,
  Business,
  Event,
  School,
  Celebration,
  LocalFlorist,
  AutoAwesome,
  StarRate,
  TrendingUp,
  ShoppingCart,
  Info,
  CheckCircle,
  Palette
} from '@mui/icons-material';
import tiesAPI from '../../services/tiesAPI';

interface EventRecommendation {
  id: string;
  event: string;
  icon: React.ReactNode;
  description: string;
  season?: string;
  formalityLevel: 'casual' | 'business' | 'semi-formal' | 'formal' | 'black-tie';
  recommendedColors: {
    primary: string[];
    secondary: string[];
    avoid: string[];
  };
  recommendedWidths: string[];
  tips: string[];
  popularCombinations: {
    color: string;
    family: string;
    width: string;
    description: string;
  }[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Styled Components
const EventCard = styled(Card)({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  }
});

const RecommendationCard = styled(Card)({
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  border: '1px solid #e0e0e0'
});

const ColorChip = styled(Chip)<{ colorFamily?: string }>(({ theme, colorFamily }) => {
  const familyColors: Record<string, string> = {
    'blues': '#0074cc',
    'reds': '#e74c3c',
    'greens': '#2ecc71',
    'blacks-grays': '#424242',
    'whites-creams': '#f5f5dc',
    'purples': '#9c27b0',
    'pinks': '#e91e63',
    'yellows-oranges': '#ff9800',
    'browns-neutrals': '#8b4513'
  };
  
  return {
    backgroundColor: familyColors[colorFamily || ''] || theme.palette.grey[300],
    color: 'white',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: familyColors[colorFamily || ''] || theme.palette.grey[400],
    }
  };
});

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EventRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  const eventRecommendations: EventRecommendation[] = [
    {
      id: 'wedding',
      event: 'Wedding',
      icon: <Favorite />,
      description: 'Perfect colors and styles for the most important day',
      season: 'All Seasons',
      formalityLevel: 'formal',
      recommendedColors: {
        primary: ['Navy Blue', 'Charcoal', 'Burgundy', 'Forest Green'],
        secondary: ['Silver', 'Dusty Rose', 'Sage Green', 'Champagne'],
        avoid: ['Bright Yellow', 'Orange', 'Hot Pink']
      },
      recommendedWidths: ['Classic Width (3.25")', 'Skinny (2.75")'],
      tips: [
        'Coordinate with wedding party colors',
        'Consider venue and season',
        'Ensure groom stands out from groomsmen',
        'Have backup ties for the wedding party'
      ],
      popularCombinations: [
        {
          color: 'Navy Blue',
          family: 'blues',
          width: 'classic-width-tie',
          description: 'Classic elegance, works with any wedding theme'
        },
        {
          color: 'Burgundy',
          family: 'reds',
          width: 'classic-width-tie',
          description: 'Rich and romantic, perfect for fall weddings'
        }
      ]
    },
    {
      id: 'business',
      event: 'Business Meeting',
      icon: <Business />,
      description: 'Professional colors that command respect',
      formalityLevel: 'business',
      recommendedColors: {
        primary: ['Navy Blue', 'Charcoal', 'Black', 'Dark Grey'],
        secondary: ['Royal Blue', 'Burgundy', 'Forest Green'],
        avoid: ['Bright Colors', 'Pastels', 'Novelty Patterns']
      },
      recommendedWidths: ['Classic Width (3.25")', 'Skinny (2.75")'],
      tips: [
        'Stick to conservative colors',
        'Match formality of the meeting',
        'Coordinate with suit color',
        'Keep patterns subtle'
      ],
      popularCombinations: [
        {
          color: 'Navy Blue',
          family: 'blues',
          width: 'classic-width-tie',
          description: 'The ultimate business color - versatile and professional'
        },
        {
          color: 'Charcoal',
          family: 'grays-blacks',
          width: 'classic-width-tie',
          description: 'Modern and sophisticated for important meetings'
        }
      ]
    },
    {
      id: 'formal-event',
      event: 'Formal Event',
      icon: <Event />,
      description: 'Elegant choices for galas, premieres, and formal dinners',
      formalityLevel: 'formal',
      recommendedColors: {
        primary: ['Black', 'White', 'Deep Purple', 'Navy Blue'],
        secondary: ['Silver', 'Gold', 'Champagne', 'Ivory'],
        avoid: ['Casual Colors', 'Bright Patterns']
      },
      recommendedWidths: ['Classic Width (3.25")', 'Bow Tie'],
      tips: [
        'Black tie events require bow ties',
        'Match metallic accents',
        'Consider venue lighting',
        'Formal events call for formal widths'
      ],
      popularCombinations: [
        {
          color: 'Black',
          family: 'grays-blacks',
          width: 'bow-tie',
          description: 'Black bow tie - the gold standard for formal events'
        },
        {
          color: 'White',
          family: 'whites-creams',
          width: 'bow-tie',
          description: 'White bow tie for ultra-formal white-tie events'
        }
      ]
    },
    {
      id: 'graduation',
      event: 'Graduation',
      icon: <School />,
      description: 'Celebrate achievements with the perfect tie',
      formalityLevel: 'semi-formal',
      recommendedColors: {
        primary: ['Navy Blue', 'Royal Blue', 'Burgundy', 'Forest Green'],
        secondary: ['School Colors', 'Gold', 'Silver'],
        avoid: ['Too Casual', 'Distracting Patterns']
      },
      recommendedWidths: ['Classic Width (3.25")', 'Skinny (2.75")'],
      tips: [
        'Consider school colors',
        'Photos will be taken - choose wisely',
        'Coordinate with family attire',
        'Weather-appropriate choices'
      ],
      popularCombinations: [
        {
          color: 'Royal Blue',
          family: 'blues',
          width: 'classic-width-tie',
          description: 'Classic graduation color that photographs well'
        }
      ]
    },
    {
      id: 'celebration',
      event: 'Celebration',
      icon: <Celebration />,
      description: 'Festive colors for parties and special occasions',
      formalityLevel: 'semi-formal',
      recommendedColors: {
        primary: ['Celebration Colors', 'Seasonal Choices', 'Personal Favorites'],
        secondary: ['Metallics', 'Festive Hues', 'Theme Colors'],
        avoid: ['Overly Serious', 'Funeral Colors']
      },
      recommendedWidths: ['All Widths', 'Personal Preference'],
      tips: [
        'Match the celebration theme',
        'Consider time of day',
        'Have fun with color choices',
        'Coordinate with other guests'
      ],
      popularCombinations: [
        {
          color: 'Gold',
          family: 'yellows-oranges',
          width: 'skinny-tie',
          description: 'Festive and modern for celebrations'
        }
      ]
    },
    {
      id: 'spring-wedding',
      event: 'Spring Wedding',
      icon: <LocalFlorist />,
      description: 'Fresh, romantic colors for spring ceremonies',
      season: 'Spring',
      formalityLevel: 'formal',
      recommendedColors: {
        primary: ['Sage Green', 'Dusty Rose', 'Lavender', 'Light Blue'],
        secondary: ['Cream', 'Champagne', 'Blush', 'Mint Green'],
        avoid: ['Dark Colors', 'Winter Tones']
      },
      recommendedWidths: ['Classic Width (3.25")', 'Skinny (2.75")'],
      tips: [
        'Embrace soft, romantic colors',
        'Consider outdoor venue lighting',
        'Coordinate with spring flowers',
        'Light colors photograph beautifully'
      ],
      popularCombinations: [
        {
          color: 'Sage Green',
          family: 'greens',
          width: 'classic-width-tie',
          description: 'Perfect for garden and outdoor spring weddings'
        },
        {
          color: 'Dusty Rose',
          family: 'pinks',
          width: 'skinny-tie',
          description: 'Romantic and modern for spring celebrations'
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading event recommendations
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleEventSelect = (event: EventRecommendation) => {
    setSelectedEvent(event);
  };

  const handleColorSelect = (color: string, family: string, width: string) => {
    const colorParam = color.toLowerCase().replace(/\s+/g, '-');
    navigate(`/ties/${width}?color=${colorParam}&family=${family}`);
  };

  const getFormalityColor = (level: string): string => {
    const colors: Record<string, string> = {
      'casual': '#4caf50',
      'business': '#2196f3',
      'semi-formal': '#ff9800',
      'formal': '#9c27b0',
      'black-tie': '#000000'
    };
    return colors[level] || '#757575';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={60} height={60} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={20} width="70%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          🎯 Event-Based Recommendations
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Get expert color and style recommendations based on your specific event. 
          From weddings to business meetings, find the perfect tie for every occasion.
        </Typography>
      </Box>

      {/* Event Selection Grid */}
      {!selectedEvent && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {eventRecommendations.map((event, index) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Fade in timeout={300 + index * 100}>
                <EventCard onClick={() => handleEventSelect(event)}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 2,
                        bgcolor: getFormalityColor(event.formalityLevel)
                      }}
                    >
                      {event.icon}
                    </Avatar>
                    
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {event.event}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {event.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
                      <Chip 
                        label={event.formalityLevel.replace('-', ' ')}
                        size="small"
                        sx={{ 
                          bgcolor: getFormalityColor(event.formalityLevel),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                      {event.season && (
                        <Chip label={event.season} size="small" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>
                </EventCard>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Selected Event Details */}
      {selectedEvent && (
        <Box>
          {/* Back Button and Header */}
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <Button 
              variant="outlined" 
              onClick={() => setSelectedEvent(null)}
              startIcon={<Palette />}
            >
              Back to Events
            </Button>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {selectedEvent.event} Recommendations
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedEvent.description}
              </Typography>
            </Box>
          </Box>

          {/* Tabs for Different Aspects */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Color Recommendations" />
              <Tab label="Popular Combinations" />
              <Tab label="Expert Tips" />
            </Tabs>
          </Box>

          {/* Color Recommendations Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <RecommendationCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      ✅ Recommended Colors
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedEvent.recommendedColors.primary.map((color) => (
                        <ColorChip
                          key={color}
                          label={color}
                          size="small"
                          onClick={() => {
                            // Navigate to color selection
                            const colorParam = color.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/collections/blues?color=${colorParam}`);
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Primary choices that work perfectly for {selectedEvent.event.toLowerCase()}
                    </Typography>
                  </CardContent>
                </RecommendationCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <RecommendationCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary.main">
                      💡 Alternative Options
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedEvent.recommendedColors.secondary.map((color) => (
                        <Chip
                          key={color}
                          label={color}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Great secondary choices for variety and personal style
                    </Typography>
                  </CardContent>
                </RecommendationCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <RecommendationCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error.main">
                      ⚠️ Colors to Avoid
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedEvent.recommendedColors.avoid.map((color) => (
                        <Chip
                          key={color}
                          label={color}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Colors that may not be appropriate for this occasion
                    </Typography>
                  </CardContent>
                </RecommendationCard>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Popular Combinations Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              {selectedEvent.popularCombinations.map((combo, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <StarRate />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{combo.color}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {combo.width.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </Box>
                        <Box ml="auto">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleColorSelect(combo.color, combo.family, combo.width)}
                          >
                            Shop Now
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        {combo.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Expert Tips Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Expert Styling Tips for {selectedEvent.event}
                    </Typography>
                    <List>
                      {selectedEvent.tips.map((tip, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                <CheckCircle fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={tip} />
                          </ListItem>
                          {index < selectedEvent.tips.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommended Widths
                    </Typography>
                    {selectedEvent.recommendedWidths.map((width) => (
                      <Chip
                        key={width}
                        label={width}
                        sx={{ mr: 1, mb: 1 }}
                        variant="outlined"
                      />
                    ))}
                    
                    <Box mt={3}>
                      <Typography variant="h6" gutterBottom>
                        Formality Level
                      </Typography>
                      <Chip
                        label={selectedEvent.formalityLevel.replace('-', ' ')}
                        sx={{
                          bgcolor: getFormalityColor(selectedEvent.formalityLevel),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      )}

      {/* Call to Action */}
      {!selectedEvent && (
        <Box textAlign="center" mt={6}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Need Help Choosing?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Our color experts have curated these recommendations based on thousands of successful styling choices.
            Click any event above to get personalized suggestions.
          </Typography>
          <Button 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/wedding-bundle')}
                            startIcon={<Favorite />}
          >
            Build Wedding Bundle
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default EventRecommendations;