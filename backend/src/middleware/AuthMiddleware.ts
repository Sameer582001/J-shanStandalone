import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default_secret_change_me';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        console.log('Auth Header:', authHeader);

        if (!token) {
            return res.sendStatus(401);
        }

        console.log('Token:', token.substring(0, 20) + '...');
        console.log('Using Secret:', JWT_SECRET.substring(0, 5) + '...');

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err.message);
                console.error('Error Name:', err.name);
                if (err.name === 'TokenExpiredError') {
                    console.error('Expired At:', (err as any).expiredAt);
                }
                return res.sendStatus(403); // Forbidden
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

export const authorizeRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || req.user.role !== role) {
            return res.sendStatus(403); // Forbidden
        }
        next();
    };
};

export const requireAdmin = authorizeRole('ADMIN');
export const isAdmin = requireAdmin;
