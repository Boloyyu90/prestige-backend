import { z } from 'zod';

export const recordProctoringEventSchema = z.object({
    params: z.object({
        userExamId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        eventType: z.enum(['FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'PHONE_DETECTED']),
        duration: z.number().int().positive().optional(),
        metadata: z.any().optional()
    })
});