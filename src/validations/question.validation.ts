import { z } from 'zod';

export const createQuestionSchema = z.object({
    body: z.object({
        content: z.string().min(10),
        options: z.any(), // Json - flexible structure
        correctAnswer: z.any(), // Now Json, not string!
        defaultScore: z.number().int().min(0).max(10).optional(),
        questionType: z.enum(['TIU', 'TKP', 'TWK'])
    })
});

export const updateQuestionSchema = z.object({
    params: z.object({
        questionId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        content: z.string().min(10).optional(),
        options: z.any().optional(),
        correctAnswer: z.any().optional(), // Now Json
        defaultScore: z.number().int().min(0).max(10).optional(),
        questionType: z.enum(['TIU', 'TKP', 'TWK']).optional()
    })
});

export const bulkImportQuestionsSchema = z.object({
    body: z.object({
        questions: z.array(z.object({
            content: z.string().min(10),
            options: z.any(),
            correctAnswer: z.any(),
            defaultScore: z.number().int().min(0).max(10).optional(),
            questionType: z.enum(['TIU', 'TKP', 'TWK'])
        })).min(1).max(100) // Max 100 questions per import
    })
});
