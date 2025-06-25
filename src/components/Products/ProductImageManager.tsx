import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  DragIndicator as DragIcon,
  CloudUpload as UploadIcon,
  Visibility as PreviewIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { productAPI } from '../../services/api';
import { ProductImage } from '../../types';

interface ProductImageManagerProps {
  productId: string;
  images: ProductImage[];
  onImagesUpdate: (images: ProductImage[]) => void;
  readOnly?: boolean;
}

interface ImageUploadData {
  file: File;
  preview: string;
  altText: string;
  caption: string;
  isPrimary: boolean;
  position: number;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  productId,
  images = [],
  onImagesUpdate,
  readOnly = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<ImageUploadData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Image form state
  const [imageForm, setImageForm] = useState({
    altText: '',
    caption: '',
    isPrimary: false,
  });

  // Drag and drop functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (readOnly) return;

    const newUploads: ImageUploadData[] = acceptedFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: `Product image ${images.length + index + 1}`,
      caption: '',
      isPrimary: images.length === 0 && index === 0, // First image is primary if no images exist
      position: images.length + index + 1,
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
  }, [images.length, readOnly]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: readOnly,
  });

  // Upload images to server
  const handleUploadImages = async () => {
    if (!uploadQueue.length) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = uploadQueue.map(async (upload) => {
        const metadata = {
          altText: upload.altText,
          caption: upload.caption,
          isPrimary: upload.isPrimary,
          position: upload.position,
        };

        const response = await productAPI.uploadImage(productId, upload.file, metadata);
        return response.data;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...uploadedImages];
      
      onImagesUpdate(updatedImages);
      setUploadQueue([]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (imageId: string) => {
    if (readOnly) return;

    try {
      await productAPI.deleteImage(productId, imageId);
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesUpdate(updatedImages);
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    }
  };

  // Set primary image
  const handleSetPrimary = async (imageId: string) => {
    if (readOnly) return;

    try {
      const updatedImages = images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }));

      // Update image order to put primary first
      const reorderedIds = updatedImages
        .sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return a.position - b.position;
        })
        .map(img => img.id);

      await productAPI.updateImageOrder(productId, reorderedIds);
      onImagesUpdate(updatedImages);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update primary image');
    }
  };

  // Edit image metadata
  const handleEditImage = async () => {
    if (!editingImage) return;

    try {
      // This would be an API call to update image metadata
      // For now, we'll update locally
      const updatedImages = images.map(img =>
        img.id === editingImage.id
          ? { ...img, ...imageForm }
          : img
      );

      onImagesUpdate(updatedImages);
      setEditingImage(null);
      setImageForm({ altText: '', caption: '', isPrimary: false });
      
    } catch (err: any) {
      setError(err.message || 'Failed to update image');
    }
  };

  // Remove from upload queue
  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => {
      const newQueue = [...prev];
      URL.revokeObjectURL(newQueue[index].preview);
      newQueue.splice(index, 1);
      return newQueue;
    });
  };

  // CDN Image URL generator (placeholder for actual CDN implementation)
  const getOptimizedImageUrl = (url: string, width?: number, height?: number) => {
    // In production, this would generate CDN URLs with optimization parameters
    // Example: https://cdn.kctmenswear.com/products/image.jpg?w=400&h=400&q=80
    if (width && height) {
      return `${url}?w=${width}&h=${height}&q=80`;
    }
    return url;
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      {!readOnly && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            mb: 3,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop images here' : 'Drag & drop product images'}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Support: JPEG, PNG, WebP (max 5MB each)
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            Browse Files
          </Button>
        </Paper>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Upload Queue ({uploadQueue.length} images)
            </Typography>
            <Box>
              <Button onClick={() => setUploadQueue([])} sx={{ mr: 1 }}>
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadImages}
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                sx={{ backgroundColor: '#8B0000' }}
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {uploadQueue.map((upload, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="120"
                    image={upload.preview}
                    alt={upload.altText}
                  />
                  <Box sx={{ p: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Alt Text"
                      value={upload.altText}
                      onChange={(e) => {
                        const newQueue = [...uploadQueue];
                        newQueue[index].altText = e.target.value;
                        setUploadQueue(newQueue);
                      }}
                      sx={{ mb: 1 }}
                    />
                    {upload.isPrimary && (
                      <Chip
                        label="Primary"
                        color="primary"
                        size="small"
                        icon={<StarIcon />}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeFromQueue(index)}
                      sx={{ float: 'right' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Current Images */}
      <Typography variant="h6" gutterBottom>
        Product Images ({images.length})
      </Typography>

      {images.length === 0 && uploadQueue.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
          <Typography color="textSecondary">
            No images uploaded yet. Add some product images to showcase your items.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {images.map((image) => (
            <Grid item xs={6} sm={4} md={3} key={image.id}>
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getOptimizedImageUrl(image.url, 300, 300)}
                  alt={image.altText || 'Product image'}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setPreviewImage(image.url)}
                />
                
                {/* Image Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  {image.isPrimary && (
                    <Chip
                      label="Primary"
                      color="primary"
                      size="small"
                      icon={<StarIcon />}
                      sx={{ backgroundColor: 'rgba(139, 0, 0, 0.9)' }}
                    />
                  )}
                </Box>

                {/* Image Actions */}
                {!readOnly && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      right: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 1,
                      p: 0.5,
                    }}
                  >
                    <Tooltip title="Set as primary">
                      <IconButton
                        size="small"
                        onClick={() => handleSetPrimary(image.id)}
                        sx={{ color: 'white' }}
                        disabled={image.isPrimary}
                      >
                        {image.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Edit details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingImage(image);
                          setImageForm({
                            altText: image.altText || '',
                            caption: image.caption || '',
                            isPrimary: image.isPrimary,
                          });
                        }}
                        sx={{ color: 'white' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete image">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(image.id)}
                        sx={{ color: 'white' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {/* Image Info */}
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {image.altText || 'No alt text'}
                  </Typography>
                  {image.caption && (
                    <Typography variant="caption" display="block" color="textSecondary" noWrap>
                      {image.caption}
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (previewImage) {
                window.open(previewImage, '_blank');
              }
            }}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewImage(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Image Dialog */}
      <Dialog
        open={!!editingImage}
        onClose={() => setEditingImage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Image Details</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alt Text"
            value={imageForm.altText}
            onChange={(e) => setImageForm({ ...imageForm, altText: e.target.value })}
            margin="normal"
            helperText="Describe the image for accessibility and SEO"
          />
          <TextField
            fullWidth
            label="Caption"
            value={imageForm.caption}
            onChange={(e) => setImageForm({ ...imageForm, caption: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            helperText="Optional caption displayed with the image"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingImage(null)}>Cancel</Button>
          <Button
            onClick={handleEditImage}
            variant="contained"
            sx={{ backgroundColor: '#8B0000' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductImageManager; 