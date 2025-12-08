import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNode } from '../context/NodeContext';
import { usePolling } from '../hooks/usePolling';

interface Node {
    id: number;
    referral_code: string;
    status: 'ACTIVE' | 'INACTIVE';
    wallet_balance: string;
    created_at: string;
}

const MyNodes: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const { switchNode, activeNode } = useNode();
    const navigate = useNavigate();

    const fetchNodes = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/nodes/my-nodes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setNodes(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchNodes().finally(() => setLoading(false));
    }, [fetchNodes]);

    // Poll every 5 seconds
    usePolling(fetchNodes, 5000);

    const handleLoginAsNode = (node: Node) => {
        switchNode({
            id: node.id,
            referralCode: node.referral_code,
            status: node.status,
            walletBalance: node.wallet_balance
        });
        navigate('/dashboard');
    };

    if (loading) return <div className="p-6">Loading nodes...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Nodes</h1>

            {activeNode && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm text-green-800">Currently Managed Node</p>
                        <p className="font-bold text-lg">{activeNode.referralCode}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nodes.map(node => (
                    <div key={node.id} className="bg-white p-6 rounded-lg shadow border border-gray-100 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{node.referral_code}</h3>
                                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${node.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {node.status}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Wallet</p>
                                <p className="font-bold">₹{node.wallet_balance}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleLoginAsNode(node)}
                            className={`w-full py-2 rounded font-semibold transition-colors ${activeNode?.id === node.id
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                }`}
                            disabled={activeNode?.id === node.id}
                        >
                            {activeNode?.id === node.id ? 'Currently Active' : 'Login using this Node'}
                        </button>
                    </div>
                ))}

                {nodes.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">You haven't purchased any nodes yet.</p>
                        <button
                            onClick={() => navigate('/purchase-node')}
                            className="text-indigo-600 font-semibold hover:underline"
                        >
                            Purchase your first node
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyNodes;
