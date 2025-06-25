import axios from 'axios';
import { CLIENT_CONFIG } from '../config/client';
import type {
  SuitProduct,
  SuitWithImages,
  SuitsAPIResponse,
  SuitDetailAPIResponse,
  SuitImagesAPIResponse,
  SuitsWithImagesAPIResponse,
  PromSuitsAPIResponse,
  WeddingSuitsAPIResponse,
  ProductCatalogResponse,
  SuitFilters,
} from '../types';

// Debug logging for configuration
console.log('🔧 Suits API Configuration:', {
  SUITS_API_URL: CLIENT_CONFIG.SUITS_API_URL,
  NODE_ENV: CLIENT_CONFIG.NODE_ENV,
  PROD: process.env.NODE_ENV === 'production',
  DEV: process.env.NODE_ENV === 'development',
});

// Create axios instance for suits API
const suitsAPI = axios.create({
  baseURL: CLIENT_CONFIG.SUITS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
suitsAPI.interceptors.request.use((config) => {
  console.log(`🔥 Suits API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Response interceptor for error handling
suitsAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Suits API Success: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Suits API Error: ${error.config?.url} – "${error.message}"`);
    return Promise.reject(error);
  }
);

/**
 * KCT Suits API Client
 * Connects to your Railway suits service with S3 images
 */
export class KCTSuitsAPI {
  
  /**
   * Get all suits with optional filtering
   */
  async getSuits(filters: SuitFilters = {}): Promise<SuitsAPIResponse> {
    const params = new URLSearchParams();
    
    // Add filters as query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await suitsAPI.get(`/api/suits?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a specific suit by slug
   */
  async getSuit(slug: string): Promise<SuitDetailAPIResponse> {
    const response = await suitsAPI.get(`/api/suits/${slug}`);
    return response.data;
  }

  /**
   * Get images for a specific suit
   */
  async getSuitImages(slug: string): Promise<SuitImagesAPIResponse> {
    const response = await suitsAPI.get(`/api/images/suits/${slug}`);
    return response.data;
  }

  /**
   * Get all suits with their images (for catalog display)
   */
  async getSuitsWithImages(): Promise<SuitsWithImagesAPIResponse> {
    try {
      // Get all suits first
      const suitsResponse = await this.getSuits();
      
      console.log(`🖼️ Loading images for ${suitsResponse.suits.length} suits...`);
      
      // Load images for each suit (limit to first 10 for performance)
      const suitsWithImages: SuitWithImages[] = await Promise.all(
        suitsResponse.suits.slice(0, 10).map(async (suit) => {
          try {
            const imagesResponse = await this.getSuitImages(suit.slug);
            console.log(`✅ Loaded images for ${suit.name}:`, imagesResponse.images);
            return {
              ...suit,
              images: imagesResponse.images
            };
          } catch (error) {
            console.warn(`⚠️ No images found for ${suit.name} (${suit.slug})`);
            return {
              ...suit,
              images: {}
            };
          }
        })
      );
      
      // Add remaining suits without images for now
      const remainingSuits = suitsResponse.suits.slice(10).map(suit => ({
        ...suit,
        images: {}
      }));
      
      const allSuits = [...suitsWithImages, ...remainingSuits];
      
      return {
        success: true,
        suits: allSuits,
        count: suitsResponse.count
      };
    } catch (error) {
      console.error('Error fetching suits with images:', error);
      throw error;
    }
  }

  /**
   * Get a suit with its images combined
   */
  async getSuitWithImages(slug: string): Promise<SuitWithImages> {
    try {
      const [suitResponse, imagesResponse] = await Promise.all([
        this.getSuit(slug),
        this.getSuitImages(slug)
      ]);

      return {
        ...suitResponse.suit,
        images: imagesResponse.images
      };
    } catch (error) {
      console.error(`Error fetching suit with images: ${slug}`, error);
      throw error;
    }
  }

  /**
   * Get prom trending suits
   */
  async getPromSuits(): Promise<PromSuitsAPIResponse> {
    const response = await suitsAPI.get('/api/suits/prom');
    return response.data;
  }

  /**
   * Get wedding popular suits
   */
  async getWeddingSuits(): Promise<WeddingSuitsAPIResponse> {
    const response = await suitsAPI.get('/api/suits/wedding');
    return response.data;
  }

  /**
   * Get business recommended suits
   */
  async getBusinessSuits(): Promise<SuitsAPIResponse> {
    const response = await suitsAPI.get('/api/suits/business');
    return response.data;
  }

  /**
   * Search suits by query
   */
  async searchSuits(query: string, filters: SuitFilters = {}): Promise<SuitsAPIResponse> {
    const params = new URLSearchParams({
      search: query,
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, value?.toString() || ''])
      )
    });

    const response = await suitsAPI.get(`/api/suits/search?${params.toString()}`);
    return response.data;
  }

  /**
   * Get suits by category
   */
  async getSuitsByCategory(category: string): Promise<SuitsAPIResponse> {
    const response = await suitsAPI.get(`/api/suits/category/${category}`);
    return response.data;
  }

  /**
   * Health check for suits API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await suitsAPI.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Suits API is not available');
    }
  }
}

/**
 * Unified Product Catalog API
 * Combines all product services (suits, ties, etc.)
 */
export class KCTProductCatalogAPI {
  private suitsAPI: KCTSuitsAPI;

  constructor() {
    this.suitsAPI = new KCTSuitsAPI();
  }

  /**
   * Get all products from all services
   */
  async getAllProducts(): Promise<ProductCatalogResponse> {
    try {
      // Get suits with images
      const suitsResponse = await this.suitsAPI.getSuitsWithImages();
      
      // TODO: Add ties when service is ready
      // const tiesResponse = await this.tiesAPI.getTiesWithImages();
      
      return {
        suits: suitsResponse.suits,
        ties: [], // Empty for now
        total_products: suitsResponse.count,
        suits_count: suitsResponse.count,
        ties_count: 0
      };
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  }

  /**
   * Search across all product services
   */
  async searchAllProducts(query: string): Promise<ProductCatalogResponse> {
    try {
      // Search suits
      const suitsResponse = await this.suitsAPI.searchSuits(query);
      
      // TODO: Add ties search when service is ready
      
      return {
        suits: suitsResponse.suits.map(suit => ({ ...suit, images: {} })), // Images will be loaded separately
        ties: [],
        total_products: suitsResponse.count,
        suits_count: suitsResponse.count,
        ties_count: 0
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(): Promise<{
    promSuits: SuitWithImages[];
    weddingSuits: SuitWithImages[];
    businessSuits: SuitProduct[];
  }> {
    try {
      const [promResponse, weddingResponse, businessResponse] = await Promise.all([
        this.suitsAPI.getPromSuits(),
        this.suitsAPI.getWeddingSuits(),
        this.suitsAPI.getBusinessSuits()
      ]);

      return {
        promSuits: promResponse.prom_suits,
        weddingSuits: weddingResponse.wedding_suits,
        businessSuits: businessResponse.suits
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }
}

// Export singleton instances
export const suitsAPIClient = new KCTSuitsAPI();
export const productCatalogAPI = new KCTProductCatalogAPI();

// Export default as the unified catalog API
export default productCatalogAPI; 