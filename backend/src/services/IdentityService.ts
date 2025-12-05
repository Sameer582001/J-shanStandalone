import crypto from 'crypto';

export class IdentityService {
    /**
     * Generates a unique referral code in the format JSE-[HEX]
     * e.g., JSE-0A475E
     */
    static generateReferralCode(): string {
        const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `JSE-${hex}`;
    }

    /**
     * Validates if a code matches the format
     */
    static isValidReferralCode(code: string): boolean {
        return /^JSE-[A-F0-9]{6}$/.test(code);
    }
}
