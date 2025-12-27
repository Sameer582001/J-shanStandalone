import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, Wallet, ShoppingCart, Layers, History, PlusCircle } from 'lucide-react';

import { useNode } from '../context/NodeContext';
import api from '../api/axios';

const UserLayout: React.FC = () => {
    const navigate = useNavigate();
    const { clearActiveNode } = useNode();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // Ensure active node is cleared when entering Master view
    React.useEffect(() => {
        clearActiveNode();
    }, [clearActiveNode]);

    const [userName, setUserName] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/profile');
                setUserName(res.data.full_name);
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        clearActiveNode(); // Clear the active node context and localStorage
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary tracking-tight">JSE System</h1>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Master Account</p>
                    </div>
                </div>
                <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
                    <Link
                        to="/dashboard"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/my-nodes"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Layers className="w-5 h-5 mr-3" />
                        My Nodes
                    </Link>
                    <Link
                        to="/wallet"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Wallet className="w-5 h-5 mr-3" />
                        My Wallet
                    </Link>
                    <Link
                        to="/wallet/add-funds"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        Add Funds
                    </Link>
                    <Link
                        to="/wallet/transactions"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5 mr-3" />
                        Wallet History
                    </Link>
                    <Link
                        to="/profile"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <User className="w-5 h-5 mr-3" />
                        My Profile
                    </Link>
                    <Link
                        to="/purchase-node"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        Purchase Node
                    </Link>
                    <Link
                        to="/support"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5 mr-3" />
                        Support
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 w-full">
                {/* Topbar */}
                <header className="glass-panel mx-4 mt-4 rounded-xl shadow-sm h-16 flex items-center justify-between px-4 md:px-8 z-10 sticky top-4">
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="mr-3 text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                            <span className="sr-only">Open Menu</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        </button>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary">JSE System</h1>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-6 ml-auto">
                        <div className="flex items-center text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border">
                            <User className="w-4 h-4 mr-2 text-primary" />
                            <span className="text-sm font-medium hidden sm:inline">{userName || 'Master Account'}</span>
                            <span className="text-sm font-medium sm:hidden">{userName?.split(' ')[0] || 'Account'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto bg-background w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
