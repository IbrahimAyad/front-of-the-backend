import axios from 'axios';
import type {
  User,
  Customer,
  Lead,
  Product,
  Order,
  Measurement,
  Appointment,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  CustomerFormData,
  LeadFormData,
  ProductFormData,
  OrderFormData,
  MeasurementFormData,
  AppointmentFormData,
} from '../types';
import { CLIENT_CONFIG } from '../config/client';

// Use production-ready API base URL
const API_BASE_URL = CLIENT_CONFIG.BACKEND_URL || 'https://front-of-the-backend-production.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  getRecentActivities: async (): Promise<ApiResponse<{
    recentOrders: Order[];
    recentLeads: Lead[];
    recentAppointments: Appointment[];
  }>> => {
    const response = await api.get('/api/dashboard/recent');
    return response.data;
  },
};

// Customer API
export const customerAPI = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get('/api/customers', { params });
    return response.data;
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CustomerFormData): Promise<ApiResponse<Customer>> => {
    const response = await api.post('/api/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData>): Promise<ApiResponse<Customer>> => {
    const response = await api.put(`/api/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/customers/${id}`);
    return response.data;
  },
};

// Lead API
export const leadAPI = {
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    search?: string;
  }): Promise<PaginatedResponse<Lead>> => {
    const response = await api.get('/api/leads', { params });
    return response.data;
  },

  getLead: async (id: string): Promise<ApiResponse<Lead>> => {
    const response = await api.get(`/api/leads/${id}`);
    return response.data;
  },

  createLead: async (data: LeadFormData): Promise<ApiResponse<Lead>> => {
    const response = await api.post('/api/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: Partial<LeadFormData>): Promise<ApiResponse<Lead>> => {
    const response = await api.put(`/api/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/leads/${id}`);
    return response.data;
  },
};

// Product API
export const productAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    lowStock?: boolean;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  createProduct: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    const response = await api.post('/api/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/api/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },
};

// Order API
export const orderAPI = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/api/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: OrderFormData): Promise<ApiResponse<Order>> => {
    const response = await api.post('/api/orders', data);
    return response.data;
  },

  updateOrder: async (id: string, data: Partial<OrderFormData>): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/api/orders/${id}`, data);
    return response.data;
  },

  deleteOrder: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/orders/${id}`);
    return response.data;
  },
};

// Measurement API
export const measurementAPI = {
  getMeasurements: async (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Measurement>> => {
    const response = await api.get('/api/measurements', { params });
    return response.data;
  },

  getMeasurement: async (id: string): Promise<ApiResponse<Measurement>> => {
    const response = await api.get(`/api/measurements/${id}`);
    return response.data;
  },

  createMeasurement: async (data: MeasurementFormData): Promise<ApiResponse<Measurement>> => {
    const response = await api.post('/api/measurements', data);
    return response.data;
  },

  updateMeasurement: async (id: string, data: Partial<MeasurementFormData>): Promise<ApiResponse<Measurement>> => {
    const response = await api.put(`/api/measurements/${id}`, data);
    return response.data;
  },

  deleteMeasurement: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/measurements/${id}`);
    return response.data;
  },
};

// Appointment API
export const appointmentAPI = {
  getAppointments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    service?: string;
    date?: string;
    customerId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get('/api/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: AppointmentFormData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/api/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: Partial<AppointmentFormData>): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/api/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/appointments/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSalesAnalytics: async (params?: { period?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/analytics/sales', {
      params,
    });
    return response.data;
  },

  getLeadAnalytics: async (params?: { period?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/analytics/leads', {
      params,
    });
    return response.data;
  },
};

export default api; 