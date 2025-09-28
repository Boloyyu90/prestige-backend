import crypto from 'crypto';
import { addHours, isAfter } from 'date-fns';
import prisma from '../client';
import { hashPassword } from '../utils/password';
import * as mail from '../utils/mailer'; // asumsi kamu sudah punya mailer
import { config } from '../config/config';

/** util hash token raw → sha256 hex (sama seperti refresh/verify) */

function sha256(s: string): string {
    return crypto.createHash('sha256').update(s).digest('hex');
}

/** Buat token reset single-use & kirim email. Respons selalu 200 (hening) */
export async function requestPasswordReset(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu balas 200 meski user tidak ada (anti email enumeration)
    if (!user) return;

    // Blacklist token reset sebelumnya (opsional aman)
    await prisma.token.updateMany({
        where: { userId: user.id, type: 'RESET_PASSWORD', blacklisted: false },
        data: { blacklisted: true },
    });

    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(raw);
    const expires = addHours(new Date(), 2); // 2 jam masa berlaku

    await prisma.token.create({
        data: {
            userId: user.id,
            type: 'RESET_PASSWORD',
            tokenHash,
            blacklisted: false,
            expires,
        },
    });

    // Kirim email (link berisi token & uid)
    const resetUrl = `${config.app.publicBaseUrl}/v1/auth/reset-password?token=${raw}&uid=${user.id}`;
    const html = `
      <p>Halo ${user.name},</p>
      <p>Kamu meminta reset password. Klik tautan berikut untuk membuat password baru (berlaku 2 jam):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Jika kamu tidak meminta ini, abaikan email ini.</p>
    `;

    await mail.sendMail(email, 'Reset your password', html);
}

/** Konsumsi token, set password baru, blacklist reset token, dan logout semua sesi. */
export async function resetPassword(rawToken: string, uid: number, newPassword: string) {
    const tokenHash = sha256(rawToken);

    const token = await prisma.token.findFirst({
        where: { userId: uid, type: 'RESET_PASSWORD', tokenHash, blacklisted: false },
    });

    if (!token) throw new Error('Invalid reset token');

    if (isAfter(new Date(), token.expires)) {
        await prisma.token.update({ where: { id: token.id }, data: { blacklisted: true } });
        throw new Error('Invalid reset token');
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
        await prisma.token.update({ where: { id: token.id }, data: { blacklisted: true } });
        throw new Error('Invalid reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
        // 1) ganti password
        prisma.user.update({
            where: { id: uid },
            data: { password: passwordHash },
        }),
        // 2) blacklist token reset yang dipakai
        prisma.token.update({
            where: { id: token.id },
            data: { blacklisted: true },
        }),
        // 3) optional security: logout semua sesi (blacklist semua refresh aktif)
        prisma.token.updateMany({
            where: { userId: uid, type: 'REFRESH', blacklisted: false },
            data: { blacklisted: true },
        }),
    ]);
}
