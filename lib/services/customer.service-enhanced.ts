import { CustomerService, CustomerServiceDependencies } from './customer.service';

// Enhanced Customer DTOs
export interface AddressDto {
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface MeasurementsDto {
  chest?: number;
  waist?: number;
  hips?: number;
  inseam?: number;
  sleeve?: number;
  neck?: number;
  shoeSize?: string;
  preferredFit?: 'slim' | 'regular' | 'relaxed';
  notes?: string;
}

export interface PreferencesDto {
  favoriteColors?: string[];
  favoriteBrands?: string[];
  preferredCategories?: string[];
  avoidMaterials?: string[];
  budgetRange?: { min: number; max: number };
  stylePreferences?: string[];
}

export interface CreateCustomerDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  password?: string;
  address?: AddressDto;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  measurements?: MeasurementsDto;
  preferences?: PreferencesDto;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface ConsentDto {
  marketingConsent: boolean;
  dataProcessingConsent?: boolean;
  cookieConsent?: boolean;
  timestamp: Date;
  ipAddress?: string;
}

export class EnhancedCustomerService extends CustomerService {
  constructor(dependencies: CustomerServiceDependencies) {
    super(dependencies);
  }

  // Alias methods for Terminal 2
  async createCustomer(data: CreateCustomerDto): Promise<any> {
    const createData = {
      ...data,
      address: data.address ? {
        ...data.address,
        isDefault: data.address.isDefault ?? true
      } : undefined
    };
    return this.create(createData as any);
  }

  async getCustomer(customerId: string): Promise<any> {
    return this.findById(customerId);
  }

  async updateCustomer(customerId: string, data: UpdateCustomerDto): Promise<any> {
    const updateData: any = {
      ...data,
      measurements: data.measurements ? {
        ...data.measurements,
        updatedAt: new Date()
      } : undefined
    };
    return this.update(customerId, updateData);
  }

  async updateCustomerMeasurements(customerId: string, measurements: MeasurementsDto): Promise<any> {
    return super.updateMeasurements(customerId, {
      ...measurements,
      updatedAt: new Date()
    } as any);
  }

  // Address management methods are not supported with current schema
  // The database doesn't have a separate Address table
  async getAddresses(customerId: string): Promise<any[]> {
    const customer = await this.findById(customerId);
    if (!customer) return [];
    
    // Return addresses if they exist
    return customer.addresses || [];
  }

  async validateAddress(address: AddressDto): Promise<{
    valid: boolean;
    standardized?: AddressDto;
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    if (!address.street || address.street.length < 5) {
      errors.push('Invalid street address');
    }
    if (!address.city || address.city.length < 2) {
      errors.push('Invalid city');
    }
    if (!address.state || address.state.length !== 2) {
      errors.push('State must be 2-letter code');
    }
    if (!address.postalCode || !this.isValidPostalCode(address.postalCode, address.country)) {
      errors.push('Invalid postal code');
    }

    const valid = errors.length === 0;
    
    return {
      valid,
      standardized: valid ? {
        ...address,
        state: address.state.toUpperCase(),
        country: address.country.toUpperCase(),
      } : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private isValidPostalCode(postalCode: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      USA: /^\d{5}(-\d{4})?$/,
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      UK: /^[A-Z]{1,2}\d{1,2} \d[A-Z]{2}$/,
      GB: /^[A-Z]{1,2}\d{1,2} \d[A-Z]{2}$/,
    };
    
    const pattern = patterns[country.toUpperCase()] || /^.+$/;
    return pattern.test(postalCode);
  }

  // Analytics aliases
  async getCustomerAnalytics(customerId: string): Promise<any> {
    return this.getAnalytics(customerId);
  }

  async getCustomerPurchaseHistory(customerId: string, limit?: number): Promise<any[]> {
    return this.getPurchaseHistory(customerId, limit);
  }

  async getCustomerSegments(): Promise<any[]> {
    return this.getSegments();
  }

  async calculateLifetimeValue(customerId: string): Promise<number> {
    const analytics = await this.getAnalytics(customerId);
    return analytics.lifetimeValue;
  }

  // Guest customer support
  async createGuestCustomer(email: string, orderData: any): Promise<any> {
    const existing = await this.findByEmail(email);
    if (existing) {
      return existing;
    }

    const nameParts = orderData.shippingAddress?.name?.split(' ') || ['Guest', 'Customer'];
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const guest = await this.create({
      email,
      firstName,
      lastName,
      phone: orderData.phone,
      address: orderData.shippingAddress ? {
        type: 'shipping',
        isDefault: true,
        street: orderData.shippingAddress.street || '',
        city: orderData.shippingAddress.city || '',
        state: orderData.shippingAddress.state || '',
        postalCode: orderData.shippingAddress.postalCode || '',
        country: orderData.shippingAddress.country || 'US',
      } : undefined,
    });

    return guest;
  }

  // Consent management
  async recordConsent(customerId: string, consent: ConsentDto): Promise<void> {
    const consentRecord = {
      customerId,
      type: 'marketing',
      granted: consent.marketingConsent,
      timestamp: consent.timestamp,
      ipAddress: consent.ipAddress,
      details: {
        dataProcessing: consent.dataProcessingConsent,
        cookies: consent.cookieConsent,
      },
    };

    // In a real implementation, this would save to a consent tracking table
    console.log('Recording consent:', consentRecord);
    
    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }
  }

