import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  useMediaQuery,
} from '@mui/material';
import {
  Camera,
  FlipCameraIos,
  PhotoLibrary,
  Close,
  CameraAlt,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface PhotoCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (photoData: string) => void;
  title?: string;
  maxPhotos?: number;
  customerId?: number;
}

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  open,
  onClose,
  onCapture,
  title = 'Take Measurement Photo',
  maxPhotos = 4,
  customerId,
}) => {
  const theme = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (open) {
      initializeCamera();
    } else {
      // Clean up camera stream when modal closes
      stopCameraStream();
    }
    
    return () => {
      stopCameraStream();
    };
  }, [open, facingMode]);

  const initializeCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Stop any existing stream
      stopCameraStream();
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      setCameraStream(stream);
      setCameraPermission(true);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setCameraPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && capturedPhotos.length < maxPhotos) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get data URL from canvas
        const photoData = canvas.toDataURL('image/jpeg');
        
        // Add to captured photos
        setCapturedPhotos(prev => [...prev, photoData]);
        
        // Call the onCapture callback
        onCapture(photoData);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && capturedPhotos.length < maxPhotos) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const photoData = e.target.result;
          setCapturedPhotos(prev => [...prev, photoData]);
          onCapture(photoData);
        }
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deletePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          height: isMobile ? '100%' : 'auto',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Camera sx={{ mr: 1 }} />
          <Typography variant="h6">{title}</Typography>
          {customerId && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Customer #{customerId}
            </Typography>
          )}
        </Box>
        <IconButton edge="end" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: isMobile ? 1 : 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <Typography color="error" gutterBottom>{error}</Typography>
            <Button 
              variant="contained" 
              onClick={initializeCamera}
              startIcon={<CameraAlt />}
            >
              Retry Camera Access
            </Button>
          </Box>
        ) : (
          <>
            {/* Camera Preview */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxHeight: '50vh',
                  backgroundColor: '#000',
                  borderRadius: theme.shape.borderRadius,
                }}
              />
              
              {/* Camera Controls */}
              <Box sx={{ 
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
              }}>
                <IconButton 
                  onClick={switchCamera} 
                  sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  <FlipCameraIos />
                </IconButton>
                
                <IconButton 
                  onClick={capturePhoto}
                  disabled={capturedPhotos.length >= maxPhotos}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.8)', 
                    color: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <CameraAlt fontSize="large" />
                </IconButton>
                
                <IconButton 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={capturedPhotos.length >= maxPhotos}
                  sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  <PhotoLibrary />
                </IconButton>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </Box>
            </Box>
            
            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Captured Photos Gallery */}
            <Typography variant="subtitle1" gutterBottom>
              Captured Photos ({capturedPhotos.length}/{maxPhotos})
            </Typography>
            
            <Grid container spacing={2}>
              {capturedPhotos.map((photo, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Paper
                    elevation={2}
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 Aspect ratio
                      borderRadius: theme.shape.borderRadius,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Captured photo ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      onClick={() => deletePhoto(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        p: 0.5,
                      }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
              
              {/* Placeholder for empty slots */}
              {Array.from({ length: Math.max(0, maxPhotos - capturedPhotos.length) }).map((_, index) => (
                <Grid item xs={6} sm={3} key={`empty-${index}`}>
                  <Paper
                    elevation={1}
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 Aspect ratio
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      border: '1px dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      <CameraAlt />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        borderTop: 1,
        borderColor: 'divider',
        justifyContent: 'space-between'
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          disabled={capturedPhotos.length === 0}
        >
          Done ({capturedPhotos.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoCaptureModal; 