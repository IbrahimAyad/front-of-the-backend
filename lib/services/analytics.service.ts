import { CacheService } from './cache.service';

export interface AnalyticsServiceDependencies {
  prisma: {
    order: {
      findMany: (args?: any) => Promise<any[]>;
      aggregate: (args?: any) => Promise<any>;
      groupBy: (args?: any) => Promise<any[]>;
    };
    product: {
      findMany: (args?: any) => Promise<any[]>;
    };
    customer: {
      findMany: (args?: any) => Promise<any[]>;
      count: (args?: any) => Promise<number>;
    };
    orderItem: {
      findMany: (args?: any) => Promise<any[]>;
      groupBy: (args?: any) => Promise<any[]>;
    };
  };
  cache?: CacheService;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  newCustomers: number;
  returningCustomers: number;
  refundRate: number;
  topProducts: ProductPerformance[];
  salesByDay: DailySales[];
  salesByCategory: CategorySales[];
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  conversionRate: number;
  viewsToSales: number;
}

export interface CustomerInsights {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customerLifetimeValue: number;
  averageOrdersPerCustomer: number;
  churnRate: number;
  topCustomers: TopCustomer[];
  customersBySegment: CustomerSegment[];
  geographicDistribution: GeographicData[];
}

export interface TopCustomer {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  averageSpent: number;
  description: string;
}

export interface GeographicData {
  region: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  newCustomers: number;
}

export interface CategorySales {
  category: string;
  revenue: number;
  orders: number;
  units: number;
  averagePrice: number;
}

export interface InventoryInsights {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  slowMovingProducts: ProductPerformance[];
  fastMovingProducts: ProductPerformance[];
  inventoryTurnover: number;
}

export interface RevenueAnalysis {
  totalRevenue: number;
  revenueGrowth: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueBySource: RevenueSource[];
  profitMargin: number;
  averageOrderValue: number;
  revenuePerCustomer: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
  growth: number;
}

export interface RevenueSource {
  source: string;
  revenue: number;
  percentage: number;
}

export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
  recentActivity: {
    recentOrders: any[];
    recentCustomers: any[];
    lowStockAlerts: any[];
  };
  charts: {
    salesTrend: DailySales[];
    topProducts: ProductPerformance[];
    customerSegments: CustomerSegment[];
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  filters: Record<string, any>;
  groupBy: string[];
  orderBy: string;
  limit?: number;
}

export class AnalyticsService {
  private readonly prisma: AnalyticsServiceDependencies['prisma'];
  private readonly cache?: CacheService;

  constructor(dependencies: AnalyticsServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.cache = dependencies.cache;
  }