  async getConsentStatus(customerId: string): Promise<{
    marketing: boolean;
    dataProcessing: boolean;
    cookies: boolean;
    lastUpdated: Date;
  }> {
    // In a real implementation, this would fetch from consent tracking table
    return {
      marketing: true,
      dataProcessing: true,
      cookies: true,
      lastUpdated: new Date(),
    };
  }

  // GDPR compliance
  async exportCustomerData(customerId: string): Promise<any> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const orders = this.orderService ? 
      (await this.orderService.getCustomerOrders(customerId)).orders : [];

    return {
      customer,
      orders,
      exportedAt: new Date(),
      format: 'json',
    };
  }

  async anonymizeCustomer(customerId: string): Promise<void> {
    await this.update(customerId, {
      firstName: 'REDACTED',
      lastName: 'REDACTED',
      phone: null,
      dateOfBirth: null,
      measurements: null,
      preferences: null,
    });

    // Keep email for order history but mark as anonymized
    await this.prisma.customers.update({
      where: { id: customerId },
      data: { 
        email: `anonymized-${customerId}@example.com`,
        notes: 'Customer data anonymized per GDPR request',
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }
  }

  // Loyalty and rewards
  async addCustomerLoyaltyPoints(customerId: string, points: number, reason: string): Promise<number> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newPoints = (customer.loyaltyPoints || 0) + points;
    
    await this.prisma.customers.update({
      where: { id: customerId },
      data: { loyaltyPoints: newPoints },
    });

    // Log the transaction (in real impl, this would be a separate table)
    console.log(`Loyalty points added: ${points} for ${reason}`);

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return newPoints;
  }

  async redeemLoyaltyPoints(customerId: string, points: number, orderId: string): Promise<number> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentPoints = customer.loyaltyPoints || 0;
    if (currentPoints < points) {
      throw new Error('Insufficient loyalty points');
    }

    const newPoints = currentPoints - points;
    
    await this.prisma.customers.update({
      where: { id: customerId },
      data: { loyaltyPoints: newPoints },
    });

    console.log(`Loyalty points redeemed: ${points} for order ${orderId}`);

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return newPoints;
  }

  // Customer communication
  async getNotificationPreferences(customerId: string): Promise<{
    email: boolean;
    sms: boolean;
    push: boolean;
  }> {
    // In real implementation, this would fetch from preferences table
    return {
      email: true,
      sms: false,
      push: true,
    };
  }

  async updateNotificationPreferences(
    customerId: string, 
    preferences: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<void> {
    // In real implementation, this would update preferences table
    console.log(`Updating notification preferences for ${customerId}:`, preferences);
    
    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }
  }

  // Wishlist functionality
  async addToWishlist(customerId: string, productId: string): Promise<void> {
    // In real implementation, this would add to wishlist table
    console.log(`Adding product ${productId} to wishlist for customer ${customerId}`);
  }

  async removeFromWishlist(customerId: string, productId: string): Promise<void> {
    console.log(`Removing product ${productId} from wishlist for customer ${customerId}`);
  }

  async getWishlist(customerId: string): Promise<string[]> {
    // In real implementation, this would fetch from wishlist table
    return [];
  }

  // Customer reviews
  async getCustomerReviews(customerId: string): Promise<any[]> {
    // In real implementation, this would fetch from reviews table
    return [];
  }

  async hasCustomerPurchasedProduct(customerId: string, productId: string): Promise<boolean> {
    if (!this.orderService) return false;
    
    const { orders } = await this.orderService.getCustomerOrders(customerId);
    return orders.some(order => 
      order.items?.some((item: any) => item.productId === productId)
    );
  }
}