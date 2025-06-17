import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as ReconnectIcon,
} from '@mui/icons-material';
import websocketService from '../../services/websocket';

const WebSocketStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [lastError, setLastError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  useEffect(() => {
    // Listen for WebSocket events
    const handleConnected = (data: any) => {
      setConnectionState('CONNECTED');
      setLastError(null);
      setReconnectAttempts(0);
      console.log('✅ WebSocket connected:', data);
    };

    const handleDisconnected = (data: any) => {
      setConnectionState('DISCONNECTED');
      console.log('🔌 WebSocket disconnected:', data);
    };

    const handleError = (error: any) => {
      setLastError(error?.message || 'Unknown error');
      console.error('❌ WebSocket error:', error);
    };

    const handleMaxReconnectAttempts = (data: any) => {
      setLastError(`Max reconnection attempts reached (${data.attempts})`);
      console.error('❌ Max reconnection attempts reached');
    };

    // Subscribe to events
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('error', handleError);
    websocketService.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);

    // Update connection state periodically
    const interval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
    }, 1000);

    return () => {
      clearInterval(interval);
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('error', handleError);
      websocketService.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
    };
  }, []);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'CONNECTED': return 'success';
      case 'CONNECTING': return 'warning';
      case 'DISCONNECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'CONNECTED': return <ConnectedIcon />;
      case 'CONNECTING': return <ReconnectIcon />;
      default: return <DisconnectedIcon />;
    }
  };

  const handleConnect = () => {
    websocketService.connect();
  };

  const handleDisconnect = () => {
    websocketService.disconnect();
  };

  const handleReconnect = () => {
    websocketService.reconnect();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">WebSocket Status</Typography>
          <Chip
            icon={getStatusIcon(connectionState)}
            label={connectionState}
            color={getStatusColor(connectionState) as any}
            variant="outlined"
          />
        </Box>

        {lastError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">{lastError}</Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connectionState === 'CONNECTED' || connectionState === 'CONNECTING'}
            size="small"
          >
            Connect
          </Button>
          <Button
            variant="outlined"
            onClick={handleDisconnect}
            disabled={connectionState === 'DISCONNECTED'}
            size="small"
          >
            Disconnect
          </Button>
          <Button
            variant="outlined"
            onClick={handleReconnect}
            startIcon={<ReconnectIcon />}
            size="small"
          >
            Reconnect
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This component demonstrates the improved WebSocket reconnection logic with exponential backoff.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus; 