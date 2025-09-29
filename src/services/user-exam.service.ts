import prisma from '../client';
import type { PrismaClient } from '../client';
import type { ExamStatus } from '../types/prisma';
import { scoreOneAnswer } from './scoring.util';

export const startExam = async (userId: number, examId: number) => {
    return await prisma.$transaction(async (tx: PrismaClient) => {
        // Ambil attempt terakhir user untuk exam ini
        const latest = await tx.userExam.findFirst({
            where: { userId, examId },
            orderBy: { attemptNumber: 'desc' },
            select: { attemptNumber: true }
        });
        const nextAttempt = (latest?.attemptNumber ?? 0) + 1;

        // Optional: validasi jadwal/waktu exam di sini (startTime, endTime)

        // Buat attempt
        const ue = await tx.userExam.create({
            data: {
                userId,
                examId,
                attemptNumber: nextAttempt,
                status: 'IN_PROGRESS' as ExamStatus,
                startedAt: new Date()
            },
            select: { id: true, attemptNumber: true, startedAt: true }
        });

        // Optional: jika butuh mengunci urutan soal per-attempt, generate mapping di sini

        return ue;
    });
};

export async function submitAnswer(
    userId: number,
    userExamId: number,
    examQuestionId: number,
    selectedAnswer: any
) {
    // Verify user owns this exam session
    const userExam = await prisma.userExam.findFirst({
        where: {
            id: userExamId,
            userId,
            status: 'IN_PROGRESS'
        },
        include: {
            exam: true
        }
    });

    if (!userExam) throw new Error('Invalid exam session');

    // Get question details
    const examQuestion = await prisma.examQuestion.findUnique({
        where: { id: examQuestionId },
        include: { question: true }
    });

    if (!examQuestion) throw new Error('Question not found');
    if (examQuestion.examId !== userExam.examId) throw new Error('Question not in this exam');

    // Calculate score
    let isCorrect: boolean | null = null;
    let obtainedScore = 0;

    const question = examQuestion.question;

    if (question.questionType === 'TKP') {
        // TKP: Get score from options
        const answerKey = typeof selectedAnswer === 'string'
            ? selectedAnswer
            : selectedAnswer?.option;

        if (question.options && typeof question.options === 'object') {
            obtainedScore = (question.options as any)[answerKey]?.score || 0;
        }
    } else {
        // TIU/TWK: Check if answer is correct
        isCorrect = JSON.stringify(selectedAnswer) === JSON.stringify(question.correctAnswer);

        if (isCorrect) {
            obtainedScore = examQuestion.effectiveScore || question.defaultScore;
        }
    }

    // Upsert answer
    return prisma.answer.upsert({
        where: {
            userExamId_examQuestionId: {
                userExamId,
                examQuestionId
            }
        },
        create: {
            userExamId,
            examQuestionId,
            selectedAnswer,
            isCorrect,
            obtainedScore
        },
        update: {
            selectedAnswer,
            isCorrect,
            obtainedScore,
            answeredAt: new Date()
        }
    });
}

export async function finishExam(userId: number, userExamId: number, forceFinish = false) {
    const userExam = await prisma.userExam.findFirst({
        where: {
            id: userExamId,
            userId,
            status: 'IN_PROGRESS'
        },
        include: {
            answers: true,
            exam: {
                include: {
                    examQuestions: true
                }
            }
        }
    });

    if (!userExam) throw new Error('Invalid exam session');

    // Check if all questions answered (unless force finish)
    if (!forceFinish) {
        const totalQuestions = userExam.exam.examQuestions.length;
        const answeredQuestions = userExam.answers.length;

        if (answeredQuestions < totalQuestions) {
            throw new Error(`Please answer all questions (${answeredQuestions}/${totalQuestions} completed)`);
        }
    }

    // Calculate total score
    const totalScore = userExam.answers.reduce(
        (sum: number, answer: { obtainedScore: number | null }) => sum + (answer.obtainedScore || 0),
        0
    );

    // Determine status
    let status: ExamStatus = 'FINISHED';
    if (forceFinish && userExam.exam.durationMinutes) {
        const elapsed = Date.now() - userExam.startedAt!.getTime();
        const maxDuration = userExam.exam.durationMinutes * 60 * 1000;
        if (elapsed > maxDuration) {
            status = 'TIMEOUT';
        }
    }

    return prisma.userExam.update({
        where: { id: userExamId },
        data: {
            finishedAt: new Date(),
            totalScore,
            status
        }
    });
}

export async function getExamProgress(userId: number, userExamId: number) {
    const userExam = await prisma.userExam.findFirst({
        where: {
            id: userExamId,
            userId
        },
        include: {
            exam: {
                include: {
                    examQuestions: {
                        include: { question: true }
                    }
                }
            },
            answers: true
        }
    });

    if (!userExam) throw new Error('Exam session not found');

    const totalQuestions = userExam.exam.examQuestions.length;
    const answeredQuestions = userExam.answers.length;
    const remainingTime = calculateRemainingTime(userExam);

    return {
        userExamId,
        status: userExam.status,
        progress: {
            answered: answeredQuestions,
            total: totalQuestions,
            percentage: Math.round((answeredQuestions / totalQuestions) * 100)
        },
        remainingTime,
        answers: userExam.answers
    };
}

function calculateRemainingTime(userExam: any): number | null {
    if (!userExam.exam.durationMinutes || !userExam.startedAt) return null;

    const elapsed = Date.now() - userExam.startedAt.getTime();
    const maxDuration = userExam.exam.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, maxDuration - elapsed);

    return Math.floor(remaining / 1000); // Return in seconds
}