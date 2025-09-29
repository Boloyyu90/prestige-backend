import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as userExamService from '../services/user-exam.service';
import prisma from "../client";

export async function startExam(req: Request, res: Response, next: NextFunction) {
    try {
        const examId = Number(req.params.examId);
        const result = await userExamService.startExam(req.user!.id, examId);
        return res.status(httpStatus.OK).json({ message: 'Exam started', data: result });
    } catch (error) {
        return next(error);
    }
}

export async function submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
        const userExamId = Number(req.params.userExamId);
        const examQuestionId = Number(req.params.questionId);
        const { selectedAnswer } = req.body;

        const answer = await userExamService.submitAnswer(
            req.user!.id,
            userExamId,
            examQuestionId,
            selectedAnswer
        );

        return res.status(httpStatus.OK).json({ message: 'Answer submitted', data: answer });
    } catch (error) {
        return next(error);
    }
}

export async function finishExam(req: Request, res: Response, next: NextFunction) {
    try {
        const userExamId = Number(req.params.userExamId);
        const { forceFinish } = req.body;

        const result = await userExamService.finishExam(req.user!.id, userExamId, forceFinish);
        return res.status(httpStatus.OK).json({ message: 'Exam finished', data: result });
    } catch (error) {
        return next(error);
    }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
    try {
        const userExamId = Number(req.params.userExamId);
        const progress = await userExamService.getExamProgress(req.user!.id, userExamId);
        return res.status(httpStatus.OK).json({ data: progress });
    } catch (error) {
        return next(error);
    }
}

export async function getMyAttempts(req: Request, res: Response, next: NextFunction) {
    try {
        const examId = req.query.examId ? Number(req.query.examId) : undefined;

        const attempts = await prisma.userExam.findMany({
            where: {
                userId: req.user!.id,
                ...(examId && { examId })
            },
            include: {
                exam: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(httpStatus.OK).json({ data: attempts });
    } catch (error) {
        return next(error);
    }
}