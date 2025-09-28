import prisma from '../client';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import type { UserRole } from '@prisma/client';
import { generateRefreshToken, saveRefreshToken, verifyRefreshToken, revokeRefreshToken } from './token.service';
import { sendVerificationEmail } from './email-verification.service';
import { config } from '../config/config'

export const register = async (
    name: string,
    email: string,
    password: string,
    requestedRole?: UserRole,
    bootstrapHeader?: string
) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Email already registered');

    // role default = PARTICIPANT (lihat diskusi sebelumnya)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    const bootstrapOk =
        bootstrapHeader && process.env.ADMIN_BOOTSTRAP_TOKEN && bootstrapHeader === process.env.ADMIN_BOOTSTRAP_TOKEN;

    let role: UserRole = 'PARTICIPANT';
    if ((requestedRole === 'ADMIN') && (isFirstUser || bootstrapOk)) {
        role = 'ADMIN';
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { name, email, password: passwordHash, role, isEmailVerified: false },
    });

    // kirim email verifikasi (non-blocking disarankan; untuk sederhana await saja)
    await sendVerificationEmail(user.id);

    const access = signAccessToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    const refresh = generateRefreshToken();
    await saveRefreshToken(user.id, refresh);

    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role , isEmailVerified: user.isEmailVerified},
        tokens: { access, refresh },
    };
};

export const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const ok = await comparePassword(password, user.password);
    if (!ok) throw new Error('Invalid credentials');

    if (config.requireVerifiedForLogin && !user.isEmailVerified) {
        const err: any = new Error('Email not verified');
        err.code = 'EMAIL_NOT_VERIFIED';
        throw err;
    }

    const access = signAccessToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    const refresh = generateRefreshToken();
    await saveRefreshToken(user.id, refresh);

    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
        tokens: { access, refresh },
    };
};


export const refreshTokens = async (refreshToken: string) => {
    const tk = await verifyRefreshToken(refreshToken);
    if (!tk) throw new Error('Invalid refresh token');

    const u = tk.user;
    const access = signAccessToken({ sub: u.id, email: u.email, name: u.name, role: u.role });
    const newRefresh = generateRefreshToken();
    await revokeRefreshToken(refreshToken);
    await saveRefreshToken(u.id, newRefresh);

    return { access, refresh: newRefresh };
};

export const logout = (refreshToken: string) => revokeRefreshToken(refreshToken);
