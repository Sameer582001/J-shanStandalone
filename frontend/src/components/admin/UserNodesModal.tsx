import React, { useEffect, useState } from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

interface Node {
    id: number;
    referral_code: string;
    status: string;
    wallet_balance: string;
    direct_referrals_count: number;
    created_at: string;
    is_rebirth: boolean;
    origin_node_id: number | null;
    custom_name?: string;
}

interface UserNodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
    userName: string;
}

export const UserNodesModal: React.FC<UserNodesModalProps> = ({ isOpen, onClose, userId, userName }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchNodes();
        } else {
            setNodes([]);
        }
    }, [isOpen, userId]);

    const fetchNodes = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await api.get(`/admin/users/${userId}/nodes`);
            setNodes(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load user nodes');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                            <Layers className="w-5 h-5 text-secondary" />
                            User Nodes
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Viewing nodes for <span className="text-primary font-medium">{userName}</span> (ID: {userId})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></span>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                            <AlertCircle className="w-10 h-10 opacity-20" />
                            <p>No nodes found for this user.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {nodes.map((node) => (
                                    <div
                                        key={node.id}
                                        className={`p-4 rounded-lg border ${node.is_rebirth ? 'bg-purple-900/10 border-purple-500/30' : 'bg-background border-border'} relative group hover:border-secondary/50 transition-all`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${node.is_rebirth ? 'bg-purple-900/50 text-purple-300' : 'bg-primary/20 text-primary'}`}>
                                                    {node.is_rebirth ? 'REBIRTH' : 'ORIGIN'}
                                                </span>
                                                <h3 className="text-lg font-mono font-bold text-card-foreground mt-1">
                                                    {node.custom_name ? (
                                                        <span>
                                                            {node.custom_name}
                                                            <span className="block text-xs font-normal text-muted-foreground">{node.referral_code}</span>
                                                        </span>
                                                    ) : (
                                                        node.referral_code
                                                    )}
                                                </h3>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${node.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} title={node.status}></div>
                                        </div>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Node ID:</span>
                                                <span className="text-foreground">{node.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Wallet Balance:</span>
                                                <span className="text-green-500 font-medium">₹{node.wallet_balance}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Direct Referrals:</span>
                                                <span className="text-foreground">{node.direct_referrals_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Created:</span>
                                                <span className="text-muted-foreground/80 text-xs">{new Date(node.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {node.is_rebirth && node.origin_node_id && (
                                                <div className="flex justify-between pt-1 border-t border-border mt-1">
                                                    <span className="text-purple-400 text-xs">Origin ID:</span>
                                                    <span className="text-purple-300 text-xs">{node.origin_node_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
