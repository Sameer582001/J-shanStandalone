import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { QrCode, Copy, History, AlertCircle } from 'lucide-react';
import QRCode from "react-qr-code";

interface FundRequest {
    id: number;
    amount: string;
    utr_number: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_remarks?: string;
    created_at: string;
}

interface QrData {
    payeeName: string;
    upiId: string;
}

const AddFunds: React.FC = () => {
    const [qrData, setQrData] = useState<QrData | null>(null);
    const [amount, setAmount] = useState('');
    const [utrNumber, setUtrNumber] = useState('');
    const [requests, setRequests] = useState<FundRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchQrData();
        fetchHistory();
    }, []);

    const fetchQrData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/funds/qr', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrData(res.data);
        } catch (error) {
            console.error('Error fetching QR:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/funds/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !utrNumber) return toast.error('Please fill all fields');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/funds/request',
                { amount: parseFloat(amount), utrNumber },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Request submitted successfully!');
            setAmount('');
            setUtrNumber('');
            fetchHistory();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied!');
    };

    // Construct UPI URI
    // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&cu=INR
    const upiUri = qrData?.upiId
        ? `upi://pay?pa=${qrData.upiId}&pn=${encodeURIComponent(qrData.payeeName || '')}&cu=INR`
        : '';

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Add Funds to Master Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Payment Section */}
                <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
                    <h2 className="text-lg font-semibold text-accent-gold mb-4 flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Step 1: Make Payment
                    </h2>

                    {qrData ? (
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg mb-6">
                            {upiUri ? (
                                <div className="bg-white p-4 rounded-lg mb-4">
                                    <QRCode
                                        value={upiUri}
                                        size={200}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-gray-700 flex items-center justify-center text-gray-400 text-sm mb-4 rounded">
                                    QR Not Configured
                                </div>
                            )}

                            {qrData.upiId && (
                                <div className="flex items-center gap-2 bg-dark-bg px-4 py-2 rounded-lg border border-gray-700 w-full justify-between group cursor-pointer" onClick={() => copyToClipboard(qrData.upiId)}>
                                    <div className="text-sm">
                                        <div className="text-gray-500 text-xs">UPI ID</div>
                                        <div className="text-white font-mono">{qrData.upiId}</div>
                                    </div>
                                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-accent-teal" />
                                </div>
                            )}
                            {qrData.payeeName && (
                                <div className="mt-2 text-xs text-gray-400">
                                    Payee: <span className="text-gray-300">{qrData.payeeName}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">Loading Payment Details...</div>
                    )}

                    <h2 className="text-lg font-semibold text-accent-gold mb-4 flex items-center gap-2 border-t border-gray-800 pt-6">
                        <AlertCircle className="w-5 h-5" />
                        Step 2: Submit Details
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Amount Paid (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue"
                                placeholder="e.g. 5000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">UTR / Ref Number</label>
                            <input
                                type="text"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-blue"
                                placeholder="e.g. 123456789012"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Please enter the exact UTR number from your payment app.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${loading
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-accent-blue to-blue-600 text-white hover:opacity-90 shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                {/* Right: History Section */}
                <div className="bg-dark-card p-6 rounded-xl border border-gray-800 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-accent-teal" />
                        Recent Requests
                    </h2>

                    <div className="flex-1 overflow-auto">
                        {requests.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No requests found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">UTR</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="text-sm hover:bg-white/5">
                                            <td className="px-4 py-3 text-gray-300">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-white">
                                                ₹{req.amount}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                                                {req.utr_number}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
                                                    req.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
                                                        'bg-yellow-900/30 text-yellow-400'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFunds;
