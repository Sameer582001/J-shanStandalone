import React, { useEffect, useState, useCallback } from 'react';
import { useNode } from '../context/NodeContext';
import { Link } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { RefreshCw } from 'lucide-react';

const DashboardHome: React.FC = () => {
    const { activeNode, clearActiveNode } = useNode();
    const [stats, setStats] = useState<any>(null);
    const [masterStats, setMasterStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [newsList, setNewsList] = useState<any[]>([]);
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);

    // News Rotation Logic
    useEffect(() => {
        if (!newsList || newsList.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentNewsIndex(prev => {
                const next = (prev + 1) % newsList.length;
                if (next === 0) setCycleCount(c => c + 1);
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [newsList]);
    const [loading, setLoading] = useState(false);

    // Fetch Node Specific Stats
    const fetchNodeStats = useCallback(async () => {
        if (!activeNode) return;
        try {
            const token = localStorage.getItem('token');
            const [statsRes, txRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/nodes/${activeNode.id}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/api/nodes/${activeNode.id}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData);
            }
        } catch (error) {
            console.error(error);
        }
    }, [activeNode]);

    // Fetch Master Account Stats (Global)
    const fetchMasterStats = useCallback(async () => {
        try {
            const tokens = localStorage.getItem('token');
            const [statsRes, txRes, newsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/wallet/stats`, { headers: { 'Authorization': `Bearer ${tokens}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/api/wallet/transactions?limit=5`, { headers: { 'Authorization': `Bearer ${tokens}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/api/news/active`, { headers: { 'Authorization': `Bearer ${tokens}` } })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setMasterStats(statsData);
            }
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData);
            }
            if (newsRes.ok) {
                const newsData = await newsRes.json();
                setNewsList(Array.isArray(newsData) ? newsData : []);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);



    // Initial Load & activeNode change
    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            if (activeNode) {
                await fetchNodeStats();
            } else {
                await fetchMasterStats();
            }
            setLoading(false);
        };
        fetchData();
    }, [activeNode, fetchNodeStats, fetchMasterStats]);

    // Polling (Every 5s)
    usePolling(() => {
        if (activeNode) {
            fetchNodeStats();
        } else {
            fetchMasterStats();
        }
    }, 5000);

    const handleManualRefresh = async () => {
        setLoading(true);
        if (activeNode) await fetchNodeStats();
        else await fetchMasterStats();
        setLoading(false);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                        {activeNode ? `Node Dashboard: ${activeNode.referralCode}` : 'Master Dashboard'}
                        <button
                            onClick={handleManualRefresh}
                            className={`p-1.5 rounded-full hover:bg-card transition ${loading ? 'animate-spin' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className="text-primary" />
                        </button>
                    </h2>
                    {activeNode && <span className="text-sm text-muted-foreground">Viewing performance for specific node</span>}
                </div>

                {activeNode ? (
                    <button
                        onClick={clearActiveNode}
                        className="w-full md:w-auto bg-card text-muted-foreground border border-border px-4 py-2 rounded hover:bg-muted transition"
                    >
                        Exit Node View
                    </button>
                ) : (
                    <Link
                        to="/purchase-node"
                        className="w-full md:w-auto text-center bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition shadow-sm border border-transparent"
                    >
                        Purchase New Node
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Wallet / Earnings */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                        <div className="w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                    </div>
                    <h3 className="text-lg font-medium text-card-foreground">
                        {activeNode ? 'Node Wallet Balance' : 'Master Wallet Balance'}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-primary tracking-tight">
                        ₹{activeNode
                            ? (stats?.walletBalance || '0.00')
                            : (masterStats?.walletBalance || '0.00')}
                    </p>
                    {!activeNode && (
                        <p className="text-sm text-muted-foreground mt-1">Total Earnings: ₹{masterStats?.totalEarnings || '0.00'}</p>
                    )}
                </div>

                {/* Card 2: Self Pool / Directs / News */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                        <div className="w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
                    </div>
                    {activeNode ? (
                        <>
                            <h3 className="text-lg font-medium text-card-foreground">Self Pool Team</h3>
                            <p className="mt-2 text-3xl font-bold text-indigo-400 tracking-tight">
                                {stats?.selfPoolTeam || '0'}
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-medium text-card-foreground flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    {newsList[currentNewsIndex] ? (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                    ) : null}
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${newsList[currentNewsIndex] ? 'bg-secondary' : 'bg-gray-500'}`}></span>
                                </span>
                                Latest Updates
                            </h3>
                            <div className="mt-4 flex-1 flex flex-col justify-center min-h-[100px]">
                                {newsList[currentNewsIndex] ? (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500" key={`${newsList[currentNewsIndex].id}-${cycleCount}`}>
                                        <div className="bg-gradient-to-br from-secondary/5 to-white border border-secondary/10 rounded-lg p-3 shadow-sm relative overflow-hidden">
                                            {/* Decorative element */}
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl -mr-4 -mt-4 pointer-events-none"></div>

                                            <h4 className="text-secondary font-bold text-sm mb-1 line-clamp-1" title={newsList[currentNewsIndex].title}>
                                                {newsList[currentNewsIndex].title}
                                            </h4>

                                            <div className="relative overflow-hidden h-12 flex items-center">
                                                <p className="text-indigo-900/80 font-medium text-base leading-snug line-clamp-2">
                                                    {newsList[currentNewsIndex].content}
                                                </p>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70">
                                                <span>{new Date(newsList[currentNewsIndex].created_at).toLocaleDateString()}</span>
                                                {newsList.length > 1 && (
                                                    <span className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-medium">
                                                        {currentNewsIndex + 1} / {newsList.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 opacity-50">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <RefreshCw size={16} />
                                        </div>
                                        <p className="text-sm font-medium">No active announcements</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Card 3: Auto Pool / Total Nodes */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                        <div className="w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
                    </div>
                    <h3 className="text-lg font-medium text-card-foreground">
                        {activeNode ? 'Auto Pool Team' : 'Total Nodes Owned'}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-purple-400 tracking-tight">
                        {activeNode
                            ? (stats?.autoPoolTeam || '0')
                            : (masterStats?.totalNodesOwned || '0')}
                    </p>
                </div>
            </div>

            {
                !activeNode && (
                    <div className="mt-8 glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-card-foreground mb-1">Manage Your Nodes</h3>
                            <p className="text-muted-foreground">View performance details and login to specific nodes.</p>
                        </div>
                        <Link
                            to="/my-nodes"
                            className="mt-4 md:mt-0 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                        >
                            Go to My Nodes
                        </Link>
                    </div>
                )
            }

            {/* Recent Activity / Transactions */}
            <div className="mt-8 glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-card-foreground">Recent Activity</h3>
                    <Link to="/wallet/transactions" className="text-sm text-secondary hover:text-secondary/80">
                        View All
                    </Link>
                </div>
                {loading && !transactions.length ? (
                    <p className="text-muted-foreground">Loading activity...</p>
                ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                                <div className="min-w-0 flex-1 mr-2">
                                    <p className="font-semibold text-foreground truncate">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold whitespace-nowrap ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No recent activity found.</p>
                )}
            </div>
        </div >
    );
};

export default DashboardHome;
