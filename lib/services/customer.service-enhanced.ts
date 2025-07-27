import { CustomerService, CustomerServiceDependencies } from './customer.service';

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
  email?: string;
}

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
  sizePreferences?: Record<string, string>;
  communicationPreferences?: {
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
    return this.create(data);
  }

  async getCustomer(customerId: string): Promise<any> {
    return this.findById(customerId);
  }

  async updateCustomer(customerId: string, data: UpdateCustomerDto): Promise<any> {
    return this.update(customerId, data);
  }

  async getCustomers(filters: any = {}, pagination?: { page: number; limit: number }): Promise<any> {
    return this.findAll(filters, pagination);
  }

  // New address management methods
  async getAddresses(customerId: string): Promise<any[]> {
    const customer = await this.findById(customerId);
    return customer?.addresses || [];
  }

  async setDefaultAddress(customerId: string, addressId: string): Promise<any> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    
    if (!address || address.customerId !== customerId) {
      throw new Error('Address not found or does not belong to customer');
    }

    await this.prisma.address.updateMany({
      where: { customerId, type: address.type },
      data: { isDefault: false },
    });

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return updated;
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

  async addAddress(customerId: string, address: AddressDto): Promise<any> {
    const validation = await this.validateAddress(address);
    if (!validation.valid) {
      throw new Error(`Invalid address: ${validation.errors?.join(', ')}`);
    }

    const addressData = validation.standardized || address;
    
    if (addressData.isDefault) {
      await this.prisma.address.updateMany({
        where: { customerId, type: addressData.type },
        data: { isDefault: false },
      });
    }

    const newAddress = await this.prisma.address.create({
      data: {
        customerId,
        type: addressData.type,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        isDefault: addressData.isDefault || false,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return newAddress;
  }

  async updateAddress(customerId: string, addressId: string, data: AddressDto): Promise<any> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    
    if (!address || address.customerId !== customerId) {
      throw new Error('Address not found or does not belong to customer');
    }

    if (data.street && data.city && data.state && data.postalCode && data.country) {
      const validation = await this.validateAddress(data);
      if (!validation.valid) {
        throw new Error(`Invalid address: ${validation.errors?.join(', ')}`);
      }
      data = validation.standardized || data;
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        type: data.type,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
      },
    });

    if (this.cache && updated.customerId) {
      await this.cache.invalidate(`customer:${updated.customerId}`);
    }

    return updated;
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
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        postalCode: orderData.shippingAddress.postalCode,
        country: orderData.shippingAddress.country,
        isDefault: true,
      } : undefined,
    });

    return guest;
  }

  async convertGuestToCustomer(guestId: string, userData: {
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    marketingConsent?: boolean;
  }): Promise<any> {
    const guest = await this.findById(guestId);
    if (!guest) {
      throw new Error('Guest customer not found');
    }

    const updated = await this.prisma.customer.update({
      where: { id: guestId },
      data: {
        firstName: userData.firstName || guest.firstName,
        lastName: userData.lastName || guest.lastName,
        phone: userData.phone || guest.phone,
        preferences: {
          ...(guest.preferences || {}),
          marketingConsent: userData.marketingConsent || false,
        } as any,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${guestId}`);
    }

    return this.findById(guestId);
  }

  // Measurements
  async saveMeasurements(customerId: string, measurements: MeasurementsDto): Promise<any> {
    return this.updateMeasurements(customerId, {
      ...measurements,
      updatedAt: new Date(),
    });
  }

  async getMeasurements(customerId: string): Promise<any> {
    const customer = await this.findById(customerId);
    return customer?.measurements || null;
  }

  // Preferences & Communications
  async updatePreferences(customerId: string, preferences: PreferencesDto): Promise<any> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentPreferences = customer.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        preferences: updatedPreferences as any,
      },
    });

    if (this.cache) {
      await this.cache.invalidate(`customer:${customerId}`);
    }

    return this.findById(customerId);
  }

  async getMarketingConsent(customerId: string): Promise<boolean> {
    const customer = await this.findById(customerId);
    return customer?.preferences?.marketingConsent || false;
  }

  async updateMarketingConsent(customerId: string, consent: ConsentDto): Promise<any> {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedPreferences = {
      ...(customer.preferences || {}),
      marketingConsent: consent.marketingConsent,
      consentHistory: [
        ...(customer.preferences?.consentHistory || []),
        {
          type: 'marketing',
          granted: consent.marketingConsent,
          timestamp: consent.timestamp,
          ipAddress: consent.ipAddress,
          dataProcessingConsent: consent.dataProcessingConsent,
          cookieConsent: consent.cookieConsent,
        },
      ],
    };

    return this.updatePreferences(customerId, updatedPreferences);
  }
}

export function createEnhancedCustomerService(dependencies: CustomerServiceDependencies): EnhancedCustomerService {
  return new EnhancedCustomerService(dependencies);
}