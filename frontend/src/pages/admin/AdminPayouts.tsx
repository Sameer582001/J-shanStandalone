import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Check, X, Copy } from 'lucide-react';

interface Withdrawal {
    id: number;
    user_id: number;
    amount: string;
    service_charge: string;
    tds_charge: string;
    net_amount: string;
    status: string;
    full_name: string;
    mobile: string;
    created_at: string;
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
}

const AdminPayouts: React.FC = () => {
    const [payouts, setPayouts] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            // Using the new backend capability: ?status=PENDING or ?status=HISTORY
            const res = await api.get(`/payout/admin/list?status=${activeTab}`);
            setPayouts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [activeTab]);

    const processPayout = async (id: number, status: 'PAID' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
        try {
            await api.post('/payout/admin/process', { payoutId: id, status });
            // Remove from list or refresh
            setPayouts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to process payout');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary">
                    {activeTab === 'PENDING' ? 'Pending Payouts' : 'Payment History'}
                </h2>

                {/* Tabs */}
                <div className="flex bg-card p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/20 shadow-xl overflow-hidden backdrop-blur-md bg-white/60">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-primary/5">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider w-[20%]">User Info</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider w-[35%]">Bank Details</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Gross</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Deductions</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Net Payable</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Date</th>
                            {activeTab === 'PENDING' && (
                                <th className="px-6 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-foreground">
                        {payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-primary/5 transition-colors duration-200">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-start space-x-3 pt-2">
                                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-primary shadow-sm flex-shrink-0 border border-primary/20">
                                            {p.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{p.full_name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary font-medium">#{p.user_id}</span>
                                                </div>
                                                <div>{p.mobile}</div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 align-top">
                                    {p.account_number ? (
                                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 text-sm w-full shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-[0.03] text-foreground">
                                                <Copy className="w-24 h-24 -rotate-12" />
                                            </div>

                                            <div className="relative z-10 flex flex-col gap-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* 1. Account Holder Name */}
                                                    <div className="group/item hover:bg-primary/5 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.account_holder_name || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Account Holder</div>
                                                                <div className="text-foreground font-medium truncate" title={p.account_holder_name}>{p.account_holder_name}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-primary opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>

                                                    {/* 2. Account Number */}
                                                    <div className="group/item hover:bg-primary/5 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.account_number || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Account Number</div>
                                                                <div className="font-mono text-lg text-foreground tracking-widest font-semibold">{p.account_number}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-primary opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* 3. IFSC Code */}
                                                    <div className="group/item hover:bg-primary/5 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.ifsc_code || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">IFSC</div>
                                                                <div className="text-primary font-mono font-medium">{p.ifsc_code}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-primary opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>

                                                    {/* 4. Bank Name */}
                                                    <div className="group/item hover:bg-primary/5 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.bank_name || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="truncate pr-2">
                                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bank</div>
                                                                <div className="text-foreground font-medium truncate" title={p.bank_name}>{p.bank_name}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-primary opacity-0 group-hover/item:opacity-100 transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 text-center h-full flex flex-col justify-center items-center gap-2 text-rose-400">
                                            <X className="w-5 h-5" />
                                            <span className="text-xs italic font-medium">No Bank Details</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-sm font-bold text-foreground">₹{p.amount}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-xs text-rose-500 font-medium flex flex-col items-end space-y-1">
                                        <span>Service: -₹{p.service_charge || '0.00'}</span>
                                        <span>TDS: -₹{p.tds_charge || '0.00'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">₹{p.net_amount || p.amount}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center align-top pt-6">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border shadow-sm
                                            ${p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            p.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground align-top pt-6">
                                    <div className="flex flex-col items-end">
                                        <span className="font-medium">{new Date(p.created_at).toLocaleDateString()}</span>
                                        <span className="text-xs text-muted-foreground/70">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                {activeTab === 'PENDING' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top pt-6">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => processPayout(p.id, 'PAID')}
                                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-lg transition-colors border border-emerald-200 shadow-sm"
                                                title="Mark as Paid"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => processPayout(p.id, 'REJECTED')}
                                                className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-2 rounded-lg transition-colors border border-rose-200 shadow-sm"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {payouts.length === 0 && !loading && (
                            <tr>
                                <td colSpan={activeTab === 'PENDING' ? 8 : 7} className="px-6 py-12 text-center text-muted-foreground">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPayouts;
