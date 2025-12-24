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
            <h1 className="text-2xl font-bold text-foreground mb-6">Add Funds to Master Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Payment Section */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Step 1: Make Payment
                    </h2>

                    {qrData ? (
                        <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg mb-6">
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
                                <div className="w-48 h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm mb-4 rounded">
                                    QR Not Configured
                                </div>
                            )}

                            {qrData.upiId && (
                                <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border w-full justify-between group cursor-pointer" onClick={() => copyToClipboard(qrData.upiId)}>
                                    <div className="text-sm">
                                        <div className="text-muted-foreground text-xs">UPI ID</div>
                                        <div className="text-foreground font-mono">{qrData.upiId}</div>
                                    </div>
                                    <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                            )}
                            {qrData.payeeName && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Payee: <span className="text-foreground">{qrData.payeeName}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">Loading Payment Details...</div>
                    )}

                    <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2 border-t border-border pt-6">
                        <AlertCircle className="w-5 h-5" />
                        Step 2: Submit Details
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                                placeholder="e.g. 5000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">UTR / Ref Number</label>
                            <input
                                type="text"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                                placeholder="e.g. 123456789012"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Please enter the exact UTR number from your payment app.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${loading
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20'
                                }`}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                {/* Right: History Section */}
                <div className="bg-card p-6 rounded-xl border border-border flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Recent Requests
                    </h2>

                    <div className="flex-1 overflow-auto">
                        {requests.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">No requests found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">UTR</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="text-sm hover:bg-muted/10">
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                ₹{req.amount}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                                                {req.utr_number}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
                                                    req.status === 'REJECTED' ? 'bg-red-900/30 text-red-500' :
                                                        'bg-yellow-900/30 text-yellow-500'
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
