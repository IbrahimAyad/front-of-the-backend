import fetch from 'node-fetch';
import logger from '../utils/logger';

interface HoldItem {
  sku: string;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface CreateHoldParams {
  items: HoldItem[];
  customerId?: string;
  sessionId?: string;
  duration?: number;
  holdType?: 'temporary' | 'standing' | 'reservation';
  outfitId?: string;
}

interface AllocateFromStandingHoldParams {
  standingHoldId: string;
  customerId: string;
  sessionId: string;
  items: HoldItem[];
}

export class MacOSAdminClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.MACOS_ADMIN_URL || 'http://localhost:8080';
    this.apiKey = process.env.MACOS_ADMIN_API_KEY || '34bae7d25bc74fd286bab1ce3355bac1';
  }

  /**
   * Check availability for items
   */
  async checkAvailability(items: HoldItem[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error(`Availability check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.availability || [];
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Create a hold (temporary or standing)
   */
  async createHold(params: CreateHoldParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          items: params.items,
          customerId: params.customerId,
          sessionId: params.sessionId,
          duration: params.duration || 1800,
          holdType: params.holdType || 'temporary',
          metadata: params.outfitId ? { outfitId: params.outfitId } : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Hold creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error creating hold:', error);
      throw error;
    }
  }

  /**
   * Allocate from standing hold
   */
  async allocateFromStandingHold(params: AllocateFromStandingHoldParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/hold/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          standingHoldId: params.standingHoldId,
          customerId: params.customerId,
          sessionId: params.sessionId,
          items: params.items
        })
      });

      if (!response.ok) {
        throw new Error(`Allocation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error allocating from standing hold:', error);
      throw error;
    }
  }

  /**
   * Get hold status
   */
  async getHoldStatus(holdId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/hold/${holdId}`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Get hold status failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error getting hold status:', error);
      throw error;
    }
  }

  /**
   * Release a hold
   */
  async releaseHold(holdId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/hold/${holdId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Hold release failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error releasing hold:', error);
      throw error;
    }
  }

  /**
   * Get products
   */
  async getProducts() {
    try {
      const response = await fetch(`${this.baseUrl}/api/products`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Get products failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Get inventory
   */
  async getInventory() {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Get inventory failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error getting inventory:', error);
      throw error;
    }
  }

  /**
   * Convert hold to order
   */
  async convertHoldToOrder(holdId: string, orderId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/hold/${holdId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          orderId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Hold conversion failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error converting hold to order:', error);
      throw error;
    }
  }
}