import { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import * as authSvc from '../services/auth.service';
import * as verifySvc from '../services/email-verification.service';
import * as resetSvc from '../services/password-reset.service';
import * as emailSvc from '../services/email-verification.service';
import type { AuthenticatedRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        const bootstrapHeader = String(req.headers['x-admin-bootstrap'] ?? '');
        const data = await authSvc.register(name, email, password, role, bootstrapHeader);
        // data.user + tokens dikembalikan; pengiriman email verifikasi non-fatal (ditangani di service)
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
        const data = await authSvc.login(email, password);
        return res.status(httpStatus.OK).json({ message: 'Logged in', ...data });
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
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message ?? 'Internal error' });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        const tokens = await authSvc.refreshTokens(refreshToken);
        return res.status(httpStatus.OK).json({ message: 'Refreshed', tokens });
    } catch {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        await authSvc.logout(refreshToken);
    } catch {
        // idempotent: walau token invalid/sudah dihapus, tetap 200
    }
    return res.status(httpStatus.OK).json({ message: 'Logged out' });
};

export const sendVerificationEmail: RequestHandler = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    await emailSvc.sendVerificationEmail(req.user.id);
    return res.status(200).json({ message: 'Verification email sent' });
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { token, uid } = req.query as { token?: string; uid?: string };
    if (!token || !uid) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Missing token or uid' });
    }
    const userId = Number(uid);
    try {
        const result = await verifySvc.verifyEmail(userId, token);
        return res.status(httpStatus.OK).json({ message: 'Email verified', ...result });
    } catch (e: any) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: e?.message ?? 'Invalid or expired token' });
    }
};

/**
 * P1-2: Endpoint PUBLIK untuk resend verification (tanpa login), dilindungi rate limit
 * Body: { email: string }
 */
export const resendVerificationPublic = async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Email is required' });
    }
    try {
        await verifySvc.sendVerificationEmailByEmail(email);
    } catch (_err: any) {
        // Jangan bocorkan apakah email terdaftar (untuk keamanan)
    }
    return res.status(httpStatus.OK).json({ message: 'If the email exists, a verification link has been sent.' });
};

/** Forgot password → selalu 200 agar tidak bocorkan email terdaftar/tidak */
export async function forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    try {
        await resetSvc.requestPasswordReset(email);
        return res.status(httpStatus.OK).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (_err) {
        // jangan bocorkan alasan
        return res.status(httpStatus.OK).json({ message: 'If that email exists, a reset link has been sent.' });
    }
}

/** Reset password pakai token single-use */
export async function resetPassword(req: Request, res: Response) {
    const { token, uid, newPassword } = req.body;
    try {
        await resetSvc.resetPassword(token, Number(uid), newPassword);
        return res.status(httpStatus.OK).json({ message: 'Password has been reset. Please login again.' });
    } catch (_err) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid or expired reset token' });
    }
}