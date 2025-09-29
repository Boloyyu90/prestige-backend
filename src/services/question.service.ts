import prisma from '../client';
import type { QuestionType } from '../types/prisma';
import { Errors } from '../utils/errors';
import { sanitizeContent, sanitizeSearchQuery } from '../utils/sanitize';

interface CreateQuestionData {
    content: string;
    options: any;
    correctAnswer: any;
    defaultScore?: number;
    questionType: QuestionType;
}

export async function createQuestion(data: CreateQuestionData) {
    // Sanitize content
    const sanitizedData = {
        ...data,
        content: sanitizeContent(data.content)
    };

    return prisma.questionBank.create({ data: sanitizedData });
}

export async function getQuestionById(id: number) {
    const question = await prisma.questionBank.findUnique({
        where: { id },
        include: {
            _count: {
                select: { examQuestions: true }
            }
        }
    });

    if (!question) throw Errors.NotFound('Question not found');
    return question;
}

export async function listQuestions(filters?: {
    questionType?: QuestionType;
    search?: string;
}) {
    const where: any = {};

    if (filters?.questionType) {
        where.questionType = filters.questionType;
    }

    if (filters?.search) {
        const sanitizedSearch = sanitizeSearchQuery(filters.search);
        where.content = {
            contains: sanitizedSearch,
            mode: 'insensitive'
        };
    }

    return prisma.questionBank.findMany({
        where,
        include: {
            _count: {
                select: { examQuestions: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateQuestion(id: number, data: Partial<CreateQuestionData>) {
    // Check if question exists
    const existing = await prisma.questionBank.findUnique({ where: { id } });
    if (!existing) throw Errors.NotFound('Question not found');

    // Check if question is used in any exam
    const usageCount = await prisma.examQuestion.count({
        where: { questionId: id }
    });

    if (usageCount > 0 && data.defaultScore !== undefined) {
        console.warn(`Changing defaultScore for question ${id} used in ${usageCount} exams`);
    }

    // Sanitize content if provided
    const sanitizedData: any = {};
    if (data.content) sanitizedData.content = sanitizeContent(data.content);
    if (data.options !== undefined) sanitizedData.options = data.options;
    if (data.correctAnswer !== undefined) sanitizedData.correctAnswer = data.correctAnswer;
    if (data.defaultScore !== undefined) sanitizedData.defaultScore = data.defaultScore;
    if (data.questionType !== undefined) sanitizedData.questionType = data.questionType;

    return prisma.questionBank.update({
        where: { id },
        data: sanitizedData
    });
}

export async function deleteQuestion(id: number) {
    // Check if question exists
    const existing = await prisma.questionBank.findUnique({ where: { id } });
    if (!existing) throw Errors.NotFound('Question not found');

    // Check if question is used in any exam
    const usageCount = await prisma.examQuestion.count({
        where: { questionId: id }
    });

    if (usageCount > 0) {
        throw Errors.BadRequest(`Cannot delete question used in ${usageCount} exam(s)`);
    }

    return prisma.questionBank.delete({ where: { id } });
}

export async function bulkImportQuestions(questions: CreateQuestionData[]) {
    // Sanitize all contents
    const sanitizedQuestions = questions.map(q => ({
        ...q,
        content: sanitizeContent(q.content)
    }));

    const result = await prisma.questionBank.createMany({
        data: sanitizedQuestions,
        skipDuplicates: true
    });

    return result;
}