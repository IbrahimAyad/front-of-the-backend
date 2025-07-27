import { CacheService } from './cache.service';

export interface SearchServiceDependencies {
  prisma: {
    product: {
      findMany: (args?: any) => Promise<any[]>;
      count: (args?: any) => Promise<number>;
    };
    order: {
      findMany: (args?: any) => Promise<any[]>;
      count: (args?: any) => Promise<number>;
    };
    customer: {
      findMany: (args?: any) => Promise<any[]>;
      count: (args?: any) => Promise<number>;
    };
  };
  cache?: CacheService;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: PaginationOptions;
  includeOutOfStock?: boolean;
  searchType?: SearchType;
}

export interface SearchFilters {
  category?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  brand?: string[];
  size?: string[];
  color?: string[];
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  rating?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  status?: string[];
}

export interface SortOptions {
  field: SortField;
  direction: 'asc' | 'desc';
}

export enum SortField {
  RELEVANCE = 'relevance',
  PRICE = 'price',
  NAME = 'name',
  RATING = 'rating',
  POPULARITY = 'popularity',
  NEWEST = 'createdAt',
  BEST_SELLING = 'sales',
  TOTAL = 'total',
  DATE = 'date',
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export enum SearchType {
  PRODUCTS = 'products',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  ALL = 'all',
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  filters: AppliedFilters;
  searchTime: number;
  suggestions?: string[];
}

export interface AppliedFilters {
  query?: string;
  category?: string[];
  priceRange?: { min?: number; max?: number };
  brand?: string[];
  inStock?: boolean;
  [key: string]: any;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  tags: string[];
  relevanceScore: number;
}

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  relevanceScore: number;
}

export interface CustomerSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  status: string;
  createdAt: Date;
  relevanceScore: number;
}

export interface SearchSuggestion {
  query: string;
  type: 'product' | 'category' | 'brand';
  count: number;
}

export interface SearchAnalytics {
  searchId: string;
  query: string;
  type: SearchType;
  filters: SearchFilters;
  resultsCount: number;
  searchTime: number;
  userId?: string;
  timestamp: Date;
  clickedResults?: string[];
}

export class SearchService {
  private readonly prisma: SearchServiceDependencies['prisma'];
  private readonly cache?: CacheService;
  private readonly searchHistory: Map<string, SearchAnalytics> = new Map();
  private readonly popularSearches: Map<string, number> = new Map();

  constructor(dependencies: SearchServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.cache = dependencies.cache;
  }

  async searchProducts(options: SearchOptions): Promise<SearchResult<ProductSearchResult>> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    const cacheKey = this.generateCacheKey('products', options);
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const {
      query = '',
      filters = {},
      sort = { field: SortField.RELEVANCE, direction: 'desc' },
      pagination = { page: 1, limit: 20 },
      includeOutOfStock = false,
    } = options;

