import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
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
  Tabs,
  Tab,
  Badge,
  Divider,
  Paper,
  Grid,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  Attachment as AttachmentIcon,
  VideoCall as VideoCallIcon,
  Phone as PhoneIcon,
  Notifications as NotificationIcon,
  Campaign as AnnouncementIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { WeddingParty, WeddingMember } from '../../types';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'coordinator' | 'member' | 'system';
  content: string;
  timestamp: Date;
  type: 'message' | 'announcement' | 'reminder' | 'update';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  mentions?: string[];
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  isRead?: boolean;
  isStarred?: boolean;
}

interface WeddingCommunicationHubProps {
  wedding: WeddingParty;
  currentUserId: string;
  currentUserRole: 'coordinator' | 'member';
  onUpdate?: () => void;
}

const WeddingCommunicationHub: React.FC<WeddingCommunicationHubProps> = ({
  wedding,
  currentUserId,
  currentUserRole,
  onUpdate
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<Message['priority']>('normal');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messageFilter, setMessageFilter] = useState<'all' | 'announcements' | 'reminders' | 'starred'>('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'coordinator-1',
        senderName: 'Sarah Johnson',
        senderRole: 'coordinator',
        content: 'Welcome to your wedding party communication hub! Please submit your measurements by Friday.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'announcement',
        priority: 'high',
        isRead: true,
      },
      {
        id: '2',
        senderId: 'member-1',
        senderName: 'John Smith',
        senderRole: 'member',
        content: 'Just submitted my measurements! When should I expect the first fitting?',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        type: 'message',
        priority: 'normal',
        isRead: true,
      },
      {
        id: '3',
        senderId: 'system',
        senderName: 'System',
        senderRole: 'system',
        content: 'Reminder: Wedding is in 45 days. Please ensure all measurements are completed.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        type: 'reminder',
        priority: 'normal',
        isRead: false,
      },
    ];
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserRole === 'coordinator' ? 'Wedding Coordinator' : 'Wedding Party Member',
      senderRole: currentUserRole,
      content: newMessage,
      timestamp: new Date(),
      type: 'message',
      priority: 'normal',
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) return;

    const announcement: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: 'Wedding Coordinator',
      senderRole: 'coordinator',
      content: announcementText,
      timestamp: new Date(),
      type: 'announcement',
      priority: announcementPriority,
      isRead: false,
    };

    setMessages(prev => [...prev, announcement]);
    setAnnouncementText('');
    setAnnouncementPriority('normal');
    setSelectedRecipients([]);
    setShowAnnouncementDialog(false);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.userId === currentUserId && r.emoji === emoji);
        
        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: reactions.filter(r => !(r.userId === currentUserId && r.emoji === emoji))
          };
        } else {
          // Add reaction
          return {
            ...msg,
            reactions: [...reactions, {
              emoji,
              userId: currentUserId,
              userName: currentUserRole === 'coordinator' ? 'Coordinator' : 'Member'
            }]
          };
        }
      }
      return msg;
    }));
  };

  const handleStarMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ));
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'announcement': return <AnnouncementIcon color="primary" />;
      case 'reminder': return <ScheduleIcon color="warning" />;
      case 'update': return <InfoIcon color="info" />;
      default: return <PersonIcon />;
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const filteredMessages = messages.filter(msg => {
    switch (messageFilter) {
      case 'announcements': return msg.type === 'announcement';
      case 'reminders': return msg.type === 'reminder';
      case 'starred': return msg.isStarred;
      default: return true;
    }
  });

  const unreadCount = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId).length;

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Communication Hub
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="Notifications"
                sx={{ mr: 2 }}
              />
              {currentUserRole === 'coordinator' && (
                <>
                  <Tooltip title="Video Call">
                    <IconButton color="primary">
                      <VideoCallIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AnnouncementIcon />}
                    onClick={() => setShowAnnouncementDialog(true)}
                    size="small"
                  >
                    Announce
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Messages
                </Badge>
              } 
            />
            <Tab label="Team" />
            <Tab label="Files" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          {/* Message Filters */}
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={messageFilter}
                label="Filter"
                onChange={(e) => setMessageFilter(e.target.value as any)}
              >
                <MenuItem value="all">All Messages</MenuItem>
                <MenuItem value="announcements">Announcements</MenuItem>
                <MenuItem value="reminders">Reminders</MenuItem>
                <MenuItem value="starred">Starred</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Messages */}
          <Paper sx={{ height: '400px', overflow: 'auto', p: 2, mb: 2 }}>
            <List>
              {filteredMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: message.isRead ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getPriorityColor(message.priority) + '.main' }}>
                        {getMessageIcon(message.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {message.senderName}
                            </Typography>
                            <Chip
                              label={message.type}
                              size="small"
                              color={getPriorityColor(message.priority)}
                              variant="outlined"
                            />
                            {message.priority === 'urgent' && (
                              <Chip label="URGENT" size="small" color="error" />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleStarMessage(message.id)}
                              color={message.isStarred ? 'warning' : 'default'}
                            >
                              <StarIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setMenuAnchor(e.currentTarget);
                                setSelectedMessage(message);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" component="span" sx={{ mt: 1, display: 'block' }}>
                            {message.content}
                          </Typography>
                          {message.reactions && message.reactions.length > 0 && (
                            <Box component="span" sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              {message.reactions.map((reaction, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${reaction.emoji} ${reaction.userName}`}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleReaction(message.id, reaction.emoji)}
                                />
                              ))}
                            </Box>
                          )}
                          <Box component="span" sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {['👍', '❤️', '😊', '👏'].map(emoji => (
                              <Button
                                key={emoji}
                                size="small"
                                onClick={() => handleReaction(message.id, emoji)}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredMessages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <div ref={messagesEndRef} />
          </Paper>

          {/* Message Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <IconButton color="primary">
              <AttachmentIcon />
            </IconButton>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              endIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Team Members */}
          <Grid container spacing={2}>
            {wedding.members.map((member) => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>{member.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.role.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={member.measurementStatus}
                            size="small"
                            color={member.measurementStatus === 'completed' ? 'success' : 'warning'}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Files and Attachments */}
          <Alert severity="info">
            File sharing feature coming soon! You'll be able to share measurement guides, 
            style references, and other important documents here.
          </Alert>
        </TabPanel>
      </Box>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onClose={() => setShowAnnouncementDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Announcement</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Announcement Message"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={announcementPriority}
              label="Priority"
              onChange={(e) => setAnnouncementPriority(e.target.value as Message['priority'])}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnnouncementDialog(false)}>Cancel</Button>
          <Button onClick={handleSendAnnouncement} variant="contained">
            Send Announcement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ReplyIcon sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ArchiveIcon sx={{ mr: 1 }} />
          Archive
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WeddingCommunicationHub; 