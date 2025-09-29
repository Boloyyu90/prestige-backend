import prisma from '../client';
import { Errors } from '../utils/errors';
import { sanitizeString, sanitizeContent } from '../utils/sanitize';

interface CreateExamData {
    title: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    durationMinutes?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    createdBy: number;
}

export async function createExam(data: CreateExamData) {
    // Validate time constraints
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw Errors.BadRequest('End time must be after start time');
    }

    // Sanitize inputs
    const sanitizedData = {
        ...data,
        title: sanitizeString(data.title),
        description: data.description ? sanitizeContent(data.description) : undefined
    };

    return prisma.exam.create({
        data: sanitizedData,
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function getExamById(id: number, includeQuestions = false) {
    const exam = await prisma.exam.findUnique({
        where: { id },
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            },
            ...(includeQuestions && {
                examQuestions: {
                    include: {
                        question: true
                    },
                    orderBy: { orderNumber: 'asc' as const }
                }
            }),
            _count: {
                select: {
                    userExams: true,
                    examQuestions: true
                }
            }
        }
    });

    if (!exam) throw Errors.NotFound('Exam not found');
    return exam;
}

export async function listExams(filters?: {
    createdBy?: number;
    status?: 'upcoming' | 'ongoing' | 'finished';
}) {
    const now = new Date();
    const where: Record<string, unknown> = {};

    if (filters?.createdBy) where.createdBy = filters.createdBy;

    if (filters?.status === 'upcoming') {
        where.startTime = { gt: now };
    } else if (filters?.status === 'ongoing') {
        where.OR = [
            { startTime: { lte: now }, endTime: { gte: now } },
            { startTime: { lte: now }, endTime: null }
        ];
    } else if (filters?.status === 'finished') {
        where.endTime = { lt: now };
    }

    return prisma.exam.findMany({
        where,
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            },
            _count: {
                select: {
                    userExams: true,
                    examQuestions: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateExam(id: number, data: Partial<CreateExamData>) {
    // Check if exam exists
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) throw Errors.NotFound('Exam not found');

    // Validate time constraints
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw Errors.BadRequest('End time must be after start time');
    }

    // Check if exam has started attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId: id, startedAt: { not: null } }
    });

    if (hasAttempts > 0 && (data.shuffleQuestions !== undefined || data.shuffleOptions !== undefined)) {
        throw Errors.BadRequest('Cannot change shuffle settings after exam has been attempted');
    }

    // Sanitize inputs
    const sanitizedData: any = {};
    if (data.title) sanitizedData.title = sanitizeString(data.title);
    if (data.description !== undefined) {
        sanitizedData.description = data.description ? sanitizeContent(data.description) : null;
    }
    if (data.startTime !== undefined) sanitizedData.startTime = data.startTime;
    if (data.endTime !== undefined) sanitizedData.endTime = data.endTime;
    if (data.durationMinutes !== undefined) sanitizedData.durationMinutes = data.durationMinutes;
    if (data.shuffleQuestions !== undefined) sanitizedData.shuffleQuestions = data.shuffleQuestions;
    if (data.shuffleOptions !== undefined) sanitizedData.shuffleOptions = data.shuffleOptions;

    return prisma.exam.update({
        where: { id },
        data: sanitizedData,
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function deleteExam(id: number) {
    // Check if exam exists
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) throw Errors.NotFound('Exam not found');

    // Check if exam has any attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId: id }
    });

    if (hasAttempts > 0) {
        throw Errors.BadRequest('Cannot delete exam with existing attempts');
    }

    return prisma.$transaction([
        prisma.examQuestion.deleteMany({ where: { examId: id } }),
        prisma.exam.delete({ where: { id } })
    ]);
}

export async function addQuestionsToExam(
    examId: number,
    questionIds: number[],
    effectiveScores?: Record<string, number>
) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw Errors.NotFound('Exam not found');

    // Check if exam already has attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId, startedAt: { not: null } }
    });

    if (hasAttempts > 0) {
        throw Errors.BadRequest('Cannot add questions to exam that has been attempted');
    }

    // Verify all questions exist
    const existingQuestions = await prisma.questionBank.findMany({
        where: { id: { in: questionIds } },
        select: { id: true }
    });

    if (existingQuestions.length !== questionIds.length) {
        throw Errors.NotFound('Some questions do not exist');
    }

    // Get current max order number
    const maxOrder = await prisma.examQuestion.findFirst({
        where: { examId },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true }
    });

    let currentOrder = (maxOrder?.orderNumber ?? 0) + 1;

    // Create exam questions
    const examQuestions = questionIds.map((questionId, index) => ({
        examId,
        questionId,
        orderNumber: currentOrder + index,
        effectiveScore: effectiveScores?.[questionId.toString()] || undefined
    }));

    return prisma.examQuestion.createMany({
        data: examQuestions,
        skipDuplicates: true
    });
}

export async function removeQuestionFromExam(examId: number, questionId: number) {
    // Check if exam has attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId, startedAt: { not: null } }
    });

    if (hasAttempts > 0) {
        throw Errors.BadRequest('Cannot remove questions from exam that has been attempted');
    }

    const deleted = await prisma.examQuestion.deleteMany({
        where: { examId, questionId }
    });

    if (deleted.count === 0) {
        throw Errors.NotFound('Question not found in exam');
    }

    return deleted;
}