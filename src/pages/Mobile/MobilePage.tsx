import React from 'react';
import { Box, useMediaQuery, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCustomTheme } from '../../contexts/ThemeContext';
import MobileDashboard from '../../components/Mobile/MobileDashboard';

const MobilePage: React.FC = () => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // If not on a mobile device, show a message with option to go to desktop dashboard
  if (!isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Mobile View
        </Typography>
        <Typography variant="body1" paragraph>
          This page is optimized for mobile devices. You are currently viewing it on a larger screen.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          For the best experience on desktop, please use our standard dashboard.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Go to Desktop Dashboard
        </Button>
      </Box>
    );
  }

  // On mobile devices, show the mobile dashboard
  return <MobileDashboard />;
};

export default MobilePage; 