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
            correctAnswer: z.string().min(1),
            defaultScore: z.number().int().min(0).max(10).optional(),
            questionType: z.enum(['TIU', 'TKP', 'TWK'])
        })).min(1).max(100) // Max 100 questions per import
    })
});

export const submitAnswerSchema = z.object({
    params: z.object({
        userExamId: z.string().regex(/^\d+$/),
        questionId: z.string().regex(/^\d+$/)
    }),
    body: z.object({
        selectedAnswer: z.any(), // Json flexible
        timeSpent: z.number().int().positive().optional()
    })
});

export const finishExamSchema = z.object({
    params: z.object({
        userExamId: z.string().regex(/^\d+$/) // Fixed: should be userExamId, not examId
    }),
    body: z.object({
        forceFinish: z.boolean().optional()
    })
});
