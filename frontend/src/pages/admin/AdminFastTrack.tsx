import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Loader2, Gift, MapPin } from 'lucide-react';
import api from '@/api/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminFastTrack() {
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [viewAddressClaim, setViewAddressClaim] = useState<any>(null);
    const [productCodes, setProductCodes] = useState('');
    const [settling, setSettling] = useState(false);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = () => {
        setLoading(true);
        api.get('/admin/fast-track/eligible')
            .then(res => setClaims(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleSettle = async () => {
        if (!selectedClaim || !productCodes) return;
        setSettling(true);
        try {
            await api.post('/admin/fast-track/settle', {
                claimId: selectedClaim.id,
                productCodes
            });
            fetchClaims();
            setSelectedClaim(null);
            setProductCodes('');
        } catch (error) {
            console.error(error);
            alert('Failed to settle claim');
        } finally {
            setSettling(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Fast Track Claims
            </h1>

            <Card className="glass-card border-none shadow-xl overflow-hidden backdrop-blur-md bg-white/60">
                <CardHeader className="bg-primary/5 border-b border-white/10">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        Eligible / Claimed List
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-primary/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Node ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Referrals</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Reward</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Time Left</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {claims.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-primary/5 transition-colors duration-200">
                                            <td className="px-6 py-4 font-mono text-xs font-medium text-muted-foreground">#{claim.node_id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{claim.user_name}</span>
                                                    <span className="text-xs text-muted-foreground">{claim.mobile}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {claim.city || claim.state ? (
                                                    <Button
                                                        className="text-primary hover:text-primary/80 hover:bg-primary/5 h-8 gap-2 px-3 bg-primary/5 border border-primary/20 rounded-full"
                                                        onClick={() => setViewAddressClaim(claim)}
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="text-xs font-semibold">View</span>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic pl-3">No Address</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-lg font-bold text-foreground/80">{claim.achieved_tier_referrals}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${claim.status === 'PENDING' ? 'text-muted-foreground' : 'text-amber-500'}`}>
                                                    ₹{claim.reward_value}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {claim.status === 'PENDING' ? (
                                                    <span className="text-orange-500 font-bold text-xs bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">{claim.days_remaining} Days</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {claim.status === 'CLAIMED' && (
                                                    <span className="text-emerald-600 border border-emerald-500/20 text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold shadow-sm">CLAIMED</span>
                                                )}
                                                {claim.status === 'ELIGIBLE' && (
                                                    <span className="text-indigo-600 border border-indigo-500/20 text-xs bg-indigo-500/10 px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">ELIGIBLE</span>
                                                )}
                                                {claim.status === 'PENDING' && (
                                                    <span className="text-amber-600 border border-amber-500/20 text-xs bg-amber-500/10 px-2.5 py-1 rounded-full font-bold shadow-sm">ACTIVE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {claim.status === 'ELIGIBLE' && (
                                                    <Button
                                                        className="bg-indigo-600 hover:bg-indigo-700 h-8 px-4 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                                                        onClick={() => setSelectedClaim(claim)}
                                                    >
                                                        Settle
                                                    </Button>
                                                )}
                                                {claim.status === 'CLAIMED' && (
                                                    <div className="group relative">
                                                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded border border-white/10 cursor-help truncate max-w-[150px] inline-block">{claim.product_codes}</span>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-black/80 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                            {claim.product_codes}
                                                        </div>
                                                    </div>
                                                )}
                                                {claim.status === 'PENDING' && (
                                                    <span className="text-xs text-muted-foreground italic">In Progress</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedClaim} onOpenChange={(open: boolean) => !open && setSelectedClaim(null)}>
                <DialogContent className="glass-card bg-white/95 backdrop-blur-xl border-white/20 text-foreground shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                            <Gift className="w-5 h-5" /> Settle Claim for Node #{selectedClaim?.node_id}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-sm font-medium text-foreground mb-1">Instruction</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter the product code(s) or voucher details provided to the user. This will mark the reward as <span className="font-bold text-emerald-600">CLAIMED</span> permanently.
                            </p>
                        </div>

                        <div className="bg-white/50 p-4 rounded-xl border border-white/20">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Shipping Address</p>
                            <p className="text-sm font-medium text-foreground">{selectedClaim?.full_address || 'No Address Set'}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Product / Voucher Codes</label>
                            <Input
                                value={productCodes}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductCodes(e.target.value)}
                                placeholder="e.g. PROD-1234, VOUCHER-5678"
                                className="bg-white/50 border-input text-foreground font-mono focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button className="px-4 py-2 rounded-lg hover:bg-muted font-medium transition-colors" onClick={() => setSelectedClaim(null)}>Cancel</button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg hover:shadow-indigo-500/25"
                            onClick={handleSettle}
                            disabled={settling || !productCodes}
                        >
                            {settling ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {settling ? 'Settling...' : 'Confirm Settlement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Address View Dialog */}
            <Dialog open={!!viewAddressClaim} onOpenChange={(open: boolean) => !open && setViewAddressClaim(null)}>
                <DialogContent className="glass-card bg-white/95 backdrop-blur-xl border-white/20 text-foreground shadow-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                            <MapPin className="w-5 h-5" /> Shipping Address
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">User Details</p>
                            <p className="text-sm font-semibold text-foreground">{viewAddressClaim?.user_name}</p>
                            <p className="text-xs text-muted-foreground">{viewAddressClaim?.mobile}</p>
                        </div>

                        <div className="bg-white/50 p-4 rounded-xl border border-white/20">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Full Address</p>
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                                {viewAddressClaim?.full_address || 'No Address Provided'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full" onClick={() => setViewAddressClaim(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
