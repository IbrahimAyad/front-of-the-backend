import { CacheService } from './cache.service';
import { OrderService } from './order.service';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  addresses?: Address[];
  measurements?: CustomerMeasurements | null;
  preferences?: CustomerPreferences | null;
  loyaltyPoints?: number;
  totalSpent?: number;
  orderCount?: number;
  lastOrderDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  customerId: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  inseam?: number;
  sleeve?: number;
  neck?: number;
  shoeSize?: string;
  preferredFit?: 'slim' | 'regular' | 'relaxed';
  notes?: string;
  updatedAt: Date;
}

export interface CustomerPreferences {
  favoriteColors?: string[];
  favoriteBrands?: string[];
  preferredCategories?: string[];
  sizePreferences?: Record<string, string>; // category -> size
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketingConsent: boolean;
}

export interface CustomerServiceDependencies {
  prisma: {
    customers: {
      findMany: (args?: any) => Promise<Customer[]>;
      findUnique: (args: any) => Promise<Customer | null>;
      create: (args: any) => Promise<Customer>;
      update: (args: any) => Promise<Customer>;
      delete: (args: any) => Promise<Customer>;
    };
    orders: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
    };
    getClient: (readonly?: boolean) => any;
    query: (sql: string, params?: any[], schema?: string) => Promise<any[]>;
  };
  orderService?: OrderService;
  cache?: CacheService;
}

export interface CustomerFilters {
  search?: string;
  minSpent?: number;
  maxSpent?: number;
  minOrders?: number;
  hasRecentOrder?: boolean; // Within last 30 days
  loyaltyTier?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minSpent?: number;
    minOrders?: number;
    dayssSinceLastOrder?: number;
    categories?: string[];
  };
  customerCount?: number;
}

export interface CustomerAnalytics {
  customerId: string;
  lifetimeValue: number;
  averageOrderValue: number;
  orderFrequency: number; // Orders per month
  lastOrderDaysAgo: number;
  favoriteCategories: Array<{ category: string; count: number }>;
  seasonalTrends: Array<{ month: string; spent: number }>;
  churnRisk: 'low' | 'medium' | 'high';
}

export class CustomerService {
  private readonly prisma: CustomerServiceDependencies['prisma'];
  private readonly orderService?: OrderService;
  private readonly cache?: CacheService;

  constructor(dependencies: CustomerServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.orderService = dependencies.orderService;
    this.cache = dependencies.cache;
  }

