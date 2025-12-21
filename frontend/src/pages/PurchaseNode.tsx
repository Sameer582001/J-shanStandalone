import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

const PurchaseNode: React.FC = () => {
    const [sponsorCode, setSponsorCode] = useState('');
    const [sponsorName, setSponsorName] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [sponsorError, setSponsorError] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const NODE_PRICE = 1750;

    // Debounce Logic for Sponsor Check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (sponsorCode.length >= 3) {
                verifySponsor(sponsorCode);
            } else {
                setSponsorName(null);
                setSponsorError(null);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [sponsorCode]);

    const verifySponsor = async (code: string) => {
        setIsChecking(true);
        setSponsorError(null);
        setSponsorName(null);
        try {
            const res = await api.get(`/nodes/verify-sponsor/${code}`);
            if (res.data.valid) {
                setSponsorName(res.data.sponsorName);
            }
        } catch (err: any) {
            setSponsorError(err.response?.data?.message || 'Invalid Sponsor Code');
        } finally {
            setIsChecking(false);
        }
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sponsorName) return; // Prevent submission if invalid

        setLoading(true);
        setMessage(null);

        try {
            const res = await api.post('/nodes/purchase', { sponsorCode });
            setMessage({ type: 'success', text: `Success! Node created. Referral Code: ${res.data.referralCode}` });
            setSponsorCode('');
            setSponsorName(null);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Purchase failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-accent-cyan">Purchase Node</h2>

            <div className="bg-dark-surface rounded-xl shadow-sm border border-gray-800 p-8">
                {/* ... (Header Section same) ... */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Standard Node Package</h3>
                        <p className="text-gray-400 text-sm mt-1">Includes entry to Self Pool & Auto Pool</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-accent-cyan">₹{NODE_PRICE}</p>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-6">
                    <div>
                        <label htmlFor="sponsorCode" className="block text-sm font-medium text-gray-300">
                            Sponsor Code (Referral Code)
                        </label>
                        <div className="mt-1 relative">
                            <input
                                type="text"
                                id="sponsorCode"
                                required
                                value={sponsorCode}
                                onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                                className={`block w-full rounded-md border-gray-700 bg-dark-bg text-white shadow-sm focus:ring-accent-teal sm:text-sm p-3 border placeholder-gray-500 outline-none
                                    ${sponsorError ? 'border-red-500 focus:border-red-500' : 'focus:border-accent-teal'}
                                    ${sponsorName ? 'border-green-500 focus:border-green-500' : ''}
                                `}
                                placeholder="Enter Sponsor's Referral Code"
                            />
                            {isChecking && (
                                <div className="absolute right-3 top-3.5">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>

                        {/* Verification Feedback */}
                        <div className="mt-2 min-h-[20px]">
                            {sponsorName && (
                                <p className="text-sm text-green-400 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Sponsor: <span className="font-bold">{sponsorName}</span>
                                </p>
                            )}
                            {sponsorError && (
                                <p className="text-sm text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {sponsorError}
                                </p>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md flex items-start ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
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
                        disabled={loading || !sponsorName}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-teal hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal transition-colors 
                            ${(loading || !sponsorName) ? 'opacity-50 cursor-not-allowed bg-gray-600 hover:bg-gray-600' : ''}`}
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
