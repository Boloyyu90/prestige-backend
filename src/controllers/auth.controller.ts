import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as svc from '../services/auth.service';
import * as verifySvc from '../services/email-verification.service';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        const bootstrapHeader = String(req.headers['x-admin-bootstrap'] ?? '');
        const data = await svc.register(name, email, password, role, bootstrapHeader);
        return res.status(httpStatus.CREATED).json({ message: 'Registered', ...data });
    } catch (e: any) {
        const msg = String(e?.message ?? '');
        if (msg.includes('Email already registered')) {
            return res.status(httpStatus.CONFLICT).json({ message: 'Email already registered' });
        }
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: msg || 'Internal error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const data = await svc.login(email, password);
        res.status(httpStatus.OK).json({ message: 'Logged in', ...data });
    } catch (e: any) {
        if (e?.code === 'EMAIL_NOT_VERIFIED') {
            return res.status(httpStatus.FORBIDDEN).json({
                message: 'Email not verified',
                hint: 'Please check your inbox or use /v1/auth/send-verification-email',
            });
        }
        if (String(e?.message).includes('Invalid credentials')) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid credentials' });
        }
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message ?? 'Internal error' });
    }
};


export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await svc.refreshTokens(refreshToken);
    res.status(httpStatus.OK).json({ message: 'Refreshed', tokens });
};

export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await svc.logout(refreshToken);
    res.status(httpStatus.OK).json({ message: 'Logged out' });
};

// NEW: resend verification (butuh login)
export const sendVerificationEmail = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id as number;
    const result = await verifySvc.sendVerificationEmail(userId);
    res.status(httpStatus.OK).json({ message: 'Verification email sent', ...result });
};

// NEW: verify
export const verifyEmail = async (req: Request, res: Response) => {
    const { token, uid } = req.query as { token?: string; uid?: string };
    if (!token || !uid) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Missing token or uid' });
    }
    const userId = Number(uid);
    const result = await verifySvc.verifyEmail(userId, token);
    res.status(httpStatus.OK).json({ message: 'Email verified', ...result });
};
