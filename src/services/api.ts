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
  ProductFilters,
  CreateProductRequest,
  CreateVariantRequest,
  StockAdjustmentRequest,
  ProductDashboardStats,
  ProductImage,
  CreateSupplierRequest,
  CreatePurchaseOrderRequest,
  SupplierPerformance,
} from '../types';
import { CLIENT_CONFIG } from '../config/client';

// Use production-ready API base URL with debugging
const API_BASE_URL = `${CLIENT_CONFIG.BACKEND_URL}/api` || 'https://front-of-the-backend-production.up.railway.app/api';

// Debug logging for API configuration
console.log('🔧 API Configuration:', {
  'CLIENT_CONFIG.BACKEND_URL': CLIENT_CONFIG.BACKEND_URL,
  'Final API_BASE_URL': API_BASE_URL,
  'isProduction': CLIENT_CONFIG.BACKEND_URL.includes('railway.app')
});

// Get timeout from environment or use default
const getApiTimeout = () => {
  // Check for environment variable first
  if (typeof window !== 'undefined' && window.localStorage) {
    const envTimeout = localStorage.getItem('API_TIMEOUT');
    if (envTimeout) return parseInt(envTimeout);
  }
  // Default: 60 seconds for production, 30 seconds for development
  return CLIENT_CONFIG.BACKEND_URL.includes('railway.app') ? 60000 : 30000;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: getApiTimeout(),
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced error logging but don't log auth failures as errors for public endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isPublicEndpoint = error.config?.url?.includes('/public') || 
                           error.config?.url?.includes('/analytics') || 
                           error.config?.url?.includes('/test');
    
    if (!isPublicEndpoint || error.response?.status !== 401) {
      console.error('🚨 API Error:', {
        'URL': error.config?.url,
        'Method': error.config?.method?.toUpperCase(),
        'Status': error.response?.status,
        'Status Text': error.response?.statusText,
        'Base URL': error.config?.baseURL,
        'Full URL': `${error.config?.baseURL}${error.config?.url}`,
        'Error Message': error.message,
        'Response Data': error.response?.data
      });
    }

    const originalRequest = error.config;

    // Only handle auth for authenticated endpoints
    if (error.response?.status === 401 && !originalRequest._retry && isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.warn('🔄 Token refresh failed - user needs to login again');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Don't redirect automatically - let the user stay on the page
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivities: async (): Promise<ApiResponse<{
    recentOrders: Order[];
    recentLeads: Lead[];
    recentAppointments: Appointment[];
  }>> => {
    const response = await api.get('/dashboard/recent');
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
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // Public customer endpoint (no auth required)
  getCustomersPublic: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get('/customers/public', { params });
    return response.data;
  },

  // Production customer analytics endpoint
  getCustomerAnalytics: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> => {
    const response = await api.get('/customers/analytics', { params });
    return response.data;
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CustomerFormData): Promise<ApiResponse<Customer>> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData>): Promise<ApiResponse<Customer>> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/customers/${id}`);
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
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getLead: async (id: string): Promise<ApiResponse<Lead>> => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  createLead: async (data: LeadFormData): Promise<ApiResponse<Lead>> => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: Partial<LeadFormData>): Promise<ApiResponse<Lead>> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
};

// Enhanced Product API with Inventory Management
export const productAPI = {
  // Get products with comprehensive filtering
  getProducts: async (filters: ProductFilters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Get single product with full details
  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  createProduct: async (productData: CreateProductRequest) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id: string, productData: Partial<CreateProductRequest>) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (Admin only)
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Product Variants
  getVariants: async (productId: string) => {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data;
  },

  createVariant: async (productId: string, variantData: CreateVariantRequest) => {
    const response = await api.post(`/products/${productId}/variants`, variantData);
    return response.data;
  },

  updateVariant: async (productId: string, variantId: string, variantData: Partial<CreateVariantRequest>) => {
    const response = await api.put(`/products/${productId}/variants/${variantId}`, variantData);
    return response.data;
  },

  deleteVariant: async (productId: string, variantId: string) => {
    const response = await api.delete(`/products/${productId}/variants/${variantId}`);
    return response.data;
  },

  // Stock Management
  adjustStock: async (productId: string, adjustment: StockAdjustmentRequest) => {
    const response = await api.post(`/products/${productId}/stock/adjust`, adjustment);
    return response.data;
  },

  adjustVariantStock: async (productId: string, variantId: string, adjustment: StockAdjustmentRequest) => {
    const response = await api.post(`/products/${productId}/variants/${variantId}/stock/adjust`, adjustment);
    return response.data;
  },

  // Inventory Logs
  getInventoryLogs: async (productId: string, page = 1, limit = 50) => {
    const response = await api.get(`/products/${productId}/inventory-logs?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Stock Alerts
  getStockAlerts: async (filters: { resolved?: boolean; priority?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/products/alerts/stock?${queryParams.toString()}`);
    return response.data;
  },

  markAlertResolved: async (alertId: string) => {
    const response = await api.put(`/products/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Dashboard Statistics
  getDashboardStats: async (): Promise<ApiResponse<ProductDashboardStats>> => {
    const response = await api.get('/products/stats/dashboard');
    return response.data;
  },

  // Product Images
  uploadImage: async (productId: string, imageFile: File, metadata: Partial<ProductImage> = {}) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await api.post(`/products/${productId}/images`, formData);
    return response.data;
  },

  updateImageOrder: async (productId: string, imageIds: string[]) => {
    const response = await api.put(`/products/${productId}/images/reorder`, { imageIds });
    return response.data;
  },

  deleteImage: async (productId: string, imageId: string) => {
    const response = await api.delete(`/products/${productId}/images/${imageId}`);
    return response.data;
  },

  // Bulk Operations
  bulkUpdateProducts: async (updates: Array<{ id: string; data: Partial<CreateProductRequest> }>) => {
    const response = await api.put('/products/bulk', { updates });
    return response.data;
  },

  bulkStockAdjustment: async (adjustments: Array<{ productId: string; variantId?: string; adjustment: StockAdjustmentRequest }>) => {
    const response = await api.post('/products/bulk/stock-adjust', { adjustments });
    return response.data;
  },

  // Export/Import
  exportProducts: async (filters: ProductFilters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/products/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importProducts: async (csvFile: File) => {
    const formData = new FormData();
    formData.append('file', csvFile);

    const response = await api.post('/products/import', formData);
    return response.data;
  },
};

// Supplier Management API
export const supplierAPI = {
  // Get all suppliers
  getSuppliers: async (filters: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    isActive?: boolean; 
    isPreferred?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/suppliers?${queryParams.toString()}`);
    return response.data;
  },

  // Get single supplier
  getSupplier: async (id: string) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  createSupplier: async (supplierData: CreateSupplierRequest) => {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  },

  // Update supplier
  updateSupplier: async (id: string, supplierData: Partial<CreateSupplierRequest>) => {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  // Delete supplier
  deleteSupplier: async (id: string) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  // Purchase Orders
  getPurchaseOrders: async (supplierId: string, filters: { page?: number; limit?: number; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/suppliers/${supplierId}/purchase-orders?${queryParams.toString()}`);
    return response.data;
  },

  createPurchaseOrder: async (orderData: CreatePurchaseOrderRequest) => {
    const response = await api.post('/suppliers/purchase-orders', orderData);
    return response.data;
  },

  updatePurchaseOrder: async (orderId: string, orderData: Partial<CreatePurchaseOrderRequest>) => {
    const response = await api.put(`/suppliers/purchase-orders/${orderId}`, orderData);
    return response.data;
  },

  receivePurchaseOrder: async (orderId: string, items: Array<{ id: string; quantityReceived: number }>, partialReceive = false) => {
    const response = await api.post(`/suppliers/purchase-orders/${orderId}/receive`, {
      items,
      partialReceive,
    });
    return response.data;
  },

  // Supplier Analytics
  getSupplierAnalytics: async (supplierId: string, dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<SupplierPerformance>> => {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      queryParams.append('startDate', dateRange.startDate);
      queryParams.append('endDate', dateRange.endDate);
    }

    const response = await api.get(`/suppliers/${supplierId}/analytics?${queryParams.toString()}`);
    return response.data;
  },

  // Rate supplier
  rateSupplier: async (supplierId: string, rating: { 
    overallRating?: number; 
    qualityRating?: number; 
    deliveryRating?: number; 
    notes?: string; 
  }) => {
    const response = await api.post(`/suppliers/${supplierId}/rate`, rating);
    return response.data;
  },
};

// Enhanced Inventory Management API
export const inventoryAPI = {
  // Low stock alerts
  getLowStockItems: async (threshold = 10) => {
    const response = await api.get(`/inventory/low-stock?threshold=${threshold}`);
    return response.data;
  },

  // Stock movements
  getStockMovements: async (filters: {
    productId?: string;
    variantId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/movements?${queryParams.toString()}`);
    return response.data;
  },

  // Inventory valuation
  getInventoryValuation: async (method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE') => {
    const response = await api.get(`/inventory/valuation?method=${method}`);
    return response.data;
  },

  // Stock take / Physical inventory
  startStockTake: async (locations?: string[]) => {
    const response = await api.post('/inventory/stock-take/start', { locations });
    return response.data;
  },

  recordStockCount: async (stockTakeId: string, counts: Array<{
    productId?: string;
    variantId?: string;
    countedQuantity: number;
    notes?: string;
  }>) => {
    const response = await api.post(`/inventory/stock-take/${stockTakeId}/count`, { counts });
    return response.data;
  },

  completeStockTake: async (stockTakeId: string) => {
    const response = await api.post(`/inventory/stock-take/${stockTakeId}/complete`);
    return response.data;
  },

  // Reorder suggestions
  getReorderSuggestions: async () => {
    const response = await api.get('/inventory/reorder-suggestions');
    return response.data;
  },

  // Create automatic reorder
  createReorderFromSuggestions: async (suggestions: Array<{
    productId?: string;
    variantId?: string;
    supplierId: string;
    quantity: number;
  }>) => {
    const response = await api.post('/inventory/auto-reorder', { suggestions });
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
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: OrderFormData): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  updateOrder: async (id: string, data: Partial<OrderFormData>): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  deleteOrder: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/orders/${id}`);
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
    const response = await api.get('/measurements', { params });
    return response.data;
  },

  getMeasurement: async (id: string): Promise<ApiResponse<Measurement>> => {
    const response = await api.get(`/measurements/${id}`);
    return response.data;
  },

  createMeasurement: async (data: MeasurementFormData): Promise<ApiResponse<Measurement>> => {
    const response = await api.post('/measurements', data);
    return response.data;
  },

  updateMeasurement: async (id: string, data: Partial<MeasurementFormData>): Promise<ApiResponse<Measurement>> => {
    const response = await api.put(`/measurements/${id}`, data);
    return response.data;
  },

  deleteMeasurement: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/measurements/${id}`);
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
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: AppointmentFormData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: Partial<AppointmentFormData>): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSalesAnalytics: async (params?: { period?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/analytics/sales', {
      params,
    });
    return response.data;
  },

  getLeadAnalytics: async (params?: { period?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/analytics/leads', {
      params,
    });
    return response.data;
  },
};

export default api; 