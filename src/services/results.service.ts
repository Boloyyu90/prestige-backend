import prisma from '../client';

type UserExamWithExamAndAnswers = {
    examId: number;
    exam: { id: number; title: string };
    attemptNumber: number;
    status: string;
    totalScore: number | null;
    finishedAt: Date | null;
    answers: Array<{ obtainedScore: number | null; isCorrect: boolean | null }>;
    faceNotDetectedSec: number;
    multipleFacesCount: number;
    phoneDetectedCount: number;
    cheatingScore: number | null;
};

type LeaderboardUserExam = {
    user: { id: number; name: string };
    totalScore: number | null;
    attemptNumber: number;
    finishedAt: Date | null;
};

export async function getUserResults(userId: number) {
    const results = await prisma.userExam.findMany({
        where: {
            userId,
            status: { not: 'IN_PROGRESS' }
        },
        include: {
            exam: {
                select: { id: true, title: true }
            },
            answers: {
                select: {
                    obtainedScore: true,
                    isCorrect: true
                }
            }
        },
        orderBy: { finishedAt: 'desc' }
    });

    return (results as UserExamWithExamAndAnswers[]).map((r) => ({
        examId: r.examId,
        examTitle: r.exam.title,
        attemptNumber: r.attemptNumber,
        status: r.status,
        totalScore: r.totalScore,
        finishedAt: r.finishedAt,
        questionsAnswered: r.answers.length,
        correctAnswers: r.answers.filter((a) => a.isCorrect).length,
        proctoringStats: {
            faceNotDetected: r.faceNotDetectedSec,
            multipleFaces: r.multipleFacesCount,
            phoneDetected: r.phoneDetectedCount,
            cheatingScore: r.cheatingScore
        }
    }));
}

export async function getExamLeaderboard(examId: number, limit = 10) {
    const topScores = await prisma.userExam.findMany({
        where: {
            examId,
            status: 'FINISHED'
        },
        include: {
            user: {
                select: { id: true, name: true }
            }
        },
        orderBy: { totalScore: 'desc' },
        take: limit
    });

    return (topScores as LeaderboardUserExam[]).map((score, index) => ({
        rank: index + 1,
        userId: score.user.id,
        userName: score.user.name,
        score: score.totalScore,
        attemptNumber: score.attemptNumber,
        finishedAt: score.finishedAt
    }));
}
