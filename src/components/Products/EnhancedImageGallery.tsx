import React, { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  Fade,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Close,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { ProductImage } from '../../types';

interface EnhancedImageGalleryProps {
  images: ProductImage[];
  productName: string;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const EnhancedImageGallery: React.FC<EnhancedImageGalleryProps> = ({
  images = [],
  productName,
  showThumbnails = true,
  enableZoom = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length]);

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Reset zoom when closing fullscreen
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2,
        }}
      >
        <Typography color="textSecondary">No images available</Typography>
      </Box>
    );
  }

  const currentImage = images[selectedIndex];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];

  return (
    <>
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* Main Image Display */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '100%', // Square aspect ratio
            backgroundColor: theme.palette.grey[50],
            borderRadius: 2,
            overflow: 'hidden',
            cursor: enableZoom ? 'zoom-in' : 'default',
          }}
          onClick={() => enableZoom && setIsFullscreen(true)}
        >
          <Box
            component="img"
            src={currentImage.url}
            alt={currentImage.altText || `${productName} - Image ${selectedIndex + 1}`}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: enableZoom ? 'scale(1.05)' : 'none',
              },
            }}
          />

          {/* Image Counter */}
          <Chip
            label={`${selectedIndex + 1} / ${images.length}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
            }}
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <NavigateBefore />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <NavigateNext />
              </IconButton>
            </>
          )}
        </Box>

        {/* Thumbnail Strip */}
        {showThumbnails && images.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 2,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.grey[200],
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.grey[400],
                borderRadius: 3,
              },
            }}
          >
            {images.map((image, index) => (
              <Box
                key={image.id || index}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  position: 'relative',
                  minWidth: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  cursor: 'pointer',
                  border: `2px solid ${
                    index === selectedIndex ? theme.palette.primary.main : 'transparent'
                  }`,
                  borderRadius: 1,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: theme.palette.primary.light,
                  },
                }}
              >
                <Box
                  component="img"
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {image.isPrimary && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Fullscreen Dialog */}
      <Dialog
        open={isFullscreen}
        onClose={handleCloseFullscreen}
        maxWidth={false}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', height: '100vh' }}>
          {/* Close Button */}
          <IconButton
            onClick={handleCloseFullscreen}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <Close />
          </IconButton>

          {/* Zoom Controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              <ZoomOut />
            </IconButton>
            <Chip
              label={`${Math.round(zoomLevel * 100)}%`}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                minWidth: 80,
              }}
            />
            <IconButton
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              <ZoomIn />
            </IconButton>
          </Box>

          {/* Fullscreen Image */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: zoomLevel > 1 ? 'move' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <Box
              component="img"
              src={currentImage.url}
              alt={currentImage.altText || productName}
              sx={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${
                  imagePosition.y / zoomLevel
                }px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                userSelect: 'none',
                WebkitUserDrag: 'none',
              }}
            />
          </Box>

          {/* Fullscreen Navigation */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <NavigateBefore sx={{ fontSize: 40 }} />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <NavigateNext sx={{ fontSize: 40 }} />
              </IconButton>
            </>
          )}

          {/* Fullscreen Thumbnail Strip */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              p: 1,
              borderRadius: 2,
              maxWidth: '90%',
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
              },
            }}
          >
            {images.map((image, index) => (
              <Box
                key={image.id || index}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  minWidth: 60,
                  height: 60,
                  cursor: 'pointer',
                  border: `2px solid ${
                    index === selectedIndex ? 'white' : 'transparent'
                  }`,
                  borderRadius: 1,
                  overflow: 'hidden',
                  opacity: index === selectedIndex ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 1,
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                <Box
                  component="img"
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedImageGallery;