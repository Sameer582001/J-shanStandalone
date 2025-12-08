import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { NotificationService } from './NotificationService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const notificationService = new NotificationService();

export class AuthService {



    async register(data: any) {
        const { fullName, email, mobile, password } = data;

        // 1. Check if user exists (by mobile or email)
        const userCheck = await query('SELECT id FROM Users WHERE mobile = $1 OR email = $2', [mobile, email]);
        if (userCheck.rows.length > 0) {
            throw new Error('User already exists (Mobile or Email)');
        }

        // 2. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const authId = `AUTH-${Date.now()}`; // Placeholder for external auth ID
        const userRes = await query(
            'INSERT INTO Users (auth_id, full_name, email, mobile, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [authId, fullName, email, mobile, hashedPassword]
        );
        const userId = userRes.rows[0].id;

        // 3. Send Notification
        await notificationService.sendWelcomeEmail(email, mobile, authId);

        return { userId, message: 'User registered successfully' };
    }

    async login(mobile: string, password: string) {
        const res = await query('SELECT * FROM Users WHERE mobile = $1', [mobile]);
        if (res.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = res.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            throw new Error('Invalid password');
        }

        console.log('Login: Generating token with secret:', JWT_SECRET.substring(0, 5) + '...');
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return { token, user: { id: user.id, mobile: user.mobile, role: user.role } };
    }
}
