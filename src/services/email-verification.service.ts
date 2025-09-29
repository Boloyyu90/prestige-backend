import prisma from '../client';
import crypto from 'crypto';
import { addHours, isAfter } from 'date-fns';
import { sendMail, verificationEmailTemplate } from '../utils/mailer';
import { config } from '../config/config';

function randomHex(len = 32) {
    return crypto.randomBytes(len).toString('hex');
}
function sha256(s: string) {
    return crypto.createHash('sha256').update(s).digest('hex');
}

export async function createVerifyEmailToken(userId: number) {
    // blacklist token verifikasi sebelumnya
    await prisma.token.updateMany({
        where: { userId, type: 'VERIFY_EMAIL', blacklisted: false },
        data: { blacklisted: true },
    });

    const raw = randomHex(32);
    const tokenHash = sha256(raw);

    const expires = addHours(new Date(), 24);
    await prisma.token.create({
        data: {
            userId,
            type: 'VERIFY_EMAIL',
            tokenHash,
            expires,
            blacklisted: false,
        },
    });
    return { raw, expires };
}

export async function sendVerificationEmail(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const { raw } = await createVerifyEmailToken(user.id);
    const verifyUrl = `${config.app.publicBaseUrl}/v1/auth/verify-email?token=${raw}&uid=${user.id}`;
    const html = verificationEmailTemplate(verifyUrl, user.name);
    await sendMail(user.email, 'Verify your email', html);
    return { email: user.email };
}

export async function sendVerificationEmailByEmail(email: string) {
    // ADD: Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new Error('User not found');
    return sendVerificationEmail(user.id);
}

export async function verifyEmail(userId: number, rawToken: string) {
    const tokenHash = sha256(rawToken);

    // Use transaction from the start to prevent race condition
    return await prisma.$transaction(async (tx) => {
        const token = await tx.token.findFirst({
            where: { userId, type: 'VERIFY_EMAIL', tokenHash, blacklisted: false },
        });

        if (!token) throw new Error('Invalid or expired token');
        if (isAfter(new Date(), token.expires)) throw new Error('Invalid or expired token');

        // Update both in same transaction
        await tx.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
        await tx.token.update({ where: { id: token.id }, data: { blacklisted: true } });

        return { userId, verified: true };
    });
}
