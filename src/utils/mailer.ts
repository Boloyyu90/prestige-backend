import nodemailer from 'nodemailer';
import { config } from '../config/config';

const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
        user: config.mail.user,
        pass: config.mail.pass,
    },
});

export async function sendMail(to: string, subject: string, html: string) {
    const info = await transporter.sendMail({
        from: config.mail.from,
        to,
        subject,
        html,
    });
    return info.messageId;
}

export function verificationEmailTemplate(verifyUrl: string, name: string) {
    return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px">
    <h2>Verify your email</h2>
    <p>Hi ${name},</p>
    <p>Terima kasih sudah mendaftar di Prestige Tryout. Klik tombol di bawah untuk verifikasi email kamu:</p>
    <p><a href="${verifyUrl}"
      style="background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">
      Verify Email
    </a></p>
    <p>Atau salin tautan ini ke browser:<br><code>${verifyUrl}</code></p>
    <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
  </div>`;
}
