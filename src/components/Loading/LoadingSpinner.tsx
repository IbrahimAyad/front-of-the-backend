import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Card,
  CardContent,
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  variant?: 'inline' | 'card' | 'backdrop';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
  overlay = false,
  variant = 'inline',
}) => {
  const LoadingContent = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (variant === 'backdrop' || fullScreen) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        open={true}
      >
        <LoadingContent />
      </Backdrop>
    );
  }

  if (variant === 'card') {
    return (
      <Card sx={{ minHeight: 200 }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight={150}
          >
            <LoadingContent />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1}
      >
        <LoadingContent />
      </Box>
    );
  }

  // Default inline variant
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={4}
    >
      <LoadingContent />
    </Box>
  );
};

export default LoadingSpinner; 