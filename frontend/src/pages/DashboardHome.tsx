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
    const [loading, setLoading] = useState(false);

    // Fetch Node Specific Stats
    const fetchNodeStats = useCallback(async () => {
        if (!activeNode) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/nodes/${activeNode.id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (error) {
            console.error(error);
        }
    }, [activeNode]);

    // Fetch Master Account Stats (Global)
    const fetchMasterStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, txRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/wallet/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/api/wallet/transactions?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setMasterStats(statsData);
            }
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData);
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {activeNode ? `Node Dashboard: ${activeNode.referralCode}` : 'Master Dashboard'}
                        <button
                            onClick={handleManualRefresh}
                            className={`p-1.5 rounded-full hover:bg-gray-200 transition ${loading ? 'animate-spin' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className="text-gray-600" />
                        </button>
                    </h2>
                    {activeNode && <span className="text-sm text-gray-500">Viewing performance for specific node</span>}
                </div>

                {activeNode ? (
                    <button
                        onClick={clearActiveNode}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                    >
                        Exit Node View
                    </button>
                ) : (
                    <Link
                        to="/purchase-node"
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition shadow-sm"
                    >
                        Purchase New Node
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Wallet / Earnings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {activeNode ? 'Node Wallet Balance' : 'Master Wallet Balance'}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                        ₹{activeNode
                            ? (stats?.walletBalance || '0.00')
                            : (masterStats?.walletBalance || '0.00')}
                    </p>
                    {!activeNode && (
                        <p className="text-sm text-gray-500 mt-1">Total Earnings: ₹{masterStats?.totalEarnings || '0.00'}</p>
                    )}
                </div>

                {/* Card 2: Self Pool / Directs */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {activeNode ? 'Self Pool Team' : 'Total Direct Referrals'}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">
                        {activeNode
                            ? (stats?.selfPoolTeam || '0')
                            : (masterStats?.directReferrals || '0')}
                    </p>
                </div>

                {/* Card 3: Auto Pool / Total Nodes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {activeNode ? 'Auto Pool Team' : 'Total Nodes Owned'}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">
                        {activeNode
                            ? (stats?.autoPoolTeam || '0')
                            : (masterStats?.totalNodesOwned || '0')}
                    </p>
                </div>
            </div>

            {!activeNode && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Manage Your Nodes</h3>
                        <p className="text-gray-500">View performance details and login to specific nodes.</p>
                    </div>
                    <Link
                        to="/my-nodes"
                        className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm"
                    >
                        Go to My Nodes
                    </Link>
                </div>
            )}

            {/* Recent Activity / Transactions */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                {loading && !transactions.length ? (
                    <p className="text-gray-500">Loading activity...</p>
                ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-semibold text-gray-800">{tx.description}</p>
                                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No recent activity found.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardHome;