    // Build where clause
    const where: any = {};

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Apply filters
    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.brand?.length) {
      where.brand = { in: filters.brand };
    }

    if (filters.priceRange) {
      where.price = {};
      if (filters.priceRange.min !== undefined) {
        where.price.gte = filters.priceRange.min;
      }
      if (filters.priceRange.max !== undefined) {
        where.price.lte = filters.priceRange.max;
      }
    }

    if (filters.inStock !== undefined || !includeOutOfStock) {
      where.stock = { gt: 0 };
    }

    if (filters.onSale) {
      where.originalPrice = { gt: where.price || 0 };
    }

    if (filters.rating?.min) {
      where.rating = { gte: filters.rating.min };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort.field) {
      case SortField.PRICE:
        orderBy = { price: sort.direction };
        break;
      case SortField.NAME:
        orderBy = { name: sort.direction };
        break;
      case SortField.RATING:
        orderBy = { rating: sort.direction };
        break;
      case SortField.NEWEST:
        orderBy = { createdAt: sort.direction };
        break;
      case SortField.POPULARITY:
        orderBy = { views: sort.direction };
        break;
      case SortField.BEST_SELLING:
        orderBy = { salesCount: sort.direction };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute search
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          reviews: {
            select: { rating: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Transform results and calculate relevance scores
    const items: ProductSearchResult[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      brand: product.brand,
      images: product.images || [],
      rating: product.rating || 0,
      reviewCount: product.reviews?.length || 0,
      inStock: product.stock > 0,
      stock: product.stock,
      tags: product.tags || [],
      relevanceScore: this.calculateProductRelevance(product, query, filters),
    }));

    // Sort by relevance if that's the sort field
    if (sort.field === SortField.RELEVANCE && query) {
      items.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / pagination.limit);

    const result: SearchResult<ProductSearchResult> = {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      filters: this.buildAppliedFilters(query, filters),
      searchTime,
      suggestions: await this.generateSuggestions(query, 'products'),
    };

    // Log search analytics
    this.logSearch({
      searchId,
      query,
      type: SearchType.PRODUCTS,
      filters,
      resultsCount: total,
      searchTime,
      timestamp: new Date(),
    });

    // Cache results
    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(result), 300); // 5 minutes
    }

    return result;
  }

  async searchOrders(options: SearchOptions): Promise<SearchResult<OrderSearchResult>> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    const {
      query = '',
      filters = {},
      sort = { field: SortField.DATE, direction: 'desc' },
      pagination = { page: 1, limit: 20 },
    } = options;

    const where: any = {};

    // Text search
    if (query) {
      where.OR = [
        { orderNumber: { contains: query, mode: 'insensitive' } },
        { customer: { email: { contains: query, mode: 'insensitive' } } },
        { customer: { firstName: { contains: query, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Apply filters
    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.priceRange) {
      where.total = {};
      if (filters.priceRange.min !== undefined) {
        where.total.gte = filters.priceRange.min;
      }
      if (filters.priceRange.max !== undefined) {
        where.total.lte = filters.priceRange.max;
      }
    }

    if (filters.dateRange) {
      where.createdAt = {};
      if (filters.dateRange.start) {
        where.createdAt.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.createdAt.lte = filters.dateRange.end;
      }
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort.field) {
      case SortField.TOTAL:
        orderBy = { total: sort.direction };
        break;
      case SortField.DATE:
        orderBy = { createdAt: sort.direction };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            select: { id: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const items: OrderSearchResult[] = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerEmail: order.customer.email,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.length,
      relevanceScore: this.calculateOrderRelevance(order, query, filters),
    }));

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / pagination.limit);

    const result: SearchResult<OrderSearchResult> = {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      filters: this.buildAppliedFilters(query, filters),
      searchTime,
      suggestions: await this.generateSuggestions(query, 'orders'),
    };

    this.logSearch({
      searchId,
      query,
      type: SearchType.ORDERS,
      filters,
      resultsCount: total,
      searchTime,
      timestamp: new Date(),
    });

    return result;
  }

  async searchCustomers(options: SearchOptions): Promise<SearchResult<CustomerSearchResult>> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    const {
      query = '',
      filters = {},
      sort = { field: SortField.NAME, direction: 'asc' },
      pagination = { page: 1, limit: 20 },
    } = options;

    const where: any = {};

    // Text search
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.dateRange) {
      where.createdAt = {};
      if (filters.dateRange.start) {
        where.createdAt.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.createdAt.lte = filters.dateRange.end;
      }
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort.field) {
      case SortField.NAME:
        orderBy = [{ firstName: sort.direction }, { lastName: sort.direction }];
        break;
      case SortField.DATE:
        orderBy = { createdAt: sort.direction };
        break;
      default:
        orderBy = { firstName: 'asc' };
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          orders: {
            select: {
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const items: CustomerSearchResult[] = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
      const lastOrder = customer.orders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer.orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt,
        status: customer.status || 'active',
        createdAt: customer.createdAt,
        relevanceScore: this.calculateCustomerRelevance(customer, query, filters),
      };
    });

    const searchTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / pagination.limit);

    const result: SearchResult<CustomerSearchResult> = {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      filters: this.buildAppliedFilters(query, filters),
      searchTime,
      suggestions: await this.generateSuggestions(query, 'customers'),
    };

    this.logSearch({
      searchId,
      query,
      type: SearchType.CUSTOMERS,
      filters,
      resultsCount: total,
      searchTime,
      timestamp: new Date(),
    });

    return result;
  }

  async globalSearch(options: SearchOptions): Promise<{
    products: SearchResult<ProductSearchResult>;
    orders: SearchResult<OrderSearchResult>;
    customers: SearchResult<CustomerSearchResult>;
  }> {
    const [products, orders, customers] = await Promise.all([
      this.searchProducts({ ...options, pagination: { page: 1, limit: 5 } }),
      this.searchOrders({ ...options, pagination: { page: 1, limit: 5 } }),
      this.searchCustomers({ ...options, pagination: { page: 1, limit: 5 } }),
    ]);

    return { products, orders, customers };
  }

  async getSearchSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Get product name suggestions
    const products = await this.prisma.product.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true, category: true },
      take: limit,
    });

    products.forEach(product => {
      suggestions.push({
        query: product.name,
        type: 'product',
        count: 1,
      });
    });

    // Get category suggestions
    const categories = await this.prisma.product.findMany({
      where: {
        category: { contains: query, mode: 'insensitive' },
      },
      select: { category: true },
      distinct: ['category'],
      take: limit,
    });

    categories.forEach(cat => {
      suggestions.push({
        query: cat.category,
        type: 'category',
        count: 1,
      });
    });

    return suggestions.slice(0, limit);
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }

  async getSearchAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResultsCount: number;
    averageSearchTime: number;
    topQueries: Array<{ query: string; count: number }>;
    searchesByType: Record<SearchType, number>;
  }> {
    const searches = Array.from(this.searchHistory.values());
    
    let filteredSearches = searches;
    if (dateRange) {
      filteredSearches = searches.filter(
        search => search.timestamp >= dateRange.start && search.timestamp <= dateRange.end
      );
    }

    const totalSearches = filteredSearches.length;
    const uniqueQueries = new Set(filteredSearches.map(s => s.query)).size;
    const averageResultsCount = filteredSearches.reduce((sum, s) => sum + s.resultsCount, 0) / totalSearches || 0;
    const averageSearchTime = filteredSearches.reduce((sum, s) => sum + s.searchTime, 0) / totalSearches || 0;

    const queryCount = new Map<string, number>();
    filteredSearches.forEach(search => {
      if (search.query) {
        queryCount.set(search.query, (queryCount.get(search.query) || 0) + 1);
      }
    });

    const topQueries = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const searchesByType = filteredSearches.reduce((acc, search) => {
      acc[search.type] = (acc[search.type] || 0) + 1;
      return acc;
    }, {} as Record<SearchType, number>);

    return {
      totalSearches,
      uniqueQueries,
      averageResultsCount,
      averageSearchTime,
      topQueries,
      searchesByType,
    };
  }

  private calculateProductRelevance(product: any, query: string, filters: SearchFilters): number {
    let score = 0;

    if (query) {
      const lowerQuery = query.toLowerCase();
      const lowerName = product.name.toLowerCase();
      const lowerDesc = product.description?.toLowerCase() || '';

      // Exact name match
      if (lowerName === lowerQuery) score += 100;
      // Name starts with query
      else if (lowerName.startsWith(lowerQuery)) score += 50;
      // Name contains query
      else if (lowerName.includes(lowerQuery)) score += 25;
      // Description contains query
      else if (lowerDesc.includes(lowerQuery)) score += 10;

      // Tag matches
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
        score += 15;
      }
    }

    // Boost popular products
    if (product.salesCount > 100) score += 10;
    if (product.rating > 4) score += 5;

    return score;
  }

  private calculateOrderRelevance(order: any, query: string, filters: SearchFilters): number {
    let score = 0;

    if (query) {
      const lowerQuery = query.toLowerCase();
      
      // Order number exact match
      if (order.orderNumber?.toLowerCase() === lowerQuery) score += 100;
      // Order number contains query
      else if (order.orderNumber?.toLowerCase().includes(lowerQuery)) score += 50;
      
      // Customer name/email matches
      const customerName = `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase();
      const customerEmail = order.customer.email.toLowerCase();
      
      if (customerName.includes(lowerQuery)) score += 25;
      if (customerEmail.includes(lowerQuery)) score += 25;
    }

    // Boost recent orders
    const daysSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder < 7) score += 10;
    else if (daysSinceOrder < 30) score += 5;

    return score;
  }

  private calculateCustomerRelevance(customer: any, query: string, filters: SearchFilters): number {
    let score = 0;

    if (query) {
      const lowerQuery = query.toLowerCase();
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const email = customer.email.toLowerCase();

      // Exact email match
      if (email === lowerQuery) score += 100;
      // Email contains query
      else if (email.includes(lowerQuery)) score += 50;
      // Name matches
      else if (fullName.includes(lowerQuery)) score += 25;
      // Phone matches
      else if (customer.phone?.includes(query)) score += 25;
    }

    // Boost valuable customers
    const totalSpent = customer.orders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;
    if (totalSpent > 1000) score += 15;
    else if (totalSpent > 500) score += 10;
    else if (totalSpent > 100) score += 5;

    return score;
  }

  private buildAppliedFilters(query?: string, filters: SearchFilters = {}): AppliedFilters {
    const applied: AppliedFilters = {};
    
    if (query) applied.query = query;
    if (filters.category?.length) applied.category = filters.category;
    if (filters.brand?.length) applied.brand = filters.brand;
    if (filters.priceRange) applied.priceRange = filters.priceRange;
    if (filters.inStock !== undefined) applied.inStock = filters.inStock;

    return applied;
  }

  private async generateSuggestions(query: string, type: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const suggestions = await this.getSearchSuggestions(query, 5);
    return suggestions.map(s => s.query);
  }

  private generateCacheKey(type: string, options: SearchOptions): string {
    return `search:${type}:${JSON.stringify(options)}`;
  }

  private generateSearchId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private logSearch(analytics: SearchAnalytics): void {
    this.searchHistory.set(analytics.searchId, analytics);
    
    // Update popular searches
    if (analytics.query) {
      const currentCount = this.popularSearches.get(analytics.query) || 0;
      this.popularSearches.set(analytics.query, currentCount + 1);
    }

    // Clean up old searches (keep last 1000)
    if (this.searchHistory.size > 1000) {
      const oldestKeys = Array.from(this.searchHistory.keys()).slice(0, 100);
      oldestKeys.forEach(key => this.searchHistory.delete(key));
    }
  }
}

export function createSearchService(dependencies: SearchServiceDependencies): SearchService {
  return new SearchService(dependencies);
}