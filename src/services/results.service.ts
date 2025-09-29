import prisma from '../client';

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

    return results.map(r => ({
        examId: r.examId,
        examTitle: r.exam.title,
        attemptNumber: r.attemptNumber,
        status: r.status,
        totalScore: r.totalScore,
        finishedAt: r.finishedAt,
        questionsAnswered: r.answers.length,
        correctAnswers: r.answers.filter(a => a.isCorrect).length,
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

    return topScores.map((score, index) => ({
        rank: index + 1,
        userId: score.user.id,
        userName: score.user.name,
        score: score.totalScore,
        attemptNumber: score.attemptNumber,
        finishedAt: score.finishedAt
    }));
}
