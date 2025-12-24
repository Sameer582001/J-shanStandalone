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
    const netAmount = numAmount;

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
            <h2 className="text-2xl font-bold text-secondary">Withdrawal Requests</h2>

            {/* Request Form */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-semibold mb-4 text-card-foreground">New Request</h3>

                {!hasBankDetails && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm flex items-center justify-between">
                        <span>You must complete your Bank Details to request a withdrawal.</span>
                        <a href="/profile" className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-md transition-colors font-medium text-xs">
                            Go to Profile
                        </a>
                    </div>
                )}

                <form onSubmit={handleRequest} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            min="500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border placeholder-muted-foreground outline-none"
                            placeholder="Min ₹500"
                            required
                        />
                        {numAmount > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Requested Amount:</span>
                                    <span className="text-foreground">₹{numAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-border pt-1 mt-1 flex justify-between font-bold text-green-500">
                                    <span>Net Receivable:</span>
                                    <span>₹{netAmount.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    * No deductions on withdrawal. Charges applied during Transfer to Master Wallet.
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || numAmount < 500 || !hasBankDetails}
                        className="w-full px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-card-foreground">Request History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Note</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                        ₹{req.amount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-red-500/80">
                                        <div>S: ₹{req.service_charge || '0.00'}</div>
                                        <div>T: ₹{req.tds_charge || '0.00'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-500">
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
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {req.admin_note || '-'}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">No history found.</td>
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
