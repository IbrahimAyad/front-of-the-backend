import axios from 'axios';
import { CLIENT_CONFIG } from '../config/client';
import type {
  WeddingParty,
  WeddingMember,
  WeddingFormData,
  WeddingAnalytics,
  WeddingTimelineEvent,
  WeddingMessage,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// Wedding Backend API Configuration
const WEDDING_API_BASE_URL = process.env.VITE_WEDDING_API_URL || 'https://your-wedding-backend.com/api';

// Create axios instance for wedding API
const weddingAPI = axios.create({
  baseURL: WEDDING_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
weddingAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
weddingAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Wedding Backend API Service
 * Integrates with dedicated wedding system backend
 */
export class WeddingBackendAPI {
  
  // Wedding Party Management
  async getWeddings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<WeddingParty>> {
    const response = await weddingAPI.get('/weddings', { params });
    return response.data;
  }

  async getWedding(id: string): Promise<ApiResponse<WeddingParty>> {
    const response = await weddingAPI.get(`/weddings/${id}`);
    return response.data;
  }

  async createWedding(data: WeddingFormData): Promise<ApiResponse<WeddingParty>> {
    const response = await weddingAPI.post('/weddings', data);
    return response.data;
  }

  async updateWedding(id: string, data: Partial<WeddingFormData>): Promise<ApiResponse<WeddingParty>> {
    const response = await weddingAPI.put(`/weddings/${id}`, data);
    return response.data;
  }

  async deleteWedding(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await weddingAPI.delete(`/weddings/${id}`);
    return response.data;
  }

  // Wedding Party Members
  async getWeddingParty(weddingId: string): Promise<ApiResponse<WeddingMember[]>> {
    const response = await weddingAPI.get(`/weddings/${weddingId}/party`);
    return response.data;
  }

  async invitePartyMember(weddingId: string, memberData: {
    name: string;
    email: string;
    phone?: string;
    role: 'groom' | 'best_man' | 'groomsman';
  }): Promise<ApiResponse<WeddingMember>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/party/invite`, memberData);
    return response.data;
  }

  async updatePartyMember(weddingId: string, memberId: string, data: Partial<WeddingMember>): Promise<ApiResponse<WeddingMember>> {
    const response = await weddingAPI.put(`/weddings/${weddingId}/party/${memberId}`, data);
    return response.data;
  }

  async removePartyMember(weddingId: string, memberId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await weddingAPI.delete(`/weddings/${weddingId}/party/${memberId}`);
    return response.data;
  }

  // Measurements
  async getWeddingMeasurements(weddingId: string): Promise<ApiResponse<any[]>> {
    const response = await weddingAPI.get(`/weddings/${weddingId}/measurements`);
    return response.data;
  }

  async submitMeasurements(weddingId: string, memberId: string, measurements: any): Promise<ApiResponse<any>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/measurements`, {
      memberId,
      measurements,
    });
    return response.data;
  }

  // Timeline Management
  async getWeddingTimeline(weddingId: string): Promise<ApiResponse<WeddingTimelineEvent[]>> {
    const response = await weddingAPI.get(`/weddings/${weddingId}/timeline`);
    return response.data;
  }

  async addTimelineEvent(weddingId: string, event: Omit<WeddingTimelineEvent, 'id'>): Promise<ApiResponse<WeddingTimelineEvent>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/timeline`, event);
    return response.data;
  }

  async updateTimelineEvent(weddingId: string, eventId: string, data: Partial<WeddingTimelineEvent>): Promise<ApiResponse<WeddingTimelineEvent>> {
    const response = await weddingAPI.put(`/weddings/${weddingId}/timeline/${eventId}`, data);
    return response.data;
  }

  // Communications
  async getWeddingMessages(weddingId: string): Promise<ApiResponse<WeddingMessage[]>> {
    const response = await weddingAPI.get(`/weddings/${weddingId}/communications`);
    return response.data;
  }

  async sendWeddingMessage(weddingId: string, message: {
    content: string;
    recipients?: string[]; // member IDs, or all if empty
    type?: 'announcement' | 'reminder' | 'update';
  }): Promise<ApiResponse<WeddingMessage>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/message`, message);
    return response.data;
  }

  // Bulk Operations
  async bulkCreateOrder(weddingId: string, orderData: {
    items: Array<{
      memberId: string;
      productId: string;
      quantity: number;
      customizations?: any;
    }>;
    discountCode?: string;
  }): Promise<ApiResponse<any>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/bulk-order`, orderData);
    return response.data;
  }

  async sendBulkReminder(weddingId: string, reminderType: 'measurements' | 'payment' | 'fitting'): Promise<ApiResponse<{ message: string }>> {
    const response = await weddingAPI.post(`/weddings/${weddingId}/reminder`, { type: reminderType });
    return response.data;
  }

  async getBulkStatus(weddingId: string): Promise<ApiResponse<{
    measurementsComplete: number;
    paymentsComplete: number;
    fittingsScheduled: number;
    totalMembers: number;
  }>> {
    const response = await weddingAPI.get(`/weddings/${weddingId}/bulk-status`);
    return response.data;
  }

  // Analytics
  async getWeddingAnalytics(params?: {
    period?: string;
    weddingId?: string;
  }): Promise<ApiResponse<WeddingAnalytics>> {
    const response = await weddingAPI.get('/analytics/weddings/summary', { params });
    return response.data;
  }

  async getWeddingTrends(): Promise<ApiResponse<any>> {
    const response = await weddingAPI.get('/analytics/weddings/trends');
    return response.data;
  }

  async getPopularThemes(): Promise<ApiResponse<any>> {
    const response = await weddingAPI.get('/analytics/popular-themes');
    return response.data;
  }

  // Customer Portal
  async joinWeddingParty(inviteCode: string, customerInfo: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<ApiResponse<WeddingMember>> {
    const response = await weddingAPI.post('/customer/join-wedding', {
      inviteCode,
      ...customerInfo,
    });
    return response.data;
  }

  async getCustomerWeddings(): Promise<ApiResponse<WeddingParty[]>> {
    const response = await weddingAPI.get('/customer/my-weddings');
    return response.data;
  }

  async getCustomerWeddingOrders(): Promise<ApiResponse<any[]>> {
    const response = await weddingAPI.get('/customer/wedding-orders');
    return response.data;
  }

  // Search and Filtering
  async searchWeddings(query: string, filters?: {
    status?: string;
    theme?: string;
    dateFrom?: string;
    dateTo?: string;
    pendingMeasurements?: boolean;
  }): Promise<ApiResponse<WeddingParty[]>> {
    const response = await weddingAPI.get('/weddings', {
      params: { search: query, ...filters },
    });
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await weddingAPI.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Wedding API is not available');
    }
  }
}

// Export singleton instance
export const weddingBackendAPI = new WeddingBackendAPI();
export default weddingBackendAPI; 