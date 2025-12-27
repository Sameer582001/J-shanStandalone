import React, { useState } from 'react';
import { X, Search, ArrowRight, CheckCircle, AlertOctagon } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

interface TransferNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TransferNodeModal: React.FC<TransferNodeModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [targetNodeId, setTargetNodeId] = useState('');
    const [newOwnerId, setNewOwnerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Reset on close
    if (!isOpen) return null;

    const handleTransfer = async () => {
        if (!targetNodeId || !newOwnerId) {
            toast.error('Both Node ID and New Owner ID are required');
            return;
        }

        setIsLoading(true);
        try {
            // Confirm Dialog logic could be here, but we'll do a direct action for MVP per user request style
            const res = await api.post('/admin/transfer-node', {
                targetNodeId: parseInt(targetNodeId),
                newOwnerId: parseInt(newOwnerId),
                adminId: 1 // Hardcoded for now, or get from context
            });

            if (res.data.success) {
                setResult(res.data);
                setStep(2);
                toast.success('Transfer Successful!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Transfer Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-card border border-white/20 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 bg-white/95 backdrop-blur-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-all hover:bg-black/5 p-2 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6 flex items-center gap-2">
                    Transfer Ownership
                </h2>

                {step === 1 ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 shadow-inner">
                            <AlertOctagon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-amber-700">Irreversible Action</p>
                                <p className="text-xs text-amber-600/80 leading-relaxed">
                                    The Node, its wallet balance, and <span className="font-bold underline">ALL Rebirth Nodes</span> will be transferred immediately. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide opacity-70">Target Node ID (Source)</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="number"
                                        value={targetNodeId}
                                        onChange={(e) => setTargetNodeId(e.target.value)}
                                        placeholder="Enter Node ID (e.g. 105)"
                                        className="w-full bg-white/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm font-mono font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide opacity-70">New Owner User ID (Destination)</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="number"
                                        value={newOwnerId}
                                        onChange={(e) => setNewOwnerId(e.target.value)}
                                        placeholder="Enter User ID (e.g. 5)"
                                        className="w-full bg-white/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm font-mono font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleTransfer}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-xl transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Transfer Ownership <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8 space-y-6">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Transfer Complete!</h3>
                            <p className="text-muted-foreground text-sm">Ownership has been successfully updated.</p>
                        </div>

                        <div className="text-sm text-foreground bg-white/50 p-6 rounded-xl border border-white/20 text-left space-y-3 shadow-inner">
                            <div className="flex justify-between items-center border-b border-foreground/5 pb-2">
                                <span className="text-muted-foreground">Result:</span>
                                <span className="font-semibold text-emerald-600">{result?.message}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-foreground/5 pb-2">
                                <span className="text-muted-foreground">Rebirths Moved:</span>
                                <span className="font-mono font-bold">{result?.rebirthsTransferred}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Balance Moved:</span>
                                <span className="font-mono font-bold text-amber-600">₹{result?.nodeBalance}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => { setStep(1); setTargetNodeId(''); setNewOwnerId(''); onClose(); }}
                            className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-colors border border-border"
                        >
                            Close Overlay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
