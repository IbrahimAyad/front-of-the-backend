import { OrderStatus, PaymentStatus } from '../types/order.types';
import { ProductService } from './product.service';
import { CacheService } from './cache.service';

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: any;
  billingAddress: any;
  shippingMethod: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  notes?: string | null;
  paymentDetails?: any;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  paidAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product?: {
      id: string;
      name: string;
      price: number;
      imageUrl: string | null;
    };
    variant?: {
      id: string;
      size: string;
      color: string;
    };
  })[];
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface OrderServiceDependencies {
  prisma: {
    order: {
      findMany: (args?: any) => Promise<Order[]>;
      findUnique: (args: any) => Promise<Order | null>;
      create: (args: any) => Promise<Order>;
      update: (args: any) => Promise<Order>;
      delete: (args: any) => Promise<Order>;
      count: (args?: any) => Promise<number>;
    };
    orderItem: {
      createMany: (args: any) => Promise<{ count: number }>;
      deleteMany: (args: any) => Promise<{ count: number }>;
    };
    productVariant: {
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
    $transaction: (fn: any) => Promise<any>;
  };
  productService: ProductService;
  cache?: CacheService;
}

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: string;
  shippingCost: number;
  notes?: string;
}

export interface OrderItemDto {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderData extends CreateOrderDto {}

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  ordersByDay: Array<{ date: string; count: number; revenue: number }>;
}

export type Period = 'day' | 'week' | 'month' | 'year';

export class OrderService {
  private readonly prisma: OrderServiceDependencies['prisma'];
  private readonly productService: ProductService;
  private readonly cache?: CacheService;

  constructor(dependencies: OrderServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.productService = dependencies.productService;
    this.cache = dependencies.cache;
  }

  async createOrder(data: CreateOrderDto): Promise<OrderWithItems> {
    return this.create(data);
  }

