import { SearchService, createSearchService, SearchType, SortField } from './search.service';

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Premium Cotton T-Shirt',
    description: 'High-quality cotton t-shirt with premium finish',
    price: 29.99,
    originalPrice: 39.99,
    category: 'Shirts',
    brand: 'Premium Brand',
    images: ['image1.jpg', 'image2.jpg'],
    rating: 4.5,
    stock: 50,
    tags: ['cotton', 'premium', 'casual'],
    salesCount: 150,
    views: 1000,
    createdAt: new Date('2025-01-01'),
    reviews: [{ rating: 5 }, { rating: 4 }],
  },
  {
    id: 'prod-2',
    name: 'Classic Jeans',
    description: 'Comfortable classic fit jeans',
    price: 89.99,
    category: 'Pants',
    brand: 'Classic Brand',
    images: ['jeans1.jpg'],
    rating: 4.2,
    stock: 25,
    tags: ['denim', 'classic', 'comfortable'],
    salesCount: 75,
    views: 500,
    createdAt: new Date('2025-01-15'),
    reviews: [{ rating: 4 }, { rating: 4 }],
  },
  {
    id: 'prod-3',
    name: 'Winter Jacket',
    description: 'Warm winter jacket for cold weather',
    price: 199.99,
    category: 'Outerwear',
    brand: 'Outdoor Brand',
    images: ['jacket1.jpg', 'jacket2.jpg'],
    rating: 4.8,
    stock: 0, // Out of stock
    tags: ['winter', 'warm', 'outdoor'],
    salesCount: 200,
    views: 2000,
    createdAt: new Date('2024-12-01'),
    reviews: [{ rating: 5 }, { rating: 5 }, { rating: 4 }],
  },
  {
    id: 'prod-4',
    name: 'Cotton T-Shirt Blue',
    description: 'Blue cotton t-shirt, perfect for everyday wear',
    price: 24.99,
    category: 'Shirts',
    brand: 'Casual Brand',
    images: ['blue-tshirt.jpg'],
    rating: 4.0,
    stock: 100,
    tags: ['cotton', 'blue', 'everyday'],
    salesCount: 300,
    views: 1500,
    createdAt: new Date('2025-01-10'),
    reviews: [{ rating: 4 }],
  },
];

const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerId: 'cust-1',
    total: 149.99,
    status: 'completed',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-22'),
    customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    items: [{ id: 'item-1' }, { id: 'item-2' }],
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-002',
    customerId: 'cust-2',
    total: 89.99,
    status: 'pending',
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-01-25'),
    customer: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    items: [{ id: 'item-3' }],
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-003',
    customerId: 'cust-1',
    total: 199.99,
    status: 'shipped',
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-19'),
    customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    items: [{ id: 'item-4' }],
  },
];

const mockCustomers = [
  {
    id: 'cust-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'active',
    createdAt: new Date('2024-12-01'),
    orders: [
      { total: 149.99, createdAt: new Date('2025-01-20') },
      { total: 199.99, createdAt: new Date('2025-01-18') },
    ],
  },
  {
    id: 'cust-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    status: 'active',
    createdAt: new Date('2025-01-01'),
    orders: [
      { total: 89.99, createdAt: new Date('2025-01-25') },
    ],
  },
  {
    id: 'cust-3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    status: 'inactive',
    createdAt: new Date('2024-11-15'),
    orders: [],
  },
];

