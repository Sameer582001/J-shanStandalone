import React, { useEffect, useState } from 'react';
import api from '../api/axios';


interface Withdrawal {
    id: number;
    amount: string;
    service_charge: string;
    tds_charge: string;
    net_amount: string;
    status: 'PENDING' | 'PAID' | 'REJECTED';
    created_at: string;
    admin_note?: string;
}

const WalletRequests: React.FC = () => {
    const [requests, setRequests] = useState<Withdrawal[]>([]);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [hasBankDetails, setHasBankDetails] = useState(true);

    // Calculated values
    const numAmount = parseFloat(amount) || 0;
    const serviceCharge = numAmount * 0.05;
    const tdsCharge = numAmount * 0.05;
    const netAmount = numAmount - serviceCharge - tdsCharge;

    const fetchRequests = async () => {
        try {
            const res = await api.get('/payout/history');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const checkProfile = async () => {
        try {
            const res = await api.get('/profile');
            // Check if essential bank details are present
            if (!res.data.account_number) {
                setHasBankDetails(false);
            }
        } catch (err) {
            console.error('Failed to check profile', err);
        }
    };

    useEffect(() => {
        fetchRequests();
        checkProfile();
    }, []);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasBankDetails) {
            setMessage('Please complete your bank details in Profile first.');
            return;
        }

        if (numAmount < 500) {
            setMessage('Minimum withdrawal amount is ₹500');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            await api.post('/payout/request', { amount: numAmount });
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

                {!hasBankDetails && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm flex items-center justify-between">
                        <span>You must complete your Bank Details to request a withdrawal.</span>
                        <a href="/profile" className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-md transition-colors font-medium text-xs">
                            Go to Profile
                        </a>
                    </div>
                )}

                <form onSubmit={handleRequest} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            min="500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:border-accent-teal focus:ring-accent-teal sm:text-sm p-2 border placeholder-gray-500 outline-none"
                            placeholder="Min ₹500"
                            required
                        />
                        {numAmount > 0 && (
                            <div className="mt-2 text-sm text-gray-400 space-y-1">
                                <div className="flex justify-between">
                                    <span>Requested Amount:</span>
                                    <span className="text-white">₹{numAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-yellow-500/80">
                                    <span>Service Charge (5%):</span>
                                    <span>- ₹{serviceCharge.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-yellow-500/80">
                                    <span>TDS (5%):</span>
                                    <span>- ₹{tdsCharge.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between font-bold text-green-400">
                                    <span>Net Receivable:</span>
                                    <span>₹{netAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || numAmount < 500 || !hasBankDetails}
                        className="w-full px-6 py-2 bg-accent-teal text-white rounded-md font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Processing...' : 'Submit Request'}
                    </button>
                </form>
                {message && (
                    <p className={`mt-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gross</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Net</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-red-300">
                                        <div>S: ₹{req.service_charge || '0.00'}</div>
                                        <div>T: ₹{req.tds_charge || '0.00'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                                        ₹{req.net_amount || req.amount}
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
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No history found.</td>
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
