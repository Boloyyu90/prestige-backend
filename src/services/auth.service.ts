// src/services/auth.service.ts
import prisma from '../client';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, generateRefreshToken, saveRefreshToken } from '../utils/jwt';
import type { UserRole} from '@prisma/client';
import * as verifySvc from './email-verification.service';

export const register = async (
    name: string,
    rawEmail: string,
    password: string,
    _role?: UserRole,                 // abaikan role dari body (hanya bootstrap yg bisa ADMIN)
    adminBootstrapHeader?: string,
) => {
    const email = rawEmail.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Email already registered');

    // ADMIN hanya via secret bootstrap; selain itu default PARTICIPANT
    const isBootstrap = !!adminBootstrapHeader && adminBootstrapHeader === process.env.ADMIN_BOOTSTRAP_SECRET;
    const finalRole: UserRole = isBootstrap ? 'ADMIN' : 'PARTICIPANT';

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { name, email, password: passwordHash, role: finalRole, isEmailVerified: false },
    });

    // Kirim verifikasi (non-fatal)
    verifySvc.sendVerificationEmail(user.id).catch((err) => {
        // hindari jatuhin flow register karena SMTP
        // eslint-disable-next-line no-console
        console.warn('Verification email failed:', (err as any)?.message);
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
        tokens: { access, refresh },
    };
};

export const login = async (rawEmail: string, password: string) => {
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const ok = await comparePassword(password, user.password);
    if (!ok) throw new Error('Invalid credentials');

    if (process.env.REQUIRE_EMAIL_VERIFIED_FOR_LOGIN === 'true' && !user.isEmailVerified) {
        const err: any = new Error('Email not verified');
        err.code = 'EMAIL_NOT_VERIFIED';
        throw err;
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
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
