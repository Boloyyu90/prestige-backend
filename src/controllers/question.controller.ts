import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as questionService from '../services/question.service';

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const question = await questionService.createQuestion(req.body);
        return res.status(httpStatus.CREATED).json({ message: 'Question created', data: question });
    } catch (error) {
        return next(error);
    }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.questionId);
        const question = await questionService.getQuestionById(id);

        if (!question) {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Question not found' });
        }

        return res.status(httpStatus.OK).json({ data: question });
    } catch (error) {
        return next(error);
    }
}

export async function listQuestions(req: Request, res: Response, next: NextFunction) {
    try {
        const filters = {
            questionType: req.query.type as any,
            search: req.query.search as string
        };

        const questions = await questionService.listQuestions(filters);
        return res.status(httpStatus.OK).json({ data: questions });
    } catch (error) {
        return next(error);
    }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.questionId);
        const question = await questionService.updateQuestion(id, req.body);
        return res.status(httpStatus.OK).json({ message: 'Question updated', data: question });
    } catch (error) {
        return next(error);
    }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.questionId);
        await questionService.deleteQuestion(id);
        return res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
        return next(error);
    }
}

export async function bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await questionService.bulkImportQuestions(req.body.questions);
        return res.status(httpStatus.CREATED).json({
            message: `${result.count} questions imported`,
            data: result
        });
    } catch (error) {
        return next(error);
    }
}