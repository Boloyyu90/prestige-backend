import prisma from '../client';
import { ExamStatus } from '@prisma/client';

export async function startExam(userId: number, examId: number) {
    // Check if exam exists and is available
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            examQuestions: {
                include: { question: true },
                orderBy: { orderNumber: 'asc' }
            }
        }
    });

    if (!exam) throw new Error('Exam not found');
    if (exam.examQuestions.length === 0) throw new Error('Exam has no questions');

    const now = new Date();

    // Check time constraints
    if (exam.startTime && now < exam.startTime) {
        throw new Error('Exam has not started yet');
    }
    if (exam.endTime && now > exam.endTime) {
        throw new Error('Exam has ended');
    }

    // Get current attempt number
    const lastAttempt = await prisma.userExam.findFirst({
        where: { userId, examId },
        orderBy: { attemptNumber: 'desc' }
    });

    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    // Check if previous attempt is finished
    if (lastAttempt && lastAttempt.status === 'IN_PROGRESS') {
        throw new Error('Previous attempt is still in progress');
    }

    // Create new user exam session
    const userExam = await prisma.userExam.create({
        data: {
            userId,
            examId,
            attemptNumber,
            startedAt: now,
            status: 'IN_PROGRESS'
        },
        include: {
            exam: {
                include: {
                    examQuestions: {
                        include: { question: true },
                        orderBy: { orderNumber: 'asc' }
                    }
                }
            }
        }
    });

    // Shuffle questions if needed
    let questions = userExam.exam.examQuestions;
    if (exam.shuffleQuestions) {
        questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Shuffle options if needed
    if (exam.shuffleOptions) {
        questions = questions.map(eq => {
            if (Array.isArray(eq.question.options)) {
                return {
                    ...eq,
                    question: {
                        ...eq.question,
                        options: [...eq.question.options].sort(() => Math.random() - 0.5)
                    }
                };
            }
            return eq;
        });
    }

    return {
        userExamId: userExam.id,
        attemptNumber: userExam.attemptNumber,
        startedAt: userExam.startedAt,
        exam: {
            ...exam,
            examQuestions: questions
        }
    };
}

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
        }
    });

    if (!userExam) throw new Error('Invalid exam session');

    // Check if exam duration exceeded
    if (userExam.exam.durationMinutes && userExam.startedAt) {
        const elapsed = Date.now() - userExam.startedAt.getTime();
        const maxDuration = userExam.exam.durationMinutes * 60 * 1000;

        if (elapsed > maxDuration) {
            // Auto finish exam
            await finishExam(userId, userExamId, true);
            throw new Error('Exam time exceeded');
        }
    }

    // Get question details
    const examQuestion = await prisma.examQuestion.findUnique({
        where: { id: examQuestionId },
        include: { question: true }
    });

    if (!examQuestion) throw new Error('Question not found');
    if (examQuestion.examId !== userExam.examId) throw new Error('Question not in this exam');

    // Calculate score based on question type
    let isCorrect: boolean | null = null;
    let obtainedScore = 0;

    const question = examQuestion.question;

    if (question.questionType === 'TKP') {
        // TKP: Score from options weight
        if (typeof question.options === 'object' && question.options !== null) {
            const answerKey = selectedAnswer?.option || selectedAnswer;
            const optionData = (question.options as any)[answerKey];
            obtainedScore = optionData?.score || 0;
        }
    } else {
        // TIU/TWK: Binary correct/incorrect
        const answerKey = selectedAnswer?.option || selectedAnswer;
        isCorrect = answerKey === question.correctAnswer;

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