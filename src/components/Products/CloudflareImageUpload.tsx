import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import CloudflareImagesService, { CloudflareImageUploadResponse } from '../../services/cloudflareImages';

export interface ProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
  position?: number;
}

interface CloudflareImageUploadProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  productName?: string;
}

const CloudflareImageUpload: React.FC<CloudflareImageUploadProps> = ({
  images,
  onChange,
  maxImages = 10,
  productName = 'Product',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(async (file: File) => {
    // 🔍 DEBUG: Log image upload start
    console.log('🔍 IMAGE UPLOAD DEBUG - Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      currentImagesCount: images.length,
      productName
    });

    setUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      setUploadProgress(10);
      
      // 🔍 DEBUG: Log base64 conversion start
      console.log('🔍 IMAGE UPLOAD DEBUG - Converting to base64...');
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 🔍 DEBUG: Log base64 conversion complete
      console.log('🔍 IMAGE UPLOAD DEBUG - Base64 conversion complete:', {
        base64Length: base64.length,
        base64Preview: base64.substring(0, 100) + '...'
      });

      setUploadProgress(30);

      // Upload via base64 (bypasses multipart issues)
      // 🔍 DEBUG: Log API call start
      console.log('🔍 IMAGE UPLOAD DEBUG - Starting API call to Cloudflare...');
      
      const result = await CloudflareImagesService.uploadBase64({
        image: base64,
        filename: file.name,
        mimetype: file.type,
        metadata: {
          productName: productName,
          uploadedAt: new Date().toISOString(),
          category: 'product-image',
        }
      });
      
      // 🔍 DEBUG: Log API response
      console.log('🔍 IMAGE UPLOAD DEBUG - Cloudflare API response:', {
        result,
        hasPublicUrl: !!result.data.urls?.public,
        publicUrl: result.data.urls?.public,
        resultId: result.data.result?.id
      });
      
      setUploadProgress(100);

      // Create new image object
      const newImage: ProductImage = {
        url: result.data.urls.public || `https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/${result.data.result.id}/public`,
        altText: `${productName} - Image ${images.length + 1}`,
        isPrimary: images.length === 0, // First image is primary
        position: images.length,
      };

      // 🔍 DEBUG: Log new image object
      console.log('🔍 IMAGE UPLOAD DEBUG - Created new image object:', {
        newImage,
        finalUrl: newImage.url,
        isPrimary: newImage.isPrimary,
        position: newImage.position
      });

      // Add to images array
      const updatedImages = [...images, newImage];
      
      // 🔍 DEBUG: Log updated images array
      console.log('🔍 IMAGE UPLOAD DEBUG - Updated images array:', {
        previousCount: images.length,
        newCount: updatedImages.length,
        updatedImages
      });
      
      onChange(updatedImages);

      toast.success(`✅ Image uploaded successfully!`);
      
    } catch (error: any) {
      // 🔍 DEBUG: Log upload error
      console.error('🔍 IMAGE UPLOAD DEBUG - Upload failed:', {
        error,
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      // Check if it's a CORS or backend deployment issue
      if (error.message.includes('Load failed') || error.message.includes('CORS') || error.message.includes('404')) {
        toast.error('🚧 Backend is deploying new features. Please try again in 1-2 minutes!', {
          duration: 5000,
        });
      } else {
        toast.error(`❌ Failed to upload ${file.name}: ${error.message}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [images, onChange, productName]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Upload files one by one
    for (const file of fileArray) {
      await handleUpload(file);
    }
  }, [images, maxImages, handleUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
    // Reset input
    event.target.value = '';
  }, [handleFileUpload]);

  const handleDelete = async (index: number) => {
    const imageToDelete = images[index];
    
    try {
      // Extract Cloudflare ID from URL for deletion
      const cloudflareIdMatch = imageToDelete.url.match(/\/([a-f0-9-]{36})\//);
      if (cloudflareIdMatch) {
        await CloudflareImagesService.deleteImage(cloudflareIdMatch[1]);
      }
      
      const newImages = images.filter((_, i) => i !== index);
      
      // If we deleted the primary image and there are other images, make the first one primary
      if (imageToDelete.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      
      onChange(newImages);
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
    toast.success('Primary image updated');
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const newImages = [...images];
    newImages[index].altText = altText;
    onChange(newImages);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Product Images ({images.length}/{maxImages})
      </Typography>

      {/* Upload Area */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          border: '2px dashed #ddd',
          backgroundColor: uploading ? '#f5f5f5' : 'transparent',
          cursor: uploading ? 'not-allowed' : 'pointer',
          '&:hover': {
            borderColor: uploading ? '#ddd' : 'primary.main',
            backgroundColor: uploading ? '#f5f5f5' : 'rgba(25, 118, 210, 0.04)',
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="cloudflare-image-upload"
          disabled={uploading || images.length >= maxImages}
        />
        
        <Stack spacing={2} alignItems="center">
          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          
          {uploading ? (
            <>
              <Typography variant="body1">Uploading to Cloudflare...</Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ width: '100%', maxWidth: 300 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(uploadProgress)}% complete
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" textAlign="center">
                Drop images here or{' '}
                <label htmlFor="cloudflare-image-upload">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<UploadIcon />}
                    disabled={images.length >= maxImages}
                  >
                    Choose Files
                  </Button>
                </label>
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Supports JPG, PNG, WebP • Max 10MB per image
                {images.length >= maxImages && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Maximum {maxImages} images reached
                  </Alert>
                )}
              </Typography>
            </>
          )}
        </Stack>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {images.map((image, index) => (
            <Box key={index} sx={{ width: 250 }}>
              <Card sx={{ position: 'relative' }}>
                {image.isPrimary && (
                  <Chip
                    label="Primary"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                    }}
                  />
                )}
                
                <CardMedia
                  component="img"
                  height="200"
                  image={image.url}
                  alt={image.altText || `Product image ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleSetPrimary(index)}
                    color={image.isPrimary ? 'primary' : 'default'}
                    title={image.isPrimary ? 'Primary image' : 'Set as primary'}
                  >
                    {image.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    color="error"
                    title="Delete image"
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <Typography variant="caption" sx={{ ml: 'auto' }}>
                    {index + 1}
                  </Typography>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Cloudflare Info */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          🚀 Images are stored and optimized by Cloudflare Images for fast global delivery
        </Typography>
      </Box>
    </Box>
  );
};

export default CloudflareImageUpload; 