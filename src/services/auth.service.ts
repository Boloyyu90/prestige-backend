import prisma from '../client';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, generateRefreshToken, saveRefreshToken } from '../utils/jwt';
import { config } from '../config/config';
import type { UserRole } from '@prisma/client';
import * as verifySvc from './email-verification.service';

export const register = async (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    adminBootstrapHeader?: string,
) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Email already registered');

    // Admin bootstrap (opsional sesuai header)
    let finalRole: UserRole = role ?? 'PARTICIPANT';
    if (adminBootstrapHeader && adminBootstrapHeader === process.env.ADMIN_BOOTSTRAP_SECRET) {
        finalRole = 'ADMIN';
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { name, email, password: passwordHash, role: finalRole, isEmailVerified: false },
    });

    // ⬅️ P1: kirim email verifikasi non-fatal (jangan jatuhkan register)
    try {
        await verifySvc.sendVerificationEmail(user.id);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Verification email failed:', (err as any)?.message);
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

export const login = async (email: string, password: string) => {
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
    // validasi & rotasi token dilakukan di utils/jwt (hash verif, blacklist dsb.)
    const { access, newRefresh } = await (await import('../utils/jwt')).rotateRefreshToken(refreshToken);
    return { access, refresh: newRefresh };
};

export const logout = async (refreshToken: string) => {
    await (await import('../utils/jwt')).blacklistRefreshToken(refreshToken);
};
