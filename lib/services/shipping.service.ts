import { CacheService } from './cache.service';

export interface ShippingServiceDependencies {
  prisma: {
    shippingMethod: {
      findMany: (args?: any) => Promise<ShippingMethod[]>;
      findUnique: (args: any) => Promise<ShippingMethod | null>;
      create: (args: any) => Promise<ShippingMethod>;
      update: (args: any) => Promise<ShippingMethod>;
    };
    shippingLabel: {
      create: (args: any) => Promise<ShippingLabel>;
      findUnique: (args: any) => Promise<ShippingLabel | null>;
      update: (args: any) => Promise<ShippingLabel>;
    };
    order: {
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
  };
  cache?: CacheService;
  uspsApiKey?: string;
  upsApiKey?: string;
  fedexApiKey?: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  residential?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: ShippingCarrier;
  type: ShippingType;
  description: string;
  estimatedDays: number;
  active: boolean;
  zones: ShippingZone[];
  rules: ShippingRule[];
  createdAt: Date;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  baseCost: number;
  perItemCost: number;
  weightMultiplier: number;
  freeShippingThreshold?: number;
}

export interface ShippingRule {
  id: string;
  condition: 'weight' | 'value' | 'items' | 'dimensions';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  action: 'add_cost' | 'multiply_cost' | 'set_cost' | 'disable';
  actionValue: number;
}

export interface ShippingRate {
  methodId: string;
  name: string;
  carrier: ShippingCarrier;
  type: ShippingType;
  cost: number;
  estimatedDays: number;
  description: string;
  available: boolean;
  reason?: string;
}

export interface ShippingLabel {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: ShippingCarrier;
  method: string;
  cost: number;
  labelUrl?: string;
  fromAddress: Address;
  toAddress: Address;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  status: ShippingLabelStatus;
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: ShippingCarrier;
  status: TrackingStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: TrackingEvent[];
  currentLocation?: string;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export enum ShippingCarrier {
  USPS = 'USPS',
  UPS = 'UPS',
  FEDEX = 'FEDEX',
  DHL = 'DHL',
  CUSTOM = 'CUSTOM',
}

export enum ShippingType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP',
}

export enum ShippingLabelStatus {
  CREATED = 'CREATED',
  PRINTED = 'PRINTED',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  CANCELLED = 'CANCELLED',
}

export enum TrackingStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  RETURNED = 'RETURNED',
}

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  estimatedDate: Date;
  businessDays: boolean;
}

export class ShippingService {
  private readonly prisma: ShippingServiceDependencies['prisma'];
  private readonly cache?: CacheService;
  private readonly carrierApiKeys: {
    usps?: string;
    ups?: string;
    fedex?: string;
  };

  constructor(dependencies: ShippingServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.cache = dependencies.cache;
    this.carrierApiKeys = {
      usps: dependencies.uspsApiKey,
      ups: dependencies.upsApiKey,
      fedex: dependencies.fedexApiKey,
    };
  }

