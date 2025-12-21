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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-dark-surface border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Transfer Node Ownership</h2>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex gap-3">
                            <AlertOctagon className="w-6 h-6 text-yellow-500 shrink-0" />
                            <p className="text-xs text-yellow-200">
                                <strong>Warning:</strong> This action is irreversible. The Node, its wallet balance, and ALL its Rebirth Nodes will be transferred to the new owner immediately.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Target Node ID (Source)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    value={targetNodeId}
                                    onChange={(e) => setTargetNodeId(e.target.value)}
                                    placeholder="Enter Node ID (e.g. 105)"
                                    className="w-full bg-dark-bg border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">New Owner User ID (Destination)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    value={newOwnerId}
                                    onChange={(e) => setNewOwnerId(e.target.value)}
                                    placeholder="Enter User ID (e.g. 5)"
                                    className="w-full bg-dark-bg border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleTransfer}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent-teal hover:bg-teal-600 text-white font-semibold rounded-lg transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Transfer Complete</h3>
                        <div className="text-sm text-gray-400 bg-dark-bg p-4 rounded-lg border border-gray-800 text-left space-y-2">
                            <p><strong>Message:</strong> {result?.message}</p>
                            <p><strong>Rebirths Moved:</strong> {result?.rebirthsTransferred}</p>
                            <p><strong>Balance Moved:</strong> ₹{result?.nodeBalance}</p>
                        </div>
                        <button
                            onClick={() => { setStep(1); setTargetNodeId(''); setNewOwnerId(''); onClose(); }}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
