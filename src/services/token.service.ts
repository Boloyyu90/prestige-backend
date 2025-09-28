import prisma from '../client';
import { sha256hex, randomHex } from '../utils/token-hash';
import { addDays, addHours } from 'date-fns';
import { config } from '../config/config';

export const generateRefreshToken = () => randomHex(32);

export const saveRefreshToken = async (userId: number, raw: string) => {
    const tokenHash = sha256hex(raw);
    const expires = addDays(new Date(), config.jwt.refreshExpirationDays);
    return prisma.token.create({
        data: { tokenHash, type: 'REFRESH', expires, blacklisted: false, userId }
    });
};

export const verifyRefreshToken = async (raw: string) => {
    const tokenHash = sha256hex(raw);
    const tk = await prisma.token.findFirst({
        where: { tokenHash, type: 'REFRESH', blacklisted: false },
        include: { user: true }
    });
    if (!tk || tk.expires < new Date()) return null;
    return tk;
};

export const revokeRefreshToken = async (raw: string) => {
    const tokenHash = sha256hex(raw);
    await prisma.token.updateMany({
        where: { tokenHash, type: 'REFRESH', blacklisted: false },
        data: { blacklisted: true }
    });
};

export const createVerifyEmailToken = async (userId: number, hours = 24) => {
    const raw = randomHex(32);
    const tokenHash = sha256hex(raw);
    const expires = addHours(new Date(), hours);

    // invalidate token verifikasi lama (opsional, biar single-active)
    await prisma.token.updateMany({
        where: { userId, type: 'VERIFY_EMAIL', blacklisted: false },
        data: { blacklisted: true },
    });

    await prisma.token.create({
        data: {
            tokenHash,
            type: 'VERIFY_EMAIL',
            expires,
            blacklisted: false,
            userId,
        },
    });

    return raw; // kirim raw lewat email
};

export const consumeVerifyEmailToken = async (userId: number, raw: string) => {
    const tokenHash = sha256hex(raw);
    const token = await prisma.token.findFirst({
        where: { userId, tokenHash, type: 'VERIFY_EMAIL', blacklisted: false },
    });
    if (!token) return null;
    if (token.expires < new Date()) return null;

    // blacklist setelah dipakai (single-use)
    await prisma.token.update({
        where: { id: token.id },
        data: { blacklisted: true },
    });

    return token;
};