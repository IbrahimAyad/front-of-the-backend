import { useEffect, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

/**
 * Hook for using cached API endpoints
 */
export function useCachedData<T = any>(
  endpoint: string | null,
  options?: SWRConfiguration
) {
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    return response.json();
  };

  const { data, error, isLoading, mutate } = useSWR<T>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      ...options
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    isError: !!error
  };
}

/**
 * Hook for cached product data
 */
export function useCachedProduct(productId: string | null) {
  return useCachedData(
    productId ? `/api/cached/products/${productId}` : null
  );
}

/**
 * Hook for cached products by category
 */
export function useCachedProductsByCategory(
  category: string,
  limit = 50,
  offset = 0
) {
  return useCachedData(
    `/api/cached/products/category/${category}?limit=${limit}&offset=${offset}`
  );
}

/**
 * Hook for cached product search
 */
export function useCachedProductSearch(
  query: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  },
  limit = 20,
  offset = 0
) {
  const params = new URLSearchParams({
    search: query,
    limit: limit.toString(),
    offset: offset.toString()
  });

  if (filters?.category) params.append('category', filters.category);
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());

  return useCachedData(
    query ? `/api/cached/products/search?${params}` : null
  );
}

/**
 * Hook for featured products
 */
export function useFeaturedProducts() {
  return useCachedData('/api/cached/products/featured');
}

/**
 * Hook for bundle pricing calculation
 */
export function useBundlePricing(
  products: Array<{ id: string; quantity: number }> | null
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!products || products.length === 0) {
      setData(null);
      return;
    }

    const calculateBundle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/cached/pricing/bundle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ products })
        });

        if (!response.ok) {
          throw new Error('Failed to calculate bundle pricing');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    calculateBundle();
  }, [JSON.stringify(products)]);

  return { data, loading, error };
}

/**
 * Hook for product pricing with quantity
 */
export function useProductPricing(productId: string | null, quantity = 1) {
  return useCachedData(
    productId ? `/api/cached/pricing/${productId}?quantity=${quantity}` : null
  );
}

/**
 * Hook to invalidate cache
 */
export function useCacheInvalidation() {
  const [loading, setLoading] = useState(false);

  const invalidate = async (type: string, id?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, id })
      });

      if (!response.ok) {
        throw new Error('Failed to invalidate cache');
      }

      return await response.json();
    } catch (error) {
      console.error('Cache invalidation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { invalidate, loading };
}