import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
} from '@mui/material';
import {
  Schedule,
  Email,
  Inventory,
  EmojiEmotions,
} from '@mui/icons-material';

const sections = [
  {
    label: 'Appointment Scheduling',
    icon: <Schedule color="primary" sx={{ mr: 1 }} />,
    description: 'Automate appointment suggestions, reminders, and confirmations for customers and staff.',
  },
  {
    label: 'Follow-up Emails',
    icon: <Email color="secondary" sx={{ mr: 1 }} />,
    description: 'Create and automate follow-up email sequences for leads, orders, and appointments.',
  },
  {
    label: 'Inventory Reorder',
    icon: <Inventory color="warning" sx={{ mr: 1 }} />,
    description: 'Enable auto-reorder triggers for low stock items and streamline supplier communication.',
  },
  {
    label: 'Satisfaction Surveys',
    icon: <EmojiEmotions color="success" sx={{ mr: 1 }} />,
    description: 'Send automated customer satisfaction surveys and view feedback analytics.',
  },
];

const WorkflowAutomationDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Workflow Automation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Automate key business processes to save time, reduce errors, and deliver a world-class customer experience.
        </Typography>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {sections.map((section) => (
            <Tab
              key={section.label}
              label={
                <Box display="flex" alignItems="center">
                  {section.icon}
                  {section.label}
                </Box>
              }
              sx={{ minWidth: 180 }}
            />
          ))}
        </Tabs>
        <Divider sx={{ mb: 3 }} />
        <Box>
          {tab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Automated Appointment Scheduling
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Smart suggestions, reminders, and one-click confirmations. (Feature coming soon)
              </Typography>
              <Button variant="contained" disabled>Configure Automation</Button>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow-up Email Sequences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Build and automate email sequences for leads, orders, and appointments. (Feature coming soon)
              </Typography>
              <Button variant="contained" color="secondary" disabled>Configure Sequences</Button>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Inventory Reorder Triggers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enable auto-reorder for low stock items and automate supplier notifications. (Feature coming soon)
              </Typography>
              <Button variant="contained" color="warning" disabled>Configure Reorder</Button>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Satisfaction Surveys
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send automated surveys and analyze customer feedback. (Feature coming soon)
              </Typography>
              <Button variant="contained" color="success" disabled>Configure Surveys</Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkflowAutomationDashboard; 