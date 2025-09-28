import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['ADMIN','PARTICIPANT']).optional()
    })
});

export const getUserSchema = z.object({
    params: z.object({ userId: z.string().regex(/^\d+$/) })
});

export const updateUserSchema = z.object({
    params: z.object({ userId: z.string().regex(/^\d+$/) }),
    body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional()
    })
});