  async findById(id: string): Promise<Customer | null> {
    const cacheKey = `customer:${id}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const customer = await this.prisma.customers.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: true,
      },
    });

    if (customer) {
      const enrichedCustomer = await this.enrichCustomerData(customer);
      
      if (this.cache) {
        await this.cache.set(cacheKey, JSON.stringify(enrichedCustomer), 300);
      }
      
      return enrichedCustomer;
    }

    return null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customers.findUnique({
      where: { email },
      include: {
        profile: true,
        orders: true,
      },
    });

    return customer ? this.enrichCustomerData(customer) : null;
  }

  async findAll(
    filters: CustomerFilters = {},
    pagination?: { page: number; limit: number }
  ): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          orders: true,
        },
      }),
      this.prisma.getClient(true).customer.count({ where }),
    ]);

    // Apply post-fetch filters based on order data
    let filteredCustomers = customers;
    
    if (filters.minSpent || filters.maxSpent || filters.minOrders || filters.hasRecentOrder) {
      const enrichedCustomers = await Promise.all(
        customers.map(c => this.enrichCustomerData(c))
      );

      filteredCustomers = enrichedCustomers.filter(c => {
        if (filters.minSpent && (c.totalSpent || 0) < filters.minSpent) return false;
        if (filters.maxSpent && (c.totalSpent || 0) > filters.maxSpent) return false;
        if (filters.minOrders && (c.orderCount || 0) < filters.minOrders) return false;
        if (filters.hasRecentOrder) {
          const daysSinceLastOrder = c.lastOrderDate 
            ? (Date.now() - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
            : Infinity;
          if (daysSinceLastOrder > 30) return false;
        }
        return true;
      });
    }

    return {
      customers: filteredCustomers,
      total: filteredCustomers.length,
      page,
      totalPages: Math.ceil(filteredCustomers.length / limit),
    };
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: Omit<Address, 'id' | 'customerId'>;
  }): Promise<Customer> {
    const customer = await this.prisma.getClient(false).$transaction(async (tx: any) => {
      const newCustomer = await tx.customer.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          loyaltyPoints: 0,
        },
      });

      if (data.address) {
        await tx.address.create({
          data: {
            customerId: newCustomer.id,
            ...data.address,
            isDefault: true,
          },
        });
      }

      return newCustomer;
    });

    if (this.cache) {
      await this.cache.invalidate('customers:*');
    }

    return this.findById(customer.id) as Promise<Customer>;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const { addresses, measurements, preferences, ...customerData } = data;

    await this.prisma.customers.update({
      where: { id },
      data: {
        ...customerData,
        ...(measurements && { measurements: measurements as any }),
        ...(preferences && { preferences: preferences as any }),
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${id}`);
      await this.cache.invalidate('customers:*');
    }

    return this.findById(id) as Promise<Customer>;
  }

  async updateMeasurements(id: string, measurements: CustomerMeasurements): Promise<Customer> {
    await this.prisma.customers.update({
      where: { id },
      data: {
        measurements: {
          ...measurements,
          updatedAt: new Date(),
        } as any,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${id}`);
    }

    return this.findById(id) as Promise<Customer>;
  }

  async updatePreferences(id: string, preferences: Partial<CustomerPreferences>): Promise<Customer> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentPreferences = customer.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await this.prisma.customers.update({
      where: { id },
      data: {
        preferences: updatedPreferences as any,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${id}`);
    }

    return this.findById(id) as Promise<Customer>;
  }

  // Address management moved to separate address service
  // since addresses may be in a different schema

  async getPurchaseHistory(customerId: string, limit: number = 10): Promise<any[]> {
    const orders = await this.prisma.orders.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return orders;
  }

  async getAnalytics(customerId: string): Promise<CustomerAnalytics> {
    const [orders, customer] = await Promise.all([
      this.prisma.orders.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: {
                select: { category: true },
              },
            },
          },
        },
      }),
      this.findById(customerId),
    ]);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const now = new Date();
    const lifetimeValue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? lifetimeValue / orders.length : 0;
    
    // Calculate order frequency (orders per month)
    const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].createdAt : customer.createdAt;
    const monthsSinceFirstOrder = Math.max(1, (now.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const orderFrequency = orders.length / monthsSinceFirstOrder;

    // Days since last order
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;
    const lastOrderDaysAgo = lastOrderDate 
      ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Favorite categories
    const categoryCount = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product.category;
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });
    const favoriteCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Seasonal trends (monthly spending)
    const monthlySpending = new Map<string, number>();
    orders.forEach(order => {
      const month = order.createdAt.toISOString().substring(0, 7);
      monthlySpending.set(month, (monthlySpending.get(month) || 0) + order.total);
    });
    const seasonalTrends = Array.from(monthlySpending.entries())
      .map(([month, spent]) => ({ month, spent }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Churn risk calculation
    let churnRisk: 'low' | 'medium' | 'high' = 'low';
    if (lastOrderDaysAgo > 90) {
      churnRisk = 'high';
    } else if (lastOrderDaysAgo > 60 || orderFrequency < 0.5) {
      churnRisk = 'medium';
    }

    return {
      customerId,
      lifetimeValue,
      averageOrderValue,
      orderFrequency,
      lastOrderDaysAgo,
      favoriteCategories,
      seasonalTrends,
      churnRisk,
    };
  }

  async getSegments(): Promise<CustomerSegment[]> {
    const segments: CustomerSegment[] = [
      {
        id: 'vip',
        name: 'VIP Customers',
        description: 'High-value customers with significant spending',
        criteria: { minSpent: 1000, minOrders: 5 },
      },
      {
        id: 'frequent',
        name: 'Frequent Shoppers',
        description: 'Customers who order regularly',
        criteria: { minOrders: 10 },
      },
      {
        id: 'new',
        name: 'New Customers',
        description: 'Customers who joined in the last 30 days',
        criteria: { dayssSinceLastOrder: 30 },
      },
      {
        id: 'at-risk',
        name: 'At Risk',
        description: 'Customers who haven\'t ordered in 60+ days',
        criteria: { dayssSinceLastOrder: 60 },
      },
    ];

    // Calculate customer count for each segment
    for (const segment of segments) {
      const customers = await this.findCustomersBySegment(segment);
      segment.customerCount = customers.length;
    }

    return segments;
  }

  async findCustomersBySegment(segment: CustomerSegment): Promise<Customer[]> {
    const { customers } = await this.findAll({}, { page: 1, limit: 1000 });
    
    return customers.filter(customer => {
      const analytics = {
        totalSpent: customer.totalSpent || 0,
        orderCount: customer.orderCount || 0,
        lastOrderDaysAgo: customer.lastOrderDate
          ? (Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          : Infinity,
      };

      if (segment.criteria.minSpent && analytics.totalSpent < segment.criteria.minSpent) {
        return false;
      }
      if (segment.criteria.minOrders && analytics.orderCount < segment.criteria.minOrders) {
        return false;
      }
      if (segment.criteria.dayssSinceLastOrder) {
        if (segment.id === 'new' && analytics.lastOrderDaysAgo > segment.criteria.dayssSinceLastOrder) {
          return false;
        }
        if (segment.id === 'at-risk' && analytics.lastOrderDaysAgo < segment.criteria.dayssSinceLastOrder) {
          return false;
        }
      }

      return true;
    });
  }

  async addLoyaltyPoints(customerId: string, points: number, reason: string): Promise<Customer> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await this.prisma.customers.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: (customer.loyaltyPoints || 0) + points,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return this.findById(customerId) as Promise<Customer>;
  }

  private async enrichCustomerData(customer: any): Promise<Customer> {
    const orderStats = await this.prisma.getClient(true).order.aggregate({
      where: { customerId: customer.id },
      _sum: { total: true },
      _count: true,
      _max: { createdAt: true },
    });

    return {
      ...customer,
      totalSpent: orderStats._sum.total || 0,
      orderCount: orderStats._count || 0,
      lastOrderDate: orderStats._max.createdAt,
    };
  }
}

export function createCustomerService(dependencies: CustomerServiceDependencies): CustomerService {
  return new CustomerService(dependencies);
}