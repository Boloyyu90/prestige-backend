import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { addDays, isAfter } from 'date-fns';
import prisma from '../client';
import { config } from '../config/config';
import type { UserRole } from '@prisma/client';


/**
 * Payload user yang kita sertakan dalam ACCESS token.
 * Tambahkan "type: 'ACCESS'" agar bisa dibedakan dari refresh/jenis token lain.
 */
export type JwtUserClaims = {
    sub: number;
    email: string;
    name: string;
    role: UserRole;
    type: 'ACCESS';
    isEmailVerified?: boolean;
};

/**
 * Tanda tangan ACCESS token berdurasi menit (config.jwt.accessExpirationMinutes).
 */
export function signAccessToken(claims: JwtUserClaims): string {
    const secret: Secret = config.jwt.secret as Secret; // pastikan ke tipe Secret
    const options: SignOptions = {
        expiresIn: `${config.jwt.accessExpirationMinutes}m`, // string atau number OK
    };
    return jwt.sign(claims, secret, options);
}
/** Generator refresh token acak (raw). */
export function generateRefreshToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}

/** Hash SHA-256 util (untuk simpan refresh token ter-hash di DB). */
function sha256(s: string): string {
    return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Simpan refresh token (hash) ke DB untuk user.
 * - type: REFRESH
 * - blacklisted: false
 * - expires: now + N days (config)
 */
export async function saveRefreshToken(userId: number, rawRefresh: string) {
    const tokenHash = sha256(rawRefresh);
    const expires = addDays(new Date(), config.jwt.refreshExpirationDays);
    await prisma.token.create({
        data: {
            userId,
            type: 'REFRESH',
            tokenHash,
            expires,
            blacklisted: false,
        },
    });
}

/**
 * Blacklist refresh token (berdasarkan raw).
 * Idempotent: jika tidak ada, tidak apa-apa.
 */
export async function blacklistRefreshToken(rawRefresh: string) {
    const tokenHash = sha256(rawRefresh);
    await prisma.token.updateMany({
        where: { tokenHash, type: 'REFRESH', blacklisted: false },
        data: { blacklisted: true },
    });
}

/**
 * Validasi refresh token, blacklist yang lama, keluarkan ACCESS baru dan REFRESH baru (rotasi).
 * Throw jika token invalid/expired/blacklisted.
 */
export async function rotateRefreshToken(rawRefresh: string): Promise<{
    access: string;
    newRefresh: string;
}> {
    const tokenHash = sha256(rawRefresh);
    const token = await prisma.token.findFirst({
        where: { tokenHash, type: 'REFRESH', blacklisted: false },
    });

    if (!token) {
        throw new Error('Invalid refresh token');
    }
    if (isAfter(new Date(), token.expires)) {
        // Kadaluarsa → blacklist dan tolak
        await prisma.token.update({
            where: { id: token.id },
            data: { blacklisted: true },
        });
        throw new Error('Invalid refresh token');
    }

    // Ambil user untuk menandatangani access token
    const user = await prisma.user.findUnique({ where: { id: token.userId } });
    if (!user) {
        // jika user sudah hilang, blacklist token ini juga
        await prisma.token.update({
            where: { id: token.id },
            data: { blacklisted: true },
        });
        throw new Error('Invalid refresh token');
    }

    // Rotasi atomik
    const newRefreshRaw = generateRefreshToken();
    const newRefreshHash = sha256(newRefreshRaw);
    const newRefreshExpires = addDays(new Date(), config.jwt.refreshExpirationDays);

    await prisma.$transaction([
        prisma.token.update({
            where: { id: token.id },
            data: { blacklisted: true },
        }),
        prisma.token.create({
            data: {
                userId: user.id,
                type: 'REFRESH',
                tokenHash: newRefreshHash,
                expires: newRefreshExpires,
                blacklisted: false,
            },
        }),
    ]);

    const access = signAccessToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'ACCESS',
        isEmailVerified: user.isEmailVerified,
    });

    return { access, newRefresh: newRefreshRaw };
}
