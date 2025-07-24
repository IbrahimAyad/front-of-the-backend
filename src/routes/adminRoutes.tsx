import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EnhancedAdminDashboard from '../pages/admin/EnhancedAdminDashboard';
import ProductDataTable from '../components/Admin/ProductDataTable';
import ProductBuilderPage from '../pages/admin/ProductBuilderPage';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<EnhancedAdminDashboard />}>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<ProductDataTable products={[]} onEdit={() => {}} onDelete={() => {}} onBulkAction={() => {}} onRefresh={() => {}} />} />
        <Route path="outfit-builder" element={<ProductBuilderPage />} />
        <Route path="dashboard" element={<div>Dashboard Overview</div>} />
        <Route path="orders" element={<div>Orders Management</div>} />
        <Route path="customers" element={<div>Customer Management</div>} />
        <Route path="analytics" element={<div>Analytics Dashboard</div>} />
        <Route path="settings" element={<div>Store Settings</div>} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;