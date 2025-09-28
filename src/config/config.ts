import dotenv from 'dotenv';
dotenv.config();

function bool(val: string | undefined, def = false) {
    if (val === undefined) return def;
    return String(val).toLowerCase() === 'true';
}

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) {
        throw new Error(`${name} is not set`); // ⬅️ P0: Wajibkan env penting
    }
    return v;
}

export const config = {
    env: process.env.NODE_ENV ?? 'development',
    isProd: (process.env.NODE_ENV ?? 'development') === 'production',

    app: {
        port: Number(process.env.PORT ?? 3000),
        publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
    },

    jwt: {
        secret: requireEnv('JWT_SECRET'), // ⬅️ P0: tidak ada default lemah
        accessExpirationMinutes: Number(process.env.JWT_ACCESS_EXP_MINUTES ?? 180),
        refreshExpirationDays: Number(process.env.JWT_REFRESH_EXP_DAYS ?? 7),
    },

    cors: {
        // ⬅️ P0: whitelist CORS via env CSV, contoh: http://localhost:5173,https://app.yourdomain.com
        allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        allowCredentials: bool(process.env.CORS_ALLOW_CREDENTIALS, true),
    },

    mail: {
        host: process.env.SMTP_HOST ?? '',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: String(process.env.SMTP_SECURE ?? 'false') === 'true',
        // dukung dua nama env umum
        user: process.env.SMTP_USER ?? process.env.SMTP_USERNAME ?? '',
        pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? '',
        from: process.env.MAIL_FROM ?? 'no-reply@example.com',
    },

    rateLimit: {
        // ⬅️ P1: untuk endpoint publik resend verification
        windowMs: Number(process.env.RL_WINDOW_MS ?? 60_000), // 1 menit
        max: Number(process.env.RL_MAX ?? 5), // 5 req per window per IP
    },
};
