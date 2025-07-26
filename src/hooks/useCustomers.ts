import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '../services/api';
import { CustomerFormData } from '../types';
import toast from 'react-hot-toast';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: any) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Get customers with pagination and search
export const useCustomers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerAPI.getCustomersPublic(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

// Get single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerAPI.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerFormData) => customerAPI.createCustomer(data),
    onSuccess: (response) => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      if (response.success) {
        toast.success('Customer created successfully!');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create customer';
      toast.error(message);
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) =>
      customerAPI.updateCustomer(id, data),
    onSuccess: (response, { id }) => {
      // Invalidate specific customer and lists
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      if (response.success) {
        toast.success('Customer updated successfully!');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update customer';
      toast.error(message);
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerAPI.deleteCustomer(id),
    onSuccess: (response) => {
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      
      if (response.success) {
        toast.success('Customer deleted successfully!');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete customer';
      toast.error(message);
    },
  });
}; 