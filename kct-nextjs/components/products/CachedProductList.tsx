'use client';

import { useCachedProductsByCategory } from '@/hooks/useCache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface CachedProductListProps {
  category: string;
  limit?: number;
}

export function CachedProductList({ category, limit = 20 }: CachedProductListProps) {
  const { data, isLoading, error } = useCachedProductsByCategory(category, limit, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(limit)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load products</p>
      </div>
    );
  }

  if (!data?.products?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found in {category}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold capitalize">{category}</h2>
        <Badge variant="secondary">
          {data.pagination.total} products
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.products.map((product: any) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              {product.images?.[0] && (
                <div className="relative h-48 w-full">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
              <p className="text-muted-foreground text-sm mb-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                {product.variants?.[0] && (
                  <Badge variant={product.variants[0].inventory > 0 ? 'default' : 'destructive'}>
                    {product.variants[0].inventory > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.pagination.hasMore && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Showing {data.products.length} of {data.pagination.total} products
          </p>
        </div>
      )}
    </div>
  );
}