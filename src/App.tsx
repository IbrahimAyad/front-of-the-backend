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
// import WeddingPortal from './components/Weddings/WeddingPortal';

import CustomerManagementPage from './pages/CustomerManagement/CustomerManagementPage';
import MarketingHubPage from './pages/Marketing/MarketingHubPage';
import ProductManagementDashboard from './components/Products/ProductManagementDashboard';
import TiesCatalog from './components/Products/TiesCatalog';
import TiesProductPage from './components/Products/TiesProductPage';
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
          <AuthProvider>
            <HelmetProvider>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Router>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/mobile" element={<MobilePage />} />
                    
                    {/* Wedding Portal - Public route */}
                    {/* <Route path="/wedding-portal" element={<WeddingPortal />} />
                    <Route path="/wedding-portal/:code" element={<WeddingPortal />} /> */}
                    
                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      
                      {/* Customer Management */}
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="customers/:id" element={<CustomerDetailPage />} />
                      <Route path="customer-management" element={<CustomerManagementPage />} />
                      
                      {/* Leads */}
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="leads/:id" element={<LeadDetailPage />} />
                      
                      {/* Orders */}
                      <Route path="orders" element={<OrdersPage />} />
                      <Route path="orders/:id" element={<OrderDetailPage />} />
                      
                      {/* Products */}
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="products/:id" element={<ProductDetailPage />} />
                      
                      {/* Ties Catalog */}
                      <Route path="ties" element={<TiesCatalog />} />
                      <Route path="ties/:slug" element={<TiesProductPage />} />
                      <Route path="collections/:family" element={<ColorFamilyCollection />} />
                      <Route path="wedding-bundle" element={<WeddingBundleBuilder />} />
                      <Route path="event-recommendations" element={<EventRecommendations />} />
                      <Route path="inventory" element={<ProductManagementDashboard />} />
                      
                      {/* Measurements */}
                      <Route path="measurements" element={<MeasurementsPage />} />
                      
                      {/* Appointments */}
                      <Route path="appointments" element={<AppointmentsPage />} />
                      
                      {/* Analytics */}
                      <Route path="analytics" element={<AnalyticsPage />} />
                      
                      {/* Profile */}
                      <Route path="profile" element={<ProfilePage />} />
                      
                      {/* CRM */}
                      <Route path="crm" element={<CRMDashboard />} />
                      
                      {/* Marketing */}
                      <Route path="marketing" element={<MarketingHubPage />} />
                      
                      {/* Tailoring */}
                      <Route path="tailoring" element={<TailoringDashboard />} />
                      
                      {/* Wedding routes */}
                      <Route path="weddings" element={<WeddingDashboard />} />
                    </Route>
                  </Routes>
                </Router>
              </LocalizationProvider>
            </HelmetProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 