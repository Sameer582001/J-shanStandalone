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

    if (!activeNode) return null;

    return (
        <div className="min-h-screen bg-dark-bg flex">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-surface shadow-xl hidden md:block z-10 text-white border-r border-gray-800">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white">Node View</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">
                        {activeNode.referralCode}
                    </p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link
                        to="/node/dashboard"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/node/genealogy"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <Network className="w-5 h-5 mr-3" />
                        Genealogy
                    </Link>
                    <Link
                        to="/node/transactions"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-bg hover:text-accent-cyan rounded-xl transition-all font-medium"
                    >
                        <ScrollText className="w-5 h-5 mr-3" />
                        Transactions
                    </Link>

                    <div className="pt-8 mt-8 border-t border-gray-800">
                        <button
                            onClick={handleExit}
                            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all font-medium"
                        >
                            <ArrowLeft className="w-5 h-5 mr-3" />
                            Exit to Master
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="bg-dark-surface shadow-sm h-16 flex items-center justify-between px-8 border-b border-gray-800">
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-white">Node View</h1>
                    </div>
                    <div className="flex items-center space-x-6 ml-auto">
                        <div className="flex items-center text-gray-300 bg-dark-bg px-4 py-2 rounded-full border border-gray-700">
                            <span className="w-2 h-2 rounded-full bg-accent-teal mr-2 animate-pulse shadow-[0_0_8px_rgba(13,115,119,0.5)]"></span>
                            <span className="text-sm font-bold text-accent-cyan tracking-wide">
                                ID: {activeNode.id}
                            </span>
                        </div>
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

export default NodeLayout;
