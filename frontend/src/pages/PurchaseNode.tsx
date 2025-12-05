import React, { useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

const PurchaseNode: React.FC = () => {
    const [sponsorCode, setSponsorCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const NODE_PRICE = 1750;

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await api.post('/nodes/purchase', { sponsorCode });
            setMessage({ type: 'success', text: `Success! Node created. Referral Code: ${res.data.referralCode}` });
            setSponsorCode('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Purchase failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Purchase Node</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Standard Node Package</h3>
                        <p className="text-gray-500 text-sm mt-1">Includes entry to Self Pool & Auto Pool</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-indigo-600">₹{NODE_PRICE}</p>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-6">
                    <div>
                        <label htmlFor="sponsorCode" className="block text-sm font-medium text-gray-700">
                            Sponsor Code (Referral Code)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                id="sponsorCode"
                                required
                                value={sponsorCode}
                                onChange={(e) => setSponsorCode(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                placeholder="Enter Sponsor's Referral Code"
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            You need a valid sponsor code to place your node in the matrix.
                        </p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                            )}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Purchase Now
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PurchaseNode;