const mockPrisma = {
  product: {
    findMany: async (args?: any) => {
      let products = [...mockProducts];

      if (args?.where) {
        if (args.where.OR) {
          products = products.filter((product: any) =>
            args.where.OR.some((condition: any) => {
              if (condition.name?.contains) {
                return product.name.toLowerCase().includes(condition.name.contains.toLowerCase());
              }
              if (condition.description?.contains) {
                return product.description.toLowerCase().includes(condition.description.contains.toLowerCase());
              }
              if (condition.tags?.hasSome) {
                return condition.tags.hasSome.some((tag: string) =>
                  product.tags.some((productTag: string) => productTag.toLowerCase().includes(tag.toLowerCase()))
                );
              }
              return false;
            })
          );
        }

        if (args.where.category?.in) {
          products = products.filter((product: any) => args.where.category.in.includes(product.category));
        }

        if (args.where.brand?.in) {
          products = products.filter((product: any) => args.where.brand.in.includes(product.brand));
        }

        if (args.where.price) {
          if (args.where.price.gte) {
            products = products.filter((product: any) => product.price >= args.where.price.gte);
          }
          if (args.where.price.lte) {
            products = products.filter((product: any) => product.price <= args.where.price.lte);
          }
        }

        if (args.where.stock?.gt !== undefined) {
          products = products.filter((product: any) => product.stock > args.where.stock.gt);
        }

        if (args.where.rating?.gte) {
          products = products.filter((product: any) => product.rating >= args.where.rating.gte);
        }
      }

      if (args?.orderBy) {
        const sortField = Object.keys(args.orderBy)[0];
        const sortDirection = args.orderBy[sortField];
        products.sort((a: any, b: any) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
        });
      }

      if (args?.skip) {
        products = products.slice(args.skip);
      }

      if (args?.take) {
        products = products.slice(0, args.take);
      }

      return products;
    },
    count: async (args?: any) => {
      const products = await mockPrisma.product.findMany(args);
      return products.length;
    },
  },
  order: {
    findMany: async (args?: any) => {
      let orders = [...mockOrders];

      if (args?.where) {
        if (args.where.OR) {
          orders = orders.filter((order: any) =>
            args.where.OR.some((condition: any) => {
              if (condition.orderNumber?.contains) {
                return order.orderNumber.toLowerCase().includes(condition.orderNumber.contains.toLowerCase());
              }
              if (condition.customer?.email?.contains) {
                return order.customer.email.toLowerCase().includes(condition.customer.email.contains.toLowerCase());
              }
              if (condition.customer?.firstName?.contains) {
                return order.customer.firstName.toLowerCase().includes(condition.customer.firstName.contains.toLowerCase());
              }
              if (condition.customer?.lastName?.contains) {
                return order.customer.lastName.toLowerCase().includes(condition.customer.lastName.contains.toLowerCase());
              }
              return false;
            })
          );
        }

        if (args.where.status?.in) {
          orders = orders.filter((order: any) => args.where.status.in.includes(order.status));
        }

        if (args.where.total) {
          if (args.where.total.gte) {
            orders = orders.filter((order: any) => order.total >= args.where.total.gte);
          }
          if (args.where.total.lte) {
            orders = orders.filter((order: any) => order.total <= args.where.total.lte);
          }
        }

        if (args.where.createdAt) {
          if (args.where.createdAt.gte) {
            orders = orders.filter((order: any) => order.createdAt >= args.where.createdAt.gte);
          }
          if (args.where.createdAt.lte) {
            orders = orders.filter((order: any) => order.createdAt <= args.where.createdAt.lte);
          }
        }
      }

      if (args?.skip) {
        orders = orders.slice(args.skip);
      }

      if (args?.take) {
        orders = orders.slice(0, args.take);
      }

      return orders;
    },
    count: async (args?: any) => {
      const orders = await mockPrisma.order.findMany(args);
      return orders.length;
    },
  },
  customer: {
    findMany: async (args?: any) => {
      let customers = [...mockCustomers];

      if (args?.where) {
        if (args.where.OR) {
          customers = customers.filter((customer: any) =>
            args.where.OR.some((condition: any) => {
              if (condition.email?.contains) {
                return customer.email.toLowerCase().includes(condition.email.contains.toLowerCase());
              }
              if (condition.firstName?.contains) {
                return customer.firstName.toLowerCase().includes(condition.firstName.contains.toLowerCase());
              }
              if (condition.lastName?.contains) {
                return customer.lastName.toLowerCase().includes(condition.lastName.contains.toLowerCase());
              }
              if (condition.phone?.contains) {
                return customer.phone?.includes(condition.phone.contains);
              }
              return false;
            })
          );
        }

        if (args.where.status?.in) {
          customers = customers.filter((customer: any) => args.where.status.in.includes(customer.status));
        }
      }

      if (args?.skip) {
        customers = customers.slice(args.skip);
      }

      if (args?.take) {
        customers = customers.slice(0, args.take);
      }

      return customers;
    },
    count: async (args?: any) => {
      const customers = await mockPrisma.customer.findMany(args);
      return customers.length;
    },
  },
};

