import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Default query options
const defaultOptions: DefaultOptions = {
  queries: {
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache time - how long data stays in cache after component unmounts
    cacheTime: 10 * 60 * 1000, // 10 minutes
    
    // Don't refetch on window focus in development
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Error handling
    onError: (error: any) => {
      // Global error handling for queries
      const message = error?.response?.data?.error || error?.message || 'An error occurred';
      
      // Don't show toast for certain errors
      const silentErrors = [401, 403]; // Unauthorized, Forbidden
      if (!silentErrors.includes(error?.response?.status)) {
        toast.error(message);
      }
      
      console.error('Query error:', error);
    },
  },
  
  mutations: {
    // Error handling for mutations
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || 'An error occurred';
      toast.error(message);
      console.error('Mutation error:', error);
    },
  },
};

// Create query client
export const queryClient = new QueryClient({
  defaultOptions,
});

// Query key factory for consistent key management
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  profile: () => [...queryKeys.auth, 'profile'] as const,
  
  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardStats: () => [...queryKeys.dashboard, 'stats'] as const,
  dashboardActivities: () => [...queryKeys.dashboard, 'activities'] as const,
  
  // Customers
  customers: ['customers'] as const,
  customersList: (params: any) => [...queryKeys.customers, 'list', params] as const,
  customersDetail: (id: number) => [...queryKeys.customers, 'detail', id] as const,
  
  // Leads
  leads: ['leads'] as const,
  leadsList: (params: any) => [...queryKeys.leads, 'list', params] as const,
  leadsDetail: (id: number) => [...queryKeys.leads, 'detail', id] as const,
  
  // Orders
  orders: ['orders'] as const,
  ordersList: (params: any) => [...queryKeys.orders, 'list', params] as const,
  ordersDetail: (id: string) => [...queryKeys.orders, 'detail', id] as const,
  
  // Products
  products: ['products'] as const,
  productsList: (params: any) => [...queryKeys.products, 'list', params] as const,
  productsDetail: (id: number) => [...queryKeys.products, 'detail', id] as const,
  
  // Measurements
  measurements: ['measurements'] as const,
  measurementsList: (params: any) => [...queryKeys.measurements, 'list', params] as const,
  measurementsDetail: (id: number) => [...queryKeys.measurements, 'detail', id] as const,
  
  // Appointments
  appointments: ['appointments'] as const,
  appointmentsList: (params: any) => [...queryKeys.appointments, 'list', params] as const,
  appointmentsDetail: (id: number) => [...queryKeys.appointments, 'detail', id] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  salesAnalytics: (params: any) => [...queryKeys.analytics, 'sales', params] as const,
  leadsAnalytics: (params: any) => [...queryKeys.analytics, 'leads', params] as const,
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity
  invalidateEntity: (entity: keyof typeof queryKeys) => {
    const queryKey = queryKeys[entity];
    if (Array.isArray(queryKey)) {
      queryClient.invalidateQueries({ queryKey });
    }
  },
  
  // Clear all cache
  clearCache: () => {
    queryClient.clear();
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Prefetch data
  prefetch: async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
    });
  },
};

export default queryClient; 