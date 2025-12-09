import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Check, X } from 'lucide-react';

interface Withdrawal {
    id: number;
    user_id: number;
    amount: string;
    status: string;
    full_name: string;
    mobile: string;
    created_at: string;
}

const AdminPayouts: React.FC = () => {
    const [payouts, setPayouts] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayouts = async () => {
        try {
            const res = await api.get('/payout/admin/list?status=PENDING');
            setPayouts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

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
            <h2 className="text-2xl font-bold text-white">Pending Payouts</h2>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700 text-gray-300">
                        {payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-white">{p.full_name}</div>
                                    <div className="text-xs text-gray-500">{p.mobile}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-400">
                                    ₹{p.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {new Date(p.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => processPayout(p.id, 'PAID')}
                                        className="text-green-400 hover:text-green-300 mr-4 transition-colors"
                                        title="Mark as Paid"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => processPayout(p.id, 'REJECTED')}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        title="Reject"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {payouts.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No pending payouts.
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
