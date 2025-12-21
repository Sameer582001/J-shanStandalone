import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Gift } from 'lucide-react';
import api from '@/api/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminFastTrack() {
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Fast Track Claims
            </h1>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-400" />
                        Eligible / Claimed List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="animate-spin text-white" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-400">Node ID</TableHead>
                                    <TableHead className="text-slate-400">User</TableHead>
                                    <TableHead className="text-slate-400">Referrals</TableHead>
                                    <TableHead className="text-slate-400">Reward</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.map((claim) => (
                                    <TableRow key={claim.id} className="border-slate-800 text-slate-200">
                                        <TableCell>#{claim.node_id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{claim.user_name}</span>
                                                <span className="text-xs text-slate-500">{claim.mobile}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{claim.achieved_tier_referrals}</TableCell>
                                        <TableCell className="text-yellow-400 font-bold">₹{claim.reward_value}</TableCell>
                                        <TableCell>
                                            {claim.status === 'CLAIMED' ? (
                                                <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">CLAIMED</span>
                                            ) : (
                                                <span className="text-blue-400 text-xs bg-blue-900/30 px-2 py-1 rounded">ELIGIBLE</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {claim.status === 'ELIGIBLE' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => setSelectedClaim(claim)}
                                                >
                                                    Settle
                                                </Button>
                                            )}
                                            {claim.status === 'CLAIMED' && (
                                                <span className="text-xs text-gray-500 break-all">{claim.product_codes}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedClaim} onOpenChange={(open: boolean) => !open && setSelectedClaim(null)}>
                <DialogContent className="bg-slate-900 text-white border-slate-700">
                    <DialogHeader>
                        <DialogTitle>Settle Claim for #{selectedClaim?.node_id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Enter the product code(s) provided to the user. This will mark the reward as CLAIMED.
                        </p>
                        <Input
                            value={productCodes}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductCodes(e.target.value)}
                            placeholder="e.g. PROD-1234, VOUCHER-5678"
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedClaim(null)}>Cancel</Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSettle}
                            disabled={settling || !productCodes}
                        >
                            {settling ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Settlement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
