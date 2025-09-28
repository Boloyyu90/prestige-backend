import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['ADMIN', 'PARTICIPANT']).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(10),
    }),
});

export const verifyQuerySchema = z.object({
    query: z.object({
        token: z.string().min(10),
        uid: z.string().regex(/^\d+$/),
    }),
});

// P1-2: public resend verification
export const resendVerificationPublicSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(10),     // token raw dari email (hex panjang)
        uid: z.coerce.number().int().positive(), // user id dari query/email link
        newPassword: z.string().min(6),
    }),
});