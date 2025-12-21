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
        // Returns list of finalized records + maybe pending ones close to completion? 
        // Request implies "who all got clamed... settle a clame". So focus on Eligible/Claimed.
        const res = await query(`
            SELECT ft.*, u.full_name as user_name, u.email, u.mobile 
            FROM FastTrackBenefits ft
            JOIN Users u ON ft.user_id = u.id
            ORDER BY ft.created_at DESC
        `);
        return res.rows;
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
