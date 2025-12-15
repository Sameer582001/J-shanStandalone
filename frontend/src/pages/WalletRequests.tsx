import React, { useEffect, useState } from 'react';
import api from '../api/axios';


interface Withdrawal {
    id: number;
    amount: string;
    status: 'PENDING' | 'PAID' | 'REJECTED';
    created_at: string;
    admin_note?: string;
}

const WalletRequests: React.FC = () => {
    const [requests, setRequests] = useState<Withdrawal[]>([]);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchRequests = async () => {
        try {
            const res = await api.get('/payout/history');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post('/payout/request', { amount: parseFloat(amount) });
            setMessage('Withdrawal requested successfully!');
            setAmount('');
            fetchRequests();
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to request withdrawal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-accent-cyan">Withdrawal Requests</h2>

            {/* Request Form */}
            <div className="bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-white">New Request</h3>
                <form onSubmit={handleRequest} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            min="100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:border-accent-teal focus:ring-accent-teal sm:text-sm p-2 border placeholder-gray-500 outline-none"
                            placeholder="Min ₹100"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-accent-teal text-white rounded-md font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Processing...' : 'Submit Request'}
                    </button>
                </form>
                {message && (
                    <p className={`mt-2 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* History Table */}
            <div className="bg-dark-surface rounded-xl shadow-sm border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-white">Request History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-dark-bg">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Note</th>
                            </tr>
                        </thead>
                        <tbody className="bg-dark-surface divide-y divide-gray-800">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        ₹{req.amount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${req.status === 'PAID' ? 'bg-green-900/50 text-green-200' :
                                                req.status === 'REJECTED' ? 'bg-red-900/50 text-red-200' :
                                                    'bg-yellow-900/50 text-yellow-200'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {req.admin_note || '-'}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WalletRequests;
