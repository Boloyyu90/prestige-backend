import prisma from '../client';
import { Prisma, ExamStatus } from '@prisma/client';

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
        throw new Error('End time must be after start time');
    }

    return prisma.exam.create({
        data,
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function getExamById(id: number, includeQuestions = false) {
    return prisma.exam.findUnique({
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
}

export async function listExams(filters?: {
    createdBy?: number;
    status?: 'upcoming' | 'ongoing' | 'finished';
}) {
    const now = new Date();

    const where: Prisma.ExamWhereInput = {};
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
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw new Error('End time must be after start time');
    }

    // Check if exam has started attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId: id, startedAt: { not: null } }
    });

    if (hasAttempts > 0 && (data.shuffleQuestions !== undefined || data.shuffleOptions !== undefined)) {
        throw new Error('Cannot change shuffle settings after exam has been attempted');
    }

    return prisma.exam.update({
        where: { id },
        data,
        include: {
            creator: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function deleteExam(id: number) {
    // Check if exam has any attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId: id }
    });

    if (hasAttempts > 0) {
        throw new Error('Cannot delete exam with existing attempts');
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
    if (!exam) throw new Error('Exam not found');

    // Check if exam already has attempts
    const hasAttempts = await prisma.userExam.count({
        where: { examId, startedAt: { not: null } }
    });

    if (hasAttempts > 0) {
        throw new Error('Cannot add questions to exam that has been attempted');
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
        throw new Error('Cannot remove questions from exam that has been attempted');
    }

    return prisma.examQuestion.delete({
        where: {
            examId_questionId: { examId, questionId }
        }
    });
}