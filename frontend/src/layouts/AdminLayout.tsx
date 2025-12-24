import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Megaphone, Image as ImageIcon, Gift, FileText, UserPlus } from 'lucide-react';

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
        <div className="min-h-screen bg-background flex text-foreground">
            {/* Sidebar */}
            <aside className="w-64 glass-panel hidden md:block m-4 rounded-xl h-[calc(100vh-2rem)] flex flex-col fixed left-0 top-0">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600 tracking-tight">Admin Panel</h1>
                </div>
                <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto">
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </Link>
                    <Link
                        to="/admin/migration"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <UserPlus className="w-5 h-5 mr-3" />
                        Migration Tool
                    </Link>
                    <Link
                        to="/admin/payouts"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <CreditCard className="w-5 h-5 mr-3" />
                        Payouts
                    </Link>
                    <Link
                        to="/admin/fund-requests"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <CreditCard className="w-5 h-5 mr-3" />
                        Fund Requests
                    </Link>
                    <Link
                        to="/admin/fast-track"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Gift className="w-5 h-5 mr-3" />
                        Fast Track
                    </Link>
                    <Link
                        to="/admin/news"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Megaphone className="w-5 h-5 mr-3" />
                        News & Updates
                    </Link>
                    <Link
                        to="/admin/gallery"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <ImageIcon className="w-5 h-5 mr-3" />
                        Awards Gallery
                    </Link>
                    <Link
                        to="/admin/documents"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <FileText className="w-5 h-5 mr-3" />
                        Legal Docs
                    </Link>
                    <Link
                        to="/admin/tickets"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Megaphone className="w-5 h-5 mr-3" />
                        Tickets
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
                {/* Topbar */}
                <header className="glass-panel mx-4 mt-4 rounded-xl shadow-sm h-16 flex items-center justify-between px-6 z-10 sticky top-4">
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-primary">Admin</h1>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="flex items-center text-muted-foreground">
                            <span className="text-sm font-medium text-primary">Administrator</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-muted-foreground hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto bg-background">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
