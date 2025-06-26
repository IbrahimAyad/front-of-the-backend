// src/services/tiesAPI.ts
// TIES COLOR SYSTEM ONLY
// Handles: 4 tie widths × 63 colors = 252 variants
// Color families: 9 families with advanced color intelligence
// NOT for suits (jacket/pants) or shirts (neck/sleeve)
import axios, { AxiosInstance } from 'axios';

interface TieWidth {
  width: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
}

interface ColorFamily {
  name: string;
  slug: string;
  gradient: { start: string; end: string };
  colors: string[];
  total: number;
}

interface TieProduct {
  id: string;
  name: string;
  slug: string;
  variants?: TieVariant[];
  colorFamilies?: ColorFamily[];
  totalColors?: number;
  sizing?: {
    type: string;
    width: string;
    length: string;
    description?: string;
  };
}

interface TieVariant {
  color: {
    name: string;
    family: {
      name: string;
      slug: string;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class TiesApiService {
  private baseURL: string;
  private client: AxiosInstance;

  constructor() {
    this.baseURL = process.env.KCT_TIES_API_URL || 'https://kct-ties-services-production.up.railway.app';
    // Note: Ties service doesn't have S3 integration yet (unlike suits)
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KCT-Frontend/1.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[TiesAPI] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[TiesAPI] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[TiesAPI] Success: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[TiesAPI] Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        data: {
          status: 'healthy',
          data: response.data,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Get all products with color variants
  async getProducts(page: number = 1, limit: number = 50): Promise<ApiResponse<{ products: TieProduct[]; total: number; page: number; totalPages: number }>> {
    try {
      const response = await this.client.get('/api/products', {
        params: { page, limit }
      });

      // Transform ties data to include color families and variants
      const enhancedProducts = await Promise.all(
        (response.data.products || []).map(async (product: any) => {
          try {
            // Fetch variants for this specific product
            const variantsResponse = await this.client.get(`/api/products/${product.slug}/variants`);
            const variantsData = variantsResponse.data;
            
            if (variantsData.success && variantsData.variants) {
              // Group variants by color family for better organization
              const colorFamilies = this.groupVariantsByColorFamily(variantsData.variants);
              
              return {
                ...product,
                variants: variantsData.variants,
                colorFamilies: colorFamilies,
                totalColors: variantsData.variants.length,
                // Enhanced product info for ties
                sizing: {
                  type: 'width_based',
                  width: this.extractWidthFromProduct(product),
                  length: 'one_size_fits_all',
                  description: this.getWidthDescription(product)
                }
              };
            }
          } catch (variantError: any) {
            console.warn(`[TiesAPI] Failed to fetch variants for ${product.slug}:`, variantError.message);
          }
          
          // Return product without variants if variant fetch failed
          return {
            ...product,
            variants: [],
            colorFamilies: [],
            totalColors: 0,
            sizing: {
              type: 'width_based',
              width: this.extractWidthFromProduct(product),
              length: 'one_size_fits_all'
            }
          };
        })
      );

      return {
        success: true,
        data: {
          products: enhancedProducts,
          total: enhancedProducts.length,
          page: page,
          totalPages: Math.ceil(enhancedProducts.length / limit)
        }
      };
    } catch (error: any) {
      console.error('[TiesAPI] Get products error:', error);
      return {
        success: false,
        error: error.message,
        data: { products: [], total: 0, page: 1, totalPages: 0 }
      };
    }
  }

  // Get product by ID
  async getProductById(id: string): Promise<ApiResponse<TieProduct>> {
    try {
      // First get the product basic info from the list
      const allProducts = await this.getProducts(1, 100);
      const product = allProducts.data?.products.find(p => p.id === id);
      
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      return {
        success: true,
        data: product
      };
    } catch (error: any) {
      console.error(`[TiesAPI] Get product ${id} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get product by slug (more common for ties)
  async getProductBySlug(slug: string): Promise<ApiResponse<TieProduct>> {
    try {
      const response = await this.client.get(`/api/products/${slug}`);
      
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        
        // Enhance with color family organization
        if (product.variants) {
          product.colorFamilies = this.groupVariantsByColorFamily(product.variants);
          product.totalColors = product.variants.length;
        }
        
        return {
          success: true,
          data: product
        };
      }
      
      return {
        success: false,
        error: 'Product not found'
      };
    } catch (error: any) {
      console.error(`[TiesAPI] Get product by slug ${slug} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get color families (revolutionary UI feature)
  async getColorFamilies(): Promise<ApiResponse<ColorFamily[]>> {
    try {
      const response = await this.client.get('/api/colors/families');
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.families || []
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch color families'
      };
    } catch (error: any) {
      console.error('[TiesAPI] Get color families error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get colors for a specific family
  async getColorsByFamily(familySlug: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.client.get(`/api/colors/filter`, {
        params: { family: familySlug }
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.colors || []
        };
      }
      
      return {
        success: false,
        error: `No colors found for family: ${familySlug}`
      };
    } catch (error: any) {
      console.error(`[TiesAPI] Get colors by family ${familySlug} error:`, error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get event-based recommendations
  async getEventRecommendations(eventSlug: string | null = null): Promise<ApiResponse<any[]>> {
    try {
      const endpoint = eventSlug ? `/api/events/${eventSlug}` : '/api/events';
      const response = await this.client.get(endpoint);
      
      return {
        success: true,
        data: response.data.events || response.data.recommendations || []
      };
    } catch (error: any) {
      console.error(`[TiesAPI] Get event recommendations error:`, error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get bundle pricing configurations
  async getBundleConfigs(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/api/bundles/configs');
      
      return {
        success: true,
        data: response.data.configs || []
      };
    } catch (error: any) {
      console.error('[TiesAPI] Get bundle configs error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Calculate bundle pricing
  async calculateBundlePricing(items: any[], options: any = {}): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/bundles/calculate', {
        items,
        ...options
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[TiesAPI] Calculate bundle pricing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper: Group variants by color family for revolutionary UI
  private groupVariantsByColorFamily(variants: TieVariant[]): ColorFamily[] {
    const families: { [key: string]: ColorFamily } = {};
    
    variants.forEach(variant => {
      if (variant.color && variant.color.family) {
        const familyName = variant.color.family.name;
        if (!families[familyName]) {
          families[familyName] = {
            name: familyName,
            slug: variant.color.family.slug,
            gradient: { start: '#000000', end: '#ffffff' }, // Default gradient
            colors: [],
            total: 0
          };
        }
        families[familyName].colors.push(variant.color.name);
        families[familyName].total++;
      }
    });
    
    return Object.values(families);
  }

  // Helper: Extract width from product name/slug
  private extractWidthFromProduct(product: TieProduct): string {
    const name = product.name?.toLowerCase() || '';
    const slug = product.slug?.toLowerCase() || '';
    
    if (name.includes('ultra skinny') || slug.includes('ultra-skinny')) {
      return '2.25"';
    } else if (name.includes('skinny') || slug.includes('skinny')) {
      return '2.75"';
    } else if (name.includes('classic') || slug.includes('classic')) {
      return '3.25"';
    } else if (name.includes('bow') || slug.includes('bow')) {
      return 'adjustable';
    }
    
    return 'standard';
  }

  // Helper: Get width description
  private getWidthDescription(product: TieProduct): string {
    const width = this.extractWidthFromProduct(product);
    
    switch (width) {
      case '2.25"':
        return 'Ultra Skinny - Modern, minimalist look';
      case '2.75"':
        return 'Skinny - Contemporary slim profile';
      case '3.25"':
        return 'Classic - Traditional standard width';
      case 'adjustable':
        return 'Bow Tie - Pre-tied with adjustable strap';
      default:
        return 'Standard tie width';
    }
  }

  // Search products with color and event filtering
  async searchProducts(query: string, filters: any = {}): Promise<ApiResponse<{ products: TieProduct[]; total: number; query: string; filters: any }>> {
    try {
      // Ties service uses different search patterns than suits
      const params = {
        q: query,
        ...filters
      };

      // For now, get all products and filter locally
      // TODO: Implement server-side search in ties service
      const allProducts = await this.getProducts(1, 100);
      
      if (!allProducts.success) {
        return allProducts as any;
      }

      const filteredProducts = allProducts.data!.products.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query.toLowerCase());
        const colorMatch = product.variants?.some(variant => 
          variant.color?.name?.toLowerCase().includes(query.toLowerCase())
        );
        
        return nameMatch || colorMatch;
      });

      return {
        success: true,
        data: {
          products: filteredProducts,
          total: filteredProducts.length,
          query: query,
          filters: filters
        }
      };
    } catch (error: any) {
      console.error('[TiesAPI] Search products error:', error);
      return {
        success: false,
        error: error.message,
        data: { products: [], total: 0, query: '', filters: {} }
      };
    }
  }

  // Generate revolutionary color data for ties (different from suits sizing)
  // TIES COLOR SYSTEM: 4 widths × 63 colors = 252 variants
  generateColorData(productId: string, productName: string, productSlug: string) {
    // TIES width specifications from KCT requirements
    const tieWidths: TieWidth[] = [
      {
        width: '2.25"',
        name: 'Ultra Skinny',
        slug: 'ultra-skinny-tie',
        description: 'Modern minimalist look',
        price: '24.99',
        compareAtPrice: '39.99'
      },
      {
        width: '2.75"',
        name: 'Skinny',
        slug: 'skinny-tie',
        description: 'Contemporary slim profile',
        price: '24.99',
        compareAtPrice: '39.99'
      },
      {
        width: '3.25"',
        name: 'Classic Width',
        slug: 'classic-width-tie',
        description: 'Traditional standard width',
        price: '29.99',
        compareAtPrice: '44.99'
      },
      {
        width: 'adjustable',
        name: 'Bow Tie',
        slug: 'bow-tie',
        description: 'Pre-tied with adjustable strap',
        price: '24.99',
        compareAtPrice: '39.99'
      }
    ];

    // EXACT 63 Wedding Collection Colors from scraped data - organized by 9 families
    const colorFamilies: ColorFamily[] = [
      {
        name: 'Blues',
        slug: 'blues',
        gradient: { start: '#001f3f', end: '#0074cc' },
        colors: ['Dark Navy', 'Navy Blue', 'Royal Blue', 'French Blue', 'Sapphire Blue', 'Cobalt Blue', 'Carolina Blue', 'Baby Blue', 'Powder Blue', 'Aqua', 'Tiffany Blue'],
        total: 11
      },
      {
        name: 'Reds', 
        slug: 'reds',
        gradient: { start: '#8b0000', end: '#ff6b6b' },
        colors: ['True Red', 'Apple Red', 'Burgundy', 'Chianti', 'Rust', 'Coral', 'Salmon', 'Peach'],
        total: 8
      },
      {
        name: 'Greens',
        slug: 'greens', 
        gradient: { start: '#013220', end: '#2ecc71' },
        colors: ['Emerald Green', 'Forest Green', 'Mint Green', 'Dark Green', 'Olive Green', 'Lime Green', 'Mermaid Green', 'Lettuce Green', 'Pastel Green'],
        total: 9
      },
      {
        name: 'Pinks',
        slug: 'pinks',
        gradient: { start: '#c71585', end: '#ffb6c1' },
        colors: ['Pink', 'Rose Gold', 'Dusty Rose', 'Light Pink', 'Blush', 'Fuchsia', 'French Rose', 'Mauve'],
        total: 8
      },
      {
        name: 'Purples',
        slug: 'purples',
        gradient: { start: '#4b0082', end: '#da70d6' },
        colors: ['Deep Purple', 'Lavender', 'Pastel Purple', 'Lilac', 'Light Purple', 'Plum', 'Medium Purple', 'Magenta'],
        total: 8
      },
      {
        name: 'Yellows/Oranges',
        slug: 'yellows-oranges',
        gradient: { start: '#ff8c00', end: '#ffd700' },
        colors: ['Canary Yellow', 'Banana Yellow', 'Yellow', 'Gold', 'Orange', 'Champagne', 'Beige', 'Cinnamon'],
        total: 8
      },
      {
        name: 'Grays/Blacks',
        slug: 'grays-blacks',
        gradient: { start: '#000000', end: '#808080' },
        colors: ['Black', 'Dark Grey', 'Charcoal', 'Teal'],
        total: 4
      },
      {
        name: 'Whites/Creams',
        slug: 'whites-creams',
        gradient: { start: '#fffaf0', end: '#f5f5dc' },
        colors: ['White', 'Silver', 'Dark Silver', 'Ivory'],
        total: 4
      },
      {
        name: 'Browns/Neutrals',
        slug: 'browns-neutrals',
        gradient: { start: '#8b4513', end: '#deb887' },
        colors: ['Chocolate Brown', 'Taupe', 'Tan'],
        total: 3
      }
    ];

    return {
      success: true,
      productId,
      productName,
      productSlug,
      availableWidths: tieWidths,
      colorFamilies: colorFamilies,
      totalColors: colorFamilies.reduce((sum, family) => sum + family.total, 0),
      totalVariants: tieWidths.length * colorFamilies.reduce((sum, family) => sum + family.total, 0),
      sizingInfo: {
        type: 'width_based',
        description: 'Ties are sized by width, with one-size-fits-all length (approximately 58-60 inches)',
        options: tieWidths.map(w => ({ width: w.width, description: w.description }))
      },
      revolutionaryUI: {
        colorFamilyGrid: '3x3 grid layout',
        gradientCards: 'Each family shows gradient with 8 representative colors',
        dynamicSelection: 'Color updates without page reload',
        crossWidthSuggestions: 'Show this color in other widths'
      }
    };
  }

  // Get color data for specific product (ties equivalent of suits sizing)
  async getProductColors(productId: string, productSlug: string | null = null) {
    try {
      console.log(`[TiesAPI] Generating colors for product ${productId}`);
      
      // Get product name for context
      let productName = 'KCT Tie';
      if (productSlug) {
        productName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      const colorData = this.generateColorData(productId, productName, productSlug || '');
      
      return colorData;
    } catch (error: any) {
      console.error(`[TiesAPI] Get colors for product ${productId} error:`, error);
      return {
        success: false,
        error: error.message,
        availableWidths: [],
        colorFamilies: []
      };
    }
  }

  // Enhanced getProducts with color data integration (ties equivalent of suits with sizes)
  async getProductsWithColors(page: number = 1, limit: number = 50): Promise<ApiResponse<{ products: TieProduct[]; total: number; page: number; totalPages: number }>> {
    try {
      // First get the base products
      const baseResult = await this.getProducts(page, limit);
      
      if (!baseResult.success) {
        return baseResult;
      }

      // Enhance products with color data
      const enhancedProducts = await Promise.all(
        baseResult.data!.products.map(async (product) => {
          try {
            const colorData = await this.getProductColors(product.id, product.slug);
            return {
              ...product,
              colors: 'colorFamilies' in colorData ? colorData.colorFamilies : [],
              totalColors: 'totalColors' in colorData ? colorData.totalColors : 0,
              totalVariants: 'totalVariants' in colorData ? colorData.totalVariants : 0,
              availableWidths: 'availableWidths' in colorData ? colorData.availableWidths : [],
              revolutionaryUI: 'revolutionaryUI' in colorData ? colorData.revolutionaryUI : {}
            };
          } catch (colorError: any) {
            console.warn(`[TiesAPI] Failed to fetch colors for ${product.slug}:`, colorError.message);
            return {
              ...product,
              colors: [],
              totalColors: 0,
              totalVariants: 0,
              availableWidths: [],
              revolutionaryUI: {}
            };
          }
        })
      );

      return {
        ...baseResult,
        data: {
          ...baseResult.data!,
          products: enhancedProducts
        }
      };
    } catch (error: any) {
      console.error('[TiesAPI] Get products with colors error:', error);
      return {
        success: false,
        error: error.message,
        data: { products: [], total: 0, page: 1, totalPages: 0 }
      };
    }
  }
}

export default new TiesApiService();