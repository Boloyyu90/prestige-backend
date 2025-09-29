import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as authSvc from '../services/auth.service';
import * as verifySvc from '../services/email-verification.service';
import * as resetSvc from '../services/password-reset.service';
import type { AuthenticatedRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role } = req.body;
        const bootstrapHeader = String(req.headers['x-admin-bootstrap'] ?? '');
        const data = await authSvc.register(name, email, password, role, bootstrapHeader);
        return res.status(httpStatus.CREATED).json({ message: 'Registered', ...data });
    } catch (error) {
        return next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const data = await authSvc.login(email, password);
        return res.status(httpStatus.OK).json({ message: 'Logged in', ...data });
    } catch (error) {
        return next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        const tokens = await authSvc.refreshTokens(refreshToken);
        return res.status(httpStatus.OK).json({ message: 'Refreshed', tokens });
    } catch (error) {
        return next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        await authSvc.logout(refreshToken);
        return res.status(httpStatus.OK).json({ message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};

export const sendVerificationEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        await verifySvc.sendVerificationEmail(req.user.id);
        return res.status(httpStatus.OK).json({ message: 'Verification email sent' });
    } catch (error) {
        return next(error);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, uid } = req.query as { token?: string; uid?: string };
        if (!token || !uid) {
            throw new Error('Missing token or uid');
        }
        const userId = Number(uid);
        const result = await verifySvc.verifyEmail(userId, token);
        return res.status(httpStatus.OK).json({ message: 'Email verified', ...result });
    } catch (error) {
        return next(error);
    }
};

export const resendVerificationPublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body as { email?: string };
        if (!email) {
            throw new Error('Email is required');
        }
        await verifySvc.sendVerificationEmailByEmail(email);
        return res.status(httpStatus.OK).json({
            message: 'If the email exists, a verification link has been sent.'
        });
    } catch (error) {
        // Don't expose if email exists (security)
        return res.status(httpStatus.OK).json({
            message: 'If the email exists, a verification link has been sent.'
        });
    }
};

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;
        await resetSvc.requestPasswordReset(email);
        return res.status(httpStatus.OK).json({
            message: 'If that email exists, a reset link has been sent.'
        });
    } catch (error) {
        // Don't expose if email exists (security)
        return res.status(httpStatus.OK).json({
            message: 'If that email exists, a reset link has been sent.'
        });
    }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, uid, newPassword } = req.body;
        await resetSvc.resetPassword(token, Number(uid), newPassword);
        return res.status(httpStatus.OK).json({
            message: 'Password has been reset. Please login again.'
        });
    } catch (error) {
        return next(error);
    }
}