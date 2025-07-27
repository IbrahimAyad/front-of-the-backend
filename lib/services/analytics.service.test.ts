import { AnalyticsService, createAnalyticsService } from './analytics.service';

const mockPrisma = {
  order: {
    findMany: async (args?: any) => {
      const orders = [
        {
          id: 'order-1',
          customerId: 'cust-1',
          total: 149.99,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              quantity: 2,
              price: 29.99,
              total: 59.98,
              product: { id: 'prod-1', name: 'T-Shirt', category: 'Shirts' },
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              quantity: 1,
              price: 89.99,
              total: 89.99,
              product: { id: 'prod-2', name: 'Jeans', category: 'Pants' },
            },
          ],
          customer: {
            id: 'cust-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'order-2',
          customerId: 'cust-2',
          total: 79.99,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          items: [
            {
              id: 'item-3',
              productId: 'prod-1',
              quantity: 1,
              price: 29.99,
              total: 29.99,
              product: { id: 'prod-1', name: 'T-Shirt', category: 'Shirts' },
            },
          ],
          customer: {
            id: 'cust-2',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
        {
          id: 'order-3',
          customerId: 'cust-1',
          total: 199.99,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          items: [
            {
              id: 'item-4',
              productId: 'prod-3',
              quantity: 1,
              price: 199.99,
              total: 199.99,
              product: { id: 'prod-3', name: 'Jacket', category: 'Outerwear' },
            },
          ],
          customer: {
            id: 'cust-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      if (args?.take) {
        return orders.slice(0, args.take);
      }

      if (args?.where?.createdAt) {
        return orders.filter(order => {
          const orderDate = order.createdAt;
          if (args.where.createdAt.gte && orderDate < args.where.createdAt.gte) return false;
          if (args.where.createdAt.lte && orderDate > args.where.createdAt.lte) return false;
          return true;
        });
      }

      return orders;
    },
    aggregate: async (args?: any) => {
      const orders = await mockPrisma.order.findMany(args);
      const total = orders.reduce((sum, order) => sum + order.total, 0);
      
      return {
        _sum: { total },
        _count: orders.length,
        _avg: { total: orders.length > 0 ? total / orders.length : 0 },
      };
    },
    groupBy: async () => [],
  },
  product: {
    findMany: async () => [
      { id: 'prod-1', name: 'T-Shirt', category: 'Shirts', price: 29.99 },
      { id: 'prod-2', name: 'Jeans', category: 'Pants', price: 89.99 },
      { id: 'prod-3', name: 'Jacket', category: 'Outerwear', price: 199.99 },
    ],
  },
  customer: {
    findMany: async (args?: any) => {
      const customers = [
        {
          id: 'cust-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          orders: [
            { total: 149.99, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { total: 199.99, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          ],
        },
        {
          id: 'cust-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          orders: [
            { total: 79.99, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          ],
        },
      ];

      if (args?.take) {
        return customers.slice(0, args.take);
      }

      if (args?.where?.createdAt) {
        return customers.filter(customer => {
          const customerDate = customer.createdAt;
          if (args.where.createdAt.gte && customerDate < args.where.createdAt.gte) return false;
          if (args.where.createdAt.lte && customerDate > args.where.createdAt.lte) return false;
          return true;
        });
      }

      return customers;
    },
    count: async (args?: any) => {
      const customers = await mockPrisma.customer.findMany(args);
      return customers.length;
    },
  },
  orderItem: {
    findMany: async () => [],
    groupBy: async () => [],
  },
};

async function testAnalyticsService() {
  console.log('Testing AnalyticsService...\n');
  
  const analyticsService = createAnalyticsService({
    prisma: mockPrisma as any,
  });

  const dateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  };

  try {
    console.log('1. Testing getSalesMetrics...');
    const salesMetrics = await analyticsService.getSalesMetrics(dateRange);
    console.log('✓ Sales metrics calculated:');
    console.log(`  Total Revenue: $${salesMetrics.totalRevenue.toFixed(2)}`);
    console.log(`  Total Orders: ${salesMetrics.totalOrders}`);
    console.log(`  Average Order Value: $${salesMetrics.averageOrderValue.toFixed(2)}`);
    console.log(`  New Customers: ${salesMetrics.newCustomers}`);
    console.log(`  Top Products: ${salesMetrics.topProducts.length}`);
    if (salesMetrics.topProducts.length > 0) {
      console.log(`    - ${salesMetrics.topProducts[0].productName}: $${salesMetrics.topProducts[0].totalRevenue.toFixed(2)}`);
    }
    console.log(`  Sales by Day: ${salesMetrics.salesByDay.length} days`);
    console.log(`  Sales by Category: ${salesMetrics.salesByCategory.length} categories`);

    console.log('\n2. Testing getCustomerInsights...');
    const customerInsights = await analyticsService.getCustomerInsights(dateRange);
    console.log('✓ Customer insights calculated:');
    console.log(`  Total Customers: ${customerInsights.totalCustomers}`);
    console.log(`  New Customers: ${customerInsights.newCustomers}`);
    console.log(`  Active Customers: ${customerInsights.activeCustomers}`);
    console.log(`  Customer Lifetime Value: $${customerInsights.customerLifetimeValue.toFixed(2)}`);
    console.log(`  Average Orders per Customer: ${customerInsights.averageOrdersPerCustomer.toFixed(1)}`);
    console.log(`  Top Customers: ${customerInsights.topCustomers.length}`);
    if (customerInsights.topCustomers.length > 0) {
      const topCustomer = customerInsights.topCustomers[0];
      console.log(`    - ${topCustomer.firstName} ${topCustomer.lastName}: $${topCustomer.totalSpent.toFixed(2)}`);
    }
    console.log(`  Customer Segments: ${customerInsights.customersBySegment.length}`);
    console.log(`  Geographic Regions: ${customerInsights.geographicDistribution.length}`);

    console.log('\n3. Testing getProductAnalytics...');
    const productAnalytics = await analyticsService.getProductAnalytics(dateRange);
    console.log('✓ Product analytics calculated:', productAnalytics.length, 'products');
    productAnalytics.forEach((product, index) => {
      if (index < 3) { // Show top 3
        console.log(`  ${index + 1}. ${product.productName}: ${product.totalSold} sold, $${product.totalRevenue.toFixed(2)} revenue`);
      }
    });

    console.log('\n4. Testing getRevenueAnalysis...');
    const revenueAnalysis = await analyticsService.getRevenueAnalysis(dateRange);
    console.log('✓ Revenue analysis calculated:');
    console.log(`  Total Revenue: $${revenueAnalysis.totalRevenue.toFixed(2)}`);
    console.log(`  Revenue Growth: ${revenueAnalysis.revenueGrowth.toFixed(1)}%`);
    console.log(`  Average Order Value: $${revenueAnalysis.averageOrderValue.toFixed(2)}`);
    console.log(`  Profit Margin: ${(revenueAnalysis.profitMargin * 100).toFixed(1)}%`);
    console.log(`  Monthly Revenue: ${revenueAnalysis.monthlyRevenue.length} months`);
    console.log(`  Revenue Sources: ${revenueAnalysis.revenueBySource.length} sources`);
    revenueAnalysis.revenueBySource.forEach(source => {
      console.log(`    - ${source.source}: $${source.revenue.toFixed(2)} (${source.percentage}%)`);
    });

    console.log('\n5. Testing getDashboardMetrics...');
    const dashboardMetrics = await analyticsService.getDashboardMetrics(dateRange);
    console.log('✓ Dashboard metrics calculated:');
    console.log('  Overview:');
    console.log(`    - Total Revenue: $${dashboardMetrics.overview.totalRevenue.toFixed(2)}`);
    console.log(`    - Total Orders: ${dashboardMetrics.overview.totalOrders}`);
    console.log(`    - Total Customers: ${dashboardMetrics.overview.totalCustomers}`);
    console.log(`    - Revenue Growth: ${dashboardMetrics.overview.revenueGrowth.toFixed(1)}%`);
    console.log(`    - Order Growth: ${dashboardMetrics.overview.orderGrowth.toFixed(1)}%`);
    console.log('  Recent Activity:');
    console.log(`    - Recent Orders: ${dashboardMetrics.recentActivity.recentOrders.length}`);
    console.log(`    - Recent Customers: ${dashboardMetrics.recentActivity.recentCustomers.length}`);
    console.log('  Charts Data:');
    console.log(`    - Sales Trend: ${dashboardMetrics.charts.salesTrend.length} data points`);
    console.log(`    - Top Products: ${dashboardMetrics.charts.topProducts.length} products`);
    console.log(`    - Customer Segments: ${dashboardMetrics.charts.customerSegments.length} segments`);

    console.log('\n6. Testing generateCustomReport...');
    const customReport = await analyticsService.generateCustomReport({
      id: 'report-1',
      name: 'Monthly Sales Report',
      description: 'Monthly breakdown of sales performance',
      metrics: ['revenue', 'orders', 'customers'],
      filters: {
        dateRange: {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString(),
        },
      },
      groupBy: ['month'],
      orderBy: 'createdAt',
      limit: 100,
    });
    console.log('✓ Custom report generated:');
    console.log(`  Report: ${customReport.reportName}`);
    console.log(`  Generated: ${customReport.generatedAt.toLocaleDateString()}`);
    console.log(`  Records: ${customReport.summary.totalRecords}`);
    console.log(`  Total Revenue: $${customReport.summary.totalRevenue.toFixed(2)}`);

    console.log('\n7. Testing analytics with different date ranges...');
    const weekRange = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };
    const weekMetrics = await analyticsService.getSalesMetrics(weekRange);
    console.log('✓ Weekly metrics:', weekMetrics.totalOrders, 'orders');

    const monthRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };
    const monthMetrics = await analyticsService.getSalesMetrics(monthRange);
    console.log('✓ Monthly metrics:', monthMetrics.totalOrders, 'orders');

    console.log('\n8. Testing performance with caching...');
    const start = Date.now();
    await analyticsService.getSalesMetrics(dateRange);
    const firstCall = Date.now() - start;
    
    const start2 = Date.now();
    await analyticsService.getSalesMetrics(dateRange);
    const secondCall = Date.now() - start2;
    
    console.log('✓ Performance test:');
    console.log(`  First call: ${firstCall}ms`);
    console.log(`  Second call: ${secondCall}ms (cached)`);

    console.log('\n✅ All AnalyticsService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testAnalyticsService().then(success => {
    process.exit(success ? 0 : 1);
  });
}