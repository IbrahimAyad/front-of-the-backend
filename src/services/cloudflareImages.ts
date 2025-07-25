export interface CloudflareImageUploadResponse {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

export interface CloudflareImageVariant {
  public: string;
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
}

const getEnv = (key: string, fallback: string = '') => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // @ts-ignore - import.meta.env is available in Vite
    return import.meta.env?.[key] || fallback;
  }
  // Server-side
  return process.env[key] || fallback;
};

const CLOUDFLARE_CONFIG = {
  ACCOUNT_ID: getEnv('VITE_CLOUDFLARE_ACCOUNT_ID', 'ea644c4a47a499ad4721449cbac587f4'),
  IMAGES_API_KEY: getEnv('VITE_CLOUDFLARE_IMAGES_API_KEY', 'ea644c4a47a499ad4721449cbac587f4'),
  ACCOUNT_HASH: getEnv('VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH', 'QI-O2U_ayTU_H_Ilcb4c6Q'),
  DELIVERY_URL: getEnv('VITE_CLOUDFLARE_IMAGE_DELIVERY_URL', 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q'),
  STREAM_API_KEY: getEnv('VITE_CLOUDFLARE_STREAM_API_KEY', 'HrF2RiWgv7tYwPUUDYLA5Ny7ykbNNMCfRK1Exhqo'),
  STREAM_URL: getEnv('VITE_CLOUDFLARE_STREAM_VIDEO_URL', 'https://customer-6njalxhlz5ulnoaq.cloudflarestream.com'),
};

export class CloudflareImagesService {
  private static getBackendUrl(): string {
    // Use the same backend URL as the main API
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return import.meta.env?.VITE_API_BASE_URL || 'https://front-of-the-backend-production.up.railway.app';
    }
    return process.env.VITE_API_BASE_URL || 'https://front-of-the-backend-production.up.railway.app';
  }

  /**
   * Upload an image to Cloudflare Images via base64 (bypasses multipart issues)
   */
  static async uploadBase64(data: {
    image: string;
    filename: string;
    mimetype: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    console.log('🚀 Base64 uploading to:', `${this.getBackendUrl()}/api/cloudflare/upload-base64`);
    console.log('📦 File:', data.filename, 'base64 length:', data.image.length);

    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/upload-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(60000), // 60 second timeout for larger files
    }).catch(error => {
      console.error('🔴 Base64 upload fetch error:', error);
      throw new Error(`Network error: ${error.message}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Base64 upload failed: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Upload an image to Cloudflare Images via backend proxy (DEPRECATED - use uploadBase64)
   */
  static async uploadImage(file: File, metadata?: Record<string, string>): Promise<CloudflareImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    console.log('🚀 Uploading to:', `${this.getBackendUrl()}/api/cloudflare/upload`);
    console.log('📦 File:', file.name, file.size, 'bytes');

    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/upload`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    }).catch(error => {
      console.error('🔴 Upload fetch error:', error);
      throw new Error(`Network error: ${error.message}`);
    });

    if (!response.ok) {
      throw new Error(`Cloudflare upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      result: result.data.result,
      success: result.success,
      errors: result.data.errors || [],
      messages: result.data.messages || [],
    };
  }

  /**
   * Upload image from URL via backend proxy
   */
  static async uploadFromUrl(url: string, metadata?: Record<string, string>): Promise<CloudflareImageUploadResponse> {
    const body: any = { url };
    if (metadata) {
      body.metadata = metadata;
    }

    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare URL upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      result: result.data.result,
      success: result.success,
      errors: result.data.errors || [],
      messages: result.data.messages || [],
    };
  }

  /**
   * Delete an image from Cloudflare Images via backend proxy
   */
  static async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/images/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }
  }

  /**
   * Get image details via backend proxy
   */
  static async getImageDetails(imageId: string) {
    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/images/${imageId}`);

    if (!response.ok) {
      throw new Error(`Failed to get image details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate image URL with transformations
   */
  static getImageUrl(imageId: string, variant: string = 'public'): string {
    return `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/${variant}`;
  }

  /**
   * Generate different image variants for product display
   */
  static getImageVariants(imageId: string): CloudflareImageVariant {
    return {
      public: this.getImageUrl(imageId, 'public'),
      thumbnail: this.getImageUrl(imageId, 'thumbnail'),
      small: this.getImageUrl(imageId, 'small'),
      medium: this.getImageUrl(imageId, 'medium'),
      large: this.getImageUrl(imageId, 'large'),
    };
  }

  /**
   * Optimized URL for product cards (300x300)
   */
  static getProductCardUrl(imageId: string): string {
    return `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=300,h=300,fit=cover,format=auto`;
  }

  /**
   * Optimized URL for product detail pages (800x800)
   */
  static getProductDetailUrl(imageId: string): string {
    return `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=800,h=800,fit=cover,format=auto`;
  }

  /**
   * Gallery thumbnail URL (150x150)
   */
  static getThumbnailUrl(imageId: string): string {
    return `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=150,h=150,fit=cover,format=auto`;
  }

  /**
   * List all images (paginated) via backend proxy
   */
  static async listImages(page: number = 1, perPage: number = 25) {
    const response = await fetch(`${this.getBackendUrl()}/api/cloudflare/images?page=${page}&per_page=${perPage}`);

    if (!response.ok) {
      throw new Error(`Failed to list images: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch upload multiple images
   */
  static async uploadMultipleImages(
    files: File[], 
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<CloudflareImageUploadResponse[]> {
    const results: CloudflareImageUploadResponse[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadImage(files[i], {
          batch: 'true',
          order: i.toString(),
        });
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, files.length);
        }
      } catch (error) {
        console.error(`Failed to upload ${files[i].name}:`, error);
        // Continue with other uploads
      }
    }
    
    return results;
  }
}

export default CloudflareImagesService; 