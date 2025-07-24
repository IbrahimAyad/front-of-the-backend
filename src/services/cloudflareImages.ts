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
  private static readonly API_BASE = 'https://api.cloudflare.com/client/v4';

  /**
   * Upload an image to Cloudflare Images
   */
  static async uploadImage(file: File, metadata?: Record<string, string>): Promise<CloudflareImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(
      `${this.API_BASE}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload image from URL
   */
  static async uploadFromUrl(url: string, metadata?: Record<string, string>): Promise<CloudflareImageUploadResponse> {
    const body: any = { url };
    if (metadata) {
      body.metadata = metadata;
    }

    const response = await fetch(
      `${this.API_BASE}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare URL upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete an image from Cloudflare Images
   */
  static async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(
      `${this.API_BASE}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }
  }

  /**
   * Get image details
   */
  static async getImageDetails(imageId: string) {
    const response = await fetch(
      `${this.API_BASE}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
        },
      }
    );

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
   * List all images (paginated)
   */
  static async listImages(page: number = 1, perPage: number = 25) {
    const response = await fetch(
      `${this.API_BASE}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
        },
      }
    );

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