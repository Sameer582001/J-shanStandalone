import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, Wallet, ShoppingCart, Layers, History, PlusCircle } from 'lucide-react';

import { useNode } from '../context/NodeContext';
import api from '../api/axios';

const UserLayout: React.FC = () => {
    const navigate = useNavigate();
    const { clearActiveNode } = useNode();

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

    return (
        <div className="min-h-screen bg-background flex text-foreground">
            {/* Sidebar */}
            <aside className="w-64 glass-panel hidden md:block z-20 m-4 rounded-xl h-[calc(100vh-2rem)] flex flex-col fixed left-0 top-0">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 tracking-tight">JSE System</h1>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Master Account</p>
                </div>
                <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
                    <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/my-nodes"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Layers className="w-5 h-5 mr-3" />
                        My Nodes
                    </Link>
                    <Link
                        to="/wallet"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Wallet className="w-5 h-5 mr-3" />
                        My Wallet
                    </Link>
                    <Link
                        to="/wallet/add-funds"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        Add Funds
                    </Link>
                    <Link
                        to="/wallet/transactions"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5 mr-3" />
                        Wallet History
                    </Link>
                    <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <User className="w-5 h-5 mr-3" />
                        My Profile
                    </Link>
                    <Link
                        to="/purchase-node"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        Purchase Node
                    </Link>
                    <Link
                        to="/support"
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5 mr-3" />
                        Support
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
                {/* Topbar */}
                <header className="glass-panel mx-4 mt-4 rounded-xl shadow-sm h-16 flex items-center justify-between px-8 z-10 sticky top-4">
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">JSE System</h1>
                    </div>
                    <div className="flex items-center space-x-6 ml-auto">
                        <div className="flex items-center text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border">
                            <User className="w-4 h-4 mr-2 text-primary" />
                            <span className="text-sm font-medium">{userName || 'Master Account'}</span>
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
                <main className="flex-1 p-8 overflow-auto bg-background">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
