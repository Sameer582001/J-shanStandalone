import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NodeProvider } from './context/NodeContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import NodeLayout from './layouts/NodeLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages - Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Pages - Landing
import LandingPage from './pages/LandingPage';

// Pages - User / Master
import DashboardHome from './pages/DashboardHome';
import PurchaseNode from './pages/PurchaseNode';
import MyNodes from './pages/MyNodes';
import Wallet from './pages/Wallet';
import WalletRequests from './pages/WalletRequests';
import WalletTransactions from './pages/wallet/WalletTransactions';
import Profile from './pages/Profile';
import UserTickets from './pages/tickets/UserTickets';

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
import AddFunds from './pages/AddFunds';
import AdminFundRequests from './pages/admin/AdminFundRequests';
import AdminFastTrack from './pages/admin/AdminFastTrack';
import AdminNews from './pages/admin/AdminNews';
import AdminTickets from './pages/admin/AdminTickets';
import AdminGallery from './pages/admin/AdminGallery';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminMigration from './pages/admin/AdminMigration';



const App: React.FC = () => {
  return (
    <NodeProvider>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <BrowserRouter>
        <Routes>
          {/* Landing Page (Root) */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes (Auth) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="fund-requests" element={<AdminFundRequests />} />
            <Route path="fast-track" element={<AdminFastTrack />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="migration" element={<AdminMigration />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* User Routes (Master Account) */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/wallet/add-funds" element={<AddFunds />} />
            <Route path="/wallet/transactions" element={<WalletTransactions />} />
            <Route path="/purchase-node" element={<PurchaseNode />} />
            <Route path="/my-nodes" element={<MyNodes />} />
            <Route path="/wallet/requests" element={<WalletRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<UserTickets />} />
          </Route>

          {/* Default Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </NodeProvider>
  );
};

export default App;
