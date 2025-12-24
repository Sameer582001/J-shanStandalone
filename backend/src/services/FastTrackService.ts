import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../config/plan_config.json');
const planConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export interface FastTrackStatus {
    status: string;
    achieved_tier_referrals: number;
    reward_value: number;
    product_codes: string | null;
    is_finalized: boolean;
    days_remaining: number;
    current_referrals?: number;
}

export class FastTrackService {

    /**
     * Checks eligibility for a node and returns the status.
     * If the 10-day window has passed, it finalizes the result in the DB.
     */
    async getFastTrackStatus(nodeId: number): Promise<FastTrackStatus> {
        // 1. Check if already finalized/claimed
        const existing = await query(
            'SELECT * FROM FastTrackBenefits WHERE node_id = $1',
            [nodeId]
        );

        if (existing.rows.length > 0) {
            return {
                status: existing.rows[0].status,
                achieved_tier_referrals: existing.rows[0].achieved_tier_referrals,
                reward_value: parseFloat(existing.rows[0].reward_value),
                product_codes: existing.rows[0].product_codes,
                is_finalized: true,
                days_remaining: 0
            };
        }

        // 2. If not in DB, calculate live status
        const nodeRes = await query('SELECT created_at, direct_referrals_count FROM Nodes WHERE id = $1', [nodeId]);
        if (nodeRes.rows.length === 0) throw new Error('Node not found');

        const node = nodeRes.rows[0];
        const createdAt = new Date(node.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Accurate remaining calculation
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
        const expiryDate = new Date(createdAt.getTime() + tenDaysMs);
        const remainingMs = expiryDate.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

        // Count referrals made within the window
        // Actually, we need to count referrals whose created_at is <= expiryDate
        // But for simplicity, if window is active, current count is valid.
        // If window expired, we query strictly.

        let referralCount = 0;

        if (remainingMs > 0) {
            // Still active, take current count (or query strictly if needed, but 'direct_referrals_count' is usually live)
            // We'll trust the aggregate if it's reliable, or count manually for precision.
            // Let's count manually to be safe about timestamps.
            referralCount = await this.countQualifyingReferrals(nodeId, expiryDate);
        } else {
            // Expired, count strictly up to expiry
            referralCount = await this.countQualifyingReferrals(nodeId, expiryDate);

            // Since it's expired and not in DB, we should attempt to finalize it (Lazy Finalization)
            await this.finalizeEligibility(nodeId, referralCount);
            // Re-fetch to return consistent structure
            return this.getFastTrackStatus(nodeId);
        }

        const currentTier = this.determineTier(referralCount);

        return {
            status: 'PENDING',
            achieved_tier_referrals: currentTier ? currentTier.referrals : 0,
            reward_value: currentTier ? currentTier.reward_value : 0,
            product_codes: null,
            is_finalized: false,
            days_remaining: remainingDays,
            current_referrals: referralCount
        };
    }

    private async countQualifyingReferrals(sponsorNodeId: number, expiryDate: Date): Promise<number> {
        const res = await query(
            'SELECT COUNT(*) as count FROM Nodes WHERE sponsor_node_id = $1 AND created_at <= $2',
            [sponsorNodeId, expiryDate]
        );
        return parseInt(res.rows[0].count);
    }

    private determineTier(referralCount: number) {
        const tiers = planConfig.fast_track.tiers; // Assumes sorted asc or we sort
        // Find the highest tier met
        // Tiers: [ {referrals: 0, 1750}, {referrals: 3, 5000}, ... ]
        // If count is 4, we want the tier with referrals=3.

        let bestTier = null;
        for (const tier of tiers) {
            if (referralCount >= tier.referrals) {
                bestTier = tier;
            }
        }
        return bestTier;
    }

    async finalizeEligibility(nodeId: number, referralCount: number) {
        const tier = this.determineTier(referralCount);
        if (!tier) return; // Should not happen given 0 tier, but safety

        const nodeRes = await query('SELECT owner_user_id FROM Nodes WHERE id = $1', [nodeId]);
        const userId = nodeRes.rows[0].owner_user_id;

        await query(
            `INSERT INTO FastTrackBenefits 
            (node_id, user_id, achieved_tier_referrals, reward_value, status)
            VALUES ($1, $2, $3, $4, 'ELIGIBLE')
            ON CONFLICT (node_id) DO NOTHING`,
            [nodeId, userId, tier.referrals, tier.reward_value]
        );
    }

    async getEligibleList() {
        // 1. Get Finalized/Eligible/Claimed from DB
        const finalizedRes = await query(`
            SELECT ft.*, u.full_name as user_name, u.email, u.mobile, 0 as days_remaining 
            FROM FastTrackBenefits ft
            JOIN Users u ON ft.user_id = u.id
        `);
        const finalized = finalizedRes.rows.map(row => ({
            ...row,
            is_active: false,
            reward_value: parseFloat(row.reward_value) // Ensure number
        }));

        // 2. Get Active Nodes (Created within last 10 days, NOT in FastTrackBenefits)
        // We also need their current referral count
        const activeRes = await query(`
            SELECT 
                n.id as node_id, 
                n.created_at, 
                n.owner_user_id as user_id,
                u.full_name as user_name, 
                u.mobile,
                (SELECT COUNT(*) FROM Nodes r WHERE r.sponsor_node_id = n.id) as achieved_tier_referrals
            FROM Nodes n
            JOIN Users u ON n.owner_user_id = u.id
            WHERE n.created_at > NOW() - INTERVAL '10 days'
            AND n.id NOT IN (SELECT node_id FROM FastTrackBenefits)
        `);

        // Helper to calculate active status
        const now = new Date();
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

        const active = activeRes.rows.map(row => {
            const createdAt = new Date(row.created_at);
            const expiryDate = new Date(createdAt.getTime() + tenDaysMs);
            const remainingMs = expiryDate.getTime() - now.getTime();
            const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

            // Determine potential reward tier for display
            const currentCount = parseInt(row.achieved_tier_referrals);
            const tier = this.determineTier(currentCount);

            return {
                id: `active-${row.node_id}`, // Temp ID for frontend key
                node_id: row.node_id,
                user_id: row.user_id,
                user_name: row.user_name,
                mobile: row.mobile,
                achieved_tier_referrals: currentCount,
                reward_value: tier ? tier.reward_value : 0,
                status: 'PENDING',
                product_codes: null,
                days_remaining: daysRemaining,
                is_active: true
            };
        });

        // 3. Merge and Sort
        // "one who is very near to clame should be show on very top" -> Sort by Referrals DESC
        const combined = [...finalized, ...active];

        combined.sort((a, b) => {
            // Primary: Status Priority (Eligible > Pending > Claimed) ? 
            // Or just pure referral count as requested? 
            // "progress... near to clame" implies referral count is key.
            // Let's sort by Referrals DESC.
            if (b.achieved_tier_referrals !== a.achieved_tier_referrals) {
                return b.achieved_tier_referrals - a.achieved_tier_referrals;
            }
            // Secondary: If referrals equal, prioritize those with LESS time remaining (urgent)
            return a.days_remaining - b.days_remaining;
        });

        return combined;
    }

    async settleClaim(claimId: number, productCodes: string) {
        const res = await query(
            `UPDATE FastTrackBenefits 
             SET status = 'CLAIMED', product_codes = $1, claimed_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [productCodes, claimId]
        );
        return res.rows[0];
    }
}
