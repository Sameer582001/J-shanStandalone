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

    // Calculated values for display
    const numAmount = parseFloat(amount) || 0;
    const serviceCharge = numAmount * 0.05;
    const tdsCharge = numAmount * 0.05;
    const netCredit = numAmount - serviceCharge - tdsCharge;

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
                <h2 className="text-2xl font-bold text-secondary">Overview</h2>
                <div className="text-sm text-muted-foreground">
                    Referral Code: <span className="font-mono font-bold text-primary">{activeNode.referralCode}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Node Wallet */}
                <div className="bg-card rounded-2xl shadow-lg p-4 md:p-6 text-card-foreground relative overflow-hidden border border-primary/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-24 h-24 text-primary" />
                    </div>
                    <h3 className="text-primary text-sm font-medium uppercase tracking-wider">Node Wallet</h3>
                    <p className="text-4xl font-bold mt-2 text-foreground">₹{activeNode.walletBalance}</p>
                    <p className="text-muted-foreground text-sm mt-1">Earnings available for transfer</p>
                </div>

                {/* Transfer to Master */}
                <div className={`rounded-2xl shadow-sm border md:col-span-2 ${isEligible ? 'bg-card border-primary/30' : 'bg-card border-border opacity-75'} transition-all duration-200`}>
                    <div className="p-4 md:p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-foreground font-bold text-lg mb-1">Transfer Funds</h3>
                                <p className="text-muted-foreground text-sm">Move earnings to your Master Wallet</p>
                            </div>
                            {isEligible ? (
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <ArrowRight className="w-6 h-6 text-primary" />
                                </div>
                            ) : (
                                <div className="bg-muted p-2 rounded-lg">
                                    <Lock className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {isEligible ? (
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Amount to Transfer (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-4 pr-4 py-4 md:py-3 border-input bg-background rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-lg md:text-base font-medium"
                                            placeholder="0.00"
                                            required
                                            min="1"
                                            inputMode="decimal" // Better keyboard on mobile
                                        />
                                    </div>
                                    {numAmount > 0 && (
                                        <div className="mt-3 text-sm rounded-lg bg-muted/50 p-3 space-y-2 border border-border">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Transfer Amount:</span>
                                                <span className="text-foreground">₹{numAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-amber-700 font-medium text-xs">
                                                <span>Service Charge (5%):</span>
                                                <span>- ₹{serviceCharge.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-indigo-700 font-medium text-xs">
                                                <span>TDS Deduction (5%):</span>
                                                <span>- ₹{tdsCharge.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-border pt-2 flex justify-between font-bold text-green-600 dark:text-green-500">
                                                <span>Net Credit to Master:</span>
                                                <span>₹{netCredit.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    {loading ? 'Processing Transfer...' : 'Transfer Now'}
                                </button>
                                {message && (
                                    <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {message}
                                    </div>
                                )}
                            </form>
                        ) : (
                            <div className="text-center py-6 bg-background/50 rounded-xl border border-dashed border-border shadow-sm">
                                <p className="text-muted-foreground font-medium mb-4 uppercase tracking-wider text-xs">Feature Locked</p>
                                <div className="inline-flex items-center justify-center space-x-2 bg-muted/50 px-6 py-3 rounded-full border border-border mb-2">
                                    <span className="text-muted-foreground text-sm">Requirement:</span>
                                    <span className="font-bold text-foreground text-sm">3 Direct Referrals</span>
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                    <p className="text-muted-foreground text-sm mb-2">Current Progress</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-2xl font-bold ${(activeNode.direct_referrals_count || 0) > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {activeNode.direct_referrals_count || 0}
                                        </span>
                                        <span className="text-muted-foreground text-2xl">/</span>
                                        <span className="text-muted-foreground text-2xl font-bold">3</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Direct Referrals */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Direct Referrals</h3>
                        <Users className="w-5 h-5 text-primary" />
                    </div>

                    <div className="space-y-3">
                        <DirectReferralsList nodeId={activeNode.id} />
                    </div>
                </div>
            </div>

            {/* Fast Track Status */}
            <FastTrackStatus nodeId={activeNode.id} />

            <div className="bg-card border border-primary/20 rounded-xl p-6">
                <h3 className="text-primary font-semibold mb-2">Node Status: {activeNode.status}</h3>
                <p className="text-foreground text-sm">
                    {activeNode.status === 'ACTIVE'
                        ? 'Your node is fully active and eligible for commissions.'
                        : 'Your node is inactive. Refer 3 active users to activate.'}
                </p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-mono">{activeNode.referralCode}</span>
                    <button className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-md transition-colors flex items-center cursor-pointer">
                        <Share2 className="w-3 h-3 mr-1" /> Share Code
                    </button>
                </div>
            </div>
        </div>
    );
};

const DirectReferralsList: React.FC<{ nodeId: number }> = ({ nodeId }) => {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const res = await api.get(`/nodes/${nodeId}/direct-referrals`);
                setReferrals(res.data);
            } catch (err) {
                console.error("Failed to fetch referrals", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferrals();
    }, [nodeId]);

    if (loading) return <div className="text-sm text-muted-foreground">Loading referrals...</div>;
    if (referrals.length === 0) return <div className="text-sm text-muted-foreground text-center py-4">No direct referrals yet.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                        <th className="px-3 py-2 rounded-l-lg">User</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 rounded-r-lg">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {referrals.map((ref) => (
                        <tr key={ref.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{ref.full_name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{ref.referral_code}</td>
                            <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ref.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {ref.status}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(ref.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default NodeDashboard;