  async calculateShippingRates(items: CartItem[], address: Address): Promise<ShippingRate[]> {
    const cacheKey = `shipping:rates:${this.hashAddress(address)}:${this.hashItems(items)}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const shippingMethods = await this.getShippingMethods();
    const rates: ShippingRate[] = [];

    // Calculate total weight and value
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.quantity, 0) * 50; // Estimate $50 per item

    for (const method of shippingMethods) {
      if (!method.active) continue;

      const zone = this.findZoneForAddress(method.zones, address);
      if (!zone) {
        rates.push({
          methodId: method.id,
          name: method.name,
          carrier: method.carrier,
          type: method.type,
          cost: 0,
          estimatedDays: method.estimatedDays,
          description: method.description,
          available: false,
          reason: 'Not available in your area',
        });
        continue;
      }

      // Calculate base cost
      let cost = zone.baseCost + (zone.perItemCost * items.length) + (zone.weightMultiplier * totalWeight);

      // Apply shipping rules
      for (const rule of method.rules) {
        if (this.evaluateRule(rule, { totalWeight, totalValue, itemCount: items.length })) {
          switch (rule.action) {
            case 'add_cost':
              cost += rule.actionValue;
              break;
            case 'multiply_cost':
              cost *= rule.actionValue;
              break;
            case 'set_cost':
              cost = rule.actionValue;
              break;
            case 'disable':
              rates.push({
                methodId: method.id,
                name: method.name,
                carrier: method.carrier,
                type: method.type,
                cost: 0,
                estimatedDays: method.estimatedDays,
                description: method.description,
                available: false,
                reason: 'Shipping restrictions apply',
              });
              continue;
          }
        }
      }

      // Check for free shipping
      if (zone.freeShippingThreshold && totalValue >= zone.freeShippingThreshold) {
        cost = 0;
      }

      rates.push({
        methodId: method.id,
        name: method.name,
        carrier: method.carrier,
        type: method.type,
        cost: Math.max(0, cost),
        estimatedDays: method.estimatedDays,
        description: method.description,
        available: true,
      });
    }

    // Sort by cost
    rates.sort((a, b) => a.cost - b.cost);

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(rates), 300); // 5 minutes
    }

    return rates;
  }

  async getAvailableCarriers(destination: Address): Promise<ShippingCarrier[]> {
    const methods = await this.getShippingMethods();
    const availableCarriers = new Set<ShippingCarrier>();

    for (const method of methods) {
      if (!method.active) continue;
      
      const zone = this.findZoneForAddress(method.zones, destination);
      if (zone) {
        availableCarriers.add(method.carrier);
      }
    }

    return Array.from(availableCarriers);
  }

  async getDeliveryEstimate(methodId: string, destination: Address): Promise<DeliveryEstimate> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id: methodId },
    });

    if (!method) {
      throw new Error('Shipping method not found');
    }

    const zone = this.findZoneForAddress(method.zones, destination);
    if (!zone) {
      throw new Error('Shipping not available to destination');
    }

    const baseEstimate = method.estimatedDays;
    const minDays = Math.max(1, baseEstimate - 1);
    const maxDays = baseEstimate + 2;

    // Calculate estimated delivery date (business days)
    const today = new Date();
    let estimatedDate = new Date(today);
    let businessDaysAdded = 0;
    
    while (businessDaysAdded < baseEstimate) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      const dayOfWeek = estimatedDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        businessDaysAdded++;
      }
    }

    return {
      minDays,
      maxDays,
      estimatedDate,
      businessDays: true,
    };
  }

  async createShippingLabel(order: any): Promise<ShippingLabel> {
    if (!order.shippingAddress) {
      throw new Error('Order must have a shipping address');
    }

    const method = await this.prisma.shippingMethod.findUnique({
      where: { id: order.shippingMethodId },
    });

    if (!method) {
      throw new Error('Invalid shipping method');
    }

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(method.carrier);

    // Calculate total weight (estimate if not provided)
    const totalWeight = order.items?.reduce((sum: number, item: any) => 
      sum + (item.weight || 1) * item.quantity, 0) || 5; // Default 5 lbs

    const label = await this.prisma.shippingLabel.create({
      data: {
        orderId: order.id,
        trackingNumber,
        carrier: method.carrier,
        method: method.name,
        cost: order.shipping || 0,
        fromAddress: this.getWarehouseAddress(),
        toAddress: order.shippingAddress,
        weight: totalWeight,
        status: ShippingLabelStatus.CREATED,
      },
    });

    // In real implementation, this would call carrier API to create actual label
    // For now, we'll simulate label creation
    const labelUrl = await this.generateLabelUrl(label.id, method.carrier);

    const updatedLabel = await this.prisma.shippingLabel.update({
      where: { id: label.id },
      data: { labelUrl },
    });

    // Update order with tracking info
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber,
        trackingCarrier: method.carrier,
      },
    });

    return updatedLabel;
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    const cacheKey = `tracking:${trackingNumber}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const label = await this.prisma.shippingLabel.findUnique({
      where: { trackingNumber },
    });

    if (!label) {
      throw new Error('Tracking number not found');
    }

    // In real implementation, this would call carrier API
    const trackingInfo = await this.fetchTrackingFromCarrier(trackingNumber, label.carrier);

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(trackingInfo), 900); // 15 minutes
    }

    return trackingInfo;
  }

  async cancelShippingLabel(labelId: string): Promise<void> {
    const label = await this.prisma.shippingLabel.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new Error('Shipping label not found');
    }

    if (label.status === ShippingLabelStatus.SHIPPED) {
      throw new Error('Cannot cancel shipped label');
    }

    // In real implementation, this would call carrier API to cancel
    await this.prisma.shippingLabel.update({
      where: { id: labelId },
      data: { status: ShippingLabelStatus.CANCELLED },
    });
  }

  async getShippingMethods(): Promise<ShippingMethod[]> {
    const cacheKey = 'shipping:methods';
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const methods = await this.prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(methods), 3600); // 1 hour
    }

    return methods;
  }

  async createCustomShippingMethod(methodData: Omit<ShippingMethod, 'id' | 'createdAt'>): Promise<ShippingMethod> {
    const method = await this.prisma.shippingMethod.create({
      data: {
        ...methodData,
        zones: methodData.zones as any,
        rules: methodData.rules as any,
      },
    });

    if (this.cache) {
      await this.cache.invalidate('shipping:methods');
    }

    return method;
  }

  async syncWithUSPS(trackingNumber: string): Promise<TrackingInfo> {
    if (!this.carrierApiKeys.usps) {
      throw new Error('USPS API key not configured');
    }

    // Simulate USPS API call
    return this.simulateTrackingSync(trackingNumber, ShippingCarrier.USPS);
  }

  async syncWithUPS(trackingNumber: string): Promise<TrackingInfo> {
    if (!this.carrierApiKeys.ups) {
      throw new Error('UPS API key not configured');
    }

    // Simulate UPS API call
    return this.simulateTrackingSync(trackingNumber, ShippingCarrier.UPS);
  }

  async syncWithFedEx(trackingNumber: string): Promise<TrackingInfo> {
    if (!this.carrierApiKeys.fedex) {
      throw new Error('FedEx API key not configured');
    }

    // Simulate FedEx API call
    return this.simulateTrackingSync(trackingNumber, ShippingCarrier.FEDEX);
  }

  private findZoneForAddress(zones: ShippingZone[], address: Address): ShippingZone | null {
    return zones.find(zone => {
      if (!zone.countries.includes(address.country)) return false;
      if (zone.states && !zone.states.includes(address.state)) return false;
      if (zone.postalCodes && !zone.postalCodes.some(pc => address.postalCode.startsWith(pc))) return false;
      return true;
    }) || null;
  }

  private evaluateRule(rule: ShippingRule, context: { totalWeight: number; totalValue: number; itemCount: number }): boolean {
    let value: number;
    switch (rule.condition) {
      case 'weight':
        value = context.totalWeight;
        break;
      case 'value':
        value = context.totalValue;
        break;
      case 'items':
        value = context.itemCount;
        break;
      default:
        return false;
    }

    switch (rule.operator) {
      case 'gt':
        return value > rule.value;
      case 'lt':
        return value < rule.value;
      case 'eq':
        return value === rule.value;
      case 'gte':
        return value >= rule.value;
      case 'lte':
        return value <= rule.value;
      default:
        return false;
    }
  }

  private hashAddress(address: Address): string {
    return Buffer.from(`${address.street}${address.city}${address.state}${address.postalCode}${address.country}`)
      .toString('base64')
      .substring(0, 10);
  }

  private hashItems(items: CartItem[]): string {
    const itemString = items.map(i => `${i.productId}:${i.quantity}`).join(',');
    return Buffer.from(itemString).toString('base64').substring(0, 10);
  }

  private generateTrackingNumber(carrier: ShippingCarrier): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    switch (carrier) {
      case ShippingCarrier.USPS:
        return `9400${timestamp.substring(-8)}${random}`;
      case ShippingCarrier.UPS:
        return `1Z${random}${timestamp.substring(-8)}`;
      case ShippingCarrier.FEDEX:
        return `${timestamp.substring(-12)}`;
      default:
        return `${carrier}${timestamp}${random}`;
    }
  }

  private getWarehouseAddress(): Address {
    // In real implementation, this would come from configuration
    return {
      street: '123 Warehouse St',
      city: 'Fulfillment City',
      state: 'CA',
      postalCode: '90210',
      country: 'USA',
    };
  }

  private async generateLabelUrl(labelId: string, carrier: ShippingCarrier): Promise<string> {
    // In real implementation, this would be the actual label URL from carrier
    return `https://labels.example.com/${carrier.toLowerCase()}/${labelId}.pdf`;
  }

  private async fetchTrackingFromCarrier(trackingNumber: string, carrier: ShippingCarrier): Promise<TrackingInfo> {
    // In real implementation, this would call the actual carrier API
    return this.simulateTrackingSync(trackingNumber, carrier);
  }

  private async simulateTrackingSync(trackingNumber: string, carrier: ShippingCarrier): Promise<TrackingInfo> {
    const events: TrackingEvent[] = [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'PICKED_UP',
        description: 'Package picked up by carrier',
        location: 'Origin Facility',
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'IN_TRANSIT',
        description: 'Package in transit',
        location: 'Sorting Facility',
      },
      {
        timestamp: new Date(),
        status: 'OUT_FOR_DELIVERY',
        description: 'Out for delivery',
        location: 'Destination City',
      },
    ];

    return {
      trackingNumber,
      carrier,
      status: TrackingStatus.OUT_FOR_DELIVERY,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
      events,
      currentLocation: 'Destination City',
    };
  }
}

export function createShippingService(dependencies: ShippingServiceDependencies): ShippingService {
  return new ShippingService(dependencies);
}