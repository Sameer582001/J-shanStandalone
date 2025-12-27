import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNode } from '../context/NodeContext';
import { usePolling } from '../hooks/usePolling';
import { Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Node {
    id: number;
    referral_code: string;
    status: 'ACTIVE' | 'INACTIVE';
    wallet_balance: string;
    created_at: string;
    direct_referrals_count: number;
    custom_name?: string;
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

    const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const startEditing = (node: Node) => {
        setEditingNodeId(node.id);
        setEditName(node.custom_name || '');
    };

    const saveNodeName = async (nodeId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/nodes/${nodeId}/name`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editName })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Node name updated');
                setEditingNodeId(null);
                fetchNodes(); // Refresh
                if (activeNode?.id === nodeId) {
                    // Update active node context if needed (requires context update logic)
                    // Currently we only update list.
                }
            } else {
                toast.error(data.message || 'Failed to update name');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating name');
        }
    };

    const handleLoginAsNode = (node: Node) => {
        switchNode({
            id: node.id,
            referralCode: node.referral_code,
            status: node.status,
            walletBalance: node.wallet_balance,
            direct_referrals_count: node.direct_referrals_count,
            customName: node.custom_name // Pass new field
        });
        navigate('/node/dashboard');
    };

    if (loading) return <div className="p-6">Loading nodes...</div>;

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">My Nodes</h1>

            {activeNode && (
                <div className="mb-8 p-4 bg-card border border-primary rounded-lg flex justify-between items-center shadow-md shadow-primary/10">
                    <div>
                        <p className="text-sm text-primary font-medium">Currently Managed Node</p>
                        <p className="font-bold text-lg text-card-foreground">
                            {activeNode.customName ? (
                                <span>{activeNode.customName} <span className="text-sm font-normal text-muted-foreground">({activeNode.referralCode})</span></span>
                            ) : (
                                activeNode.referralCode
                            )}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nodes.map(node => (
                    <div key={node.id} className="glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                {editingNodeId === node.id ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:border-primary text-foreground"
                                            placeholder="Enter name"
                                            autoFocus
                                            maxLength={50}
                                        />
                                        <button
                                            onClick={() => saveNodeName(node.id)}
                                            className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingNodeId(null)}
                                            className="p-1 bg-muted text-muted-foreground rounded hover:bg-muted/80"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        {node.custom_name && <span className="text-sm font-semibold text-secondary block">{node.custom_name}</span>}
                                        <button
                                            onClick={() => startEditing(node)}
                                            className="text-muted-foreground hover:text-primary transition-colors"
                                            title="Edit Name"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1 tracking-wide ${node.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
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
                            className={`w-full py-2.5 rounded-lg font-bold transition-all duration-300 ${activeNode?.id === node.id
                                ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                : 'btn-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
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
