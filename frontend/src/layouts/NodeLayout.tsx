import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Network, ArrowLeft, ScrollText } from 'lucide-react';
import { useNode } from '../context/NodeContext';

const NodeLayout: React.FC = () => {
    const navigate = useNavigate();
    const { activeNode, clearActiveNode } = useNode();

    useEffect(() => {
        if (!activeNode) {
            navigate('/my-nodes');
        }
    }, [activeNode, navigate]);

    const handleExit = () => {
        clearActiveNode();
        navigate('/dashboard');
    };

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    if (!activeNode) return null;

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
                glass-panel w-64 flex flex-col fixed left-0 top-0 m-4 h-[calc(100vh-2rem)] z-50 rounded-xl
                transition-transform duration-300 ease-in-out md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Node View</h1>
                        <p className="text-sm font-medium text-foreground mt-1">
                            {activeNode.customName || activeNode.referralCode}
                        </p>
                        {activeNode.customName && (
                            <p className="text-xs text-muted-foreground font-mono">
                                {activeNode.referralCode}
                            </p>
                        )}
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
                <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
                    <Link
                        to="/node/dashboard"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/node/genealogy"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <Network className="w-5 h-5 mr-3" />
                        Genealogy
                    </Link>
                    <Link
                        to="/node/transactions"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center px-4 py-3 text-muted-foreground hover:bg-white/5 hover:text-primary rounded-xl transition-all font-medium"
                    >
                        <ScrollText className="w-5 h-5 mr-3" />
                        Transactions
                    </Link>

                    <div className="pt-8 mt-8 border-t border-border">
                        <button
                            onClick={handleExit}
                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 font-bold tracking-wide group"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Exit to Master
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 w-full">
                {/* Topbar */}
                <header className="glass-panel mx-4 mt-4 rounded-xl shadow-sm h-16 flex items-center justify-between px-4 md:px-8 z-10 sticky top-4">
                    <div className="flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="mr-3 md:hidden text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                            <span className="sr-only">Open Menu</span>
                            {/* Hamburger Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        </button>
                        <h1 className="text-xl font-bold text-foreground md:hidden">Node View</h1>
                    </div>
                    <div className="flex items-center space-x-6 ml-auto">
                        <div className="flex items-center text-muted-foreground bg-background px-4 py-2 rounded-full border border-border">
                            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_8px_rgba(255,56,56,0.5)]"></span>
                            <span className="text-sm font-bold text-foreground tracking-wide hidden sm:inline">
                                ID: {activeNode.id}
                            </span>
                            <span className="text-sm font-bold text-foreground tracking-wide sm:hidden">
                                {activeNode.id}
                            </span>
                        </div>
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

export default NodeLayout;
