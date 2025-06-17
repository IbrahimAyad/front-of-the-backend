import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Paper,
  Fab,
} from '@mui/material';
import {
  Psychology as AIIcon,
  AutoAwesome as MagicIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Insights as InsightsIcon,
  Recommend as RecommendIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { format, differenceInDays, addDays } from 'date-fns';
import { WeddingParty, WeddingMember } from '../../types';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedActions?: string[];
  estimatedImpact?: string;
  category: 'timeline' | 'measurements' | 'logistics' | 'quality' | 'cost';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type: 'text' | 'insight' | 'action';
}

interface WeddingAIAssistantProps {
  wedding: WeddingParty;
  onUpdate?: () => void;
}

const WeddingAIAssistant: React.FC<WeddingAIAssistantProps> = ({ wedding, onUpdate }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate AI insights based on wedding data
  useEffect(() => {
    generateInsights();
  }, [wedding]);

  const generateInsights = () => {
    const daysUntilWedding = differenceInDays(wedding.weddingDate, new Date());
    const totalMembers = wedding.members.length;
    const completedMeasurements = wedding.members.filter(m => m.measurementStatus === 'completed').length;
    const pendingMeasurements = totalMembers - completedMeasurements;
    const membersWithShipping = wedding.members.filter(m => m.shippingAddress).length;
    
    const generatedInsights: AIInsight[] = [];

    // Timeline Analysis
    if (daysUntilWedding <= 30 && pendingMeasurements > 0) {
      generatedInsights.push({
        id: '1',
        type: 'warning',
        title: 'Urgent: Measurements Deadline Approaching',
        description: `${pendingMeasurements} members still need to submit measurements with only ${daysUntilWedding} days until the wedding.`,
        confidence: 95,
        priority: 'critical',
        actionable: true,
        suggestedActions: [
          'Send urgent reminders to pending members',
          'Schedule emergency measurement appointments',
          'Consider rush order options'
        ],
        estimatedImpact: 'High risk of delivery delays',
        category: 'timeline'
      });
    }

    // Measurement Optimization
    if (completedMeasurements > 0) {
      const avgMeasurementTime = 3; // Mock calculation
      generatedInsights.push({
        id: '2',
        type: 'optimization',
        title: 'Measurement Process Optimization',
        description: `Based on completed measurements, average processing time is ${avgMeasurementTime} days. Consider batch processing for efficiency.`,
        confidence: 87,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Group measurements by size ranges',
          'Schedule bulk processing sessions',
          'Implement quality checkpoints'
        ],
        estimatedImpact: '20% faster processing',
        category: 'measurements'
      });
    }

    // Shipping Logistics
    if (membersWithShipping < totalMembers * 0.8) {
      generatedInsights.push({
        id: '3',
        type: 'recommendation',
        title: 'Shipping Address Collection',
        description: `${totalMembers - membersWithShipping} members haven't provided shipping addresses. Early collection improves delivery reliability.`,
        confidence: 92,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Send shipping address reminders',
          'Offer local pickup options',
          'Verify address accuracy'
        ],
        estimatedImpact: 'Reduced delivery issues',
        category: 'logistics'
      });
    }

    // Predictive Analysis
    const predictedDeliveryDate = addDays(new Date(), 14); // Mock prediction
    if (differenceInDays(wedding.weddingDate, predictedDeliveryDate) < 7) {
      generatedInsights.push({
        id: '4',
        type: 'prediction',
        title: 'Delivery Timeline Prediction',
        description: `AI predicts delivery completion by ${format(predictedDeliveryDate, 'MMM dd')}. This provides ${differenceInDays(wedding.weddingDate, predictedDeliveryDate)} days buffer.`,
        confidence: 78,
        priority: 'low',
        actionable: false,
        category: 'timeline'
      });
    }

    // Quality Insights
    if (wedding.members.some(m => m.role === 'groom' || m.role === 'best_man')) {
      generatedInsights.push({
        id: '5',
        type: 'recommendation',
        title: 'VIP Member Priority',
        description: 'Groom and Best Man detected. Consider priority processing and additional quality checks for key members.',
        confidence: 100,
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Schedule priority fittings',
          'Assign senior tailor',
          'Add extra quality checkpoints'
        ],
        estimatedImpact: 'Enhanced satisfaction for key members',
        category: 'quality'
      });
    }

    setInsights(generatedInsights);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: generateAIResponse(newMessage),
        timestamp: new Date(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('measurement') || input.includes('size')) {
      return "Based on the measurements submitted, I recommend scheduling fittings 2-3 weeks before the wedding. For members with unique sizing requirements, consider custom adjustments. Would you like me to analyze the measurement data for any potential issues?";
    }
    
    if (input.includes('timeline') || input.includes('schedule')) {
      return `With ${differenceInDays(wedding.weddingDate, new Date())} days until the wedding, here's my recommended timeline: Complete all measurements within 7 days, begin production within 14 days, and schedule final fittings 1 week before the wedding. This ensures optimal quality and timing.`;
    }
    
    if (input.includes('shipping') || input.includes('delivery')) {
      return "I've analyzed the shipping addresses and delivery requirements. Consider grouping deliveries by geographic location to optimize costs. For members in remote areas, I recommend adding 2-3 extra days to the delivery timeline.";
    }
    
    return "I'm here to help optimize your wedding planning process! I can provide insights on measurements, timelines, shipping logistics, and quality control. What specific area would you like me to analyze?";
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation': return <RecommendIcon />;
      case 'warning': return <WarningIcon />;
      case 'optimization': return <SpeedIcon />;
      case 'prediction': return <InsightsIcon />;
      default: return <LightbulbIcon />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const criticalInsights = insights.filter(i => i.priority === 'critical').length;
  const highPriorityInsights = insights.filter(i => i.priority === 'high').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AIIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                AI Wedding Assistant
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Intelligent insights and recommendations for your wedding planning
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {insights.length}
              </Typography>
              <Typography variant="caption">
                Active Insights
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={criticalInsights} color="error">
                <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold">
                Critical Issues
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={highPriorityInsights} color="warning">
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold">
                Optimizations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Improvement opportunities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {differenceInDays(wedding.weddingDate, new Date())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Days to Wedding
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Insights & Recommendations
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'timeline', 'measurements', 'logistics', 'quality', 'cost'].map(category => (
            <Chip
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Insights List */}
      <Box sx={{ mb: 3 }}>
        {filteredInsights.map((insight) => (
          <Accordion key={insight.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ bgcolor: getPriorityColor(insight.priority) + '.main' }}>
                  {getTypeIcon(insight.type)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {insight.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={insight.type}
                      size="small"
                      color={getPriorityColor(insight.priority)}
                      variant="outlined"
                    />
                    <Chip
                      label={`${insight.confidence}% confidence`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {insight.description}
              </Typography>
              
              {insight.estimatedImpact && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Estimated Impact:</strong> {insight.estimatedImpact}
                  </Typography>
                </Alert>
              )}

              {insight.suggestedActions && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Suggested Actions:
                  </Typography>
                  <List dense>
                    {insight.suggestedActions.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${action}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {insight.actionable && (
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" size="small" sx={{ mr: 1 }}>
                    Take Action
                  </Button>
                  <Button variant="outlined" size="small">
                    Learn More
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* AI Chat Fab */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowChat(true)}
      >
        <BotIcon />
      </Fab>

      {/* AI Chat Dialog */}
      <Dialog open={showChat} onClose={() => setShowChat(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">AI Assistant</Typography>
              <Typography variant="caption" color="text.secondary">
                Ask me anything about your wedding planning
              </Typography>
            </Box>
            <IconButton onClick={() => setShowChat(false)} sx={{ ml: 'auto' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ height: 300, overflow: 'auto', p: 2, mb: 2 }}>
            {chatMessages.length === 0 && (
              <Alert severity="info">
                Hi! I'm your AI wedding assistant. I can help you with timeline planning, 
                measurement analysis, shipping optimization, and quality recommendations. 
                What would you like to know?
              </Alert>
            )}
            {chatMessages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                    color: message.sender === 'user' ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                    {format(message.timestamp, 'HH:mm')}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <Typography variant="body2">AI is thinking...</Typography>
                  <LinearProgress sx={{ mt: 1 }} />
                </Paper>
              </Box>
            )}
          </Paper>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask me anything..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              endIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WeddingAIAssistant; 