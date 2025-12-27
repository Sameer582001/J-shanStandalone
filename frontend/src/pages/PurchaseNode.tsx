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
            <h2 className="text-2xl font-bold text-secondary">Purchase Node</h2>

            <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-8">
                {/* ... (Header Section same) ... */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-card-foreground">Standard Node Package</h3>
                        <p className="text-muted-foreground text-sm mt-1">Includes entry to Self Pool & Auto Pool</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-secondary">₹{NODE_PRICE}</p>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-6">
                    <div>
                        <label htmlFor="sponsorCode" className="block text-sm font-medium text-muted-foreground">
                            Sponsor Code (Referral Code)
                        </label>
                        <div className="mt-1 relative">
                            <input
                                type="text"
                                id="sponsorCode"
                                required
                                value={sponsorCode}
                                onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                                className={`block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:ring-primary sm:text-sm p-3 border placeholder-muted-foreground outline-none
                                    ${sponsorError ? 'border-red-500 focus:border-red-500' : 'focus:border-primary'}
                                    ${sponsorName ? 'border-green-500 focus:border-green-500' : ''}
                                `}
                                placeholder="Enter Sponsor's Referral Code"
                            />
                            {isChecking && (
                                <div className="absolute right-3 top-3.5">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                                </div>
                            )}
                        </div>

                        {/* Verification Feedback */}
                        <div className="mt-2 min-h-[20px]">
                            {sponsorName && (
                                <p className="text-sm text-green-500 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Sponsor: <span className="font-bold">{sponsorName}</span>
                                </p>
                            )}
                            {sponsorError && (
                                <p className="text-sm text-red-500 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {sponsorError}
                                </p>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-start border backdrop-blur-sm ${message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 shadow-sm'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-700 shadow-sm'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !sponsorName}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors 
                            ${(loading || !sponsorName) ? 'opacity-50 cursor-not-allowed bg-muted hover:bg-muted' : ''}`}
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
