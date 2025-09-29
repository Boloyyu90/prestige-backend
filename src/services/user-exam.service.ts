import prisma from '../client';
import { ExamStatus } from '@prisma/client';
import { scoreOneAnswer } from './scoring.util';

export const startExam = async (userId: number, examId: number) => {
    return await prisma.$transaction(async (tx) => {
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
                status: ExamStatus.IN_PROGRESS,
                startedAt: new Date()
            },
            select: { id: true, attemptNumber: true, startedAt: true }
        });

        // Optional: jika butuh mengunci urutan soal per-attempt, generate mapping di sini

        return ue;
    });
};

export const submitAnswer = async (params: {
    userId: number;
    userExamId: number;
    examQuestionId: number;
    selectedAnswer: any;
}) => {
    const { userId, userExamId, examQuestionId, selectedAnswer } = params;

    await prisma.$transaction(async (tx) => {
        // Ambil userExam + minimal field exam untuk validasi waktu
        const userExam = await tx.userExam.findFirst({
            where: { id: userExamId, userId, status: 'IN_PROGRESS' },
            select: {
                id: true,
                startedAt: true,
                exam: { select: { durationMinutes: true, startTime: true, endTime: true } }
            }
        });
        if (!userExam) throw new Error('UserExam not found or not in progress');

        // Guard waktu
        const now = new Date();
        const durationMs = (userExam.exam?.durationMinutes ?? 0) * 60_000;
        const byEndTimeMs =
            userExam.exam?.endTime && userExam.exam?.startTime
                ? userExam.exam.endTime.getTime() - userExam.exam.startTime.getTime()
                : 0;
        const maxMs = durationMs || byEndTimeMs;

        if (userExam.startedAt && maxMs > 0) {
            const elapsed = now.getTime() - userExam.startedAt.getTime();
            if (elapsed > maxMs) {
                await tx.userExam.update({
                    where: { id: userExam.id },
                    data: { status: 'FINISHED', finishedAt: now }
                });
                throw new Error('Exam time exceeded');
            }
        }

        // Ambil info soal untuk skoring minimum (jenis, skor, kunci, opsi)
        const eq = await tx.examQuestion.findUnique({
            where: { id: examQuestionId },
            select: {
                effectiveScore: true,
                question: { select: { questionType: true, defaultScore: true, correctAnswer: true, options: true } }
            }
        });
        if (!eq) throw new Error('ExamQuestion not found');

        const { obtainedScore, normalizedAnswerJson } = scoreOneAnswer({
            questionType: eq.question.questionType,
            effectiveScore: eq.effectiveScore,
            defaultScore: eq.question.defaultScore,
            selectedAnswer,
            options: eq.question.options,
            correctAnswer: eq.question.correctAnswer
        });

        // Upsert jawaban (idempotent)
        await tx.answer.upsert({
            where: { userExamId_examQuestionId: { userExamId, examQuestionId } },
            create: {
                userExamId,
                examQuestionId,
                selectedAnswer: normalizedAnswerJson,
                obtainedScore,
                answeredAt: now
            },
            update: {
                selectedAnswer: normalizedAnswerJson,
                obtainedScore,
                answeredAt: now
            }
        });
    });
};

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
        (sum, answer) => sum + (answer.obtainedScore || 0),
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