import { Prisma, Product, ProductVariant } from '@prisma/client';

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface ProductServiceDependencies {
  prisma: {
    product: {
      findMany: (args?: any) => Promise<Product[]>;
      findUnique: (args: any) => Promise<Product | null>;
      create: (args: any) => Promise<Product>;
      update: (args: any) => Promise<Product>;
      delete: (args: any) => Promise<Product>;
    };
    productVariant: {
      updateMany: (args: any) => Promise<{ count: number }>;
    };
  };
  cache?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    invalidate: (pattern: string) => Promise<void>;
  };
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {
  private readonly prisma: ProductServiceDependencies['prisma'];
  private readonly cache: ProductServiceDependencies['cache'];
  private readonly cacheTTL = 300; // 5 minutes
  private readonly lowStockThreshold = 10;

  constructor(dependencies: ProductServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.cache = dependencies.cache;
  }

  async findAll(
    filters: ProductFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ProductWithVariants>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const cacheKey = `products:${JSON.stringify({ filters, pagination })}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const where: Prisma.ProductWhereInput = {
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: filters.search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { variants: true },
      }),
      this.prisma.product.findMany({ where }).then(items => items.length),
    ]);

    const productsWithStock = products.map(product => {
      const totalStock = this.calculateTotalStock(product as ProductWithVariants);
      return {
        ...product,
        totalStock,
        inStock: totalStock > 0,
      };
    });

    const filteredProducts = filters.inStock !== undefined
      ? productsWithStock.filter(p => p.inStock === filters.inStock)
      : productsWithStock;

    const result: PaginatedResult<ProductWithVariants> = {
      data: filteredProducts as ProductWithVariants[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(result), this.cacheTTL);
    }

    return result;
  }

  async findById(id: string): Promise<ProductWithVariants | null> {
    const cacheKey = `product:${id}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (product && this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(product), this.cacheTTL);
    }

    return product as ProductWithVariants | null;
  }

  async create(data: Prisma.ProductCreateInput): Promise<ProductWithVariants> {
    const product = await this.prisma.product.create({
      data,
      include: { variants: true },
    });

    if (this.cache) {
      await this.cache.invalidate('products:*');
      await this.cache.set(`product:${product.id}`, JSON.stringify(product), this.cacheTTL);
    }

    return product as ProductWithVariants;
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithVariants> {
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: { variants: true },
    });

    if (this.cache) {
      await this.cache.invalidate('products:*');
      await this.cache.invalidate(`product:${id}`);
      await this.cache.set(`product:${id}`, JSON.stringify(product), this.cacheTTL);
    }

    return product as ProductWithVariants;
  }

  async delete(id: string): Promise<ProductWithVariants> {
    const product = await this.prisma.product.delete({
      where: { id },
      include: { variants: true },
    });

    if (this.cache) {
      await this.cache.invalidate('products:*');
      await this.cache.invalidate(`product:${id}`);
    }

    return product as ProductWithVariants;
  }

  calculateTotalStock(product: ProductWithVariants): number {
    if (!product.variants || product.variants.length === 0) {
      return 0;
    }
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  }

  async checkLowStock(): Promise<ProductWithVariants[]> {
    const products = await this.prisma.product.findMany({
      include: { variants: true },
    });

    const lowStockProducts = products.filter(product => {
      const totalStock = this.calculateTotalStock(product as ProductWithVariants);
      return totalStock > 0 && totalStock <= this.lowStockThreshold;
    });

    return lowStockProducts as ProductWithVariants[];
  }

  async updateStock(variantId: string, quantity: number, operation: 'increment' | 'decrement' | 'set'): Promise<void> {
    const updateData = 
      operation === 'set' 
        ? { stock: quantity }
        : { stock: { [operation]: quantity } };

    await this.prisma.productVariant.updateMany({
      where: { id: variantId },
      data: updateData,
    });

    if (this.cache) {
      await this.cache.invalidate('products:*');
    }
  }

  async getCategories(): Promise<string[]> {
    const cacheKey = 'product:categories';
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = products.map(p => p.category).filter(Boolean) as string[];
    
    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(categories), this.cacheTTL * 2);
    }

    return categories;
  }
}

export function createProductService(dependencies: ProductServiceDependencies): ProductService {
  return new ProductService(dependencies);
}