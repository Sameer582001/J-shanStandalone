import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, Wallet, ShoppingCart } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600">MLM System</h1>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/dashboard"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/wallet"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <Wallet className="w-5 h-5 mr-3" />
                        My Wallet
                    </Link>
                    <Link
                        to="/purchase-node"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        Purchase Node
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
                    <div className="md:hidden">
                        {/* Mobile menu button could go here */}
                        <h1 className="text-xl font-bold text-indigo-600">MLM System</h1>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="flex items-center text-gray-700">
                            <User className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">User</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
