import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: Number(process.env.PORT ?? 3000),
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
    jwt: {
        secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
        accessExpirationMinutes: Number(process.env.JWT_ACCESS_EXP_MINUTES ?? 180),
        refreshExpirationDays: Number(process.env.JWT_REFRESH_EXP_DAYS ?? 7),
    },
    mail: {
        host: process.env.SMTP_HOST ?? '',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: String(process.env.SMTP_SECURE ?? 'false') === 'true',
        user: process.env.SMTP_USER ?? process.env.SMTP_USERNAME ?? '',
        pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? '',
        from: process.env.MAIL_FROM ?? 'no-reply@example.com',
    },
    requireVerifiedForLogin: String(process.env.REQUIRE_EMAIL_VERIFIED_FOR_LOGIN ?? 'false') === 'true',

};
