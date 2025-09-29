import prisma from '../client';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, generateRefreshToken, saveRefreshToken } from '../utils/jwt';
import type { UserRole } from '../types/prisma';
import * as verifySvc from './email-verification.service';
import { AppError, Errors } from '../utils/errors';
import { sanitizeEmail} from "../utils/sanitize";

export const register = async (
    name: string,
    rawEmail: string,
    password: string,
    _role?: UserRole,
    adminBootstrapHeader?: string,
) => {
    const email = sanitizeEmail(rawEmail);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw Errors.Conflict('Email already registered');

    // ADMIN only via secret bootstrap
    const isBootstrap = !!adminBootstrapHeader &&
        adminBootstrapHeader === process.env.ADMIN_BOOTSTRAP_SECRET;
    const finalRole: UserRole = isBootstrap ? 'ADMIN' : 'PARTICIPANT';

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email,
            password: passwordHash,
            role: finalRole,
            isEmailVerified: false
        },
    });

    // Send verification (non-fatal)
    verifySvc.sendVerificationEmail(user.id).catch((err) => {
        console.warn('Verification email failed:', (err as Error)?.message);
    });

    const access = signAccessToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'ACCESS',
        isEmailVerified: user.isEmailVerified,
    });
    const refresh = generateRefreshToken();
    await saveRefreshToken(user.id, refresh);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        },
        tokens: { access, refresh },
    };
};

export const login = async (rawEmail: string, password: string) => {
    const email = sanitizeEmail(rawEmail);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw Errors.Unauthorized('Invalid credentials');

    const ok = await comparePassword(password, user.password);
    if (!ok) throw Errors.Unauthorized('Invalid credentials');

    // Check email verification if required
    if (process.env.REQUIRE_EMAIL_VERIFIED_FOR_LOGIN === 'true' && !user.isEmailVerified) {
        throw new AppError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
    }

    const access = signAccessToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'ACCESS',
        isEmailVerified: user.isEmailVerified,
    });
    const refresh = generateRefreshToken();
    await saveRefreshToken(user.id, refresh);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        },
        tokens: { access, refresh },
    };
};

export const refreshTokens = async (refreshToken: string) => {
    const { access, newRefresh } = await (await import('../utils/jwt')).rotateRefreshToken(refreshToken);
    return { access, refresh: newRefresh };
};

export const logout = async (refreshToken: string) => {
    await (await import('../utils/jwt')).blacklistRefreshToken(refreshToken);
};