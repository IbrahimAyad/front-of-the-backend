import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AutoAwesome,
  ExpandMore,
  Psychology,
  Description,
  Palette,
  TrendingUp,
  PhotoCamera,
  Share,
  ContentCopy,
  Lightbulb,
  Style,
  Camera,
  TextFields,
} from '@mui/icons-material';
import { SmartProduct } from '../../types';
import { useAIProductEnhancement } from '../../hooks/useAIProductEnhancement';

interface AIProductAssistantProps {
  selectedProducts?: SmartProduct[];
  onApplyChanges?: (changes: any) => void;
}

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
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AIProductAssistant: React.FC<AIProductAssistantProps> = ({
  selectedProducts = [],
  onApplyChanges,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { enhanceProduct, loading, error } = useAIProductEnhancement();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAIRequest = async (type: 'description' | 'seo' | 'styling' | 'pricing' | 'images' | 'semantic_search' | 'voice_description' | 'product_matching', prompt?: string) => {
    try {
      const result = await enhanceProduct({
        type,
        product: selectedProducts[0], // Use first selected product
        userPrompt: prompt || userInput,
      });

      if (result.success) {
        setAiResponse(result.content);
        if (result.suggestions) {
          setSuggestions(result.suggestions);
        }
      }
    } catch (err) {
      console.error('AI Enhancement Error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card sx={{ mt: 3, border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesome color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            AI Product Assistant
          </Typography>
          <Chip 
            label="BETA" 
            size="small" 
            color="primary" 
            sx={{ ml: 2 }} 
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab icon={<Description />} label="Descriptions" />
          <Tab icon={<Style />} label="Styling" />
          <Tab icon={<TrendingUp />} label="SEO & Marketing" />
          <Tab icon={<Palette />} label="Visual Enhancement" />
          <Tab icon={<Psychology />} label="AI Intelligence" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {/* AI Description Generator */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              ✍️ AI Description Generator
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate compelling product descriptions that convert browsers into buyers.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your product or paste existing description for enhancement..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Psychology />}
                onClick={() => handleAIRequest('description', userInput)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Generate Description'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Lightbulb />}
                onClick={() => handleAIRequest('description', 'wedding suit premium')}
              >
                Use Sample
              </Button>
            </Box>

            {aiResponse && (
              <Box>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {aiResponse}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={() => copyToClipboard(aiResponse)}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onApplyChanges?.({ description: aiResponse })}
                    >
                      Apply
                    </Button>
                  </Box>
                </Card>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* AI Styling Suggestions */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              👔 Smart Styling Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get AI-powered styling suggestions and outfit combinations.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Style />}
                onClick={() => handleAIRequest('styling')}
                disabled={loading}
              >
                Generate Styling Ideas
              </Button>
              <Button
                variant="outlined"
                startIcon={<Camera />}
              >
                Analyze Product Images
              </Button>
            </Box>

            {suggestions.length > 0 && (
              <List>
                {suggestions.map((suggestion, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            )}

            {aiResponse && activeTab === 1 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {aiResponse}
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* SEO & Marketing Optimization */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              📈 SEO & Marketing Optimizer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Optimize your products for search engines and better conversion rates.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => handleAIRequest('seo')}
                disabled={loading}
              >
                Generate SEO Content
              </Button>
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={() => handleAIRequest('pricing')}
                disabled={loading}
              >
                Pricing Analysis
              </Button>
            </Box>

            {aiResponse && (activeTab === 2) && (
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {aiResponse}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(aiResponse)}
                  >
                    Copy
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onApplyChanges?.({ seo: aiResponse })}
                  >
                    Apply SEO
                  </Button>
                </Box>
              </Card>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* Visual Enhancement */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              🎨 Visual Enhancement Studio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI-powered image optimization and visual merchandising suggestions.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PhotoCamera />}
                onClick={() => handleAIRequest('images')}
                disabled={loading}
              >
                Optimize Images
              </Button>
              <Button
                variant="outlined"
                startIcon={<Palette />}
              >
                Color Analysis
              </Button>
              <Button
                variant="outlined"
                startIcon={<TextFields />}
              >
                Layout Suggestions
              </Button>
            </Box>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>🖼️ Image Enhancement Features</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Background Removal"
                      secondary="Clean white backgrounds for professional look"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Color Correction"
                      secondary="Ensure accurate color representation"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Auto-Cropping"
                      secondary="Perfect aspect ratios for all platforms"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Style Consistency"
                      secondary="Maintain brand visual standards"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          {/* AI Intelligence Hub */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              🧠 Advanced AI Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Leverage OpenAI's most powerful models for advanced product enhancement.
            </Typography>

            {/* Semantic Search */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Psychology color="primary" sx={{ mr: 1 }} />
                  <Typography>🔍 Semantic Product Search</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Find products based on meaning and context, not just keywords.
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search by style, occasion, feeling... (e.g., 'elegant formal wear for special occasions')"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Psychology />}
                  onClick={() => handleAIRequest('semantic_search')}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : 'Semantic Search'}
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* Voice Descriptions */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Camera color="primary" sx={{ mr: 1 }} />
                  <Typography>🎙️ AI Voice Descriptions</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Generate professional voice-over scripts and audio for your products.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Camera />}
                    onClick={() => handleAIRequest('voice_description')}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  >
                    Generate Voice Script
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  >
                    Upload Audio Sample
                  </Button>
                </Box>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="caption">
                    🎵 Voice generation uses GPT-4o Audio for natural, engaging product descriptions
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* Product Matching */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Lightbulb color="primary" sx={{ mr: 1 }} />
                  <Typography>🤝 Smart Product Matching</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Find similar products and create intelligent recommendations using embeddings.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Lightbulb />}
                  onClick={() => handleAIRequest('product_matching')}
                  disabled={loading}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Find Similar Products'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Uses text-embedding-3-large for high-dimensional product analysis
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* AI Response Display */}
            {aiResponse && activeTab === 4 && (
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50', mt: 3 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {aiResponse}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(aiResponse)}
                  >
                    Copy Results
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onApplyChanges?.({ aiIntelligence: aiResponse })}
                  >
                    Apply Insights
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Share />}
                  >
                    Share Analysis
                  </Button>
                </Box>
              </Card>
            )}

            {/* Embeddings Visualization (if available) */}
            {suggestions.length > 0 && activeTab === 4 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎯 AI Recommendations:
                </Typography>
                <List dense>
                  {suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Psychology color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={suggestion}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        {/* Quick Actions */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            ⚡ Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Generate Bundle Offers" 
              onClick={() => handleAIRequest('pricing')}
              clickable
              size="small"
            />
            <Chip 
              label="Season Trend Analysis" 
              onClick={() => handleAIRequest('styling')}
              clickable
              size="small"
            />
            <Chip 
              label="Competitor Research" 
              onClick={() => handleAIRequest('seo')}
              clickable
              size="small"
            />
            <Chip 
              label="Customer Review Insights" 
              onClick={() => handleAIRequest('description')}
              clickable
              size="small"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIProductAssistant; 