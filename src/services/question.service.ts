import prisma from '../client';
import type { QuestionType } from '../types/prisma';

interface CreateQuestionData {
    content: string;
    options: any; // Json
    correctAnswer: any;
    defaultScore?: number;
    questionType: QuestionType;
}

export async function createQuestion(data: CreateQuestionData) {
    return prisma.questionBank.create({ data });
}

export async function getQuestionById(id: number) {
    return prisma.questionBank.findUnique({
        where: { id },
        include: {
            _count: {
                select: { examQuestions: true }
            }
        }
    });
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
        where.content = {
            contains: filters.search,
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
    // Check if question is used in any exam
    const usageCount = await prisma.examQuestion.count({
        where: { questionId: id }
    });

    if (usageCount > 0 && data.defaultScore !== undefined) {
        // Warning: changing default score won't affect existing exams with effectiveScore
        console.warn(`Changing defaultScore for question ${id} used in ${usageCount} exams`);
    }

    return prisma.questionBank.update({
        where: { id },
        data
    });
}

export async function deleteQuestion(id: number) {
    // Check if question is used in any exam
    const usageCount = await prisma.examQuestion.count({
        where: { questionId: id }
    });

    if (usageCount > 0) {
        throw new Error(`Cannot delete question used in ${usageCount} exam(s)`);
    }

    return prisma.questionBank.delete({ where: { id } });
}

export async function bulkImportQuestions(questions: CreateQuestionData[]) {
    return prisma.questionBank.createMany({
        data: questions,
        skipDuplicates: true
    });
}
