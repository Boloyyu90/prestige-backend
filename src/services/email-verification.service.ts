import prisma from '../client';
import { config } from '../config/config';
import { sendMail, verificationEmailTemplate } from '../utils/mailer';
import { createVerifyEmailToken, consumeVerifyEmailToken } from './token.service';

export async function sendVerificationEmail(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const raw = await createVerifyEmailToken(user.id);
    const url = `${config.publicBaseUrl}/v1/auth/verify-email?token=${encodeURIComponent(raw)}&uid=${user.id}`;
    const html = verificationEmailTemplate(url, user.name);

    await sendMail(user.email, 'Verify your email', html);
    return { sentTo: user.email };
}

export async function verifyEmail(userId: number, rawToken: string) {
    const token = await consumeVerifyEmailToken(userId, rawToken);
    if (!token) throw new Error('Invalid or expired token');

    await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
    });

    return { verified: true };
}
