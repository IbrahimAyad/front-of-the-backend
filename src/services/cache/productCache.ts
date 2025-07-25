import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from './redisClient';
import { logger } from '../../utils/logger';
import { Product, ProductVariant } from '@prisma/client';

// Cache keys
const CACHE_KEYS = {
  ALL_PRODUCTS: 'products:all',
  PRODUCT_BY_ID: (id: string) => `products:${id}`,
  PRODUCT_BY_SLUG: (slug: string) => `products:slug:${slug}`,
  PRODUCTS_BY_CATEGORY: (category: string) => `products:category:${category}`,
  PRODUCT_VARIANTS: (productId: string) => `products:${productId}:variants`,
  FEATURED_PRODUCTS: 'products:featured',
  COLLECTIONS: 'collections:all',
  COLLECTION_BY_SLUG: (slug: string) => `collections:slug:${slug}`,
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  PRODUCTS: 3600, // 1 hour
  VARIANTS: 3600, // 1 hour
  COLLECTIONS: 7200, // 2 hours
  FEATURED: 1800, // 30 minutes
};

// Product cache functions
export async function getCachedProducts(): Promise<Product[] | null> {
  return cacheGet<Product[]>(CACHE_KEYS.ALL_PRODUCTS);
}

export async function setCachedProducts(products: Product[]): Promise<void> {
  await cacheSet(CACHE_KEYS.ALL_PRODUCTS, products, CACHE_TTL.PRODUCTS);
}

export async function getCachedProductById(id: string): Promise<Product | null> {
  return cacheGet<Product>(CACHE_KEYS.PRODUCT_BY_ID(id));
}

export async function setCachedProductById(product: Product): Promise<void> {
  await cacheSet(CACHE_KEYS.PRODUCT_BY_ID(product.id), product, CACHE_TTL.PRODUCTS);
}

export async function getCachedProductBySlug(slug: string): Promise<Product | null> {
  return cacheGet<Product>(CACHE_KEYS.PRODUCT_BY_SLUG(slug));
}

export async function setCachedProductBySlug(product: Product): Promise<void> {
  if (product.slug) {
    await cacheSet(CACHE_KEYS.PRODUCT_BY_SLUG(product.slug), product, CACHE_TTL.PRODUCTS);
  }
}

export async function getCachedProductsByCategory(category: string): Promise<Product[] | null> {
  return cacheGet<Product[]>(CACHE_KEYS.PRODUCTS_BY_CATEGORY(category));
}

export async function setCachedProductsByCategory(category: string, products: Product[]): Promise<void> {
  await cacheSet(CACHE_KEYS.PRODUCTS_BY_CATEGORY(category), products, CACHE_TTL.PRODUCTS);
}

export async function getCachedProductVariants(productId: string): Promise<ProductVariant[] | null> {
  return cacheGet<ProductVariant[]>(CACHE_KEYS.PRODUCT_VARIANTS(productId));
}

export async function setCachedProductVariants(productId: string, variants: ProductVariant[]): Promise<void> {
  await cacheSet(CACHE_KEYS.PRODUCT_VARIANTS(productId), variants, CACHE_TTL.VARIANTS);
}

export async function getCachedFeaturedProducts(): Promise<Product[] | null> {
  return cacheGet<Product[]>(CACHE_KEYS.FEATURED_PRODUCTS);
}

export async function setCachedFeaturedProducts(products: Product[]): Promise<void> {
  await cacheSet(CACHE_KEYS.FEATURED_PRODUCTS, products, CACHE_TTL.FEATURED);
}

// Cache invalidation functions
export async function invalidateProductCache(productId?: string): Promise<void> {
  try {
    if (productId) {
      // Invalidate specific product
      await cacheDel(CACHE_KEYS.PRODUCT_BY_ID(productId));
      await cacheDel(CACHE_KEYS.PRODUCT_VARIANTS(productId));
      
      // Also invalidate product by slug (would need to fetch product to get slug)
      // For now, clear all slug-based caches
      await cacheDelPattern('products:slug:*');
    }
    
    // Always invalidate list caches
    await cacheDel(CACHE_KEYS.ALL_PRODUCTS);
    await cacheDelPattern('products:category:*');
    await cacheDel(CACHE_KEYS.FEATURED_PRODUCTS);
    
    logger.info('Product cache invalidated', { productId });
  } catch (error) {
    logger.error('Error invalidating product cache:', error);
  }
}

export async function invalidateAllProductCaches(): Promise<void> {
  try {
    await cacheDelPattern('products:*');
    logger.info('All product caches invalidated');
  } catch (error) {
    logger.error('Error invalidating all product caches:', error);
  }
}

// Collection cache functions
export async function getCachedCollections(): Promise<any[] | null> {
  return cacheGet<any[]>(CACHE_KEYS.COLLECTIONS);
}

export async function setCachedCollections(collections: any[]): Promise<void> {
  await cacheSet(CACHE_KEYS.COLLECTIONS, collections, CACHE_TTL.COLLECTIONS);
}

export async function getCachedCollectionBySlug(slug: string): Promise<any | null> {
  return cacheGet<any>(CACHE_KEYS.COLLECTION_BY_SLUG(slug));
}

export async function setCachedCollectionBySlug(collection: any): Promise<void> {
  await cacheSet(CACHE_KEYS.COLLECTION_BY_SLUG(collection.slug), collection, CACHE_TTL.COLLECTIONS);
}

export async function invalidateCollectionCache(): Promise<void> {
  try {
    await cacheDelPattern('collections:*');
    logger.info('Collection cache invalidated');
  } catch (error) {
    logger.error('Error invalidating collection cache:', error);
  }
}