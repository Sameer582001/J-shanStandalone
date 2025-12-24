import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

export class AuthController {
    static async sendOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }
            const result = await authService.sendOtp(email);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async register(req: Request, res: Response) {
        try {
            const { fullName, email, mobile, otp } = req.body; // Removed 'password' check
            if (!fullName || !email || !mobile || !otp) {
                return res.status(400).json({ message: 'All fields (including OTP) are required' });
            }
            const result = await authService.register(req.body);
            res.status(201).json({ message: 'Registration successful', data: result });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const result = await authService.login(req.body.mobile, req.body.password);
            res.status(200).json({ message: 'Login successful', data: result });
        } catch (error: any) {
            res.status(401).json({ message: error.message });
        }
    }
}
