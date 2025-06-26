// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { HelmetProvider } from 'react-helmet-async';

import { CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import EnhancedDashboard from './pages/Dashboard/EnhancedDashboard';
import EnhancedDashboardPage from './pages/Dashboard/EnhancedDashboardPage';
import CustomersPage from './pages/Customers/CustomersPage';
import CustomerDetailPage from './pages/Customers/CustomerDetailPage';
import LeadsPage from './pages/Leads/LeadsPage';
import LeadDetailPage from './pages/Leads/LeadDetailPage';
import OrdersPage from './pages/Orders/OrdersPage';
import OrderDetailPage from './pages/Orders/OrderDetailPage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import MeasurementsPage from './pages/Measurements/MeasurementsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import MobilePage from './pages/Mobile/MobilePage';
import CRMDashboard from './pages/CRM/CRMDashboard';
import TailoringDashboard from './components/Tailoring/TailoringDashboard';
import WeddingDashboard from './components/Weddings/WeddingDashboard';
import WeddingPortal from './components/Weddings/WeddingPortal';
import UnifiedDashboardHub from './components/Dashboard/UnifiedDashboardHub';
import CustomerManagementPage from './pages/CustomerManagement/CustomerManagementPage';
import MarketingHubPage from './pages/Marketing/MarketingHubPage';
import ProductManagementDashboard from './components/Products/ProductManagementDashboard';
import TiesProductPage from './components/Products/TiesProductPage';
import TiesCatalog from './components/Products/TiesCatalog';
import ColorFamilyCollection from './components/Products/ColorFamilyCollection';
import WeddingBundleBuilder from './components/Products/WeddingBundleBuilder';
import EventRecommendations from './components/Products/EventRecommendations';

// Import configured query client
import { queryClient } from './utils/queryClient';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <HelmetProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <div className="App">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Wedding Portal - Public route */}
                    <Route path="/wedding-portal" element={<WeddingPortal />} />
                    <Route path="/wedding-portal/:code" element={<WeddingPortal />} />
                    
                    {/* Mobile route - outside of the main layout */}
                    <Route path="/mobile" element={<ProtectedRoute><MobilePage /></ProtectedRoute>} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/dashboard-hub" replace />} />
                      <Route path="dashboard-hub" element={<UnifiedDashboardHub />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
                      <Route path="modern-dashboard" element={<EnhancedDashboardPage />} />
                      
                      {/* Customer Management routes */}
                      <Route path="customer-management" element={<CustomerManagementPage />} />
                      
                      {/* Customer routes */}
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="customers/:id" element={<CustomerDetailPage />} />
                      
                      {/* Lead routes */}
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="leads/:id" element={<LeadDetailPage />} />
                      
                      {/* Order routes */}
                      <Route path="orders" element={<OrdersPage />} />
                      <Route path="orders/:id" element={<OrderDetailPage />} />
                      
                      {/* Product routes */}
                      <Route path="products/*" element={<ProductsPage />} />
                      <Route path="ties" element={<TiesCatalog />} />
                      <Route path="ties/:slug" element={<TiesProductPage />} />
                      <Route path="collections/:family" element={<ColorFamilyCollection />} />
                      <Route path="wedding-bundle" element={<WeddingBundleBuilder />} />
                      <Route path="event-recommendations" element={<EventRecommendations />} />
                      <Route path="inventory" element={<ProductManagementDashboard />} />
                      
                      {/* Measurement routes */}
                      <Route path="measurements" element={<MeasurementsPage />} />
                      
                      {/* Appointment routes */}
                      <Route path="appointments" element={<AppointmentsPage />} />
                      
                      {/* Analytics routes */}
                      <Route path="analytics" element={<AnalyticsPage />} />
                      
                      {/* Marketing routes */}
                      <Route path="marketing" element={<MarketingHubPage />} />
                      
                      {/* CRM routes */}
                      <Route path="crm" element={<CRMDashboard />} />
                      
                      {/* Tailoring routes */}
                      <Route path="tailoring" element={<TailoringDashboard />} />
                      
                      {/* Wedding routes */}
                      <Route path="weddings" element={<WeddingDashboard />} />
                      
                      {/* Profile routes */}
                      <Route path="profile" element={<ProfilePage />} />
                    </Route>
                    
                    {/* 404 fallback */}
                    <Route path="*" element={<Navigate to="/dashboard-hub" replace />} />
                  </Routes>
                </div>
              </Router>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4caf50',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#f44336',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              </HelmetProvider>
            </AuthProvider>
          </LocalizationProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 