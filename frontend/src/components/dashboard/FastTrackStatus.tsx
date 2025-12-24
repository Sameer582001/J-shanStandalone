import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Loader2, Trophy, Clock, CheckCircle } from 'lucide-react';
import api from '@/api/axios';

interface FastTrackData {
    status: 'PENDING' | 'ELIGIBLE' | 'CLAIMED';
    achieved_tier_referrals: number;
    reward_value: number;
    product_codes: string | null;
    is_finalized: boolean;
    days_remaining: number;
    current_referrals?: number;
}

export function FastTrackStatus({ nodeId }: { nodeId: number }) {
    const [data, setData] = useState<FastTrackData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { // Updated logic to fix missing dependency
        if (!nodeId) return;
        setLoading(true);
        api.get(`/nodes/${nodeId}/fast-track`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [nodeId]);

    if (loading) return <div><Loader2 className="animate-spin h-5 w-5" /></div>;
    if (!data) return null;

    return (
        <Card className="bg-card text-card-foreground border-border shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Fast Track Bonus
                </CardTitle>
                {data.status === 'CLAIMED' ? (
                    <span className="bg-green-600/20 text-green-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-green-600/50">
                        <CheckCircle className="h-3 w-3" /> CLAIMED
                    </span>
                ) : (
                    <span className="bg-secondary/20 text-secondary-foreground text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-secondary/50">
                        <Clock className="h-3 w-3" /> {data.days_remaining} DAYS LEFT
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Achieved Referrals</p>
                        <p className="text-2xl font-bold text-foreground">{data.current_referrals ?? data.achieved_tier_referrals}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Potential Reward</p>
                        <p className="text-2xl font-bold text-primary">₹{data.reward_value}</p>
                    </div>
                </div>

                {data.status === 'CLAIMED' && data.product_codes && (
                    <div className="mt-4 p-2 bg-black/30 rounded text-xs break-all border border-white/10">
                        <p className="text-muted-foreground mb-1">Product Codes:</p>
                        <code className="text-primary">{data.product_codes}</code>
                    </div>
                )}

                {data.status === 'ELIGIBLE' && !data.product_codes && (
                    <div className="mt-4 p-2 bg-primary/20 rounded text-xs text-primary border border-primary/30">
                        Eligible! Contact Admin to claim your product reward.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
