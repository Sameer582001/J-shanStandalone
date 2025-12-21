import React, { useState } from 'react';
import { useNode } from '../../context/NodeContext';
import { Wallet, Users, Share2, ArrowRight, Lock } from 'lucide-react';
import api from '../../api/axios';
import { FastTrackStatus } from '../../components/dashboard/FastTrackStatus';

const NodeDashboard: React.FC = () => {
    const { activeNode } = useNode(); // switchNode used to update context if needed (e.g. balance)
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!activeNode) return null;

    const isEligible = (activeNode.direct_referrals_count || 0) >= 3;

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post('/wallet/transfer/node-to-master', {
                nodeId: activeNode.id,
                amount: parseFloat(amount)
            });
            setMessage('Transfer successful!');
            setAmount('');
            // Optional: Refresh node data to show new balance
            // For now, simple success message. 
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-accent-cyan">Overview</h2>
                <div className="text-sm text-gray-400">
                    Referral Code: <span className="font-mono font-bold text-accent-teal">{activeNode.referralCode}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Node Wallet */}
                {/* Node Wallet */}
                <div className="bg-dark-surface rounded-2xl shadow-lg p-6 text-white relative overflow-hidden border border-accent-teal/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-24 h-24 text-accent-cyan" />
                    </div>
                    <h3 className="text-accent-cyan text-sm font-medium uppercase tracking-wider">Node Wallet</h3>
                    <p className="text-4xl font-bold mt-2 text-white">₹{activeNode.walletBalance}</p>
                    <p className="text-gray-400 text-sm mt-1">Earnings available for transfer</p>
                </div>

                {/* Team Stats */}
                {/* Team Stats */}
                <div className="bg-dark-surface rounded-2xl shadow-sm border border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">My Team</h3>
                        <Users className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Self Pool</span>
                            <span className="text-xl font-bold text-white">{activeNode.selfPoolTeam || 0}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div className="bg-accent-teal h-1.5 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Auto Pool</span>
                            <span className="text-xl font-bold text-white">{activeNode.autoPoolTeam || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Transfer to Master */}
                <div className={`rounded-2xl shadow-sm border ${isEligible ? 'bg-dark-surface border-accent-teal/30' : 'bg-dark-surface border-gray-800 opacity-75'} transition-all duration-200`}>
                    <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Transfer Funds</h3>
                                <p className="text-gray-400 text-sm">Move earnings to your Master Wallet</p>
                            </div>
                            {isEligible ? (
                                <div className="bg-accent-teal/10 p-2 rounded-lg">
                                    <ArrowRight className="w-6 h-6 text-accent-cyan" />
                                </div>
                            ) : (
                                <div className="bg-gray-800 p-2 rounded-lg">
                                    <Lock className="w-6 h-6 text-gray-500" />
                                </div>
                            )}
                        </div>

                        {isEligible ? (
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount to Transfer (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-4 pr-4 py-3 border-gray-700 bg-dark-bg rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all outline-none"
                                            placeholder="0.00"
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-accent-teal text-white font-semibold py-3.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-lg shadow-teal-900/50 cursor-pointer"
                                >
                                    {loading ? 'Processing Transfer...' : 'Transfer Now'}
                                </button>
                                {message && (
                                    <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {message}
                                    </div>
                                )}
                            </form>
                        ) : (
                            <div className="text-center py-6 bg-dark-bg/50 rounded-xl border border-dashed border-gray-800 shadow-sm">
                                <p className="text-gray-400 font-medium mb-4 uppercase tracking-wider text-xs">Feature Locked</p>
                                <div className="inline-flex items-center justify-center space-x-2 bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700 mb-2">
                                    <span className="text-gray-400 text-sm">Requirement:</span>
                                    <span className="font-bold text-gray-200 text-sm">3 Direct Referrals</span>
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                    <p className="text-gray-500 text-sm mb-2">Current Progress</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-2xl font-bold ${(activeNode.direct_referrals_count || 0) > 0 ? 'text-accent-cyan' : 'text-gray-600'}`}>
                                            {activeNode.direct_referrals_count || 0}
                                        </span>
                                        <span className="text-gray-600 text-2xl">/</span>
                                        <span className="text-gray-500 text-2xl font-bold">3</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fast Track Status */}
            <FastTrackStatus nodeId={activeNode.id} />

            <div className="bg-dark-surface border border-accent-teal/20 rounded-xl p-6">
                <h3 className="text-accent-cyan font-semibold mb-2">Node Status: {activeNode.status}</h3>
                <p className="text-gray-300 text-sm">
                    {activeNode.status === 'ACTIVE'
                        ? 'Your node is fully active and eligible for commissions.'
                        : 'Your node is inactive. Refer 3 active users to activate.'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-mono">{activeNode.referralCode}</span>
                    <button className="text-xs bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-cyan px-3 py-1 rounded-md transition-colors flex items-center cursor-pointer">
                        <Share2 className="w-3 h-3 mr-1" /> Share Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NodeDashboard;
