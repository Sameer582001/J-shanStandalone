import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Check, X } from 'lucide-react';

interface FundRequest {
    id: number;
    user_id: number;
    full_name: string;
    email: string; // Viewable in details
    mobile: string;
    amount: string;
    utr_number: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

const AdminFundRequests: React.FC = () => {
    const [requests, setRequests] = useState<FundRequest[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [adminUtr, setAdminUtr] = useState('');
    const [adminAmount, setAdminAmount] = useState('');

    // Reject State
    const [rejectReason, setRejectReason] = useState('');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:3000/api/funds/admin/requests?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = (req: FundRequest) => {
        setSelectedRequest(req);
        setAdminUtr('');
        setAdminAmount('');
        setIsVerifyModalOpen(true);
    };

    const handleRejectClick = (req: FundRequest) => {
        setSelectedRequest(req);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const submitVerify = async () => {
        if (!selectedRequest) return;
        if (!adminUtr || !adminAmount) return toast.error('Both fields are strictly required');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/funds/admin/verify',
                {
                    requestId: selectedRequest.id,
                    adminUtr,
                    adminAmount: parseFloat(adminAmount)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Request Approved & Funds Added');
            setIsVerifyModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Verification Failed');
        }
    };

    const submitReject = async () => {
        if (!selectedRequest) return;
        if (!rejectReason) return toast.error('Reason is required');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/funds/admin/reject',
                { requestId: selectedRequest.id, remarks: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Request Rejected');
            setIsRejectModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Rejection Failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Fund Requests Verification</h1>

                <div className="flex space-x-2 bg-dark-card p-1 rounded-lg border border-gray-700">
                    {['PENDING', 'APPROVED', 'REJECTED', ''].map((status) => (
                        <button
                            key={status || 'ALL'}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === status
                                ? 'bg-accent-blue text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {status || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Check</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">UTR Check</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-dark-card divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{req.full_name}</div>
                                        <div className="text-xs text-gray-500">{req.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-lg font-bold text-accent-gold">₹{req.amount}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-sm text-accent-teal bg-teal-900/20 px-2 py-1 rounded inline-block">
                                            {req.utr_number}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === 'PENDING' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleVerifyClick(req)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Verify
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(req)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
                                                >
                                                    <X className="w-3 h-3" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
                                                }`}>
                                                {req.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Verify Modal */}
            {isVerifyModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-card border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Verify Transaction</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Please check your bank statement. Enter the <strong>exact</strong> UTR and Amount you received.
                            <br />The system will only approve if they match the user's request details.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded mb-4">
                                <div className="text-xs text-yellow-500 uppercase font-bold">User Claimed:</div>
                                <div className="text-gray-300 text-sm">Amount: ₹{selectedRequest.amount}</div>
                                <div className="text-gray-300 text-sm">UTR: {selectedRequest.utr_number}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Bank Statement Amount</label>
                                <input
                                    type="number"
                                    value={adminAmount}
                                    onChange={(e) => setAdminAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                    placeholder="Enter received amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Bank Statement UTR</label>
                                <input
                                    type="text"
                                    value={adminUtr}
                                    onChange={(e) => setAdminUtr(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                    placeholder="Enter received UTR"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsVerifyModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitVerify}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-green-900/20"
                            >
                                Verify & Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-card border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Reject Request</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Are you sure you want to reject this request? Funds will NOT be added.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-white h-24 focus:border-red-500 outline-none resize-none"
                            placeholder="Reason for rejection (e.g. Invalid UTR, Payment not received)"
                        ></textarea>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-red-900/20"
                            >
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFundRequests;
