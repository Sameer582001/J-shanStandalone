import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import NodeLayout from './layouts/NodeLayout';
import NodeDashboard from './pages/node/NodeDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardHome from './pages/DashboardHome';
import Wallet from './pages/Wallet';
import PurchaseNode from './pages/PurchaseNode';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLayout from './layouts/AdminLayout';
import { NodeProvider } from './context/NodeContext';
import MyNodes from './pages/MyNodes';
import WalletRequests from './pages/WalletRequests';
import AdminPayouts from './pages/admin/AdminPayouts';

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


          {/* User Routes (Master Account) */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/purchase-node" element={<PurchaseNode />} />
            <Route path="/my-nodes" element={<MyNodes />} />
            <Route path="/wallet/requests" element={<WalletRequests />} />
          </Route>

          {/* Node Routes (Isolated) */}
          <Route path="/node" element={<NodeLayout />}>
            <Route path="dashboard" element={<NodeDashboard />} />
            {/* Genealogy and Commissions placeholders can route to dashboard for now */}
            <Route path="genealogy" element={<NodeDashboard />} />
            <Route path="commissions" element={<NodeDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/portal-secure" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payouts" element={<AdminPayouts />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </NodeProvider>
  );
};

export default App;
