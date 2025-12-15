import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NodeProvider } from './context/NodeContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import NodeLayout from './layouts/NodeLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages - Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Pages - User / Master
import DashboardHome from './pages/DashboardHome';
import PurchaseNode from './pages/PurchaseNode';
import MyNodes from './pages/MyNodes';
import Wallet from './pages/Wallet';
import WalletRequests from './pages/WalletRequests';
import WalletTransactions from './pages/wallet/WalletTransactions';

// Pages - Node
import NodeDashboard from './pages/node/NodeDashboard';
import NodeGenealogy from './pages/node/NodeGenealogy';
import NodeTransactions from './pages/node/NodeTransactions';

// Pages - Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminSettings from './pages/admin/AdminSettings';

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
            <Route path="/wallet/transactions" element={<WalletTransactions />} />
            <Route path="/purchase-node" element={<PurchaseNode />} />
            <Route path="/my-nodes" element={<MyNodes />} />
            <Route path="/wallet/requests" element={<WalletRequests />} />
          </Route>

          {/* Node Routes (Isolated) */}
          <Route path="/node" element={<NodeLayout />}>
            <Route path="dashboard" element={<NodeDashboard />} />
            <Route path="genealogy" element={<NodeGenealogy />} />
            <Route path="transactions" element={<NodeTransactions />} />
            {/* Fix for legacy/broken URLs */}
            <Route path="commissions" element={<Navigate to="/node/transactions" replace />} />
            <Route path="commissions/transactions" element={<Navigate to="/node/transactions" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/portal-secure" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </NodeProvider>
  );
};

export default App;
