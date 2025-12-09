import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Users, Settings, CreditCard } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'ADMIN') {
            navigate('/login'); // Redirect to public login to hide secret route
        } else {
            setIsAuthenticated(true);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login'); // Redirect to public login
    };

    if (!isAuthenticated) {
        return null; // Prevent flash of content before redirect
    }

    return (
        <div className="min-h-screen bg-gray-900 flex text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 shadow-md hidden md:block border-r border-gray-700">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-400">Admin Panel</h1>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </Link>
                    <Link
                        to="/admin/payouts"
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <CreditCard className="w-5 h-5 mr-3" />
                        Payouts
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-700">
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-indigo-400">Admin</h1>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="flex items-center text-gray-300">
                            <span className="text-sm font-medium">Administrator</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-500 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
