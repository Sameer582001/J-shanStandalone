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
    direct_referrals_count: number;
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
            walletBalance: node.wallet_balance,
            direct_referrals_count: node.direct_referrals_count
        });
        navigate('/node/dashboard');
    };

    if (loading) return <div className="p-6">Loading nodes...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">My Nodes</h1>

            {activeNode && (
                <div className="mb-8 p-4 bg-card border border-primary rounded-lg flex justify-between items-center shadow-md shadow-primary/10">
                    <div>
                        <p className="text-sm text-primary font-medium">Currently Managed Node</p>
                        <p className="font-bold text-lg text-card-foreground">{activeNode.referralCode}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nodes.map(node => (
                    <div key={node.id} className="bg-card p-6 rounded-lg shadow-sm border border-border relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-card-foreground">{node.referral_code}</h3>
                                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${node.status === 'ACTIVE' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
                                    }`}>
                                    {node.status}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Wallet</p>
                                <p className="font-bold text-secondary">₹{node.wallet_balance}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleLoginAsNode(node)}
                            className={`w-full py-2 rounded font-semibold transition-colors ${activeNode?.id === node.id
                                ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                                }`}
                            disabled={activeNode?.id === node.id}
                        >
                            {activeNode?.id === node.id ? 'Currently Active' : 'Login using this Node'}
                        </button>
                    </div>
                ))}

                {nodes.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-card rounded border border-dashed border-border">
                        <p className="text-muted-foreground mb-4">You haven't purchased any nodes yet.</p>
                        <button
                            onClick={() => navigate('/purchase-node')}
                            className="text-primary font-semibold hover:underline"
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