  async getSalesMetrics(dateRange: DateRange): Promise<SalesMetrics> {
    const cacheKey = `analytics:sales:${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const where = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    const [orders, orderStats, customerStats] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      this.getCustomerMetrics(dateRange),
    ]);

    const totalRevenue = orderStats._sum.total || 0;
    const totalOrders = orderStats._count || 0;
    const averageOrderValue = orderStats._avg.total || 0;

    // Calculate top products
    const productSales = new Map<string, { revenue: number; quantity: number; name: string }>();
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const key = item.productId;
        const current = productSales.get(key) || { revenue: 0, quantity: 0, name: item.product.name };
        current.revenue += item.total;
        current.quantity += item.quantity;
        productSales.set(key, current);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalSold: data.quantity,
        totalRevenue: data.revenue,
        averagePrice: data.revenue / data.quantity,
        conversionRate: 0.15, // Would need view data
        viewsToSales: 0.15,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Calculate daily sales
    const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const current = dailySalesMap.get(date) || { revenue: 0, orders: 0 };
      current.revenue += order.total;
      current.orders += 1;
      dailySalesMap.set(date, current);
    });

    const salesByDay = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        newCustomers: 0, // Would need customer creation data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate sales by category
    const categorySales = new Map<string, { revenue: number; orders: number; units: number }>();
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const category = item.product.category || 'Uncategorized';
        const current = categorySales.get(category) || { revenue: 0, orders: 0, units: 0 };
        current.revenue += item.total;
        current.units += item.quantity;
        categorySales.set(category, current);
      });
    });

    const salesByCategory = Array.from(categorySales.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orders: data.orders,
        units: data.units,
        averagePrice: data.revenue / data.units,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const metrics: SalesMetrics = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate: 0.025, // Would need visitor data
      newCustomers: customerStats.newCustomers,
      returningCustomers: customerStats.returningCustomers,
      refundRate: 0.02, // Would need refund data
      topProducts,
      salesByDay,
      salesByCategory,
    };

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(metrics), 3600); // 1 hour
    }

    return metrics;
  }

  async getCustomerInsights(dateRange: DateRange): Promise<CustomerInsights> {
    const where = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    const [customers, orders] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          orders: {
            select: {
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
        },
      }),
    ]);

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => 
      c.createdAt >= dateRange.startDate && c.createdAt <= dateRange.endDate
    ).length;

    const activeCustomers = customers.filter(c => c.orders.length > 0).length;

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const totalOrders = orders.length;
    const averageOrdersPerCustomer = activeCustomers > 0 ? totalOrders / activeCustomers : 0;

    // Calculate top customers
    const customerStats = new Map<string, { totalSpent: number; orderCount: number; customer: any }>();
    orders.forEach(order => {
      const key = order.customerId;
      const current = customerStats.get(key) || { totalSpent: 0, orderCount: 0, customer: order.customer };
      current.totalSpent += order.total;
      current.orderCount += 1;
      customerStats.set(key, current);
    });

    const topCustomers = Array.from(customerStats.entries())
      .map(([customerId, data]) => ({
        customerId,
        email: data.customer.email,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        totalSpent: data.totalSpent,
        orderCount: data.orderCount,
        lastOrderDate: new Date(),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Customer segments
    const customersBySegment = [
      { segment: 'VIP', count: topCustomers.filter(c => c.totalSpent > 1000).length, averageSpent: 1500, description: 'High-value customers' },
      { segment: 'Regular', count: topCustomers.filter(c => c.totalSpent > 100 && c.totalSpent <= 1000).length, averageSpent: 300, description: 'Regular customers' },
      { segment: 'New', count: newCustomers, averageSpent: 50, description: 'First-time customers' },
    ];

    // Geographic distribution (mock data)
    const geographicDistribution = [
      { region: 'California', customerCount: Math.floor(totalCustomers * 0.3), totalRevenue: totalRevenue * 0.35, averageOrderValue: 150 },
      { region: 'New York', customerCount: Math.floor(totalCustomers * 0.2), totalRevenue: totalRevenue * 0.25, averageOrderValue: 180 },
      { region: 'Texas', customerCount: Math.floor(totalCustomers * 0.15), totalRevenue: totalRevenue * 0.15, averageOrderValue: 140 },
      { region: 'Other', customerCount: Math.floor(totalCustomers * 0.35), totalRevenue: totalRevenue * 0.25, averageOrderValue: 130 },
    ];

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      customerLifetimeValue,
      averageOrdersPerCustomer,
      churnRate: 0.05, // Would need historical data
      topCustomers,
      customersBySegment,
      geographicDistribution,
    };
  }

  async getProductAnalytics(dateRange: DateRange): Promise<ProductPerformance[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const productStats = new Map<string, { revenue: number; quantity: number; orders: number; product: any }>();
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const key = item.productId;
        const current = productStats.get(key) || { revenue: 0, quantity: 0, orders: 0, product: item.product };
        current.revenue += item.total;
        current.quantity += item.quantity;
        current.orders += 1;
        productStats.set(key, current);
      });
    });

    return Array.from(productStats.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.product.name,
        totalSold: data.quantity,
        totalRevenue: data.revenue,
        averagePrice: data.revenue / data.quantity,
        conversionRate: 0.15, // Would need view data
        viewsToSales: 0.15,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getRevenueAnalysis(dateRange: DateRange): Promise<RevenueAnalysis> {
    const currentPeriod = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    });

    // Previous period for growth calculation
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStart = new Date(dateRange.startDate.getTime() - periodLength);
    const previousEnd = new Date(dateRange.endDate.getTime() - periodLength);

    const previousPeriod = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      _sum: { total: true },
    });

    const totalRevenue = currentPeriod._sum.total || 0;
    const previousRevenue = previousPeriod._sum.total || 0;
    const revenueGrowth = previousRevenue > 0 ? 
      ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Monthly revenue breakdown
    const monthlyRevenue = await this.calculateMonthlyRevenue(dateRange);

    const revenueBySource = [
      { source: 'Direct', revenue: totalRevenue * 0.4, percentage: 40 },
      { source: 'Organic Search', revenue: totalRevenue * 0.3, percentage: 30 },
      { source: 'Social Media', revenue: totalRevenue * 0.2, percentage: 20 },
      { source: 'Email', revenue: totalRevenue * 0.1, percentage: 10 },
    ];

    return {
      totalRevenue,
      revenueGrowth,
      monthlyRevenue,
      revenueBySource,
      profitMargin: 0.25, // Would need cost data
      averageOrderValue: currentPeriod._avg.total || 0,
      revenuePerCustomer: 0, // Would need customer count
    };
  }

  async getDashboardMetrics(dateRange: DateRange): Promise<DashboardMetrics> {
    const [salesMetrics, customerInsights, recentOrders, recentCustomers] = await Promise.all([
      this.getSalesMetrics(dateRange),
      this.getCustomerInsights(dateRange),
      this.getRecentOrders(10),
      this.getRecentCustomers(10),
    ]);

    // Previous period for growth calculation
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStart = new Date(dateRange.startDate.getTime() - periodLength);
    const previousEnd = new Date(dateRange.endDate.getTime() - periodLength);

    const previousMetrics = await this.getSalesMetrics({ startDate: previousStart, endDate: previousEnd });

    const revenueGrowth = previousMetrics.totalRevenue > 0 ? 
      ((salesMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100 : 0;

    const orderGrowth = previousMetrics.totalOrders > 0 ? 
      ((salesMetrics.totalOrders - previousMetrics.totalOrders) / previousMetrics.totalOrders) * 100 : 0;

    return {
      overview: {
        totalRevenue: salesMetrics.totalRevenue,
        totalOrders: salesMetrics.totalOrders,
        totalCustomers: customerInsights.totalCustomers,
        averageOrderValue: salesMetrics.averageOrderValue,
        revenueGrowth,
        orderGrowth,
      },
      recentActivity: {
        recentOrders,
        recentCustomers,
        lowStockAlerts: [], // Would integrate with inventory service
      },
      charts: {
        salesTrend: salesMetrics.salesByDay,
        topProducts: salesMetrics.topProducts.slice(0, 5),
        customerSegments: customerInsights.customersBySegment,
      },
    };
  }

  async generateCustomReport(report: CustomReport): Promise<any> {
    // This would build dynamic queries based on the report configuration
    // For now, return a simplified implementation
    const baseQuery = {
      createdAt: report.filters.dateRange ? {
        gte: new Date(report.filters.dateRange.start),
        lte: new Date(report.filters.dateRange.end),
      } : undefined,
    };

    const data = await this.prisma.order.findMany({
      where: baseQuery,
      include: {
        items: true,
        customer: true,
      },
      orderBy: { [report.orderBy]: 'desc' },
      take: report.limit,
    });

    return {
      reportId: report.id,
      reportName: report.name,
      generatedAt: new Date(),
      data,
      summary: {
        totalRecords: data.length,
        totalRevenue: data.reduce((sum, order) => sum + order.total, 0),
      },
    };
  }

  private async getCustomerMetrics(dateRange: DateRange): Promise<{ newCustomers: number; returningCustomers: number }> {
    const newCustomers = await this.prisma.customer.count({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    // Returning customers would need order history analysis
    const returningCustomers = Math.floor(newCustomers * 0.3); // Estimate

    return { newCustomers, returningCustomers };
  }

  private async calculateMonthlyRevenue(dateRange: DateRange): Promise<MonthlyRevenue[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    const monthlyData = new Map<string, { revenue: number; orders: number }>();
    
    orders.forEach(order => {
      const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { revenue: 0, orders: 0 };
      current.revenue += order.total;
      current.orders += 1;
      monthlyData.set(month, current);
    });

    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
        growth: 0, // Would need previous year data
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate growth rates
    for (let i = 1; i < monthlyRevenue.length; i++) {
      const current = monthlyRevenue[i];
      const previous = monthlyRevenue[i - 1];
      if (previous.revenue > 0) {
        current.growth = ((current.revenue - previous.revenue) / previous.revenue) * 100;
      }
    }

    return monthlyRevenue;
  }

  private async getRecentOrders(limit: number): Promise<any[]> {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  private async getRecentCustomers(limit: number): Promise<any[]> {
    return this.prisma.customer.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });
  }
}

export function createAnalyticsService(dependencies: AnalyticsServiceDependencies): AnalyticsService {
  return new AnalyticsService(dependencies);
}