  async create(data: CreateOrderData): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx: any) => {
      // Validate inventory availability
      const inventoryChecks = await Promise.all(
        data.items.map(async (item) => {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          if (!variant) {
            throw new Error(`Product variant ${item.variantId} not found`);
          }

          if (variant.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${variant.product.name} (${variant.size} ${variant.color}). Available: ${variant.stock}, Requested: ${item.quantity}`
            );
          }

          return { variant, item };
        })
      );

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = subtotal * 0.08; // 8% tax rate
      const total = subtotal + tax + data.shippingCost;

      // Create order
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          orderNumber: this.generateOrderNumber(),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          tax,
          shipping: data.shippingCost,
          total,
          shippingAddress: data.shippingAddress as any,
          billingAddress: (data.billingAddress || data.shippingAddress) as any,
          shippingMethod: data.shippingMethod,
          notes: data.notes,
        },
      });

      // Create order items and update inventory
      await Promise.all(
        inventoryChecks.map(async ({ variant, item }) => {
          // Create order item
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            },
          });

          // Update inventory
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        })
      );

      // Invalidate cache
      if (this.cache) {
        await this.cache.invalidate('orders:*');
        await this.cache.invalidate('products:*');
      }

      // Fetch complete order with items
      return this.findById(order.id);
    });
  }

  async getOrder(orderId: string): Promise<OrderWithItems | null> {
    return this.findById(orderId);
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const cacheKey = `order:${id}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (order && this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(order), 300);
    }

    return order as OrderWithItems | null;
  }

  async getOrders(filters: OrderFilters = {}, pagination?: { page: number; limit: number }): Promise<{
    orders: OrderWithItems[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(filters, pagination);
  }

  async getCustomerOrders(customerId: string, pagination?: { page: number; limit: number }): Promise<{
    orders: OrderWithItems[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll({ customerId }, pagination);
  }

  async getOrdersByStatus(status: OrderStatus, pagination?: { page: number; limit: number }): Promise<{
    orders: OrderWithItems[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll({ status }, pagination);
  }

  async findAll(filters: OrderFilters = {}, pagination?: { page: number; limit: number }): Promise<{
    orders: OrderWithItems[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.status && {
        status: Array.isArray(filters.status) ? { in: filters.status } : filters.status,
      }),
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      ...(filters.minTotal && { total: { gte: filters.minTotal } }),
      ...(filters.maxTotal && { total: { lte: filters.maxTotal } }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  size: true,
                  color: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders as OrderWithItems[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderWithItems> {
    return this.updateStatus(orderId, status);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { 
        status,
        ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
        ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`order:${id}`);
      await this.cache.invalidate('orders:*');
    }

    return this.findById(id) as Promise<OrderWithItems>;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentDetails?: any): Promise<OrderWithItems> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { 
        paymentStatus,
        ...(paymentStatus === PaymentStatus.PAID && { paidAt: new Date() }),
        ...(paymentDetails && { paymentDetails: paymentDetails as any }),
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`order:${id}`);
      await this.cache.invalidate('orders:*');
    }

    return this.findById(id) as Promise<OrderWithItems>;
  }

  async cancel(id: string, reason?: string): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel shipped or delivered orders');
      }

      // Restore inventory
      await Promise.all(
        order.items.map(async (item: OrderItem) => {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        })
      );

      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      if (this.cache) {
        await this.cache.invalidate(`order:${id}`);
        await this.cache.invalidate('orders:*');
        await this.cache.invalidate('products:*');
      }

      return this.findById(id) as Promise<OrderWithItems>;
    });
  }

  async getMetrics(filters: OrderFilters = {}): Promise<OrderMetrics> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const ordersByPaymentStatus = orders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<PaymentStatus, number>);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByPaymentStatus,
    };
  }

  async addTrackingInfo(id: string, trackingNumber: string, carrier: string): Promise<OrderWithItems> {
    await this.prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        trackingCarrier: carrier,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`order:${id}`);
    }

    return this.findById(id) as Promise<OrderWithItems>;
  }

  async addOrderItems(orderId: string, items: OrderItemDto[]): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error('Can only add items to pending orders');
      }

      // Validate inventory for new items
      const inventoryChecks = await Promise.all(
        items.map(async (item) => {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          if (!variant) {
            throw new Error(`Product variant ${item.variantId} not found`);
          }

          if (variant.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${variant.product.name} (${variant.size} ${variant.color}). Available: ${variant.stock}, Requested: ${item.quantity}`
            );
          }

          return { variant, item };
        })
      );

      // Create new order items and update inventory
      await Promise.all(
        inventoryChecks.map(async ({ variant, item }) => {
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            },
          });

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        })
      );

      // Recalculate order totals
      const newSubtotal = order.subtotal + items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const newTax = newSubtotal * 0.08;
      const newTotal = newSubtotal + newTax + order.shipping;

      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
        },
      });

      if (this.cache) {
        await this.cache.invalidate(`order:${orderId}`);
        await this.cache.invalidate('orders:*');
        await this.cache.invalidate('products:*');
      }

      return this.findById(orderId) as Promise<OrderWithItems>;
    });
  }

  async calculateOrderTotals(orderId: string): Promise<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax + order.shipping;

    return { subtotal, tax, shipping: order.shipping, total };
  }

  async validateOrderStock(items: OrderItemDto[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    await Promise.all(
      items.map(async (item) => {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          errors.push(`Product variant ${item.variantId} not found`);
        } else if (variant.stock < item.quantity) {
          errors.push(
            `Insufficient stock for ${variant.product.name} (${variant.size} ${variant.color}). Available: ${variant.stock}, Requested: ${item.quantity}`
          );
        }
      })
    );

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getOrderStats(dateRange?: DateRange): Promise<OrderStats> {
    const where: any = {};
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top products
    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId;
        const current = productStats.get(key) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.total;
        productStats.set(key, current);
      });
    });

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate orders by day
    const ordersByDayMap = new Map<string, { count: number; revenue: number }>();
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const current = ordersByDayMap.get(date) || { count: 0, revenue: 0 };
      current.count++;
      current.revenue += order.total;
      ordersByDayMap.set(date, current);
    });

    const ordersByDay = Array.from(ordersByDayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      ordersByDay,
    };
  }

  async getRevenueByPeriod(period: Period, dateRange?: DateRange): Promise<Array<{
    period: string;
    revenue: number;
    orderCount: number;
  }>> {
    const where: any = {};
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const revenueMap = new Map<string, { revenue: number; orderCount: number }>();

    orders.forEach(order => {
      let periodKey: string;
      const date = order.createdAt;

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = date.toISOString().substring(0, 7);
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
      }

      const current = revenueMap.get(periodKey) || { revenue: 0, orderCount: 0 };
      current.revenue += order.total;
      current.orderCount++;
      revenueMap.set(periodKey, current);
    });

    return Array.from(revenueMap.entries())
      .map(([period, stats]) => ({ period, ...stats }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}

export function createOrderService(dependencies: OrderServiceDependencies): OrderService {
  return new OrderService(dependencies);
}