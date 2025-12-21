import React, { useEffect, useState } from 'react';
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
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Fast Track Bonus
                </CardTitle>
                {data.status === 'CLAIMED' ? (
                    <span className="bg-green-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> CLAIMED
                    </span>
                ) : (
                    <span className="bg-blue-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {data.days_remaining} DAYS LEFT
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-indigo-300">Achieved Referrals</p>
                        <p className="text-2xl font-bold">{data.current_referrals ?? data.achieved_tier_referrals}</p>
                    </div>
                    <div>
                        <p className="text-xs text-indigo-300">Potential Reward</p>
                        <p className="text-2xl font-bold text-yellow-400">₹{data.reward_value}</p>
                    </div>
                </div>

                {data.status === 'CLAIMED' && data.product_codes && (
                    <div className="mt-4 p-2 bg-black/30 rounded text-xs break-all">
                        <p className="text-gray-400 mb-1">Product Codes:</p>
                        <code className="text-green-400">{data.product_codes}</code>
                    </div>
                )}

                {data.status === 'ELIGIBLE' && !data.product_codes && (
                    <div className="mt-4 p-2 bg-yellow-500/20 rounded text-xs text-yellow-200">
                        Eligible! Contact Admin to claim your product reward.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