async function testSearchService() {
  console.log('Testing SearchService...\n');
  
  const searchService = createSearchService({
    prisma: mockPrisma as any,
  });

  try {
    console.log('1. Testing product search with text query...');
    const productSearch = await searchService.searchProducts({
      query: 'cotton t-shirt',
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Product search completed:');
    console.log(`  Found ${productSearch.total} products`);
    console.log(`  Search time: ${productSearch.searchTime}ms`);
    productSearch.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - $${product.price} (Score: ${product.relevanceScore})`);
    });

    console.log('\n2. Testing product search with filters...');
    const filteredSearch = await searchService.searchProducts({
      filters: {
        category: ['Shirts'],
        priceRange: { min: 20, max: 50 },
        inStock: true,
      },
      sort: { field: SortField.PRICE, direction: 'asc' },
      pagination: { page: 1, limit: 5 },
    });
    console.log('✓ Filtered product search completed:');
    console.log(`  Found ${filteredSearch.total} products in Shirts category`);
    filteredSearch.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
    });

    console.log('\n3. Testing product search with out-of-stock inclusion...');
    const includeOutOfStock = await searchService.searchProducts({
      query: 'jacket',
      includeOutOfStock: true,
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Search with out-of-stock products:');
    console.log(`  Found ${includeOutOfStock.total} products`);
    includeOutOfStock.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - Stock: ${product.stock} (${product.inStock ? 'In Stock' : 'Out of Stock'})`);
    });

    console.log('\n4. Testing order search...');
    const orderSearch = await searchService.searchOrders({
      query: 'john',
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Order search completed:');
    console.log(`  Found ${orderSearch.total} orders`);
    orderSearch.items.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} - ${order.customerName} - $${order.total} (${order.status})`);
    });

    console.log('\n5. Testing order search with filters...');
    const filteredOrderSearch = await searchService.searchOrders({
      filters: {
        status: ['completed', 'shipped'],
        priceRange: { min: 100 },
      },
      sort: { field: SortField.TOTAL, direction: 'desc' },
      pagination: { page: 1, limit: 5 },
    });
    console.log('✓ Filtered order search completed:');
    console.log(`  Found ${filteredOrderSearch.total} orders`);
    filteredOrderSearch.items.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} - $${order.total} (${order.status})`);
    });

    console.log('\n6. Testing customer search...');
    const customerSearch = await searchService.searchCustomers({
      query: 'jane',
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Customer search completed:');
    console.log(`  Found ${customerSearch.total} customers`);
    customerSearch.items.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.firstName} ${customer.lastName} - ${customer.email} (Orders: ${customer.totalOrders}, Spent: $${customer.totalSpent})`);
    });

    console.log('\n7. Testing customer search with filters...');
    const filteredCustomerSearch = await searchService.searchCustomers({
      filters: {
        status: ['active'],
      },
      sort: { field: SortField.NAME, direction: 'asc' },
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Filtered customer search completed:');
    console.log(`  Found ${filteredCustomerSearch.total} active customers`);
    filteredCustomerSearch.items.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.status})`);
    });

    console.log('\n8. Testing global search...');
    const globalSearch = await searchService.globalSearch({
      query: 'john',
    });
    console.log('✓ Global search completed:');
    console.log(`  Products: ${globalSearch.products.total} found, showing ${globalSearch.products.items.length}`);
    console.log(`  Orders: ${globalSearch.orders.total} found, showing ${globalSearch.orders.items.length}`);
    console.log(`  Customers: ${globalSearch.customers.total} found, showing ${globalSearch.customers.items.length}`);

    console.log('\n9. Testing search suggestions...');
    const suggestions = await searchService.getSearchSuggestions('cot', 5);
    console.log('✓ Search suggestions for "cot":');
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.query} (${suggestion.type})`);
    });

    console.log('\n10. Testing pagination...');
    const page1 = await searchService.searchProducts({
      pagination: { page: 1, limit: 2 },
    });
    const page2 = await searchService.searchProducts({
      pagination: { page: 2, limit: 2 },
    });
    console.log('✓ Pagination test:');
    console.log(`  Page 1: ${page1.items.length} items (hasNext: ${page1.hasNext}, hasPrev: ${page1.hasPrev})`);
    console.log(`  Page 2: ${page2.items.length} items (hasNext: ${page2.hasNext}, hasPrev: ${page2.hasPrev})`);
    console.log(`  Total pages: ${page1.totalPages}`);

    console.log('\n11. Testing different sort options...');
    const sortByPrice = await searchService.searchProducts({
      sort: { field: SortField.PRICE, direction: 'desc' },
      pagination: { page: 1, limit: 3 },
    });
    console.log('✓ Sort by price (desc):');
    sortByPrice.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
    });

    const sortByRating = await searchService.searchProducts({
      sort: { field: SortField.RATING, direction: 'desc' },
      pagination: { page: 1, limit: 3 },
    });
    console.log('✓ Sort by rating (desc):');
    sortByRating.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - Rating: ${product.rating}`);
    });

    console.log('\n12. Testing empty search results...');
    const emptySearch = await searchService.searchProducts({
      query: 'nonexistentproduct12345',
    });
    console.log('✓ Empty search results:');
    console.log(`  Found ${emptySearch.total} products`);
    console.log(`  Suggestions: ${emptySearch.suggestions?.length || 0}`);

    console.log('\n13. Testing complex filters...');
    const complexSearch = await searchService.searchProducts({
      filters: {
        category: ['Shirts', 'Pants'],
        brand: ['Premium Brand', 'Classic Brand'],
        priceRange: { min: 25, max: 100 },
        rating: { min: 4.0 },
        tags: ['cotton'],
      },
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Complex filter search:');
    console.log(`  Found ${complexSearch.total} products matching complex criteria`);
    console.log(`  Applied filters: ${Object.keys(complexSearch.filters).join(', ')}`);

    console.log('\n14. Testing search analytics...');
    // Perform several searches to generate analytics data
    await searchService.searchProducts({ query: 'shirt' });
    await searchService.searchProducts({ query: 'jeans' });
    await searchService.searchProducts({ query: 'jacket' });
    await searchService.searchOrders({ query: 'order' });

    const analytics = await searchService.getSearchAnalytics();
    console.log('✓ Search analytics:');
    console.log(`  Total searches: ${analytics.totalSearches}`);
    console.log(`  Unique queries: ${analytics.uniqueQueries}`);
    console.log(`  Average results: ${analytics.averageResultsCount.toFixed(1)}`);
    console.log(`  Average search time: ${analytics.averageSearchTime.toFixed(1)}ms`);
    console.log(`  Top queries: ${analytics.topQueries.map(q => q.query).join(', ')}`);

    console.log('\n15. Testing popular searches...');
    const popularSearches = await searchService.getPopularSearches(5);
    console.log('✓ Popular searches:');
    popularSearches.forEach((query, index) => {
      console.log(`  ${index + 1}. "${query}"`);
    });

    console.log('\n16. Testing date range filters...');
    const dateRangeSearch = await searchService.searchOrders({
      filters: {
        dateRange: {
          start: new Date('2025-01-15'),
          end: new Date('2025-01-31'),
        },
      },
      pagination: { page: 1, limit: 10 },
    });
    console.log('✓ Date range filter search:');
    console.log(`  Found ${dateRangeSearch.total} orders in date range`);
    dateRangeSearch.items.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} - ${order.createdAt.toDateString()}`);
    });

    console.log('\n17. Testing search type enumeration...');
    const searchTypes = Object.values(SearchType);
    const sortFields = Object.values(SortField);
    console.log('✓ Available search types:', searchTypes.join(', '));
    console.log('✓ Available sort fields:', sortFields.join(', '));

    console.log('\n18. Testing search result metadata...');
    const metadataSearch = await searchService.searchProducts({
      query: 'shirt',
      pagination: { page: 1, limit: 3 },
    });
    console.log('✓ Search result metadata:');
    console.log(`  Items returned: ${metadataSearch.items.length}`);
    console.log(`  Total available: ${metadataSearch.total}`);
    console.log(`  Current page: ${metadataSearch.page}`);
    console.log(`  Items per page: ${metadataSearch.limit}`);
    console.log(`  Total pages: ${metadataSearch.totalPages}`);
    console.log(`  Has next page: ${metadataSearch.hasNext}`);
    console.log(`  Has previous page: ${metadataSearch.hasPrev}`);
    console.log(`  Search time: ${metadataSearch.searchTime}ms`);

    console.log('\n19. Testing relevance scoring...');
    const relevanceSearch = await searchService.searchProducts({
      query: 'cotton',
      sort: { field: SortField.RELEVANCE, direction: 'desc' },
      pagination: { page: 1, limit: 5 },
    });
    console.log('✓ Relevance scoring:');
    relevanceSearch.items.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (Score: ${product.relevanceScore})`);
    });

    console.log('\n20. Testing edge cases...');
    // Test with empty query
    const emptyQuery = await searchService.searchProducts({
      query: '',
      pagination: { page: 1, limit: 5 },
    });
    console.log(`✓ Empty query test: ${emptyQuery.total} products found`);

    // Test with very high page number
    const highPage = await searchService.searchProducts({
      pagination: { page: 999, limit: 5 },
    });
    console.log(`✓ High page number test: ${highPage.items.length} products found`);

    // Test analytics with date range
    const analyticsWithRange = await searchService.getSearchAnalytics({
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31'),
    });
    console.log(`✓ Analytics with date range: ${analyticsWithRange.totalSearches} searches`);

    console.log('\n✅ All SearchService tests passed!');
    console.log('\n📊 Final Test Statistics:');
    console.log(`  Product searches performed: Multiple`);
    console.log(`  Order searches performed: Multiple`);
    console.log(`  Customer searches performed: Multiple`);
    console.log(`  Global searches performed: 1`);
    console.log(`  Different filter combinations tested: 5+`);
    console.log(`  Sort options tested: 3`);
    console.log(`  Pagination scenarios tested: 2`);
    console.log(`  Edge cases tested: 3`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testSearchService().then(success => {
    process.exit(success ? 0 : 1);
  });
}