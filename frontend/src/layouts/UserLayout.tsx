import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, Wallet, ShoppingCart, Layers, History, PlusCircle } from 'lucide-react';

import { useNode } from '../context/NodeContext';

const UserLayout: React.FC = () => {
    const navigate = useNavigate();
    const { clearActiveNode } = useNode();

    // Ensure active node is cleared when entering Master view
    React.useEffect(() => {
        clearActiveNode();
    }, [clearActiveNode]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        clearActiveNode(); // Clear the active node context and localStorage
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-surface shadow-xl hidden md:block z-10 border-r border-gray-800">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold text-accent-cyan tracking-tight">MLM System</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Master Account</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/my-nodes"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <Layers className="w-5 h-5 mr-3" />
                        My Nodes
                    </Link>
                    <Link
                        to="/wallet"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <Wallet className="w-5 h-5 mr-3" />
                        My Wallet
                    </Link>
                    <Link
                        to="/wallet/add-funds"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        Add Funds
                    </Link>
                    <Link
                        to="/wallet/transactions"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5 mr-3" />
                        Wallet History
                    </Link>
                    <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <User className="w-5 h-5 mr-3" />
                        My Profile
                    </Link>
                    <Link
                        to="/purchase-node"
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        Purchase Node
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="bg-dark-surface shadow-sm h-16 flex items-center justify-between px-8 border-b border-gray-800">
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-accent-cyan">MLM System</h1>
                    </div>
                    <div className="flex items-center space-x-6 ml-auto">
                        <div className="flex items-center text-gray-300 bg-dark-bg px-3 py-1.5 rounded-full border border-gray-700">
                            <User className="w-4 h-4 mr-2 text-accent-teal" />
                            <span className="text-sm font-medium">Master Account</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-400 hover:text-accent-cyan transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
