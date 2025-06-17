import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Campaign,
  TrendingUp,
  AutoAwesome,
  ContentCopy,
  Instagram,
  Facebook,
  Twitter,
  LinkedIn,
  Email,
  Search,
  Analytics,
  Lightbulb,
  Rocket,
  Star,
  Schedule,
  CheckCircle,
  Warning,
  SmartToy,
  Psychology,
  Insights,
  Link,
  Article,
  PhotoCamera,
  VideoLibrary,
  AttachMoney,
  Speed,
  Visibility,
  ThumbUp,
  Share,
  Download,
  Edit,
  PlayArrow,
  Pause,
  Settings,
  Person,
  Palette,
  Straighten,
  Close,
  Favorite,
} from '@mui/icons-material';
import TinderStyleSwipe from '../../components/Marketing/TinderStyleSwipe';
import { CLIENT_CONFIG } from '../../config/client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketing-tabpanel-${index}`}
      aria-labelledby={`marketing-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Mock data
const mockCampaigns = [
  { id: 1, name: 'Wedding Season 2024', type: 'Social Media', status: 'Active', reach: 15000, engagement: 8.5, budget: 2500, roi: 340 },
  { id: 2, name: 'Business Professional', type: 'Google Ads', status: 'Active', reach: 8500, engagement: 12.3, budget: 1800, roi: 280 },
  { id: 3, name: 'Holiday Collection', type: 'Email', status: 'Scheduled', reach: 5200, engagement: 15.7, budget: 800, roi: 450 },
];

const mockContentIdeas = [
  { id: 1, title: 'Wedding Suit Styling Tips', platform: 'Instagram', status: 'Ready', engagement_score: 92, aiGenerated: true },
  { id: 2, title: 'Business Attire Trends 2024', platform: 'LinkedIn', status: 'In Review', engagement_score: 88, aiGenerated: true },
  { id: 3, title: 'Custom Tailoring Process', platform: 'Facebook', status: 'Draft', engagement_score: 85, aiGenerated: false },
  { id: 4, title: 'Fabric Selection Guide', platform: 'Blog', status: 'Ready', engagement_score: 90, aiGenerated: true },
];

const mockSEOKeywords = [
  { keyword: 'custom wedding suits', volume: 2400, difficulty: 45, ranking: 8, opportunity: 'High' },
  { keyword: 'business suits tailoring', volume: 1800, difficulty: 52, ranking: 12, opportunity: 'Medium' },
  { keyword: 'menswear alterations', volume: 3200, difficulty: 38, ranking: 5, opportunity: 'High' },
  { keyword: 'luxury menswear', volume: 1200, difficulty: 68, ranking: 15, opportunity: 'Low' },
];

const mockLeadMagnets = [
  { id: 1, title: 'Ultimate Wedding Suit Guide', downloads: 245, conversion: 18.5, status: 'Active', type: 'PDF' },
  { id: 2, title: 'Business Dress Code Handbook', downloads: 189, conversion: 22.1, status: 'Active', type: 'eBook' },
  { id: 3, title: 'Measurement Guide PDF', downloads: 156, conversion: 15.8, status: 'Active', type: 'PDF' },
  { id: 4, title: 'Style Quiz: Find Your Perfect Suit', downloads: 312, conversion: 28.3, status: 'Active', type: 'Interactive' },
];

const mockBacklinkOpportunities = [
  { domain: 'weddingwire.com', authority: 85, relevance: 'High', status: 'Opportunity', type: 'Guest Post' },
  { domain: 'gq.com', authority: 92, relevance: 'Medium', status: 'Outreach Sent', type: 'Feature' },
  { domain: 'theknot.com', authority: 88, relevance: 'High', status: 'Opportunity', type: 'Directory' },
  { domain: 'esquire.com', authority: 90, relevance: 'Medium', status: 'In Progress', type: 'Interview' },
];

// Types for mock data (for UI only)
type UICampaign = { id: number; name: string; type: string; status: string; reach: number; engagement: number; budget: number; roi: number };
type UIContentIdea = { id: number; title: string; platform: string; status: string; engagement_score: number; aiGenerated: boolean };
type UISEOKeyword = { keyword: string; volume: number; difficulty: number; ranking: number; opportunity: string };
type UILeadMagnet = { id: number; title: string; downloads: number; conversion: number; status: string; type: string };
type UIBacklink = { domain: string; authority: number; relevance: string; status: string; type: string };

// Real data fetching (placeholder for now)
const realCampaigns: UICampaign[] = [];
const realContentIdeas: UIContentIdea[] = [];
const realSEOKeywords: UISEOKeyword[] = [];
const realLeadMagnets: UILeadMagnet[] = [];
const realBacklinkOpportunities: UIBacklink[] = [];

// Use feature flag to select data
const campaigns = CLIENT_CONFIG.USE_MOCK_DATA ? mockCampaigns : realCampaigns;
const contentIdeas = CLIENT_CONFIG.USE_MOCK_DATA ? mockContentIdeas : realContentIdeas;
const seoKeywords = CLIENT_CONFIG.USE_MOCK_DATA ? mockSEOKeywords : realSEOKeywords;
const leadMagnetsData = CLIENT_CONFIG.USE_MOCK_DATA ? mockLeadMagnets : realLeadMagnets;
const backlinkOpportunities = CLIENT_CONFIG.USE_MOCK_DATA ? mockBacklinkOpportunities : realBacklinkOpportunities;

// Palette color keys for StatCard
export type PaletteColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Lead magnet type
interface LeadMagnetType {
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    title: string;
    description: string;
    features: string[];
    expectedResults: string;
  };
}

// Use Record<string, LeadMagnetType> for leadMagnets
const leadMagnets: Record<string, LeadMagnetType> = {
  perfectFit: {
    title: "Perfect Fit Guide",
    description: "Interactive measurement and sizing guide",
    icon: <Straighten className="w-8 h-8" />,
    preview: {
      title: "Perfect Fit Measurement Guide",
      description: "Get your exact measurements for the perfect fit every time",
      features: ["Body measurement calculator", "Size recommendation engine", "Fit preference analysis"],
      expectedResults: "25% conversion rate, $45 average order value"
    }
  },
  styleQuiz: {
    title: "Style Personality Quiz",
    description: "Discover your unique style profile",
    icon: <Person className="w-8 h-8" />,
    preview: {
      title: "Style Personality Assessment",
      description: "Uncover your personal style DNA with our comprehensive quiz",
      features: ["15-question style assessment", "Personalized style profile", "Curated product recommendations"],
      expectedResults: "35% conversion rate, $52 average order value"
    }
  },
  colorMaster: {
    title: "Color Coordination Masterclass",
    description: "Master the art of color matching",
    icon: <Palette className="w-8 h-8" />,
    preview: {
      title: "Color Coordination Masterclass",
      description: "Learn professional color matching techniques",
      features: ["Color wheel fundamentals", "Seasonal color analysis", "Pattern mixing guide"],
      expectedResults: "28% conversion rate, $38 average order value"
    }
  },
  trendReport: {
    title: "Spring 2025 Trend Report",
    description: "Exclusive fashion trend insights",
    icon: <TrendingUp className="w-8 h-8" />,
    preview: {
      title: "Spring 2025 Fashion Trends",
      description: "Get ahead of the curve with insider trend knowledge",
      features: ["Runway trend analysis", "Styling recommendations", "Investment piece guide"],
      expectedResults: "32% conversion rate, $48 average order value"
    }
  },
  tinderSwipe: {
    title: "Tinder Style Swipe",
    description: "Interactive product matching game",
    icon: <Favorite className="w-8 h-8" />,
    preview: {
      title: "Style Match Game",
      description: "Swipe through products to test your style knowledge",
      features: ["Interactive swipe interface", "Style knowledge test", "Personalized results"],
      expectedResults: "42% conversion rate, $55 average order value"
    }
  }
};

const MarketingHubPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [aiMode, setAiMode] = useState(true);
  const [leadMagnetDialogOpen, setLeadMagnetDialogOpen] = useState(false);
  const [selectedMagnet, setSelectedMagnet] = useState('perfectFit');
  const [showTinderSwipe, setShowTinderSwipe] = useState(false);
  const [magnetFormData, setMagnetFormData] = useState({
    name: '',
    email: '',
    style: '',
    budget: '',
    eventType: 'blackTie'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'scheduled': return 'warning';
      case 'ready': return 'success';
      case 'in review': return 'warning';
      case 'draft': return 'info';
      case 'opportunity': return 'primary';
      case 'in progress': return 'warning';
      case 'outreach sent': return 'info';
      default: return 'default';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram sx={{ color: '#E4405F' }} />;
      case 'facebook': return <Facebook sx={{ color: '#1877F2' }} />;
      case 'twitter': return <Twitter sx={{ color: '#1DA1F2' }} />;
      case 'linkedin': return <LinkedIn sx={{ color: '#0A66C2' }} />;
      case 'email': return <Email sx={{ color: '#EA4335' }} />;
      case 'blog': return <Article sx={{ color: '#FF6B35' }} />;
      default: return <Campaign />;
    }
  };

  // StatCard with PaletteColorKey
  const StatCard = ({ title, value, icon, color, subtitle, trend }: { title: string; value: number; icon: React.ReactNode; color: PaletteColorKey; subtitle?: string; trend?: number }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" mt={1}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  +{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const handleInputChange = (field: string, value: string) => {
    setMagnetFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateLeadMagnet = () => {
    if (selectedMagnet === 'tinderSwipe') {
      // Show the Tinder Style Swipe component
      setShowTinderSwipe(true);
      setLeadMagnetDialogOpen(false);
    } else {
      // This would integrate with your backend to generate the actual PDF/content
      alert(`Generating ${leadMagnets[selectedMagnet as keyof typeof leadMagnets].title} for ${magnetFormData.name}...`);
      setLeadMagnetDialogOpen(false);
    }
    
    // Reset form
    setMagnetFormData({
      name: '',
      email: '',
      style: '',
      budget: '',
      eventType: 'blackTie'
    });
  };

  // If showing Tinder Swipe, render that component
  if (showTinderSwipe) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            onClick={() => setShowTinderSwipe(false)}
            startIcon={<Close />}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Marketing Hub
          </Button>
          <Typography variant="h4">
            Tinder Style Swipe - Lead Magnet Demo
          </Typography>
        </Box>
        <TinderStyleSwipe 
          eventType={magnetFormData.eventType}
          onComplete={(results) => {
            console.log('Game completed:', results);
            // Handle completion - could save results, show analytics, etc.
          }}
        />
      </Box>
    );
  }

  const tabs = [
    {
      label: 'AI Content Studio',
      icon: <SmartToy />,
      component: (
        <Grid container spacing={3}>
          {/* AI Content Generation */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="bold">
                    AI Content Generator
                  </Typography>
                  <FormControlLabel
                    control={<Switch checked={aiMode} onChange={(e) => setAiMode(e.target.checked)} />}
                    label="AI Mode"
                  />
                </Box>
                
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Content Type</InputLabel>
                      <Select defaultValue="social-post" label="Content Type">
                        <MenuItem value="social-post">Social Media Post</MenuItem>
                        <MenuItem value="blog-article">Blog Article</MenuItem>
                        <MenuItem value="email-campaign">Email Campaign</MenuItem>
                        <MenuItem value="ad-copy">Ad Copy</MenuItem>
                        <MenuItem value="product-description">Product Description</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Platform</InputLabel>
                      <Select defaultValue="instagram" label="Platform">
                        <MenuItem value="instagram">Instagram</MenuItem>
                        <MenuItem value="facebook">Facebook</MenuItem>
                        <MenuItem value="linkedin">LinkedIn</MenuItem>
                        <MenuItem value="twitter">Twitter</MenuItem>
                        <MenuItem value="blog">Blog</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe what you want to create... (e.g., 'Create a post about our new wedding suit collection highlighting craftsmanship and elegance')"
                  sx={{ mb: 3 }}
                />

                <Box display="flex" gap={2} mb={3}>
                  <Button variant="contained" startIcon={<AutoAwesome />} sx={{ bgcolor: 'purple' }}>
                    Generate with AI
                  </Button>
                  <Button variant="outlined" startIcon={<PhotoCamera />}>
                    Add Images
                  </Button>
                  <Button variant="outlined" startIcon={<Schedule />}>
                    Schedule Post
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>AI Suggestion</AlertTitle>
                  Based on your recent performance, posts about wedding suits get 40% more engagement on weekends.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Ideas */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  AI Content Ideas
                </Typography>
                <List dense>
                  {contentIdeas.map((idea) => (
                    <ListItem key={idea.id} divider>
                      <ListItemIcon>
                        {getPlatformIcon(idea.platform)}
                      </ListItemIcon>
                      <ListItemText
                        primary={idea.title}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip 
                              label={idea.status} 
                              size="small" 
                              color={getStatusColor(idea.status) as any}
                              variant="outlined"
                            />
                            {idea.aiGenerated && (
                              <Chip 
                                label="AI" 
                                size="small" 
                                sx={{ bgcolor: 'purple', color: 'white' }}
                              />
                            )}
                            <Typography variant="caption" color="success.main">
                              {idea.engagement_score}% score
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'SEO & Keywords',
      icon: <Search />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Keyword Performance & Opportunities
                </Typography>
                <List>
                  {seoKeywords.map((keyword, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight="medium">{keyword.keyword}</Typography>
                            <Chip 
                              label={keyword.opportunity} 
                              size="small" 
                              color={keyword.opportunity === 'High' ? 'success' : keyword.opportunity === 'Medium' ? 'warning' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Grid container spacing={2}>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="textSecondary">Volume</Typography>
                                <Typography variant="body2" fontWeight="medium">{keyword.volume.toLocaleString()}/mo</Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="textSecondary">Difficulty</Typography>
                                <Box display="flex" alignItems="center">
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={keyword.difficulty} 
                                    sx={{ width: 40, mr: 1 }}
                                    color={keyword.difficulty < 40 ? 'success' : keyword.difficulty < 60 ? 'warning' : 'error'}
                                  />
                                  <Typography variant="body2">{keyword.difficulty}</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="textSecondary">Current Rank</Typography>
                                <Typography variant="body2" fontWeight="medium">#{keyword.ranking}</Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Button size="small" variant="outlined" startIcon={<Rocket />}>
                                  Optimize
                                </Button>
                              </Grid>
                            </Grid>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  SEO Health Score
                </Typography>
                <Box textAlign="center" mb={2}>
                  <Typography variant="h2" fontWeight="bold" color="success.main">
                    78
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Good - Room for improvement
                  </Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Meta descriptions optimized" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="warning" /></ListItemIcon>
                    <ListItemText primary="Page speed needs improvement" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Mobile-friendly design" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Content Suggestions
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Wedding Suit Trends 2024"
                      secondary="High search volume, low competition"
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Write" size="small" color="primary" />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Suit Fitting Guide"
                      secondary="Evergreen content opportunity"
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Write" size="small" color="primary" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Lead Magnets',
      icon: <Lightbulb />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="bold">
                    Lead Magnet Performance
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AutoAwesome />} 
                    sx={{ bgcolor: 'purple' }}
                    onClick={() => setLeadMagnetDialogOpen(true)}
                  >
                    Create New Magnet
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {leadMagnetsData.map((magnet) => (
                    <Grid item xs={12} sm={6} key={magnet.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
                            <Typography variant="h6" fontWeight="medium" sx={{ flexGrow: 1 }}>
                              {magnet.title}
                            </Typography>
                            <Chip 
                              label={magnet.type} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                          
                          <Grid container spacing={2} mb={2}>
                            <Grid item xs={4}>
                              <Box textAlign="center">
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                  {magnet.downloads}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Downloads
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box textAlign="center">
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                  {magnet.conversion}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Conversion
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box textAlign="center">
                                <Chip 
                                  label={magnet.status} 
                                  size="small" 
                                  color={getStatusColor(magnet.status) as any}
                                />
                              </Box>
                            </Grid>
                          </Grid>

                          <Box display="flex" gap={1}>
                            <Button size="small" variant="outlined" startIcon={<Analytics />}>
                              Analytics
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<Edit />}>
                              Edit
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  AI Magnet Ideas
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Groom's Style Checklist"
                      secondary="Interactive PDF with timeline"
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" startIcon={<AutoAwesome />}>
                        Generate
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Suit Care Guide"
                      secondary="Video series + PDF"
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" startIcon={<AutoAwesome />}>
                        Generate
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Body Type Suit Quiz"
                      secondary="Interactive assessment"
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" startIcon={<AutoAwesome />}>
                        Generate
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Performance Insights
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Best performing type
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Interactive Content
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    28.3% avg conversion
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Optimization tip
                  </Typography>
                  <Typography variant="body2">
                    Add video previews to increase download rates by 35%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Backlink Strategy',
      icon: <Link />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Backlink Opportunities
                </Typography>
                <List>
                  {backlinkOpportunities.map((opportunity, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight="medium">{opportunity.domain}</Typography>
                            <Box display="flex" gap={1}>
                              <Chip 
                                label={`DA: ${opportunity.authority}`} 
                                size="small" 
                                color={opportunity.authority > 80 ? 'success' : 'primary'}
                              />
                              <Chip 
                                label={opportunity.relevance} 
                                size="small" 
                                color={opportunity.relevance === 'High' ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {opportunity.type} • {opportunity.status}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Button size="small" variant="outlined">
                                View Details
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                disabled={opportunity.status !== 'Opportunity'}
                              >
                                Start Outreach
                              </Button>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Backlink Health
                </Typography>
                <Box textAlign="center" mb={2}>
                  <Typography variant="h2" fontWeight="bold" color="primary.main">
                    42
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Quality backlinks
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Domain Authority Growth
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <LinearProgress 
                      variant="determinate" 
                      value={65} 
                      sx={{ flexGrow: 1, mr: 1 }}
                      color="success"
                    />
                    <Typography variant="body2" fontWeight="bold">65</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  AI Outreach Assistant
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Personalized email templates generated for each opportunity
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<SmartToy />}
                  sx={{ bgcolor: 'purple' }}
                >
                  Generate Outreach Emails
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Campaign Analytics',
      icon: <Analytics />,
      component: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Active Campaigns
                </Typography>
                <List>
                  {campaigns.map((campaign) => (
                    <ListItem key={campaign.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="medium">
                              {campaign.name}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <Chip 
                                label={campaign.type} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={campaign.status} 
                                size="small" 
                                color={getStatusColor(campaign.status) as any}
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box mt={2}>
                            <Grid container spacing={3}>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">Reach</Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  {campaign.reach.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">Engagement</Typography>
                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                  {campaign.engagement}%
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">Budget</Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  ${campaign.budget}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">ROI</Typography>
                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                  {campaign.roi}%
                                </Typography>
                              </Grid>
                            </Grid>
                            <Box display="flex" gap={1} mt={2}>
                              <Button size="small" variant="outlined" startIcon={<Analytics />}>
                                View Details
                              </Button>
                              <Button size="small" variant="outlined" startIcon={<Edit />}>
                                Edit
                              </Button>
                              <Button size="small" variant="outlined" startIcon={<Pause />}>
                                Pause
                              </Button>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI Marketing Hub
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Intelligent content generation, SEO optimization, and automated marketing campaigns
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Psychology />}
            sx={{ borderColor: 'purple', color: 'purple' }}
          >
            AI Insights
          </Button>
          <Button
            variant="contained"
            startIcon={<Rocket />}
            sx={{ bgcolor: 'purple', '&:hover': { bgcolor: 'darkviolet' } }}
          >
            Launch Campaign
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Reach"
            value={28700}
            icon={<Visibility />}
            color={"primary"}
            subtitle="Monthly reach"
            trend={15.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Engagement Rate"
            value="12.1%"
            icon={<ThumbUp />}
            color="secondary"
            subtitle="Average engagement"
            trend={8.7}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Leads Generated"
            value="156"
            icon={<Lightbulb />}
            color="success"
            subtitle="This month"
            trend={22.4}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Campaign ROI"
            value="340%"
            icon={<AttachMoney />}
            color="warning"
            subtitle="Average return"
            trend={12.8}
          />
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  background: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          <Box
            sx={{
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {tab.component}
          </Box>
        </TabPanel>
      ))}

      {/* Lead Magnet Generator Dialog */}
      <Dialog open={leadMagnetDialogOpen} onClose={() => setLeadMagnetDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              KCT Menswear Lead Magnet Generator
            </Typography>
            <IconButton onClick={() => setLeadMagnetDialogOpen(false)}>
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
              
              {/* Right Panel - Preview */}
              <Grid item xs={12} md={8}>
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {selectedMagnet ? (
                    <>
                      <Typography variant="h5" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                        {leadMagnets[selectedMagnet as keyof typeof leadMagnets].preview.title}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                        {leadMagnets[selectedMagnet as keyof typeof leadMagnets].preview.description}
                      </Typography>

                      {selectedMagnet === 'tinderSwipe' ? (
                        // Special preview for Tinder Style Swipe
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a' }}>
                            Configure Your Style Game
                          </Typography>
                          
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Event Type</InputLabel>
                            <Select
                              value={magnetFormData.eventType || 'blackTie'}
                              onChange={(e) => handleInputChange('eventType', e.target.value)}
                              label="Event Type"
                            >
                              <MenuItem value="blackTie">Black Tie Optional</MenuItem>
                              <MenuItem value="business">Business Casual</MenuItem>
                              <MenuItem value="wedding">Wedding Guest</MenuItem>
                              <MenuItem value="cocktail">Cocktail Party</MenuItem>
                              <MenuItem value="casual">Smart Casual</MenuItem>
                            </Select>
                          </FormControl>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>
                              Game Preview
                            </Typography>
                            <Box sx={{ 
                              border: '2px dashed #ddd', 
                              borderRadius: 2, 
                              p: 3, 
                              textAlign: 'center',
                              backgroundColor: '#f9f9f9'
                            }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>
                                "Do you know what to wear to a {magnetFormData.eventType === 'blackTie' ? 'Black Tie Optional' : magnetFormData.eventType} event?"
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                                Users will swipe through 12 products - some appropriate, some not
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                                <Chip label="6-7 Correct Items" color="success" size="small" />
                                <Chip label="5-6 Incorrect Items" color="error" size="small" />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Results show style knowledge score + personalized recommendations
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>
                              Features
                            </Typography>
                            <List dense>
                              {leadMagnets[selectedMagnet as keyof typeof leadMagnets].preview.features.map((feature, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                                  </ListItemIcon>
                                  <ListItemText primary={feature} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Box>
                      ) : (
                        // Regular preview for other magnets
                        <>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>
                              Features
                            </Typography>
                            <List dense>
                              {leadMagnets[selectedMagnet as keyof typeof leadMagnets].preview.features.map((feature, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                                  </ListItemIcon>
                                  <ListItemText primary={feature} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>
                              Customer Information
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Customer Name"
                                  value={magnetFormData.name}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Email Address"
                                  type="email"
                                  value={magnetFormData.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Style Preference"
                                  value={magnetFormData.style}
                                  onChange={(e) => handleInputChange('style', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Budget Range"
                                  value={magnetFormData.budget}
                                  onChange={(e) => handleInputChange('budget', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        </>
                      )}

                      {selectedMagnet === 'tinderSwipe' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>
                            Customer Information
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Customer Name"
                                value={magnetFormData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={magnetFormData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                size="small"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}

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
                    </>
                  ) : (
                    <Typography variant="body1" sx={{ color: '#666', textAlign: 'center', py: 4 }}>
                      Select a lead magnet type to see the preview
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setLeadMagnetDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={generateLeadMagnet}
            disabled={!magnetFormData.name || !magnetFormData.email}
            variant="contained"
            startIcon={<Download />}
            sx={{ bgcolor: '#1976d2' }}
          >
            Generate {leadMagnets[selectedMagnet as keyof typeof leadMagnets].title}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketingHubPage; 