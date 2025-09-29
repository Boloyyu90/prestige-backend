import { z } from 'zod';

export const createExamSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        durationMinutes: z.number().int().min(1).max(480).optional(), // max 8 hours
        shuffleQuestions: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
    })
});

export const updateExamSchema = z.object({
    params: z.object({
        examId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        title: z.string().min(3).max(255).optional(),
        description: z.string().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        durationMinutes: z.number().int().min(1).max(480).optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
    })
});

export const addQuestionsToExamSchema = z.object({
    params: z.object({
        examId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        questionIds: z.array(z.number().int().positive()).min(1),
        effectiveScores: z.record(z.string(), z.number().int().positive()).optional()
    })
});

export const startExamSchema = z.object({
    params: z.object({
        examId: z.string().regex(/^\d+$/)
    })
});

export const submitAnswerSchema = z.object({
    params: z.object({
        examId: z.string().regex(/^\d+$/),
        questionId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        selectedAnswer: z.any(), // Json flexible for TIU/TWK/TKP
        timeSpent: z.number().int().positive().optional()
    })
});

export const finishExamSchema = z.object({
    params: z.object({
        examId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        forceFinish: z.boolean().optional()
    })
});
