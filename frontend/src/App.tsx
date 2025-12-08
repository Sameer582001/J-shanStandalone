import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardHome from './pages/DashboardHome';
import Wallet from './pages/Wallet';
import PurchaseNode from './pages/PurchaseNode';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './layouts/AdminLayout';
import { NodeProvider } from './context/NodeContext';
import MyNodes from './pages/MyNodes';

const App: React.FC = () => {
  return (
    <NodeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Auth) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes (Dashboard) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/purchase-node" element={<PurchaseNode />} />
            <Route path="/my-nodes" element={<MyNodes />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/portal-secure" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </NodeProvider>
  );
};

export default App;
