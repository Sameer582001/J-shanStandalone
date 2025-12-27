import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Megaphone, Image as ImageIcon, Gift, FileText, UserPlus } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    if (!isAuthenticated) {
        return null; // Prevent flash of content before redirect
    }

    return (
        <div className="min-h-screen bg-background flex text-foreground relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                glass-panel w-64 h-[calc(100vh-2rem)] flex flex-col fixed left-0 top-0 m-4 z-50 rounded-xl
                transition-transform duration-300 ease-in-out md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary tracking-tight">Admin Console</h1>
                </div>
                <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto">
                    <Link
                        to="/admin/dashboard"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/users"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </Link>
                    <Link
                        to="/admin/migration"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <UserPlus className="w-5 h-5 mr-3" />
                        Migration Tool
                    </Link>
                    <Link
                        to="/admin/payouts"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <CreditCard className="w-5 h-5 mr-3" />
                        Payouts
                    </Link>
                    <Link
                        to="/admin/fund-requests"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <CreditCard className="w-5 h-5 mr-3" />
                        Fund Requests
                    </Link>
                    <Link
                        to="/admin/fast-track"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Gift className="w-5 h-5 mr-3" />
                        Fast Track
                    </Link>
                    <Link
                        to="/admin/news"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Megaphone className="w-5 h-5 mr-3" />
                        News & Updates
                    </Link>
                    <Link
                        to="/admin/gallery"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <ImageIcon className="w-5 h-5 mr-3" />
                        Awards Gallery
                    </Link>
                    <Link
                        to="/admin/documents"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <FileText className="w-5 h-5 mr-3" />
                        Legal Docs
                    </Link>
                    <Link
                        to="/admin/tickets"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Megaphone className="w-5 h-5 mr-3" />
                        Tickets
                    </Link>
                    <Link
                        to="/admin/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 w-full">
                {/* Topbar */}
                <header className="glass-panel mx-4 mt-4 rounded-xl shadow-sm h-16 flex items-center justify-between px-4 md:px-6 z-10 sticky top-4">
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="mr-3 text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                            <span className="sr-only">Open Menu</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        </button>
                        <h1 className="text-xl font-bold text-primary">Admin</h1>
                    </div>

                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="flex items-center text-muted-foreground">
                            <span className="text-sm font-medium text-primary hidden sm:inline">Administrator</span>
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
                <main className="flex-1 p-4 md:p-6 overflow-auto bg-background w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
