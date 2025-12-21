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
                <h2 className="text-2xl font-bold text-accent-cyan">
                    {activeTab === 'PENDING' ? 'Pending Payouts' : 'Payment History'}
                </h2>

                {/* Tabs */}
                <div className="flex bg-dark-surface p-1 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING'
                            ? 'bg-accent-teal text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY'
                            ? 'bg-accent-teal text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="bg-dark-surface rounded-xl border border-gray-800 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-dark-bg">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[20%]">User Info</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[35%]">Bank Details</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Gross</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Deductions</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Net Payable</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                            {activeTab === 'PENDING' && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-dark-surface divide-y divide-gray-800 text-gray-300">
                        {payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-start space-x-3 pt-2">
                                        <div className="bg-gradient-to-br from-gray-700 to-gray-800 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner flex-shrink-0">
                                            {p.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{p.full_name}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono bg-gray-800 px-1 rounded text-gray-500">#{p.user_id}</span>
                                                </div>
                                                <div className="mt-1">{p.mobile}</div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4 align-top">
                                    {p.account_number ? (
                                        <div className="bg-dark-bg p-4 rounded-xl border border-gray-700/50 text-sm w-full shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-[0.03] text-white">
                                                <Copy className="w-24 h-24 -rotate-12" />
                                            </div>

                                            <div className="relative z-10 flex flex-col gap-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* 1. Account Holder Name */}
                                                    <div className="group/item hover:bg-gray-800/50 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.account_holder_name || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Account Holder Name</div>
                                                                <div className="text-gray-200 font-medium truncate" title={p.account_holder_name}>{p.account_holder_name}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-gray-600 group-hover/item:text-accent-teal opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>

                                                    {/* 2. Account Number */}
                                                    <div className="group/item hover:bg-gray-800/50 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.account_number || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Account Number</div>
                                                                <div className="font-mono text-lg text-white tracking-widest">{p.account_number}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-gray-600 group-hover/item:text-accent-teal opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* 3. IFSC Code */}
                                                    <div className="group/item hover:bg-gray-800/50 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.ifsc_code || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">IFSC</div>
                                                                <div className="text-accent-teal font-mono font-medium">{p.ifsc_code}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-gray-600 group-hover/item:text-accent-teal opacity-0 group-hover/item:opacity-100 transition-all ml-2" />
                                                        </div>
                                                    </div>

                                                    {/* 4. Bank Name */}
                                                    <div className="group/item hover:bg-gray-800/50 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(p.bank_name || '')}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="truncate pr-2">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Bank</div>
                                                                <div className="text-gray-300 font-medium truncate" title={p.bank_name}>{p.bank_name}</div>
                                                            </div>
                                                            <Copy className="w-3.5 h-3.5 text-gray-600 group-hover/item:text-accent-teal opacity-0 group-hover/item:opacity-100 transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-dashed border-gray-700 bg-gray-800/20 text-center h-full flex flex-col justify-center items-center gap-2 text-yellow-500/50">
                                            <X className="w-5 h-5" />
                                            <span className="text-xs italic">No Bank Details</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-sm font-medium text-white">₹{p.amount}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-xs text-red-300 flex flex-col items-end space-y-1">
                                        <span>Service: -₹{p.service_charge || '0.00'}</span>
                                        <span>TDS: -₹{p.tds_charge || '0.00'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right align-top pt-6">
                                    <div className="text-lg font-bold text-green-400">₹{p.net_amount || p.amount}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center align-top pt-6">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border 
                                            ${p.status === 'PAID' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                            p.status === 'REJECTED' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                                'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-400 align-top pt-6">
                                    <div className="flex flex-col items-end">
                                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-600">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                {activeTab === 'PENDING' && (
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium align-top pt-6">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => processPayout(p.id, 'PAID')}
                                                className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-green-900/20 rounded"
                                                title="Mark as Paid"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => processPayout(p.id, 'REJECTED')}
                                                className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-900/20 rounded"
                                                title="Reject"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {payouts.length === 0 && !loading && (
                            <tr>
                                <td colSpan={activeTab === 'PENDING' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
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
